"""Cut a flat-design character sheet (EPS/AI/PDF) into rig parts.

Usage: python3 scripts/char-parts.py <sheet.eps> <out-dir>

Renders the sheet with Ghostscript (transparent background), finds each separate drawing
(connected shapes) and saves the heads as PNGs. The body, arms and legs are drawn as vector
shapes by the rig (src/character), so only the heads, which carry the expressions, come from the art.

Units: everything is saved at 3 px per "rig unit". One rig unit = one point of the big front-view
figure on the sheet (that figure is ~1700 units tall), so the rig can place heads by its own numbers.
Writes parts.json with each head's anchor (the bottom-centre of the neck, where it meets the collar).
"""
import json
import os
import subprocess
import sys
import tempfile

import cv2
import numpy as np

PX = 3  # px per rig unit in the saved PNGs
YELLOW = np.array([45, 176, 245])  # sweater colour (BGR), removed from head crops


def main():
    src, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    dpi = 288  # 4 px per point
    k = dpi / 72
    png = os.path.join(tempfile.mkdtemp(), 'sheet.png')
    subprocess.run(['gs', '-q', '-dSAFER', '-dBATCH', '-dNOPAUSE', '-dEPSCrop', '-sDEVICE=pngalpha', f'-r{dpi}',
                    '-dTextAlphaBits=4', '-dGraphicsAlphaBits=4', f'-sOutputFile={png}', src], check=True)
    im = cv2.imread(png, cv2.IMREAD_UNCHANGED)
    alpha = (im[:, :, 3] > 10).astype(np.uint8)
    n, _, st, _ = cv2.connectedComponentsWithStats(cv2.dilate(alpha, np.ones((int(2 * k) | 1,) * 2, np.uint8)))
    boxes = [tuple(int(v) for v in st[i][:4]) for i in range(1, n) if st[i][4] > 2000 * k * k / 4]
    tall = max(boxes, key=lambda b: b[3])  # the big front figure defines the unit
    unit = k  # 1 rig unit = 1 sheet point; the big figure is ~1700 units tall

    # Heads = the row of equal boxes along the top (excluding the big figure).
    heads = sorted([b for b in boxes if b[1] < 20 * k and b != tall], key=lambda b: b[0])
    names = ['smile', 'shock', 'laugh', 'sad', 'kiss', 'mask']
    meta = {'pxPerUnit': PX, 'heads': {}}
    for name, (x, y, w, h) in zip(names, heads):
        meta['heads'][name] = save(im, (x, y, w, h), unit, PX, os.path.join(out, f'head-{name}.png'))

    # Side-view head: top of the narrowest full-height figure (drawn at half scale on the sheet).
    figs = [b for b in boxes if b[3] > 0.45 * tall[3] and b != tall]
    side = min(figs, key=lambda b: b[2])
    x, y, w, h = side
    crop_h = int(h * 0.19)  # head + neck + collar skin (the hand further down is skin too)
    meta['heads']['side'] = save(im, (x, y, w, crop_h), unit / 2, PX, os.path.join(out, 'head-side.png'), strip_yellow=True)
    json.dump(meta, open(os.path.join(out, 'parts.json'), 'w'), indent=1)
    print(json.dumps(meta, indent=1))


def save(im, box, unit, px, path, strip_yellow=True):
    x, y, w, h = box
    crop = im[y:y + h, x:x + w].copy()
    if strip_yellow:
        d = np.abs(crop[:, :, :3].astype(int) - YELLOW).sum(2)
        crop[d < 60, 3] = 0
    a = crop[:, :, 3] > 10
    ys, xs = np.where(a)
    crop = crop[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    s = px / unit
    crop = cv2.resize(crop, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
    cv2.imwrite(path, crop)
    hh, ww = crop.shape[:2]
    # Anchor: lowest skin pixel row's centre = where the neck meets the collar.
    sk = crop[:, :, 3] > 128
    rows = np.where(sk.any(1))[0]
    bottom = rows.max()
    cols = np.where(sk[max(0, bottom - int(10 * px)):bottom + 1].any(0))[0]
    return {'file': os.path.basename(path), 'w': ww / px, 'h': hh / px,
            'anchorX': float(cols.mean() / px), 'anchorY': float(bottom / px)}


if __name__ == '__main__':
    main()
