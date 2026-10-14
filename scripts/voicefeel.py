"""How he SAYS each line: loudness, pitch and speed per sentence → an intensity curve (calm / normal / intense).

The "two-step" route (2026-10-14): the WORDS' emotion is read by Claude from the fixed Hinglish transcript (meaning,
jokes, sarcasm: better than any small text-sentiment model); the VOICE's energy comes from here, measured on his own
audio, compared with his own average (so it works for his Hinglish and his mic, no training data needed).
Lines where he gets louder, higher and faster than usual = excited / frustrated peaks; quieter, lower, slower = a
serious or soft moment. The sound pass uses it to place music changes, drops and silences on real emotional turns.
  .venv/bin/python scripts/voicefeel.py <name>        (needs _work/<name>/clip-N.mp3 + clip-N.words.json)
Writes _work/<name>/voicefeel.json and prints the lines with their level.
"""
import json
import os
import sys

import numpy as np
import essentia
import essentia.standard as es

essentia.log.warningActive = False
sys.path.insert(0, os.path.dirname(__file__))
WORK = '/Volumes/T7 Shield/ReelEngine/_work' if os.path.isdir('/Volumes/T7 Shield/ReelEngine/_work') else os.path.join(os.path.dirname(__file__), '..', 'work')
SR = 16000


def sentences(words):
    """Split into lines at sentence punctuation or pauses > 0.45 s."""
    out, cur = [], []
    for i, w in enumerate(words):
        if not w.get('w', '').strip():
            continue
        cur.append(i)
        nxt = next((x for x in words[i + 1:] if x.get('w', '').strip()), None)
        if w['w'].rstrip()[-1:] in '.?!' or (nxt and nxt['s'] - w['e'] > 0.45) or len(cur) >= 14:
            out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    return out


def main():
    name = sys.argv[1]
    work = os.path.join(WORK, name)
    clips = sorted(f for f in os.listdir(work) if f.startswith('clip-') and f.endswith('.words.json'))
    pitch_alg = es.PitchYinFFT(frameSize=2048, sampleRate=SR)
    win, spec = es.Windowing(type='hann'), es.Spectrum()
    lines = []
    for wf in clips:
        k = wf.split('-')[1].split('.')[0]
        audio_f = os.path.join(work, f'clip-{k}.mp3')
        if not os.path.exists(audio_f):
            continue
        audio = es.MonoLoader(filename=audio_f, sampleRate=SR)()
        words = json.load(open(os.path.join(work, wf)))['words']
        for idx in sentences(words):
            a, b = words[idx[0]]['s'], words[idx[-1]]['e']
            seg = audio[int(a * SR):int(b * SR)]
            if len(seg) < SR * 0.3:
                continue
            rms = float(np.sqrt(np.mean(seg ** 2)) + 1e-9)
            pitches = []
            for frame in es.FrameGenerator(seg, frameSize=2048, hopSize=512):
                p, conf = pitch_alg(spec(win(frame)))
                if conf > 0.6 and 70 < p < 450:
                    pitches.append(p)
            text = ' '.join(words[i]['w'] for i in idx)
            lines.append({'clip': int(k), 'words': [idx[0], idx[-1]], 's': round(a, 2), 'e': round(b, 2), 'text': text,
                          'db': 20 * np.log10(rms), 'pitch': float(np.median(pitches)) if pitches else None,
                          'rate': len(idx) / max(0.3, b - a)})
    if not lines:
        print('no lines found')
        return
    # compare every line with HIS OWN average (z-scores), then combine
    def z(key):
        v = np.array([l[key] if l[key] is not None else np.nan for l in lines], float)
        m, s = np.nanmean(v), np.nanstd(v) or 1
        return np.nan_to_num((v - m) / s)
    score = 0.45 * z('db') + 0.35 * z('pitch') + 0.2 * z('rate')
    for l, sc in zip(lines, score):
        l['intensity'] = round(float(sc), 2)
        l['level'] = 'intense' if sc > 0.8 else 'calm' if sc < -0.8 else 'normal'
        l['db'] = round(l['db'], 1)
        l['pitch'] = round(l['pitch']) if l['pitch'] else None
        l['rate'] = round(l['rate'], 1)
    json.dump(lines, open(os.path.join(work, 'voicefeel.json'), 'w'), indent=1, ensure_ascii=False)
    for l in lines:
        mark = {'intense': '▲', 'calm': '▽', 'normal': '·'}[l['level']]
        print(f"{mark} {l['s']:6.1f}s  w{l['words'][0]:<4} {l['intensity']:+.1f}  {l['text'][:70]}")
    print(f"\n{sum(l['level'] == 'intense' for l in lines)} intense, {sum(l['level'] == 'calm' for l in lines)} calm of {len(lines)} lines → {os.path.join(work, 'voicefeel.json')}")


if __name__ == '__main__':
    main()
