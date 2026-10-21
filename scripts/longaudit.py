"""Strict audit of a scripted long-form cut: every sentence is heard ALONE and compared to the script.
Whisper on a whole cut quietly drops repeated phrases ("you see, you see" → "you see"), so a repeat check on one long
transcript misses most retakes. Here each kept row (sentence) is transcribed on its own from the FINAL cut audio.
Usage: .venv/bin/python scripts/longaudit.py <work dir> <script.md> [cut audio, default cutaudio.wav]
Prints:
  EXTRA  words heard in a row that its script sentence doesn't have (stumble, restart, half take)
  DUPE   two rows that say the same script words (a second take kept)
  EDGE   cut points that land inside speech (an audible half word / sentence tail at a join)
Writes audit.json (rows with heard text) for the next pass."""
import json, re, subprocess, sys, difflib
import numpy as np
import mlx_whisper

W, scriptp = sys.argv[1], sys.argv[2]
audio = sys.argv[3] if len(sys.argv) > 3 else W + '/cutaudio.wav'
P = json.load(open(W + '/pieces.json'))
sp = P['speed']
n = lambda x: re.sub(r'[^a-z0-9]', '', x.lower().replace('$', '').replace(',', ''))
script = open(scriptp).read().split('\n', 3)[3]
sw = [n(x) for x in script.split() if n(x)]
ff = '/Users/siddhesh/ReelEngine/node_modules/ffmpeg-static/ffmpeg'
pcm = subprocess.run([ff, '-v', 'error', '-i', audio, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True).stdout
A = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768

def src(t):
    for p in P['pieces']:
        d = (p['e'] - p['s']) / sp
        if p['at'] <= t <= p['at'] + d + 1e-3: return p['s'] + (t - p['at']) * sp
    return -1

# Whisper "cleans up" stumbles by default; a disfluent prompt makes it write what is actually said, repeats included
VERBATIM = "Umm, so so the, the font is, uh, I I mean, it it is, you know, you know, like, like the the company, the company it rents it."
rows = []
spans = []
for i, r in enumerate(P['rows']):
    ps = [p for p in P['pieces'] if p['row'] == i]
    if ps: spans.append((i, ps[0]['at'], ps[-1]['at'] + (ps[-1]['e'] - ps[-1]['s']) / sp, r['text']))
# rows go to Whisper in ~24 s batches with 1 s of silence between them (one 30 s window per call instead of one per
# sentence), each word is mapped back to its row by time
GAP = 1.0
k = 0
while k < len(spans):
    grp, tot = [], 0
    while k < len(spans) and (not grp or tot + spans[k][2] - spans[k][1] + GAP < 24):
        grp.append(spans[k]); tot += spans[k][2] - spans[k][1] + GAP; k += 1
    parts, offs, pos = [], [], 0.25
    parts.append(np.zeros(4000, np.float32))
    for (i, a, b, _) in grp:
        seg = A[int(a * 16000):int(b * 16000)]
        offs.append((pos, pos + len(seg) / 16000, a)); parts.append(seg); parts.append(np.zeros(int(GAP * 16000), np.float32)); pos += len(seg) / 16000 + GAP
    res = mlx_whisper.transcribe(np.concatenate(parts), path_or_hf_repo='mlx-community/whisper-large-v3-turbo', language='en',
                                 word_timestamps=True, condition_on_previous_text=False, temperature=0, initial_prompt=VERBATIM)
    allw = [w for s_ in res['segments'] for w in s_.get('words', []) if w['word'].strip()]
    for (i, a, b, text), (p0, p1, a0) in zip(grp, offs):
        mid = lambda w: (w['start'] + w['end']) / 2
        ws = [{'w': w['word'].strip(), 's': round(a0 + w['start'] - p0, 2), 'e': round(a0 + w['end'] - p0, 2)} for w in allw if p0 - 0.3 <= mid(w) < p1 + 0.3]
        rows.append({'row': i, 'a': round(a, 2), 'b': round(b, 2), 'text': text, 'heard': ws})
    print(f"{k}/{len(spans)}", file=sys.stderr, flush=True)
json.dump(rows, open(W + '/audit.json', 'w'), indent=0)

# map every row to its script words
cover = []
for r in rows:
    hw = [n(x['w']) for x in r['heard'] if n(x['w'])]
    keep = [x for x in r['heard'] if n(x['w'])]
    # locate: best window of the script for this row
    best, bj = 0, 0
    L = len(hw)
    for j in range(0, max(1, len(sw) - L + 1)):
        sc = sum(1 for k, w in enumerate(hw) if w in sw[j:j + L + 4])
        if sc > best: best, bj = sc, j
    win = sw[max(0, bj - 3):bj + L + 6]
    sm = difflib.SequenceMatcher(None, hw, win, autojunk=False)
    got = set()
    for blk in sm.get_matching_blocks():
        for k in range(blk.size): got.add(max(0, bj - 3) + blk.b + k)
    matched = set()
    for blk in sm.get_matching_blocks():
        for k in range(blk.size): matched.add(blk.a + k)
    extra = [k for k in range(len(hw)) if k not in matched]
    # repeated runs inside the row (a restart): same 1–4 words twice in a row
    for m in range(1, 5):
        for k in range(len(hw) - 2 * m + 1):
            if hw[k:k + m] == hw[k + m:k + 2 * m]:
                # legit only if the script has the same doubling
                pat = hw[k:k + 2 * m]
                if not any(sw[j:j + 2 * m] == pat for j in range(len(sw))):
                    extra += list(range(k, k + m))
    extra = sorted(set(extra))
    if extra:
        # group into stretches
        grp, cur = [], [extra[0]]
        for k in extra[1:]:
            if k == cur[-1] + 1: cur.append(k)
            else: grp.append(cur); cur = [k]
        grp.append(cur)
        for g in grp:
            t0, t1 = keep[g[0]]['s'], keep[g[-1]]['e']
            ctx = ' '.join(x['w'] for x in keep[max(0, g[0] - 4):g[0]]) + ' [[' + ' '.join(keep[k]['w'] for k in g) + ']] ' + ' '.join(x['w'] for x in keep[g[-1] + 1:g[-1] + 5])
            print(f"EXTRA {t0:7.2f}s  src {src(t0):8.2f}-{src(t1):8.2f}  row {r['row']:3}  {ctx}")
    cover.append((r, got))

for x in range(len(cover)):
    for y in range(x + 1, min(len(cover), x + 8)):
        ov = cover[x][1] & cover[y][1]
        if len(ov) >= 3:
            print(f"DUPE  {cover[x][0]['a']:7.2f}s row {cover[x][0]['row']} & {cover[y][0]['a']:7.2f}s row {cover[y][0]['row']}: {len(ov)} words  | {' '.join(w['w'] for w in cover[y][0]['heard'][:12])}")

# cut points inside speech
sil = [tuple(map(float, l.split('\t'))) for l in open(W + '/silences.tsv').read().split('\n') if l.count('\t') == 1]
def in_sil(t): return any(a - 0.03 <= t <= b + 0.03 for a, b in sil)
pcs = P['pieces']
for k in range(1, len(pcs)):
    pr, pc = pcs[k - 1], pcs[k]
    if abs(pr['e'] - pc['s']) < 0.02: continue  # continuous
    bad = [lab for lab, t in (('end', pr['e']), ('start', pc['s'])) if not in_sil(t)]
    if bad: print(f"EDGE  {pc['at']:7.2f}s  {'+'.join(bad)}  src {pr['e']:.2f} → {pc['s']:.2f}  row {pr['row']}→{pc['row']}")

# waveform check (does not trust Whisper at all): speech time per matched script word; a row that takes much longer
# than his normal rate holds words the script doesn't have = a repeat Whisper hid
def speech(a, b):
    x = A[int(a * 16000):int(b * 16000)]
    if not len(x): return 0
    fr = x[:len(x) // 320 * 320].reshape(-1, 320)
    db = 20 * np.log10(np.sqrt((fr ** 2).mean(1)) + 1e-9)
    return float((db > -45).sum() * 0.02)
rates = []
for r, got in cover:
    if len(got) >= 4: rates.append((speech(r['a'], r['b']) / len(got), r, len(got)))
med = sorted(x[0] for x in rates)[len(rates) // 2]
for q, r, k in rates:
    if q > med * 1.45 and speech(r['a'], r['b']) - med * k > 0.6:
        print(f"SLOW  {r['a']:7.2f}s  row {r['row']:3}  {speech(r['a'], r['b']):.1f}s of speech for {k} script words (normal {med * k:.1f}s)  | {' '.join(w['w'] for w in r['heard'][:14])}")
