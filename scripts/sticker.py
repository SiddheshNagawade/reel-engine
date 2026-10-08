"""Turn anything into a sticker: cut the subject out of a picture or a video frame (Apple Vision background removal,
built into macOS 14+), trim it, add a white sticker outline + soft shadow.

Usage: .venv/bin/python scripts/sticker.py <image | video> <out.png> [--frame N] [--point x,y] [--outline 14] [--no-shadow]
  --frame N    take frame N of a video (30fps frame number)
  --point x,y  keep only the object under this point (fractions of the picture, e.g. 0.7,0.6); default: every
               foreground object. Look at the picture first and point at the thing you want.
  --outline    white border in px (0 = none)
Also writes <out>-check.jpg (the sticker on grey) to look at before using it.
Used for direction.attach {what: 'image', src: ...}. See .claude/skills/motion-graphics/SKILL.md.
"""
import os
import subprocess
import sys
import tempfile

import cv2
import numpy as np
import Quartz
import Vision
from Foundation import NSURL


def to_png(ci, path, ctx):
    ctx.writePNGRepresentationOfImage_toURL_format_colorSpace_options_error_(
        ci, NSURL.fileURLWithPath_(path), Quartz.kCIFormatL8, Quartz.CGColorSpaceCreateDeviceGray(), None, None)
    return cv2.imread(path, cv2.IMREAD_GRAYSCALE)


def main():
    src, out = sys.argv[1], sys.argv[2]
    arg = lambda k, d=None: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d
    outline = int(arg('--outline', 14))
    tmp = tempfile.mkdtemp()
    img_path = src
    if arg('--frame') is not None or src.lower().endswith(('.mp4', '.mov', '.m4v', '.webm')):
        ffmpeg = os.path.join(os.path.dirname(__file__), '..', 'node_modules', 'ffmpeg-static', 'ffmpeg')
        img_path = os.path.join(tmp, 'frame.png')
        n = int(arg('--frame', 0))
        subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-i', src, '-vf', f"select='eq(n\\,{n})'", '-vsync', '0',
                        '-frames:v', '1', img_path], check=True)
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    if img.ndim == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    img = img[:, :, :3]
    h, w = img.shape[:2]

    req = Vision.VNGenerateForegroundInstanceMaskRequest.alloc().init()
    handler = Vision.VNImageRequestHandler.alloc().initWithURL_options_(NSURL.fileURLWithPath_(img_path), None)
    ok, err = handler.performRequests_error_([req], None)
    res = req.results() or []
    if not ok or not res:
        sys.exit(f'no foreground object found in {src}')
    obs = res[0]
    ctx = Quartz.CIContext.contextWithOptions_(None)
    instances = obs.allInstances()
    if arg('--point'):
        px, py = map(float, arg('--point').split(','))
        labels = to_png(Quartz.CIImage.imageWithCVPixelBuffer_(obs.instanceMask()), os.path.join(tmp, 'labels.png'), ctx)
        lh, lw = labels.shape
        lx, ly = int(px * lw), int(py * lh)
        # the label under the point, or the nearest labelled pixel
        if labels[ly, lx] == 0:
            ys, xs = np.nonzero(labels)
            if not len(xs):
                sys.exit('nothing found near that point')
            j = np.argmin((xs - lx) ** 2 + (ys - ly) ** 2)
            ly, lx = ys[j], xs[j]
        instances = Foundation_indexset(int(labels[ly, lx]))
    buf, err = obs.generateScaledMaskForImageForInstances_fromRequestHandler_error_(instances, handler, None)
    if buf is None:
        sys.exit(f'mask failed: {err}')
    mask = to_png(Quartz.CIImage.imageWithCVPixelBuffer_(buf), os.path.join(tmp, 'mask.png'), ctx)
    if mask.shape[:2] != (h, w):
        mask = cv2.resize(mask, (w, h))

    # Trim to the object (+ room for the outline), then outline + shadow.
    ys, xs = np.nonzero(mask > 20)
    pad = outline + 24
    y0, y1, x0, x1 = max(0, ys.min() - pad), min(h, ys.max() + pad), max(0, xs.min() - pad), min(w, xs.max() + pad)
    rgb, a = img[y0:y1, x0:x1].copy(), mask[y0:y1, x0:x1].astype(np.float32) / 255
    rgb = np.pad(rgb, ((pad, pad), (pad, pad), (0, 0)))
    a = np.pad(a, pad)
    canvas = np.zeros((*a.shape, 4), np.float32)
    if '--no-shadow' not in sys.argv:
        sh = cv2.GaussianBlur(cv2.dilate(a, np.ones((outline * 2 + 1,) * 2, np.uint8)), (0, 0), 10)
        sh = np.roll(sh, (8, 4), (0, 1)) * 0.35
        canvas[..., 3] = sh
    if outline:
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (outline * 2 + 1,) * 2)
        ring = cv2.GaussianBlur(cv2.dilate((a > 0.5).astype(np.float32), k), (0, 0), 1.2)
        canvas[..., :3] = canvas[..., :3] * (1 - ring[..., None]) + 255 * ring[..., None]
        canvas[..., 3] = np.maximum(canvas[..., 3], ring)
    canvas[..., :3] = canvas[..., :3] * (1 - a[..., None]) + rgb * a[..., None]
    canvas[..., 3] = np.maximum(canvas[..., 3], a)
    canvas[..., 3] *= 255
    ys, xs = np.nonzero(canvas[..., 3] > 3)
    canvas = canvas[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    cv2.imwrite(out, canvas.clip(0, 255).astype(np.uint8))
    al = canvas[..., 3:4] / 255
    check = (canvas[..., :3] * al + 128 * (1 - al)).astype(np.uint8)
    cv2.imwrite(os.path.splitext(out)[0] + '-check.jpg', check)
    print(f'sticker {canvas.shape[1]}x{canvas.shape[0]} → {out}')


def Foundation_indexset(i):
    from Foundation import NSIndexSet
    return NSIndexSet.indexSetWithIndex_(i)


if __name__ == '__main__':
    main()
