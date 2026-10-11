"""Landscape (16:9) footage → vertical 9:16, framed on the speaker like a camera operator would.

For podcast / interview clips: each camera shot gets ONE steady framing centred on the biggest face in it
(the person on camera), and the framing changes only at real camera cuts. No wobbly tracking, no dead space.

Usage: .venv/bin/python scripts/vcrop.py <in.mkv|mp4> <out.mp4> [--fps 5] [--scene 0.3] [--bias 0.0]
  --bias: shift the frame toward where the person looks/speaks (fraction of crop width, e.g. 0.05). Default 0.
Writes <out.mp4> (1080x1920, original audio) and <out>.shots.json (cut times + chosen x per shot).
"""
import json
import os
import re
import statistics
import subprocess
import sys
import tempfile

import Quartz  # noqa: F401
import Vision
from Foundation import NSURL

FF = os.path.join(os.path.dirname(__file__), "..", "node_modules", "ffmpeg-static", "ffmpeg")


def opt(flag, default):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else default


def probe(path):
    err = subprocess.run([FF, "-hide_banner", "-i", path], capture_output=True, text=True).stderr
    w, h = map(int, re.search(r"Video:.*?(\d{3,5})x(\d{3,5})", err).groups())
    d = re.search(r"Duration: (\d+):(\d+):([\d.]+)", err).groups()
    return w, h, int(d[0]) * 3600 + int(d[1]) * 60 + float(d[2])


def scene_cuts(path, thresh):
    err = subprocess.run([FF, "-hide_banner", "-i", path, "-vf", f"scale=320:-2,select='gt(scene,{thresh})',showinfo",
                          "-an", "-f", "null", "-"], capture_output=True, text=True).stderr
    cuts = [float(t) for t in re.findall(r"pts_time:([\d.]+)", err)]
    merged = []
    for c in cuts:  # flashes / fast motion give bursts of "cuts": keep one per 0.5 s
        if not merged or c - merged[-1] > 0.5:
            merged.append(c)
    return merged


def faces(path, fps):
    out = []
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-i", path, "-vf", f"fps={fps},scale=640:-2",
                        "-q:v", "4", f"{tmp}/%05d.jpg"], check=True)
        for i, name in enumerate(sorted(os.listdir(tmp))):
            req = Vision.VNDetectFaceRectanglesRequest.alloc().init()
            handler = Vision.VNImageRequestHandler.alloc().initWithURL_options_(NSURL.fileURLWithPath_(f"{tmp}/{name}"), None)
            ok, _ = handler.performRequests_error_([req], None)
            res = req.results() or []
            if ok and res:
                b = max(res, key=lambda r: r.boundingBox().size.width).boundingBox()
                out.append((i / fps, b.origin.x + b.size.width / 2, b.size.width))
    return out


def main():
    src, dst = sys.argv[1], sys.argv[2]
    fps = float(opt("--fps", 5))
    bias = float(opt("--bias", 0))
    W, H, dur = probe(src)
    cw = round(H * 9 / 16 / 2) * 2  # crop width for a full-height 9:16 window
    cuts = scene_cuts(src, float(opt("--scene", 0.3)))
    track = faces(src, fps)
    bounds = [0.0] + cuts + [dur]
    shots = []
    for a, b in zip(bounds, bounds[1:]):
        xs = [x for t, x, _ in track if a <= t < b]
        if xs:
            cx = statistics.median(xs) * W + bias * cw
        else:
            cx = shots[-1]["cx"] if shots else W / 2  # no face (b-roll, hands): keep the previous framing
        x = int(max(0, min(W - cw, cx - cw / 2)))
        shots.append({"from": round(a, 3), "to": round(b, 3), "cx": cx, "x": x, "faces": len(xs)})
    # piecewise-constant x: changes exactly at the camera cuts
    expr = str(shots[-1]["x"])
    for s in reversed(shots[:-1]):
        expr = f"if(lt(t,{s['to']}),{s['x']},{expr})"
    vf = f"crop={cw}:{H}:'{expr}':0,scale=1080:1920:flags=lanczos,setsar=1"
    subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-y", "-i", src, "-vf", vf, "-c:v", "libx264", "-preset", "slow",
                    "-crf", "16", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", dst], check=True)
    json.dump({"source": src, "size": [W, H], "cropW": cw, "shots": shots}, open(dst + ".shots.json", "w"), indent=1)
    print(f"{dst}: {len(shots)} shots, faces in {len(track)} samples")


if __name__ == "__main__":
    main()
