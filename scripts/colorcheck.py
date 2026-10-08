"""Colour check: measure a frame the way scopes do, so grading decisions don't rely on tired eyes.

Usage: .venv/bin/python scripts/colorcheck.py <image-or-video> [time_seconds] [--label NAME] ...
       (pass several images/videos to compare them side by side)

Reports
  clipping   : % pure white / pure black pixels (waveform touching top/bottom)
  spread     : luma p5..p95 (how much contrast the image really has)
  neutral    : colour cast of bright, low-saturation areas (white walls): + = warm/yellow, - = cool/blue; green tint
  skin       : on the speaker's face (Apple Vision): vectorscope hue angle vs the skin-tone line (~123°),
               direction (toward yellow or toward red/pink) and chroma (how rich the skin colour is)
"""
import math
import os
import subprocess
import sys
import tempfile

import numpy as np
import Vision
from Foundation import NSURL

FF = os.path.join(os.path.dirname(__file__), "..", "node_modules", "ffmpeg-static", "ffmpeg")
W, H = 540, 960
SKIN_LINE = 123.0  # degrees on a standard vectorscope


def frame_png(path, t, out):
    args = [FF, "-hide_banner", "-loglevel", "error", "-y"]
    if t is not None:
        args += ["-ss", str(t)]
    args += ["-i", path, "-frames:v", "1", "-vf", f"scale={W}:{H}", out]
    subprocess.run(args, check=True)


def rgb(png):
    raw = subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-i", png, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(H, W, 3).astype(np.float32)


def face_box(png):
    req = Vision.VNDetectFaceRectanglesRequest.alloc().init()
    Vision.VNImageRequestHandler.alloc().initWithURL_options_(NSURL.fileURLWithPath_(png), None).performRequests_error_([req], None)
    faces = req.results() or []
    if not faces:
        return None
    b = max(faces, key=lambda r: r.boundingBox().size.width).boundingBox()
    # inner part of the face (cheeks/nose), avoiding hair, eyes and background
    cx, cy, w, h = b.origin.x + b.size.width / 2, 1 - (b.origin.y + b.size.height / 2), b.size.width, b.size.height
    return int((cx - w * 0.25) * W), int((cy - h * 0.15) * H), int((cx + w * 0.25) * W), int((cy + h * 0.25) * H)


def ycbcr(px):
    r, g, b = px[..., 0], px[..., 1], px[..., 2]
    y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    cb = (b - y) / 1.8556
    cr = (r - y) / 1.5748
    return y, cb, cr


def angle(cb, cr):
    return math.degrees(math.atan2(cr, cb)) % 360


def check(path, t=None, label=None):
    with tempfile.TemporaryDirectory() as tmp:
        png = os.path.join(tmp, "f.png")
        frame_png(path, t, png)
        img = rgb(png)
        box = face_box(png)
    y, cb, cr = ycbcr(img)
    res = {"label": label or os.path.basename(path)}
    res["clip_white_%"] = round(float((y > 250).mean() * 100), 2)
    res["clip_black_%"] = round(float((y < 5).mean() * 100), 2)
    res["luma_p5_p95"] = (round(float(np.percentile(y, 5))), round(float(np.percentile(y, 95))))
    sat = np.sqrt(cb ** 2 + cr ** 2)
    neutral = (y > 170) & (sat < 18)
    if neutral.sum() > 200:
        m = img[neutral].mean(axis=0)
        res["neutral_warm(+)/cool(-)"] = round(float(m[0] - m[2]), 1)
        res["neutral_green(+)/magenta(-)"] = round(float(m[1] - (m[0] + m[2]) / 2), 1)
    if box:
        x0, y0, x1, y1 = box
        fcb, fcr, fy = cb[y0:y1, x0:x1], cr[y0:y1, x0:x1], y[y0:y1, x0:x1]
        a = angle(float(fcb.mean()), float(fcr.mean()))
        res["skin_hue_deg"] = round(a, 1)
        d = a - SKIN_LINE
        res["skin_vs_line"] = f"{abs(d):.1f}° toward {'red/pink' if d < 0 else 'yellow'}" if abs(d) > 1 else "on the line"
        res["skin_chroma"] = round(float(np.sqrt(fcb.mean() ** 2 + fcr.mean() ** 2)), 1)
        res["skin_luma"] = round(float(fy.mean()))
    return res


def main():
    args = sys.argv[1:]
    items, i = [], 0
    while i < len(args):
        path = args[i]; i += 1
        t = label = None
        while i < len(args) and not os.path.exists(args[i]):
            if args[i] == "--label":
                label = args[i + 1]; i += 2
            else:
                t = float(args[i]); i += 1
        items.append(check(path, t, label))
    keys = [k for k in items[0] if k != "label"]
    print(f"{'':28}" + "".join(f"{it['label'][:18]:>20}" for it in items))
    for k in keys:
        print(f"{k:28}" + "".join(f"{str(it.get(k, '-')):>20}" for it in items))


if __name__ == "__main__":
    main()
