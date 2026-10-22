"""Turn any expressive voice clip into Sida's voice (keeps the laughs, sighs, timing and emotion; swaps the timbre).
Usage: .venv-tts/bin/python scripts/sida_vc.py in.wav [in2.wav ...] --out DIR
Sida's reference voice: T7 Library/voices/sida/ref.wav (made with scripts/sida.py)."""
import argparse, os, torchaudio
from chatterbox.vc import ChatterboxVC
REF = "/Volumes/T7 Shield/ReelEngine/Library/voices/sida/ref.wav"
p = argparse.ArgumentParser(); p.add_argument("inputs", nargs="+"); p.add_argument("--out", required=True)
a = p.parse_args()
vc = ChatterboxVC.from_pretrained("mps")
for f in a.inputs:
    w = vc.generate(f, target_voice_path=REF)
    o = os.path.join(a.out, "sida-" + os.path.basename(f)); torchaudio.save(o, w, vc.sr); print("saved", o, flush=True)
