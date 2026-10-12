"""Find where to cut, instead of guessing or speeding things up (brain/craft.md).

  .venv/bin/python scripts/cutfinder.py beats <video> [--from 10 --to 60] [--n 5] [--len 2.5]
      The N liveliest moments (movement + loudness: laughs, shouts, impacts), non-overlapping, in time order.
      Prints a ready "jumps" list for vlog.json: jump cuts to the best beats at real speed.
  .venv/bin/python scripts/cutfinder.py actions <video> [--from --to]
      Movement peaks: cutting ON an action (a punch, a jump, a turn) hides the cut. Use them as in/out points.
  .venv/bin/python scripts/cutfinder.py match <videoA> <secondsA> <videoB> [--from --to] [--rotA 90 --rotB 0]
      The moment in B whose picture looks most like A at secondsA (shapes, positions, light): a match cut.
  .venv/bin/python scripts/cutfinder.py activity <video> [--fps 1] [--min 20]
      Hours of drawing/making-of footage: which stretches are ACTIVE (hand moving, paper changing) and which are idle
      (break, phone moved away, nothing happening). Look at the active ones first; skip idle ones without decoding.

Reads tiny grey frames (64x36 @ 10 fps) and mono audio through ffmpeg, so it's fast even on long 4K clips.
"""
import json
import subprocess
import sys

import numpy as np

FF = 'node_modules/ffmpeg-static/ffmpeg'
FPS = 10
W, H = 64, 36
ROT = {90: 'transpose=1,', 270: 'transpose=2,', 180: 'hflip,vflip,'}


def arg(name, default=None, cast=float):
    if name in sys.argv:
        return cast(sys.argv[sys.argv.index(name) + 1])
    return default


def frames(path, a=None, b=None, rot=0):
    rng = (['-ss', str(a)] if a is not None else []) + (['-t', str(b - a)] if a is not None and b is not None else [])
    cmd = [FF, '-v', 'error', *rng, '-i', path, '-vf', f'{ROT.get(int(rot), "")}fps={FPS},scale={W}:{H},format=gray',
           '-f', 'rawvideo', '-']
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)


def loudness(path, a=None, b=None, n=None):
    rng = (['-ss', str(a)] if a is not None else []) + (['-t', str(b - a)] if a is not None and b is not None else [])
    raw = subprocess.run([FF, '-v', 'error', *rng, '-i', path, '-vn', '-ac', '1', '-ar', '8000', '-f', 's16le', '-'],
                         capture_output=True).stdout
    x = np.frombuffer(raw, np.int16).astype(np.float32)
    hop = 8000 // FPS
    m = len(x) // hop
    if m == 0:
        return np.zeros(n or 0)
    rms = np.sqrt(np.mean(x[: m * hop].reshape(m, hop) ** 2, axis=1) + 1e-6)
    db = 20 * np.log10(rms / 32768 + 1e-9)
    if n is not None:
        db = np.pad(db, (0, max(0, n - len(db))), constant_values=db.min() if len(db) else -90)[:n]
    return db


def z(v):
    s = v.std()
    return (v - v.mean()) / s if s > 1e-6 else v * 0


def motion(fr):
    if len(fr) < 2:
        return np.zeros(len(fr))
    d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
    return np.concatenate([[d[0]], d])


def beats(path):
    a, b = arg('--from'), arg('--to')
    n, length = int(arg('--n', 5)), arg('--len', 2.5)
    fr = frames(path, a, b)
    mo = motion(fr)
    lo = loudness(path, a, b, len(mo))
    score = z(np.convolve(mo, np.ones(3) / 3, 'same')) + z(lo)
    win = max(1, int(length * FPS))
    total = np.convolve(score, np.ones(win), 'valid')  # score of a window starting at i
    taken, picks = np.zeros(len(score), bool), []
    for i in np.argsort(-total):
        if len(picks) >= n:
            break
        lo_i, hi_i = max(0, i - 5), min(len(score), i + win + 5)  # keep ~0.5 s between beats
        if taken[lo_i:hi_i].any():
            continue
        taken[i:i + win] = True
        picks.append(i)
    off = a or 0.0
    out = sorted([[round(off + i / FPS, 2), round(off + (i + win) / FPS, 2), round(float(total[i]) / win, 2)] for i in picks])
    print(json.dumps({'jumps': [[x[0], x[1]] for x in out], 'scores': [x[2] for x in out]}))


def actions(path):
    a, b = arg('--from'), arg('--to')
    mo = np.convolve(motion(frames(path, a, b)), np.ones(3) / 3, 'same')
    zz = z(mo)
    peaks = [i for i in range(2, len(mo) - 2) if zz[i] > 1.0 and mo[i] == mo[i - 2:i + 3].max()]
    off = a or 0.0
    print(json.dumps({'actions': [round(off + i / FPS, 2) for i in peaks], 'strength': [round(float(zz[i]), 2) for i in peaks]}))


def match(pa, ta, pb):
    a, b = arg('--from'), arg('--to')
    ref = frames(pa, ta, ta + 0.11, arg('--rotA', 0))[0]
    fr = frames(pb, a, b, arg('--rotB', 0))
    norm = lambda f: (f - f.mean()) / (f.std() + 1e-6)
    r = norm(ref)
    sim = np.array([float((norm(f) * r).mean()) for f in fr])
    i = int(sim.argmax())
    off = a or 0.0
    print(json.dumps({'best': round(off + i / FPS, 2), 'similarity': round(float(sim[i]), 3),
                      'top': [round(off + j / FPS, 2) for j in np.argsort(-sim)[:5]]}))


def activity(path):
    # 1 sample per second over the whole clip is enough to tell work from idle on hour-long recordings
    rate = arg('--fps', 1.0)
    cmd = [FF, '-v', 'error', '-skip_frame', 'nokey', '-i', path, '-vf', f'fps={rate},scale={W}:{H},format=gray', '-f', 'rawvideo', '-']
    raw = subprocess.run(cmd, capture_output=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
    if len(fr) < 3:
        print(json.dumps({'active': [], 'idle': []}))
        return
    mo = np.convolve(motion(fr), np.ones(5) / 5, 'same')
    thr = max(np.percentile(mo, 35), 0.6)
    act = mo > thr
    runs, start = [], 0
    for i in range(1, len(act) + 1):
        if i == len(act) or act[i] != act[start]:
            runs.append((bool(act[start]), start / rate, i / rate))
            start = i
    mn = arg('--min', 20.0)
    active = [[round(a, 1), round(b, 1)] for on, a, b in runs if on and b - a >= mn]
    idle = [[round(a, 1), round(b, 1)] for on, a, b in runs if not on and b - a >= mn]
    total = len(act) / rate
    print(json.dumps({'seconds': round(total, 1), 'active_share': round(float(act.mean()), 2), 'active': active, 'idle': idle}))


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'beats':
        beats(sys.argv[2])
    elif cmd == 'actions':
        actions(sys.argv[2])
    elif cmd == 'activity':
        activity(sys.argv[2])
    elif cmd == 'match':
        match(sys.argv[2], float(sys.argv[3]), sys.argv[4])
    else:
        print(__doc__)
        sys.exit(1)
