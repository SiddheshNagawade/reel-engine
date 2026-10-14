"""Skin balance: per-moment white balance anchored on HIS skin, so a yellow room or warm bulb doesn't turn his face yellow.

Usage: .venv/bin/python scripts/skinbalance.py <video> <out.json> [every_seconds=0.5]
Writes [{f, gains: [r, g, b], hue, dev, chroma, luma, neutral}] (f = 30fps frame of <video>).

How (brain/color.md "Skin balance"):
- Apple Vision finds the face; the inner face (cheeks/nose) is measured on a vectorscope (same maths as colorcheck.py).
- Skin within TOL° of the skin-tone line = his natural colour → gains 1 (we never change a good skin tone).
- Further away (yellow/orange cast, or pink/magenta) → bring the skin colour back toward the line (85 %), keep its
  brightness, calm an over-rich glow to chroma 38, and turn that into per-channel gains (a white-balance move on the whole frame).
- Neutral areas (walls, grey/white things; mask from AKMessi/vex) vote too: if they disagree with the skin (lit warm but walls cool), half strength.
- Gains capped to ±CAP, luma kept. HLG HDR footage is tone-mapped to Rec.709 before measuring (what the viewer sees).
"""
import json
import math
import os
import subprocess
import sys
import tempfile

import numpy as np
import Vision
from Foundation import NSURL

FF = os.path.join(os.path.dirname(__file__), "..", "node_modules", "ffmpeg-static", "ffmpeg")
W, H = 360, 640
SKIN_LINE, TOL, CAP, STRENGTH, MAX_CHROMA = 123.0, 3.0, 0.15, 0.85, 38.0
KR, KB = 0.2126, 0.0722


def is_hlg(video):
    out = subprocess.run([FF, "-hide_banner", "-i", video], capture_output=True, text=True).stderr
    return "arib-std-b67" in out


def face_box(png):
    req = Vision.VNDetectFaceRectanglesRequest.alloc().init()
    Vision.VNImageRequestHandler.alloc().initWithURL_options_(NSURL.fileURLWithPath_(png), None).performRequests_error_([req], None)
    faces = req.results() or []
    if not faces:
        return None
    b = max(faces, key=lambda r: r.boundingBox().size.width).boundingBox()
    if b.size.width < 0.08:
        return None
    cx, cy, w, h = b.origin.x + b.size.width / 2, 1 - (b.origin.y + b.size.height / 2), b.size.width, b.size.height
    return int((cx - w * 0.25) * W), int((cy - h * 0.15) * H), int((cx + w * 0.25) * W), int((cy + h * 0.25) * H)


def to_ycc(r, g, b):
    y = KR * r + (1 - KR - KB) * g + KB * b
    return y, (b - y) / 1.8556, (r - y) / 1.5748


def from_ycc(y, cb, cr):
    r = y + 1.5748 * cr
    b = y + 1.8556 * cb
    g = (y - KR * r - KB * b) / (1 - KR - KB)
    return np.array([r, g, b])


def measure(png):
    raw = subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-i", png, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], check=True, capture_output=True).stdout
    img = np.frombuffer(raw, np.uint8).reshape(H, W, 3).astype(np.float32)
    box = face_box(png)
    if not box:
        return None
    x0, y0, x1, y1 = [max(0, v) for v in box]
    patch = img[y0:y1, x0:x1].reshape(-1, 3)
    if len(patch) < 50:
        return None
    rgb = patch.mean(axis=0)
    y, cb, cr = to_ycc(*rgb)
    hue = math.degrees(math.atan2(cr, cb)) % 360
    dev = hue - SKIN_LINE  # + = toward yellow, - = toward red/pink
    # neutral areas (method borrowed from AKMessi/vex color_grading.py): mid-bright, low saturation, channels close
    # together, and not skin; needs >= 1.5 % of the frame to be trusted
    px = img / 255.0
    mx, mn = px.max(axis=2), px.min(axis=2)
    lum = KR * px[..., 0] + (1 - KR - KB) * px[..., 1] + KB * px[..., 2]
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    skin = (px[..., 0] > px[..., 1]) & (px[..., 1] > px[..., 2] * 0.72) & ((px[..., 0] - px[..., 2]) >= 0.045) & (sat >= 0.12)
    neutral = (lum >= 0.16) & (lum <= 0.86) & (sat <= 0.20) & ((mx - mn) <= 0.11) & ~skin
    ncast = nmean = None
    if neutral.mean() >= 0.015:
        nmean = img[neutral].mean(axis=0)
        ncast = float(nmean[0] - nmean[2])  # + warm, - cool
    norm = lambda g: g / (KR * g[0] + (1 - KR - KB) * g[1] + KB * g[2])  # keep brightness
    skin_dev = lambda g: (math.degrees(math.atan2(*to_ycc(*(rgb * g))[2:0:-1])) % 360) - SKIN_LINE
    gains = np.ones(3)
    if abs(dev) > TOL:  # 1) skin off the line: rotate it back to the edge of the band
        # back onto the line, and a coloured light that also over-saturated the skin (orange/yellow glow) is calmed to
        # MAX_CHROMA (his liked v1 skin: chroma 37-39); dull skin is never boosted here (saturation = the film look's job)
        target = math.radians(SKIN_LINE)
        c = min(math.hypot(cb, cr), MAX_CHROMA)
        g = from_ycc(y, c * math.cos(target), c * math.sin(target)) / np.maximum(rgb, 1)
        strength = STRENGTH * (0.5 if ncast is not None and abs(ncast) > 4 and (ncast > 0) != (dev > 0) else 1)
        gains = norm(1 + (g - 1) * strength)
    if nmean is not None and abs(ncast) > 6 and (ncast > 0) == (dev > 0):
        # 2) walls agree the light is coloured: grey-world on the neutrals (vex), as far as his skin stays in the band
        gw = norm(nmean.mean() / np.maximum(nmean, 1))
        for k in (1.0, 0.75, 0.5, 0.25):
            g = norm(1 + (gw - 1) * k)
            if abs(skin_dev(g)) <= TOL and np.abs(g - 1).max() > np.abs(gains - 1).max():
                gains = g
                break
    gains = [float(np.clip(v, 1 - CAP, 1 + CAP)) for v in gains]
    return {"gains": [round(v, 4) for v in gains], "hue": round(hue, 1), "dev": round(dev, 1),
            "chroma": round(float(math.hypot(cb, cr)), 1), "luma": round(float(y)), "neutral": None if ncast is None else round(ncast, 1)}


def main():
    video, out = sys.argv[1], sys.argv[2]
    every = float(sys.argv[3]) if len(sys.argv) > 3 else 0.5
    vf = f"fps=1/{every},scale={W}:{H}"
    if is_hlg(video):
        vf = f"zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=mobius:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,{vf}"
    res = []
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-i", video, "-vf", vf, f"{tmp}/%05d.png"], check=True)
        for i, name in enumerate(sorted(os.listdir(tmp))):
            m = measure(f"{tmp}/{name}")
            if m:
                res.append({"f": round(i * every * 30), **m})
    with open(out, "w") as fh:
        json.dump(res, fh)
    devs = [r["dev"] for r in res]
    fixed = sum(1 for r in res if r["gains"] != [1.0, 1.0, 1.0])
    print(f"  skin balance: {len(res)} samples · median skin {np.median(devs) if devs else 0:+.1f}° from the line · {fixed} need a fix")


if __name__ == "__main__":
    main()
