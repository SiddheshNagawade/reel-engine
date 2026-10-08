"""Cut a flat-design character sheet (EPS/AI/PDF) into rig parts.

Usage: python3 scripts/char-parts.py <sheet.eps|.ai|.pdf|.png> <out-dir> [--names smile,shock,laugh,sad,kiss]

Renders the sheet (Ghostscript for vector files; PNG/JPG with a transparent or white background also work),
finds each separate drawing (connected shapes) and saves the heads as PNGs: head-1.png … in reading order,
plus head-side.png from a side-view figure if the sheet has one. --names renames them in that order.
Look at parts.png (every head, numbered) and map expressions in scene.json → character.heads. The body, arms and legs are drawn as vector
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
YELLOW = np.array([45, 176, 245])  # top colour (BGR), removed from head crops; re-measured from the sheet


def main():
    src, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True)
    dpi = 288  # 4 px per point
    k = dpi / 72
    names = sys.argv[sys.argv.index('--names') + 1].split(',') if '--names' in sys.argv else []
    if src.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
        im = cv2.imread(src, cv2.IMREAD_UNCHANGED)
        if im.shape[2] == 3 or im[:, :, 3].min() == 255:  # no transparency: treat near-white as background
            im = cv2.cvtColor(im[:, :, :3], cv2.COLOR_BGR2BGRA)
            im[(im[:, :, :3] > 245).all(2), 3] = 0
        k = 4  # assume the raster is roughly 4 px per sheet point
    else:
        png = os.path.join(tempfile.mkdtemp(), 'sheet.png')
        try:
            subprocess.run(['gs', '-q', '-dSAFER', '-dBATCH', '-dNOPAUSE', '-dEPSCrop', '-sDEVICE=pngalpha', f'-r{dpi}',
                            '-dTextAlphaBits=4', '-dGraphicsAlphaBits=4', f'-sOutputFile={png}', src], check=True)
        except FileNotFoundError:
            sys.exit('Ghostscript is needed for EPS/AI/PDF sheets: brew install ghostscript')
        im = cv2.imread(png, cv2.IMREAD_UNCHANGED)
    alpha = (im[:, :, 3] > 10).astype(np.uint8)
    n, _, st, _ = cv2.connectedComponentsWithStats(cv2.dilate(alpha, np.ones((int(2 * k) | 1,) * 2, np.uint8)))
    boxes = [tuple(int(v) for v in st[i][:4]) for i in range(1, n) if st[i][4] > 2000 * k * k / 4]
    tall = max(boxes, key=lambda b: b[3])  # the big front figure defines the unit
    unit = k  # 1 rig unit = 1 sheet point; the big figure is ~1700 units tall
    global YELLOW  # the top's colour = most common colour across the big figure's chest
    x, y, w, h = tall
    band = im[y + int(h * 0.3):y + int(h * 0.42), x:x + w]
    px_ = band[band[:, :, 3] > 250][:, :3] // 8 * 8
    if len(px_):
        vals, counts = np.unique(px_, axis=0, return_counts=True)
        YELLOW = vals[counts.argmax()].astype(int) + 4

    # Heads = the row of equal boxes along the top (excluding the big figure).
    heads = sorted([b for b in boxes if b[1] < 20 * k and b != tall], key=lambda b: b[0])
    # same-size boxes in the top band = the expression heads
    if heads:
        hh = np.median([b[3] for b in heads])
        heads = [b for b in heads if abs(b[3] - hh) < 0.25 * hh]
    meta = {'pxPerUnit': PX, 'heads': {}}
    for n, (x, y, w, h) in enumerate(heads):
        name = names[n] if n < len(names) else str(n + 1)
        meta['heads'][name] = save(im, (x, y, w, h), unit, PX, os.path.join(out, f'head-{name}.png'))

    # Side-view head: top of the narrowest full-height figure (drawn at half scale on the sheet).
    # A side view = a full-height figure much narrower than the others (drawn at half scale on these sheets).
    figs = [b for b in boxes if b[3] > 0.45 * tall[3] and b != tall]
    if len(figs) >= 2:
        side = min(figs, key=lambda b: b[2])
        others = np.median([b[2] for b in figs if b != side])
        if side[2] < 0.7 * others:
            x, y, w, h = side
            crop_h = int(h * 0.19)  # head + neck + collar skin (the hand further down is skin too)
            meta['heads']['side'] = save(im, (x, y, w, crop_h), unit * side[3] / tall[3], PX, os.path.join(out, 'head-side.png'))
    json.dump(meta, open(os.path.join(out, 'parts.json'), 'w'), indent=1)
    index(out, meta)
    print('heads:', ', '.join(meta['heads']), f'→ {out}/parts.png')


def index(out, meta):
    """One labelled image of every head, to decide which number is which expression."""
    tiles = []
    for name, m in meta['heads'].items():
        im = cv2.imread(os.path.join(out, m['file']), cv2.IMREAD_UNCHANGED)
        s = 220 / im.shape[0]
        im = cv2.resize(im, None, fx=s, fy=s)
        bg = np.full((260, max(200, im.shape[1] + 20), 3), 235, np.uint8)
        a = im[:, :, 3:4] / 255.0
        y0, x0 = 30, (bg.shape[1] - im.shape[1]) // 2
        bg[y0:y0 + im.shape[0], x0:x0 + im.shape[1]] = (im[:, :, :3] * a + bg[y0:y0 + im.shape[0], x0:x0 + im.shape[1]] * (1 - a)).astype(np.uint8)
        cv2.putText(bg, name, (8, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 200), 2)
        tiles.append(bg)
    cv2.imwrite(os.path.join(out, 'parts.png'), np.hstack(tiles))


def save(im, box, unit, px, path, strip_yellow=True):  # strip_yellow: drop sweater-coloured pixels below the neck
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
