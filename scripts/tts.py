"""Voice-over with Chatterbox Multilingual (local, MIT, voice cloning, Hindi + English).

Usage: .venv-tts/bin/python scripts/tts.py "text" out.wav [--ref his_voice.wav] [--lang hi|en] [--exag 0.5]
--ref = 5-15 s clean clip of the voice to copy (his own voice -> VO sounds like him).
Hinglish: write it in Roman script and use --lang hi only if English sounds wrong; test both.
"""
import argparse, torch, torchaudio
from chatterbox.mtl_tts import ChatterboxMultilingualTTS

p = argparse.ArgumentParser()
p.add_argument("text"); p.add_argument("out")
p.add_argument("--ref"); p.add_argument("--lang", default="en")
p.add_argument("--exag", type=float, default=0.5)
a = p.parse_args()

dev = "mps" if torch.backends.mps.is_available() else "cpu"
m = ChatterboxMultilingualTTS.from_pretrained(device=dev)
wav = m.generate(a.text, language_id=a.lang, audio_prompt_path=a.ref, exaggeration=a.exag)
torchaudio.save(a.out, wav, m.sr)
print("saved", a.out)
