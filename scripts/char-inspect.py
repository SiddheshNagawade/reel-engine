"""Pictures for directing a character scene (look at them, then write/adjust scene.json).

Usage:
  python3 scripts/char-inspect.py contact <plate.mp4> <out.jpg> [--every 15]
      every Nth frame, numbered: what happens when, where objects/surfaces are
  python3 scripts/char-inspect.py frame <plate.mp4> <out.jpg> <frame> [<frame> ...]
      full-size frames with a 100px grid (fine 20px ticks): measure floor lines, object edges, anchor spots
  python3 scripts/char-inspect.py check <plate.mp4> <track-wall.json> <scene.json> <out.jpg> [--every 30]
      the tracked floor line (+ ground.fix), occluder outlines and anchors drawn on the plate: verify before rendering
"""
import json
import sys

import cv2
import numpy as np


def frames(video, want=None, every=None):
    cap = cv2.VideoCapture(video)
    i = 0
    while True:
        ok, f = cap.read()
        if not ok:
            return
        if (want is not None and i in want) or (every and i % every == 0):
            yield i, f
        i += 1


def label(img, text, scale=1.0):
    cv2.putText(img, text, (8, int(34 * scale)), cv2.FONT_HERSHEY_SIMPLEX, 1.1 * scale, (0, 0, 0), int(6 * scale))
    cv2.putText(img, text, (8, int(34 * scale)), cv2.FONT_HERSHEY_SIMPLEX, 1.1 * scale, (0, 0, 255), int(2 * scale))


def tile(imgs, cols, w=480):
    imgs = [cv2.resize(im, (w, int(im.shape[0] * w / im.shape[1]))) for im in imgs]
    while len(imgs) % cols:
        imgs.append(np.zeros_like(imgs[0]))
    return np.vstack([np.hstack(imgs[r:r + cols]) for r in range(0, len(imgs), cols)])


def main():
    mode, a = sys.argv[1], sys.argv[2:]
    opt = lambda k, d: type(d)(a[a.index(k) + 1]) if k in a else d
    if mode == 'contact':
        out = []
        for i, f in frames(a[0], every=opt('--every', 15)):
            label(f, f'{i}', 2.2)
            out.append(f)
        cv2.imwrite(a[1], tile(out, 5, 384), [cv2.IMWRITE_JPEG_QUALITY, 85])
    elif mode == 'frame':
        want = {int(v) for v in a[2:] if v.isdigit()}
        for i, f in frames(a[0], want=want):
            h, w = f.shape[:2]
            for x in range(0, w, 20):
                cv2.line(f, (x, 0), (x, 8 if x % 100 else h), (0, 0, 255) if x % 100 == 0 else (0, 0, 180), 1)
            for y in range(0, h, 20):
                cv2.line(f, (0, y), (8 if y % 100 else w, y), (0, 0, 255) if y % 100 == 0 else (0, 0, 180), 1)
            for x in range(0, w, 200):
                cv2.putText(f, str(x), (x + 3, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
            for y in range(100, h, 100):
                cv2.putText(f, str(y), (3, y - 3), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
            label(f, f'frame {i}', 1.2)
            path = a[1].replace('.jpg', f'-{i:04d}.jpg') if len(want) > 1 else a[1]
            cv2.imwrite(path, f, [cv2.IMWRITE_JPEG_QUALITY, 90])
            print(path)
    elif mode == 'check':
        mats = json.load(open(a[1]))['matrices']
        scene = json.load(open(a[2]))
        g = scene['ground']
        fix = g.get('fix') or [[0, 0]]
        out = []
        anchor_frames = {an['frame'] for an in (scene.get('anchors') or {}).values()}
        for i, f in frames(a[0], want=anchor_frames, every=opt('--every', 30)):
            if i >= len(mats):
                break
            M = np.array(mats[i])
            dy = float(np.interp(i, [k[0] for k in fix], [k[1] for k in fix]))
            pts = []
            for x in np.arange(-3000, 12000, 40):
                p = M @ [x, g['y0'] + g['slope'] * x, 1]
                if -50 < p[0] < f.shape[1] + 50:
                    pts.append((int(p[0]), int(p[1] + dy)))
            for p, q in zip(pts, pts[1:]):
                cv2.line(f, p, q, (0, 0, 255), 4)
            for o in scene.get('occluders', []):
                if o['from'] <= i <= o['to']:
                    poly = np.array([(M @ [x, y, 1]) for x, y in o['poly']], np.int32)
                    cv2.polylines(f, [poly], True, (255, 0, 255), 3)
            for name, an in (scene.get('anchors') or {}).items():
                if an['frame'] == i:
                    cv2.circle(f, tuple(int(v) for v in an['screen']), 14, (0, 255, 0), -1)
                    cv2.putText(f, name, (int(an['screen'][0]) + 18, int(an['screen'][1])), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 160, 0), 3)
            label(f, f'{i}', 2.2)
            out.append(f)
        cv2.imwrite(a[3], tile(out, 3, 640), [cv2.IMWRITE_JPEG_QUALITY, 85])
    if mode != 'frame':
        print('→', a[1] if mode == 'contact' else a[3])


if __name__ == '__main__':
    main()
