"""Turn "remove this phrase from this row" into exact cut-outs for cut.txt, using the audit's verbatim transcript and the
waveform. Each cut runs from the start of the abandoned take to the start of the word after it (the retake), and both
ends are moved to the quietest point nearby, so no half word or breath is left at the join.
Usage: .venv/bin/python scripts/longfix.py <work dir> <fixes.txt>      fixes.txt: "<row> | <heard phrase to remove>"
Prints "C a b" rows (source seconds) to append to cut.txt."""
import json, re, sys, subprocess
import numpy as np
W, fx = sys.argv[1], sys.argv[2]
P = json.load(open(W + '/pieces.json')); sp = P['speed']
rows = {r['row']: r for r in json.load(open(W + '/audit.json'))}
n = lambda x: re.sub(r'[^a-z0-9]', '', x.lower())
ff = '/Users/siddhesh/ReelEngine/node_modules/ffmpeg-static/ffmpeg'
A = np.frombuffer(subprocess.run([ff, '-v', 'error', '-i', W + '/audio16.wav', '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True).stdout, np.int16).astype(np.float32) / 32768
def src(t):
    for p in P['pieces']:
        d = (p['e'] - p['s']) / sp
        if p['at'] <= t <= p['at'] + d + 1e-3: return p['s'] + (t - p['at']) * sp
    return None
def quiet(t, back=0.25, fwd=0.06):
    """the quietest 10 ms point in [t-back, t+fwd] of the source"""
    a, b = int((t - back) * 16000), int((t + fwd) * 16000)
    x = A[a:b]; fr = x[:len(x) // 160 * 160].reshape(-1, 160)
    e = np.sqrt((fr ** 2).mean(1)); i = int(np.argmin(e))
    return (a + i * 160 + 80) / 16000
for line in open(fx):
    if '|' not in line or line.strip().startswith('#'): continue
    r, ph = line.split('|', 1); r = int(r); want = [n(w) for w in ph.split() if n(w)]
    hw = [w for w in rows[r]['heard'] if n(w['w'])]; hn = [n(w['w']) for w in hw]
    k = next((i for i in range(len(hn)) if hn[i:i + len(want)] == want), None)
    if k is None: print(f'# row {r}: phrase not found: {ph.strip()}  | heard: {" ".join(w["w"] for w in hw)}'); continue
    a = src(hw[k]['s']); nxt = hw[k + len(want)] if k + len(want) < len(hw) else None
    b = src(nxt['s']) if nxt else src(hw[k + len(want) - 1]['e'])
    if a is None or b is None: print(f'# row {r}: outside the cut'); continue
    a, b = quiet(a), quiet(b)
    # the abandoned take and the retake can sit in different pieces far apart in the source: cut only inside the kept
    # pieces between them (one wide range could swallow other lines that were taken from that stretch)
    pa = next(p for p in P['pieces'] if p['s'] - 0.3 <= a <= p['e'] + 0.3)
    pb = next(p for p in P['pieces'] if p['s'] - 0.3 <= b <= p['e'] + 0.3)
    if pa is pb: print(f'C {a:.3f} {b:.3f}   # row {r}: {ph.strip()}'); continue
    ia, ib = P['pieces'].index(pa), P['pieces'].index(pb)
    print(f'C {a:.3f} {pa["e"] + 0.05:.3f}   # row {r}: {ph.strip()}')
    for p in P['pieces'][ia + 1:ib]: print(f'C {p["s"] - 0.05:.3f} {p["e"] + 0.05:.3f}   # row {r} (between)')
    print(f'C {pb["s"] - 0.05:.3f} {b:.3f}   # row {r}')
