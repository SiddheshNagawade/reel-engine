"""Hero-frame picker: the best still of a person in a video, for a reel cover or a YouTube thumbnail.
From the AI-editing blueprint he shared ("a still of you is picked from your best frames").

Usage: .venv/bin/python scripts/heroframe.py <video> <out-dir> [--from s] [--to s] [--fps 2] [--n 4] [--rotate 90]
Scores every sampled frame (Apple Vision face landmarks + OpenCV):
  sharp   face not motion-blurred (Laplacian variance of the face crop)
  eyes    both eyes open (eye height / width)
  big     the face is a good size in frame (not tiny, not cropped)
  mouth   an expression: mouth open or smiling reads better than a neutral blink
Writes the top N as full-resolution JPGs (hero-1.jpg …, at least 1.5 s apart) + hero-sheet.jpg, and prints the times.
Then: cover = the best one (check the centre 4:5 crop for the Instagram grid); thumbnail = cut him out with
scripts/herocut.py and add the big text.
"""
import json
import os
import subprocess
import sys
import tempfile

import cv2
import numpy as np
import Quartz  # noqa: F401
import Vision
from Foundation import NSURL

ROT = {90: "transpose=1,", 270: "transpose=2,", 180: "hflip,vflip,"}


def opt(flag, default=None):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else default


def pts(region, box, w, h):
    """Landmark points of a region in pixel coordinates (Vision gives them inside the face box, bottom-left origin)."""
    if region is None:
        return None
    n = region.pointCount()
    p = region.normalizedPoints()
    bx, by, bw, bh = box
    return np.array([[(bx + p[i].x * bw) * w, (1 - (by + p[i].y * bh)) * h] for i in range(n)])


def openness(points):
    if points is None or len(points) < 3:
        return 0.0
    width = np.ptp(points[:, 0]) or 1
    return float(np.ptp(points[:, 1]) / width)


def score_frame(path):
    img = cv2.imread(path)
    if img is None:
        return None
    h, w = img.shape[:2]
    req = Vision.VNDetectFaceLandmarksRequest.alloc().init()
    handler = Vision.VNImageRequestHandler.alloc().initWithURL_options_(NSURL.fileURLWithPath_(path), None)
    ok, _ = handler.performRequests_error_([req], None)
    faces = list(req.results() or []) if ok else []
    if not faces:
        return None
    f = max(faces, key=lambda o: o.boundingBox().size.width * o.boundingBox().size.height)
    b = f.boundingBox()
    box = (b.origin.x, b.origin.y, b.size.width, b.size.height)
    x0, y0 = int(max(0, b.origin.x * w)), int(max(0, (1 - b.origin.y - b.size.height) * h))
    x1, y1 = int(min(w, (b.origin.x + b.size.width) * w)), int(min(h, (1 - b.origin.y) * h))
    crop = cv2.cvtColor(img[y0:y1, x0:x1], cv2.COLOR_BGR2GRAY)
    if crop.size == 0:
        return None
    sharp = float(cv2.Laplacian(cv2.resize(crop, (256, 256)), cv2.CV_64F).var())
    lm = f.landmarks()
    eyes = min(openness(pts(lm.leftEye(), box, w, h)), openness(pts(lm.rightEye(), box, w, h))) if lm else 0
    mouth = openness(pts(lm.innerLips(), box, w, h)) if lm else 0
    size = b.size.height
    cropped = b.origin.x < 0.01 or b.origin.y < 0.01 or b.origin.x + b.size.width > 0.99 or b.origin.y + b.size.height > 0.99
    return {"sharp": sharp, "eyes": eyes, "mouth": mouth, "size": size, "cropped": cropped}


def main():
    video, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    start, end = float(opt("--from", 0)), opt("--to")
    fps, n = float(opt("--fps", 2)), int(opt("--n", 4))
    rot = ROT.get(int(opt("--rotate", 0)), "")
    ffmpeg = os.path.join(os.path.dirname(__file__), "..", "node_modules", "ffmpeg-static", "ffmpeg")
    with tempfile.TemporaryDirectory() as tmp:
        cmd = [ffmpeg, "-hide_banner", "-loglevel", "error", "-ss", str(start)] + (["-t", str(float(end) - start)] if end else [])
        cmd += ["-i", video, "-vf", f"{rot}fps={fps},scale='min(1280,iw)':-2", "-q:v", "2", f"{tmp}/%05d.jpg"]
        subprocess.run(cmd, check=True)
        rows = []
        for i, name in enumerate(sorted(os.listdir(tmp))):
            s = score_frame(f"{tmp}/{name}")
            if s:
                rows.append({"t": round(start + i / fps, 2), **s})
    if not rows:
        print("no faces found")
        return
    # normalise each measure across the clip, then weight: sharpness and open eyes matter most
    def norm(k):
        v = np.array([r[k] for r in rows], dtype=float)
        return (v - v.min()) / (np.ptp(v) or 1)
    sharp, eyes, mouth, size = norm("sharp"), norm("eyes"), norm("mouth"), norm("size")
    top_sharp = float(np.percentile([r["sharp"] for r in rows], 90))  # vs the sharpest frames: night footage is soft overall
    for i, r in enumerate(rows):
        # hard rules first (tuned on img-1391): half-closed eyes (< 0.16) or a motion-blurred face (under 60 % of the
        # sharpest frames' level) never make the cover, however good the expression
        r["score"] = round(float(0.4 * sharp[i] + 0.3 * eyes[i] + 0.15 * mouth[i] + 0.15 * size[i] - (0.5 if r["cropped"] else 0)
                                 - (0.8 if r["eyes"] < 0.16 else 0) - (0.8 if r["sharp"] < 0.6 * top_sharp else 0)), 3)
    picks = []
    ranked = sorted(rows, key=lambda r: -r["score"])
    passing = [r for r in ranked if r["score"] > 0] or ranked[:1]  # frames that break a hard rule only if nothing passes
    for r in passing:
        if all(abs(r["t"] - p["t"]) >= 1.5 for p in picks):
            picks.append(r)
        if len(picks) >= n:
            break
    files = []
    for k, p in enumerate(picks, 1):
        f = os.path.join(out, f"hero-{k}.jpg")
        subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-ss", str(p["t"]), "-i", video, "-frames:v", "1",
                        "-vf", f"{rot}null", "-q:v", "1", f], check=True)
        files.append(f)
        print(f'hero-{k}.jpg  t={p["t"]:.2f}s  score {p["score"]:.2f}  (sharp {p["sharp"]:.0f}, eyes {p["eyes"]:.2f}, mouth {p["mouth"]:.2f})')
    if len(files) > 1:
        inputs = sum([["-i", f] for f in files], [])
        subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y", *inputs, "-filter_complex",
                        "".join(f"[{i}]scale=-2:640[s{i}];" for i in range(len(files))) + "".join(f"[s{i}]" for i in range(len(files))) + f"hstack={len(files)}",
                        os.path.join(out, "hero-sheet.jpg")], check=True)
    json.dump(picks, open(os.path.join(out, "hero.json"), "w"), indent=1)


if __name__ == "__main__":
    main()
