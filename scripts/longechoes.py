"""Find repeated speech in a cut WITHOUT trusting a transcriber: when he says the same words twice, the two stretches of
sound are nearly identical. MFCC frames (10 ms) of the cut are compared with the next 0.3–9 s; a long diagonal run of
very similar frames = the same phrase spoken twice. Each hit is then transcribed as two SEPARATE short clips (Whisper
can't merge what it hears in two different calls) and printed with both texts so it can be cut.
Usage: .venv/bin/python scripts/longechoes.py <work dir> [cut audio]"""
import json, sys, subprocess
import numpy as np
import mlx_whisper
W = sys.argv[1]; audio = sys.argv[2] if len(sys.argv) > 2 else W + '/cutaudio.wav'
ff = '/Users/siddhesh/ReelEngine/node_modules/ffmpeg-static/ffmpeg'
A = np.frombuffer(subprocess.run([ff, '-v', 'error', '-i', audio, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True).stdout, np.int16).astype(np.float32) / 32768
SR, HOP, NF = 16000, 160, 400
fr = np.lib.stride_tricks.sliding_window_view(np.pad(A, (0, NF)), NF)[::HOP] * np.hanning(NF)
spec = np.abs(np.fft.rfft(fr, 512)) ** 2
mel = lambda f: 2595 * np.log10(1 + f / 700)
pts = 700 * (10 ** (np.linspace(mel(80), mel(7600), 42) / 2595) - 1)
bins = np.floor(513 * pts / SR).astype(int)
fb = np.zeros((40, 257))
for i in range(40):
    a, b, c = bins[i], bins[i + 1], bins[i + 2]
    fb[i, a:b] = np.linspace(0, 1, b - a, endpoint=False); fb[i, b:c] = np.linspace(1, 0, c - b, endpoint=False)
lm = np.log(spec @ fb.T + 1e-8)
dct = np.cos(np.pi / 40 * (np.arange(40) + 0.5)[None, :] * np.arange(1, 14)[:, None])
M = lm @ dct.T
energy = 10 * np.log10(spec.sum(1) + 1e-9)
speech = energy > np.percentile(energy, 35)
M = (M - M.mean(0)) / (M.std(0) + 1e-6)
M /= np.linalg.norm(M, axis=1, keepdims=True) + 1e-9
# downsample to 20 ms for speed
M2, S2 = M[::2], speech[::2]
T = len(M2); hits = []
for lag in range(15, 450):  # 0.3–9 s
    sim = np.einsum('ij,ij->i', M2[:-lag], M2[lag:])
    good = (sim > 0.42) & S2[:-lag] & S2[lag:]
    # smooth: runs of >= 0.45 s with >= 80 % good frames
    k = 22
    c = np.convolve(good.astype(float), np.ones(k) / k, 'same')
    run = c > 0.55
    i = 0
    while i < len(run):
        if run[i]:
            j = i
            while j < len(run) and run[j]: j += 1
            if j - i >= 4: hits.append((i * 0.02, (j - i) * 0.02 + 0.44, lag * 0.02, float(sim[i:j].mean())))
            i = j
        else: i += 1
# merge hits that describe the same repeat (overlapping first copy)
hits.sort(key=lambda h: (-(h[1] * h[3])))
keep = []
for h in hits:
    if any(abs(h[0] - k[0]) < 1.0 for k in keep): continue
    keep.append(h)
keep.sort()
def say(a, b):
    x = A[int(max(0, a) * SR):int(b * SR)]
    r = mlx_whisper.transcribe(np.concatenate([np.zeros(3200, np.float32), x, np.zeros(3200, np.float32)]), path_or_hf_repo='mlx-community/whisper-large-v3-turbo', language='en', condition_on_previous_text=False, temperature=0)
    return r['text'].strip()
out = []
for (t, d, lag, s) in keep:
    a1, b1 = t - 0.15, t + d + 0.1
    t1, t2 = say(a1, b1), say(a1 + lag, b1 + lag)
    import re
    wa = [re.sub(r'[^a-z0-9]', '', w.lower()) for w in t1.split()]; wb = [re.sub(r'[^a-z0-9]', '', w.lower()) for w in t2.split()]
    pairs = lambda w: {(w[i], w[i + 1]) for i in range(len(w) - 1)}
    shared = pairs(wa) & pairs(wb) or ({x for x in wa if len(x) > 4} & {x for x in wb if len(x) > 4})
    if not shared: continue
    out.append({'t': round(t, 2), 'dur': round(d, 2), 'lag': round(lag, 2), 'sim': round(s, 3), 'first': t1, 'second': t2})
    print(f"{t:7.2f}s  +{lag:4.2f}s  len {d:.2f}  sim {s:.2f}  | {t1!r}  ~  {t2!r}", flush=True)
json.dump(out, open(W + '/echoes.json', 'w'), indent=0)

