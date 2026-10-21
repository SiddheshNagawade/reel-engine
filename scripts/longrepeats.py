"""Find every repeated word / phrase / sentence in a finished cut by aligning its transcript to the script.
Usage: python3 scripts/longrepeats.py <work dir> <script.md>
Prints each extra (not-in-script) stretch whose words also occur right next to it = a stumble or retake,
with the SOURCE time range to cut out (a "C a b" row for cut.txt)."""
import json, re, sys, difflib
W, scriptp = sys.argv[1], sys.argv[2]
cw = json.load(open(W + '/cutwords.json'))['words']
P = json.load(open(W + '/pieces.json'))
n = lambda x: re.sub(r'[^a-z0-9]', '', x.lower())
script = open(scriptp).read().split('\n', 3)[3]
sw = [n(x) for x in script.split() if n(x)]
tw = [n(x['w']) for x in cw]
print(len(tw), 'words in the cut,', len(sw), 'in the script')
def src(t):
    for p in P['pieces']:
        d = (p['e'] - p['s']) / P['speed']
        if p['at'] <= t <= p['at'] + d: return p['s'] + (t - p['at']) * P['speed']
    return -1
sm = difflib.SequenceMatcher(None, tw, sw, autojunk=False)
for op, i1, i2, j1, j2 in sm.get_opcodes():
    extra = (i2 - i1) - (j2 - j1) if op == 'replace' else (i2 - i1 if op == 'delete' else 0)
    if extra <= 0: continue
    ins = tw[i1:i2]
    near = tw[max(0, i1 - 10):i1] + tw[i2:i2 + 10]
    if sum(1 for w in ins if w in near) * 2 >= len(ins):
        t0, t1 = cw[i1]['s'], cw[i2 - 1]['e']
        print(f"{t0:6.1f}s  C {src(t0) - 0.05:.2f} {src(t1) + 0.02:.2f}  | {' '.join(x['w'] for x in cw[max(0, i1 - 5):i1])} [[{' '.join(x['w'] for x in cw[i1:i2])}]] {' '.join(x['w'] for x in cw[i2:i2 + 5])}")
