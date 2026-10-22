"""Sida: our own narrator voice (Kokoro, local). Blend of af_heart + af_bella + af_nicole with a touch
of other voices so she sounds sweet but not stock. Moods glide sentence to sentence (no tone jumps).

Script format (plain text, one sentence or line per mood change; tag carries on until the next tag):
  [calm] In 1998, a small studio got a strange request.
  [curious] Make a logo nobody will remember.
  [excited] And it worked!
Moods: calm, warm, curious, excited, soft, serious, sad, playful.

Usage: .venv-tts/bin/python scripts/sida.py script.txt out.wav [--smooth 1]
"""
import argparse, re, numpy as np, soundfile as sf, torch
from kokoro import KPipeline

SR = 24000
# Sida's base identity: mostly heart (warmth), bella (brightness), nicole (breathy softness),
# plus a little of af_sky + bf_isabella so she doesn't sound like the stock voices.
BASE = {"af_heart": .42, "af_bella": .22, "af_nicole": .14, "af_sky": .12, "bf_isabella": .10}
# Each mood = a nudge on top of the base (voice mix) + speaking speed + pause after the sentence.
MOODS = {
    "calm":    ({"af_heart": .15}, .95, .35),
    "warm":    ({"af_heart": .25, "af_nicole": .05}, .93, .40),
    "curious": ({"af_bella": .12, "af_sky": .05}, .97, .45),
    "excited": ({"af_bella": .35}, 1.08, .25),
    "playful": ({"af_bella": .20, "af_sky": .10}, 1.03, .30),
    "soft":    ({"af_nicole": .35}, .90, .50),
    "serious": ({"bf_isabella": .15, "af_heart": .10}, .92, .50),
    "sad":     ({"af_nicole": .25, "af_heart": .10}, .86, .60),
}

def mix(pipe, weights):
    tot = sum(weights.values())
    return sum(pipe.load_voice(v) * (w / tot) for v, w in weights.items())

def mood_voice(pipe, mood):
    w = dict(BASE)
    for v, x in MOODS[mood][0].items():
        w[v] = w.get(v, 0) + x
    return mix(pipe, w)

def parse(text):
    out, mood = [], "calm"
    for line in text.splitlines():
        for m in re.finditer(r"(?:\[(\w+)\])?\s*([^\[]+)", line):
            if m.group(1):
                mood = m.group(1).lower()
            for s in re.split(r"(?<=[.!?…])\s+", m.group(2).strip()):
                if s:
                    out.append((mood if mood in MOODS else "calm", s))
    return out

def render(text, out, smooth=1):
    pipe = KPipeline(lang_code="a")
    sents = parse(text)
    voices = [mood_voice(pipe, m) for m, _ in sents]
    speeds = [MOODS[m][1] for m, _ in sents]
    pauses = [MOODS[m][2] for m, _ in sents]
    n, chunks = len(sents), []
    for i, (_, s) in enumerate(sents):
        # glide: each sentence is a weighted blend of its neighbours' moods, so tone curves instead of jumping
        ks = [(j, 1.0 / (1 + abs(j - i))) for j in range(max(0, i - smooth), min(n, i + smooth + 1))]
        ks = [(j, w * (2 if j == i else 1)) for j, w in ks]
        tw = sum(w for _, w in ks)
        v = sum(voices[j] * w for j, w in ks) / tw
        sp = sum(speeds[j] * w for j, w in ks) / tw
        a = np.concatenate([r.audio.numpy() for r in pipe(s, voice=v, speed=sp)])
        chunks += [a, np.zeros(int(SR * (pauses[i] if s[-1] in ".!?…" else .15)), np.float32)]
    sf.write(out, np.concatenate(chunks[:-1]), SR)
    print("saved", out)

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("script"); p.add_argument("out")
    p.add_argument("--smooth", type=int, default=1, help="how many neighbour sentences blend in (0 = hard switches)")
    a = p.parse_args()
    render(open(a.script).read(), a.out, a.smooth)
