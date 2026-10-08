"""Camera track for character overlays: how a surface moves through a handheld shot.

Usage: python3 scripts/walltrack.py <video> <out.json> [--surface wall|dark] [--band 0.35,0.78]

Tracks corner features frame-to-frame (Lucas-Kanade) inside a horizontal band of the frame and
fits a similarity transform (move + scale + small rotation) with RANSAC. Transforms are chained,
so each frame gets a 2x3 matrix that maps a point drawn on frame 0 onto frame t: a character
"painted" on the surface stays glued to it while the camera pans.

  --surface wall  ignore very dark pixels (bags, people) so the wall/skirting drives the track
  --surface dark  only dark pixels (e.g. a black bag the character is sitting on)
"""
import json
import sys

import cv2
import numpy as np


def main():
    args = sys.argv[1:]
    video, out = args[0], args[1]
    surface = args[args.index('--surface') + 1] if '--surface' in args else 'wall'
    band = [float(v) for v in (args[args.index('--band') + 1] if '--band' in args else '0.35,0.78').split(',')]

    cap = cv2.VideoCapture(video)
    fps = cap.get(cv2.CAP_PROP_FPS)
    ok, frame = cap.read()
    h, w = frame.shape[:2]
    scale = 0.5  # track at half resolution: faster, less noise
    small = lambda f: cv2.cvtColor(cv2.resize(f, None, fx=scale, fy=scale), cv2.COLOR_BGR2GRAY)

    def roi(gray):
        m = np.zeros_like(gray)
        m[int(band[0] * gray.shape[0]):int(band[1] * gray.shape[0]), :] = 255
        dark = (gray < 70).astype(np.uint8) * 255
        dark = cv2.dilate(dark, np.ones((15, 15), np.uint8))
        return cv2.bitwise_and(m, dark if surface == 'dark' else cv2.bitwise_not(dark))

    prev = small(frame)
    acc = np.eye(3)
    mats = [acc[:2].tolist()]
    quality = [1.0]
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        cur = small(frame)
        pts = cv2.goodFeaturesToTrack(prev, 600, 0.005, 6, mask=roi(prev), blockSize=7)
        m = np.eye(3)
        inl = 0.0
        if pts is not None and len(pts) >= 8:
            nxt, st, _ = cv2.calcOpticalFlowPyrLK(prev, cur, pts, None, winSize=(31, 31), maxLevel=4)
            good = st.ravel() == 1
            if good.sum() >= 8:
                a, inliers = cv2.estimateAffinePartial2D(pts[good], nxt[good], method=cv2.RANSAC, ransacReprojThreshold=1.5)
                if a is not None:
                    a[:, 2] /= scale  # back to full-resolution pixels
                    m[:2] = a
                    inl = float(inliers.mean())
        acc = m @ acc
        mats.append(acc[:2].tolist())
        quality.append(round(inl, 3))
        prev = cur

    json.dump({'fps': fps, 'width': w, 'height': h, 'surface': surface, 'band': band,
               'matrices': mats, 'quality': quality}, open(out, 'w'))
    p0 = np.array([w / 2, h * 0.58, 1])
    for i in range(0, len(mats), 30):
        x, y = np.array(mats[i]) @ p0
        print(f'frame {i:4d}: wall centre → ({x:7.1f}, {y:6.1f})  inliers {quality[i]:.2f}')


if __name__ == '__main__':
    main()
