"""Auto colour grade with a TRAINED model: Image-Adaptive 3D LUT (Zeng et al., TPAMI 2020; github.com/HuiZeng/
Image-Adaptive-3DLUT, Apache-2.0), trained on MIT-Adobe FiveK = 5,000 photos graded by a professional retoucher
(expert C). A tiny CNN looks at the picture and mixes 3 learned 3D LUTs into the grade that picture needs (exposure,
contrast, saturation, colour): it fixes flat/grey footage and keeps a deliberate mood instead of "neutralising" it.

Usage: .venv/bin/python scripts/autograde.py <video> <out.cube> [--strength 0.8] [--every 1] [--from s] [--to s]
       [--apply out.mp4]   (test render of the range with the LUT, ffmpeg lut3d)
Runs locally on the Mac (CPU/MPS, ~1 s per video); no tokens, no internet. Weights: models/autograde/ (Mac system files).
- The model's weights are averaged over frames sampled every --every seconds (one stable grade per range, no flicker).
- --strength blends the model's grade with the untouched picture (1 = full expert grade).
- HLG HDR footage is tone-mapped to Rec.709 before analysis (what the viewer sees).
"""
import argparse
import os
import subprocess
import tempfile

import numpy as np
import torch
import torch.nn as nn

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
FF = os.path.join(ROOT, "node_modules", "ffmpeg-static", "ffmpeg")
MODELS = os.path.join(ROOT, "models", "autograde")
DIM = 33


def block(i, o, norm=False):
    layers = [nn.Conv2d(i, o, 3, stride=2, padding=1), nn.LeakyReLU(0.2)]
    if norm:
        layers.append(nn.InstanceNorm2d(o, affine=True))
    return layers


class Classifier(nn.Module):  # same layout as the paper's models.py (so the trained weights load)
    def __init__(self):
        super().__init__()
        self.model = nn.Sequential(
            nn.Upsample(size=(256, 256), mode="bilinear"),
            nn.Conv2d(3, 16, 3, stride=2, padding=1), nn.LeakyReLU(0.2), nn.InstanceNorm2d(16, affine=True),
            *block(16, 32, True), *block(32, 64, True), *block(64, 128, True), *block(128, 128),
            nn.Dropout(p=0.5), nn.Conv2d(128, 3, 8, padding=0),
        )

    def forward(self, x):
        return self.model(x)


def hlg(video):
    return "arib-std-b67" in subprocess.run([FF, "-hide_banner", "-i", video], capture_output=True, text=True).stderr


def tonemap_vf(video):
    return "zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=mobius:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p," if hlg(video) else ""


def frames(video, every, t0, t1, w=256, h=456):
    args = [FF, "-hide_banner", "-loglevel", "error"]
    if t0:
        args += ["-ss", str(t0)]
    if t1:
        args += ["-to", str(t1)] if not t0 else ["-t", str(t1 - t0)]
    args += ["-i", video, "-vf", f"{tonemap_vf(video)}fps=1/{every},scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    raw = subprocess.run(args, check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)


def load():
    clf = Classifier()
    clf.load_state_dict(torch.load(os.path.join(MODELS, "classifier.pth"), weights_only=True, map_location="cpu"))
    clf.eval()
    luts = torch.load(os.path.join(MODELS, "LUTs.pth"), weights_only=True, map_location="cpu")
    return clf, [luts[k]["LUT"] for k in ("0", "1", "2")]


def grade_lut(imgs, strength=0.8):
    """imgs: N×H×W×3 uint8 → (3, 33, 33, 33) LUT indexed [channel, b, g, r], blended with identity by strength."""
    clf, luts = load()
    with torch.no_grad():
        x = torch.from_numpy(imgs.copy()).permute(0, 3, 1, 2).float() / 255
        w = clf(x).reshape(len(imgs), 3).mean(0)  # one grade for the whole range
    lut = w[0] * luts[0] + w[1] * luts[1] + w[2] * luts[2]
    g = torch.linspace(0, 1, DIM)
    b_, g_, r_ = torch.meshgrid(g, g, g, indexing="ij")
    ident = torch.stack([r_, g_, b_])
    return (ident + (lut - ident) * strength).clamp(0, 1).numpy(), w.tolist()


def write_cube(lut, path):
    # .cube order = red fastest, then green, then blue; our array is [c, b, g, r] → iterate b, g, r
    with open(path, "w") as f:
        f.write(f'TITLE "autograde"\nLUT_3D_SIZE {DIM}\n')
        for bi in range(DIM):
            for gi in range(DIM):
                for ri in range(DIM):
                    f.write(f"{lut[0, bi, gi, ri]:.6f} {lut[1, bi, gi, ri]:.6f} {lut[2, bi, gi, ri]:.6f}\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("cube")
    ap.add_argument("--strength", type=float, default=0.8)
    ap.add_argument("--every", type=float, default=1.0)
    ap.add_argument("--from", dest="t0", type=float, default=0)
    ap.add_argument("--to", dest="t1", type=float, default=0)
    ap.add_argument("--apply")
    a = ap.parse_args()
    imgs = frames(a.video, a.every, a.t0, a.t1)
    lut, w = grade_lut(imgs, a.strength)
    write_cube(lut, a.cube)
    print(f"  autograde: {len(imgs)} frames · model weights {[round(v, 2) for v in w]} · strength {a.strength} → {a.cube}")
    if a.apply:
        args = [FF, "-hide_banner", "-loglevel", "error", "-y"]
        if a.t0:
            args += ["-ss", str(a.t0)]
        if a.t1:
            args += ["-t", str(a.t1 - a.t0)]
        args += ["-i", a.video, "-vf", f"{tonemap_vf(a.video)}lut3d={a.cube}", "-c:a", "copy", a.apply]
        subprocess.run(args, check=True)


if __name__ == "__main__":
    main()
