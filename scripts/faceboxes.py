"""All faces per sampled frame (Apple Vision), for keeping captions/graphics off faces.

Usage: .venv/bin/python scripts/faceboxes.py <video> <out.json> [fps=4]
Writes [{t, b: [[x, y, w, h], ...]}]: t in seconds, boxes as fractions of the frame (origin top-left).
"""
import json
import os
import subprocess
import sys
import tempfile

import Quartz  # noqa: F401
import Vision
from Foundation import NSURL


def main():
    video, out = sys.argv[1], sys.argv[2]
    rate = float(sys.argv[3]) if len(sys.argv) > 3 else 4
    ffmpeg = os.path.join(os.path.dirname(__file__), "..", "node_modules", "ffmpeg-static", "ffmpeg")
    res = []
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-i", video, "-vf", f"fps={rate},scale=640:-2", "-q:v", "4", f"{tmp}/%05d.jpg"], check=True)
        for i, name in enumerate(sorted(os.listdir(tmp))):
            req = Vision.VNDetectFaceRectanglesRequest.alloc().init()
            h = Vision.VNImageRequestHandler.alloc().initWithURL_options_(NSURL.fileURLWithPath_(f"{tmp}/{name}"), None)
            ok, _ = h.performRequests_error_([req], None)
            boxes = []
            for r in (req.results() or []) if ok else []:
                b = r.boundingBox()
                boxes.append([round(b.origin.x, 4), round(1 - b.origin.y - b.size.height, 4), round(b.size.width, 4), round(b.size.height, 4)])
            res.append({"t": round((i + 0.5) / rate, 3), "b": boxes})
    json.dump(res, open(out, "w"))
    print(f"  {sum(1 for r in res if r['b'])}/{len(res)} frames with faces")


if __name__ == "__main__":
    main()
