"""Cut ONE person out of a photo/frame (Apple Vision person INSTANCE masks), for hero intros and stickers.

Usage: .venv/bin/python scripts/herocut.py <image> <x> <y> <out.png> [--box 0.3]
  x, y = a point on that person (fractions of the image, e.g. his face from a labelled sheet).
  The image is first cropped to a window around the point (--box = window width as a fraction of the image width),
  because Vision separates at most 4 people per image. Writes an RGBA PNG cropped to the person + <out>.json bbox.
"""
import json
import os
import subprocess
import sys
import tempfile

import Quartz
import Vision
from Foundation import NSURL, NSIndexSet


def read_mask(buf):
    Quartz.CVPixelBufferLockBaseAddress(buf, 0)
    w, h = Quartz.CVPixelBufferGetWidth(buf), Quartz.CVPixelBufferGetHeight(buf)
    bpr = Quartz.CVPixelBufferGetBytesPerRow(buf)
    data = bytes(Quartz.CVPixelBufferGetBaseAddress(buf).as_buffer(bpr * h))
    Quartz.CVPixelBufferUnlockBaseAddress(buf, 0)
    return w, h, bpr, data


def main():
    img, x, y, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
    box = float(sys.argv[sys.argv.index('--box') + 1]) if '--box' in sys.argv else 0.3
    with tempfile.TemporaryDirectory() as tmp:
        full = f'{tmp}/full.png'
        subprocess.run(['sips', '-s', 'format', 'png', img, '--out', full], check=True, capture_output=True)
        ci = Quartz.CIImage.imageWithContentsOfURL_(NSURL.fileURLWithPath_(full))
        ext = ci.extent()
        W, H = ext.size.width, ext.size.height
        # window around the point (CoreImage origin is bottom-left)
        cw, ch = W * box, H
        cx0 = max(0, min(W - cw, x * W - cw / 2))
        crop = ci.imageByCroppingToRect_(Quartz.CGRectMake(cx0, 0, cw, ch)).imageByApplyingTransform_(Quartz.CGAffineTransformMakeTranslation(-cx0, 0))
        ctx = Quartz.CIContext.contextWithOptions_(None)
        win = f'{tmp}/win.png'
        ctx.writePNGRepresentationOfImage_toURL_format_colorSpace_options_error_(crop, NSURL.fileURLWithPath_(win), Quartz.kCIFormatRGBA8, Quartz.CGColorSpaceCreateDeviceRGB(), None, None)

        req = Vision.VNGeneratePersonInstanceMaskRequest.alloc().init()
        handler = Vision.VNImageRequestHandler.alloc().initWithURL_options_(NSURL.fileURLWithPath_(win), None)
        ok, err = handler.performRequests_error_([req], None)
        res = req.results() or []
        if not ok or not res:
            sys.exit(f'no person found ({err})')
        obs = res[0]
        mw, mh, bpr, data = read_mask(obs.instanceMask())
        px, py = (x * W - cx0) / cw, y
        # most common instance id in a small neighbourhood of the point
        votes = {}
        for dy in range(-6, 7, 2):
            for dx in range(-6, 7, 2):
                i = min(mw - 1, max(0, int(px * mw) + dx)); j = min(mh - 1, max(0, int(py * mh) + dy))
                v = data[j * bpr + i]
                if v: votes[v] = votes.get(v, 0) + 1
        if not votes:
            sys.exit('point is not on a person')
        inst = max(votes, key=votes.get)
        # bbox of that instance (mask coords, origin top-left)
        xs, ys = [], []
        for j in range(0, mh, 2):
            row = data[j * bpr:j * bpr + mw]
            for i in range(0, mw, 2):
                if row[i] == inst: xs.append(i); ys.append(j)
        bx0, bx1, by0, by1 = min(xs) / mw, max(xs) / mw, min(ys) / mh, max(ys) / mh
        buf, err = obs.generateMaskedImageOfInstances_fromRequestHandler_croppedToInstancesExtent_error_(NSIndexSet.indexSetWithIndex_(inst), handler, False, None)
        # bbox from the masked image's alpha (4 bytes per pixel, alpha last or first: take the max of both)
        bw, bh, bbpr, bdata = read_mask(buf)
        xs, ys = [], []
        for j in range(0, bh, 4):
            o = j * bbpr
            for i in range(0, bw, 4):
                if bdata[o + i * 4 + 3] > 40 or bdata[o + i * 4] > 40 and bdata[o + i * 4 + 3] > 0:
                    xs.append(i); ys.append(j)
        bx0, bx1, by0, by1 = min(xs) / bw, (max(xs) + 4) / bw, min(ys) / bh, min(1, (max(ys) + 4) / bh)
        mimg = Quartz.CIImage.imageWithCVPixelBuffer_(buf)
        e = mimg.extent()
        r = Quartz.CGRectMake(bx0 * e.size.width, (1 - by1) * e.size.height, (bx1 - bx0) * e.size.width, (by1 - by0) * e.size.height)
        cut = mimg.imageByCroppingToRect_(r)
        ctx.writePNGRepresentationOfImage_toURL_format_colorSpace_options_error_(cut, NSURL.fileURLWithPath_(out), Quartz.kCIFormatRGBA8, Quartz.CGColorSpaceCreateDeviceRGB(), None, None)
        bb = {'x0': (cx0 + bx0 * cw) / W, 'x1': (cx0 + bx1 * cw) / W, 'y0': by0, 'y1': by1, 'instance': int(inst), 'people': len(obs.allInstances())}
        json.dump(bb, open(os.path.splitext(out)[0] + '.json', 'w'))
        print(json.dumps(bb))


if __name__ == '__main__':
    main()
