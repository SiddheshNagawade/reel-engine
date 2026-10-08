"""Face tracking with Apple's Vision framework (built into macOS). No internet, no extra models.

Usage: .venv/bin/python scripts/facetrack.py <video> <out.json> [fps=10]
Writes [{f, x, y, w, h}]: speaker's face centre/size as fractions of the frame (origin top-left), f = 30fps frame.
"""
import json
import os
import subprocess
import sys
import tempfile

import Quartz  # noqa: F401  (needed for CoreGraphics types)
import Vision
from Foundation import NSURL


def main():
    video, out = sys.argv[1], sys.argv[2]
    rate = int(sys.argv[3]) if len(sys.argv) > 3 else 10
    ffmpeg = os.path.join(os.path.dirname(__file__), "..", "node_modules", "ffmpeg-static", "ffmpeg")
    results = []
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-i", video, "-vf", f"fps={rate},scale=360:-2", "-q:v", "4", f"{tmp}/%05d.jpg"], check=True)
        frames = sorted(os.listdir(tmp))
        for i, name in enumerate(frames):
            req = Vision.VNDetectFaceRectanglesRequest.alloc().init()
            handler = Vision.VNImageRequestHandler.alloc().initWithURL_options_(NSURL.fileURLWithPath_(f"{tmp}/{name}"), None)
            ok, _ = handler.performRequests_error_([req], None)
            faces = req.results() or []
            if not ok or not faces:
                continue
            b = max(faces, key=lambda r: r.boundingBox().size.width).boundingBox()  # biggest face = speaker
            results.append({
                "f": round(i * 30 / rate),
                "x": round(b.origin.x + b.size.width / 2, 4),
                "y": round(1 - (b.origin.y + b.size.height / 2), 4),
                "w": round(b.size.width, 4),
                "h": round(b.size.height, 4),
            })
    json.dump(results, open(out, "w"))
    print(f"  face found in {len(results)} of {len(frames)} sampled frames")


if __name__ == "__main__":
    main()
