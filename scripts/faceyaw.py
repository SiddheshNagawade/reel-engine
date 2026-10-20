"""Where he is LOOKING per sampled frame (Apple Vision face yaw): finds lines where he reads his laptop instead of
the camera, so the edit can cover them. Writes [{t, yaw}] (radians, 0 = facing the camera; None = no face).

Usage: .venv/bin/python scripts/faceyaw.py <video> <out.json> [fps=2]
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
            req.setRevision_(3)
            h = Vision.VNImageRequestHandler.alloc().initWithURL_options_(NSURL.fileURLWithPath_(f"{tmp}/{name}"), None)
            ok, _ = h.performRequests_error_([req], None)
            best = None
            for r in (req.results() or []) if ok else []:
                b = r.boundingBox()
                if best is None or b.size.width > best[0]:
                    y = r.yaw()
                    best = (b.size.width, float(y) if y is not None else None)
            res.append({"t": round((i + 0.5) / rate, 3), "yaw": best[1] if best else None})
    json.dump(res, open(out, "w"))
    print(f"  {sum(1 for r in res if r['yaw'] is not None and abs(r['yaw']) > 0.3)}/{len(res)} frames looking away")


if __name__ == "__main__":
    main()
