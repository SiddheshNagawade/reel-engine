"""Read burned-in subtitles from a video with Apple Vision text recognition (for dubbed footage where Whisper can't help).

Usage: .venv/bin/python scripts/subocr.py <video> <out.json> [--from s] [--to s] [--fps 4] [--band 0.8,1.0]
Looks only at the horizontal band (fractions of frame height) where the subtitles sit, merges identical consecutive
reads into lines, and writes [{s, e, text}] in seconds of the source video.
"""
import json
import os
import subprocess
import sys
import tempfile
from difflib import SequenceMatcher

import Quartz  # noqa: F401
import Vision
from Foundation import NSURL


def opt(flag, default):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else default


def read_text(path, top=0.0, bottom=1.0):
    req = Vision.VNRecognizeTextRequest.alloc().init()
    req.setRecognitionLevel_(0)  # accurate
    req.setUsesLanguageCorrection_(True)
    handler = Vision.VNImageRequestHandler.alloc().initWithURL_options_(NSURL.fileURLWithPath_(path), None)
    ok, _ = handler.performRequests_error_([req], None)
    if not ok:
        return ""
    def centre(o):  # fraction from the top of the frame
        b = o.boundingBox()
        return 1 - (b.origin.y + b.size.height / 2)
    obs = sorted((o for o in req.results() or [] if top <= centre(o) <= bottom), key=centre)
    return " ".join(o.topCandidates_(1)[0].string() for o in obs if o.confidence() > 0.3).strip()


def main():
    video, out = sys.argv[1], sys.argv[2]
    start, end = float(opt("--from", 0)), opt("--to", None)
    fps = float(opt("--fps", 4))
    top, bottom = (float(v) for v in opt("--band", "0.8,1.0").split(","))
    ffmpeg = os.path.join(os.path.dirname(__file__), "..", "node_modules", "ffmpeg-static", "ffmpeg")
    lines = []
    with tempfile.TemporaryDirectory() as tmp:
        cmd = [ffmpeg, "-hide_banner", "-loglevel", "error", "-ss", str(start)]
        if end:
            cmd += ["-t", str(float(end) - start)]
        cmd += ["-i", video, "-vf", f"fps={fps}", "-q:v", "2", f"{tmp}/%05d.jpg"]
        subprocess.run(cmd, check=True)
        for i, name in enumerate(sorted(os.listdir(tmp))):
            t = start + i / fps
            text = read_text(f"{tmp}/{name}", top, bottom)
            last = lines[-1] if lines else None
            if text and last and last["e"] >= t - 1.5 / fps and SequenceMatcher(None, last["text"], text).ratio() > 0.8:
                last["e"] = round(t + 1 / fps, 2)
                if len(text) > len(last["text"]):
                    last["text"] = text
            elif text:
                lines.append({"s": round(t, 2), "e": round(t + 1 / fps, 2), "text": text})
    json.dump(lines, open(out, "w"), indent=1, ensure_ascii=False)
    for l in lines:
        print(f'{l["s"]:7.2f} {l["e"]:7.2f}  {l["text"]}')


if __name__ == "__main__":
    main()
