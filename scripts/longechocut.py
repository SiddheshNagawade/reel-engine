"""Cut a repeat found by longechoes.py: remove exactly one period (lag) of it. Copy 1 at u is joined to copy 2 at u+lag
(the same sound), u = the quietest moment of the matched stretch, so the join is seamless.
Usage: .venv/bin/python scripts/longechocut.py <work dir> t:lag:d …   → "C a b" rows (source seconds) for cut.txt"""
import json, sys, subprocess
import numpy as np
W = sys.argv[1]
P = json.load(open(W + '/pieces.json')); sp = P['speed']
A = np.frombuffer(subprocess.run(['/Users/siddhesh/ReelEngine/node_modules/ffmpeg-static/ffmpeg', '-v', 'error', '-i', W + '/cutaudio.wav', '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True).stdout, np.int16).astype(np.float32) / 32768
e = lambda t: float(np.sqrt((A[int(t * 16000):int(t * 16000) + 320] ** 2).mean()))
def src(t):
    for p in P['pieces']:
        d = (p['e'] - p['s']) / sp
        if p['at'] <= t <= p['at'] + d + 1e-3: return p, p['s'] + (t - p['at']) * sp
for arg in sys.argv[2:]:
    t, lag, d = map(float, arg.split(':'))
    u = min(np.arange(t - 0.3, t + d, 0.01), key=lambda x: e(x) + e(x + lag))
    (pa, a), (pb, b) = src(u), src(u + lag)
    if pa is pb: print(f'C {a:.3f} {b:.3f}   # echo at {t}s'); continue
    ia, ib = P['pieces'].index(pa), P['pieces'].index(pb)
    print(f'C {a:.3f} {pa["e"] + 0.05:.3f}   # echo at {t}s')
    for p in P['pieces'][ia + 1:ib]: print(f'C {p["s"] - 0.05:.3f} {p["e"] + 0.05:.3f}')
    print(f'C {pb["s"] - 0.05:.3f} {b:.3f}')
