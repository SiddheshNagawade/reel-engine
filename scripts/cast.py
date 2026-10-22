"""Voice cast: many characters, each with a fixed voice, every line ACTED with its emotion.
How: Qwen3-TTS VoiceDesign performs the line (character description + emotion), then Chatterbox voice
conversion locks it to that character's reference voice so they sound the same in every line.

Script (one line per speech; emotion in plain words, fillers written into the text):
  [grandpa | warm, chuckling softly] Arre beta, in my time we drew everything by hand. Hehe.
  [kid | excited, squealing] Dadaji! Look look look, I made a robot!
Characters: Library/voices/cast.json (name -> description). New name = add it there, run `--refs`.

Run with .venv-mlx (Qwen) for the performance and .venv-tts (Chatterbox VC) for the lock, so two steps:
  .venv-mlx/bin/python scripts/cast.py perform script.txt WORKDIR      # raw acted lines
  .venv-tts/bin/python scripts/cast.py lock WORKDIR out.wav            # same voices + joined scene
  .venv-mlx/bin/python scripts/cast.py refs                            # (re)make each character's reference voice
"""
import json, os, re, sys

LIB = "/Volumes/T7 Shield/ReelEngine/Library/voices"
CAST = json.load(open(os.path.join(LIB, "cast.json")))
QWEN = "mlx-community/Qwen3-TTS-12Hz-1.7B-VoiceDesign-bf16"
REF_LINE = "Hello. This is how I normally talk, nice and easy, when I'm just telling you about my day."


def qwen():
    from mlx_audio.tts.utils import load_model
    return load_model(QWEN)


def say(m, who, emo, text, out):
    import numpy as np, soundfile as sf
    a = np.concatenate([np.array(r.audio) for r in m.generate(text=text, instruct=f"{CAST[who]}. Emotion: {emo}.")])
    sf.write(out, a, m.sample_rate)


def refs():
    m = qwen()
    for who in CAST:
        os.makedirs(f"{LIB}/cast/{who}", exist_ok=True)
        p = f"{LIB}/cast/{who}/ref.wav"
        if not os.path.exists(p):
            say(m, who, "calm, natural, relaxed", REF_LINE, p); print("ref", who, flush=True)


def perform(script, work):
    os.makedirs(work, exist_ok=True)
    lines = [re.match(r"\[\s*(\w+)\s*\|\s*([^\]]+)\]\s*(.+)", l.strip()) for l in open(script) if l.strip()]
    m = qwen()
    meta = []
    for i, x in enumerate(lines):
        who, emo, text = x.group(1).lower(), x.group(2).strip(), x.group(3).strip()
        f = f"{work}/{i:03d}-{who}.wav"
        say(m, who, emo, text, f); meta.append(f); print(i, who, emo, flush=True)
    json.dump(meta, open(f"{work}/lines.json", "w"))


def lock(work, out):
    import numpy as np, torch, torchaudio
    from chatterbox.vc import ChatterboxVC
    vc = ChatterboxVC.from_pretrained("mps")
    parts = []
    for f in json.load(open(f"{work}/lines.json")):
        who = os.path.basename(f)[4:-4]
        w = vc.generate(f, target_voice_path=f"{LIB}/cast/{who}/ref.wav")
        torchaudio.save(f.replace(".wav", "-locked.wav"), w, vc.sr)
        parts += [w, torch.zeros(1, int(vc.sr * 0.25))]  # short turn-taking gap between speakers
    torchaudio.save(out, torch.cat(parts[:-1], 1), vc.sr); print("saved", out)


if __name__ == "__main__":
    cmd = sys.argv[1]
    {"refs": lambda: refs(), "perform": lambda: perform(sys.argv[2], sys.argv[3]),
     "lock": lambda: lock(sys.argv[2], sys.argv[3])}[cmd]()
