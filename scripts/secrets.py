"""Secrets sweep: find private things visible on screens in footage (phone/laptop on camera, screen recordings) and
return blur boxes. From the AI-editing blueprint he shared ("on-screen secrets are found and blurred"); important for
his building-in-public videos (dashboards, DMs, payment screens).

Usage: .venv/bin/python scripts/secrets.py <video> [--from s] [--to s] [--fps 2] [--rotate 90] [--never "<a,b>"] [--out f.json]
  Reads every line of text (Apple Vision) on sampled frames and flags: emails, UPI IDs, Indian phone numbers, OTP codes,
  card / Aadhaar numbers, API keys / tokens, and anything in --never or in a never.txt next to the output (names,
  addresses, his friends' numbers…).
  Output: [{from, to, kind, text, keys: [[t, x, y, w, h], ...]}]  t in seconds from --from, boxes as fractions of the
  (rotated) frame, top-left origin, padded. `keys` drops straight into a vlog segment's "censor" (speed-1 segments) or a
  reel `blurs` entry.
"""
import json
import os
import re
import subprocess
import sys
import tempfile

import Quartz  # noqa: F401
import Vision
from Foundation import NSURL

ROT = {90: "transpose=1,", 270: "transpose=2,", 180: "hflip,vflip,"}
PATTERNS = [
    ("email", re.compile(r"[\w.+-]+@[\w-]+\.[\w.]{2,}")),
    ("upi", re.compile(r"\b[\w.-]{2,}@(ok\w+|ybl|paytm|upi|ibl|axl|apl|sbi|icici|hdfcbank|axisbank|kotak|yesbank)\b", re.I)),
    ("phone", re.compile(r"(\+91[\s-]?)?\b[6-9]\d{4}[\s-]?\d{5}\b")),
    ("card", re.compile(r"\b(?:\d{4}[\s-]?){3}\d{4}\b")),
    ("aadhaar", re.compile(r"\b\d{4}\s\d{4}\s\d{4}\b")),
    ("otp", re.compile(r"\b(otp|code|verification)\b\D{0,20}\b\d{4,8}\b", re.I)),
    ("key", re.compile(r"\b(sk|pk|rk)[-_][A-Za-z0-9_-]{16,}|\bAKIA[0-9A-Z]{16}\b|\bgh[pousr]_[A-Za-z0-9]{20,}|\bAIza[0-9A-Za-z_-]{30,}|\beyJ[A-Za-z0-9_-]{20,}")),
    ("password", re.compile(r"\b(password|passwd|pwd)\s*[:=]\s*\S+", re.I)),
]


def opt(flag, default=None):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else default


def lines_in(path):
    req = Vision.VNRecognizeTextRequest.alloc().init()
    req.setRecognitionLevel_(0)
    req.setUsesLanguageCorrection_(False)  # numbers and handles must stay as they are
    handler = Vision.VNImageRequestHandler.alloc().initWithURL_options_(NSURL.fileURLWithPath_(path), None)
    ok, _ = handler.performRequests_error_([req], None)
    out = []
    for o in (req.results() or []) if ok else []:
        if o.confidence() < 0.3:
            continue
        b = o.boundingBox()  # Vision: bottom-left origin
        out.append((o.topCandidates_(1)[0].string(), [b.origin.x, 1 - b.origin.y - b.size.height, b.size.width, b.size.height]))
    return out


def main():
    video = sys.argv[1]
    start, end = float(opt("--from", 0)), opt("--to")
    fps = float(opt("--fps", 2))
    out = opt("--out")
    never = [w.strip().lower() for w in (opt("--never", "") or "").split(",") if w.strip()]
    if out and os.path.exists(os.path.join(os.path.dirname(out), "never.txt")):
        never += [l.strip().lower() for l in open(os.path.join(os.path.dirname(out), "never.txt")) if l.strip()]
    ffmpeg = os.path.join(os.path.dirname(__file__), "..", "node_modules", "ffmpeg-static", "ffmpeg")
    hits = []
    with tempfile.TemporaryDirectory() as tmp:
        cmd = [ffmpeg, "-hide_banner", "-loglevel", "error", "-ss", str(start)]
        if end:
            cmd += ["-t", str(float(end) - start)]
        cmd += ["-i", video, "-vf", f"{ROT.get(int(opt('--rotate', 0)), '')}fps={fps}", "-q:v", "2", f"{tmp}/%05d.jpg"]
        subprocess.run(cmd, check=True)
        for i, name in enumerate(sorted(os.listdir(tmp))):
            t = round(i / fps, 2)
            for text, box in lines_in(f"{tmp}/{name}"):
                kinds = [k for k, rx in PATTERNS if rx.search(text)] + (["never"] if any(n in text.lower() for n in never) else [])
                if kinds:
                    hits.append({"t": t, "kind": kinds[0], "text": text, "box": box})
    # follow each secret across frames: same kind + overlapping box within ~1.5 samples = one track
    tracks = []
    for h in hits:
        x, y, w, hh = h["box"]
        pad = [max(0, x - 0.01), max(0, y - 0.01), min(1 - max(0, x - 0.01), w + 0.02), min(1 - max(0, y - 0.01), hh + 0.02)]
        key = [h["t"], *[round(v, 4) for v in pad]]
        for tr in tracks:
            last = tr["keys"][-1]
            near = abs(last[1] - key[1]) < 0.15 and abs(last[2] - key[2]) < 0.15
            if tr["kind"] == h["kind"] and near and h["t"] - last[0] <= 1.6 / fps:
                if key[0] != last[0]:
                    tr["keys"].append(key)
                tr["to"] = round(h["t"] + 1 / fps, 2)
                break
        else:
            tracks.append({"from": h["t"], "to": round(h["t"] + 1 / fps, 2), "kind": h["kind"], "text": h["text"], "keys": [key]})
    for tr in tracks:  # hold the box until the end of the last sample
        tr["keys"].append([tr["to"], *tr["keys"][-1][1:]])
    if out:
        json.dump(tracks, open(out, "w"), indent=1, ensure_ascii=False)
    for tr in tracks:
        print(f'{tr["from"]:7.2f}–{tr["to"]:<7.2f} {tr["kind"]:8s} {tr["text"][:60]}')
    if not tracks:
        print("no secrets found")


if __name__ == "__main__":
    main()
