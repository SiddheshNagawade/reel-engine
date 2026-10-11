"""Fix A/V sync of partial downloads (yt-dlp --download-sections).

Why: a section download starts the VIDEO at the keyframe before the requested time but the AUDIO exactly on time, and
both get timestamp 0, so the picture runs ahead of the voice (measured 1.23 s on the Aspire clips; lips visibly off).
Fix: find the video's true start by matching its camera cuts against a full-length, correctly timed preview of the same
video, then replace the audio with the exact slice of a full-length reference audio track.

Usage: .venv/bin/python scripts/avsync.py <video> <out.mp4> --requested <s> --preview <preview.mp4> --audio <full_audio>
                                          [--raw <section.mkv>]
  <video> can be the raw section or anything derived from it with the same timing (e.g. the vcrop.py output).
  If the cut match is weak (long single shots), it matches the picture frame by frame against the preview instead;
  that needs --raw (the uncropped section). Both methods agreed within 1 frame when tested (Aspire "voice" clip).
"""
import os
import re
import tempfile
import subprocess
import sys

FF = os.path.join(os.path.dirname(__file__), "..", "node_modules", "ffmpeg-static", "ffmpeg")


def opt(flag, default=None):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else default


def cuts(path, start=None, length=None, thresh=0.3):
    cmd = [FF, "-hide_banner"]
    if start is not None:
        cmd += ["-ss", str(start), "-t", str(length)]
    cmd += ["-i", path, "-vf", f"scale=320:-2,select='gt(scene,{thresh})',showinfo", "-an", "-f", "null", "-"]
    err = subprocess.run(cmd, capture_output=True, text=True).stderr
    ts = [float(t) + (start or 0) for t in re.findall(r"pts_time:([\d.]+)", err)]
    out = []
    for t in ts:
        if not out or t - out[-1] > 0.5:
            out.append(t)
    return out


def frame_match(raw, preview, req):
    """Start time of `raw` inside `preview` by comparing tiny greyscale frames (24 fps)."""
    import numpy as np
    with tempfile.TemporaryDirectory() as tmp:
        grab = lambda src, ss, t, out: subprocess.run(
            [FF, "-v", "error"] + (["-ss", str(ss)] if ss else []) + ["-t", str(t), "-i", src, "-vf",
             "fps=24,scale=32:18,format=gray", "-f", "rawvideo", out], check=True)
        grab(raw, 0, 30, f"{tmp}/p.raw")
        lo = max(0, req - 10)
        grab(preview, lo, 50, f"{tmp}/r.raw")
        P = np.fromfile(f"{tmp}/p.raw", np.uint8).reshape(-1, 576).astype(float)
        R = np.fromfile(f"{tmp}/r.raw", np.uint8).reshape(-1, 576).astype(float)
        diffs = [np.abs(R[k:k + len(P)] - P).mean() for k in range(len(R) - len(P))]
        k = int(np.argmin(diffs))
        return lo + k / 24, diffs[k]


def main():
    video, dst = sys.argv[1], sys.argv[2]
    req = float(opt("--requested"))
    preview, audio = opt("--preview"), opt("--audio")
    mine = cuts(video)[:12]
    ref = cuts(preview, max(0, req - 8), 60)
    best, score = None, -1
    for r in ref:  # every pairing of a reference cut with one of mine proposes a start time
        for m in mine:
            start = r - m
            hits = sum(1 for x in mine if any(abs(start + x - y) < 0.12 for y in ref))
            if hits > score or (hits == score and abs(start - req) < abs(best - req)):
                best, score = start, hits
    pairs = [y - x for x in mine for y in ref if abs(best + x - y) < 0.12]
    best = sum(pairs) / len(pairs)  # refine: average over every matched cut (frame-accurate)
    print(f"{os.path.basename(video)}: requested {req:.3f}, video really starts at {best:.3f} "
          f"(offset {best - req:+.3f}s, {score}/{len(mine)} cuts matched)")
    if score < max(2, len(mine) // 2):
        if not opt("--raw"):
            sys.exit("weak cut match and no --raw given: not writing")
        best, diff = frame_match(opt("--raw"), preview, req)
        print(f"  frame match instead: video starts at {best:.3f} (offset {best - req:+.3f}s, mean diff {diff:.1f})")
        if diff > 15:
            sys.exit("frame match also weak: not writing, check this one by eye")
    subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-y", "-i", video, "-ss", f"{best:.3f}", "-i", audio,
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-shortest",
                    "-movflags", "+faststart", dst], check=True)


if __name__ == "__main__":
    main()
