"""Where his EYES point per sampled frame (Apple Vision landmarks): the pupil's position inside each eye, -1 = far left,
0 = centre (looking into the lens), +1 = far right; plus the nose's offset from the face centre (head turn).
Face yaw alone missed the look-aways (Vision quantises yaw to 45°, a glance at the laptop is ~15°).
Usage: .venv/bin/python scripts/facegaze.py <video> <out.json> [fps=4]   → [{t, gx, gy, nose}] (None = no face)"""
import json, os, subprocess, sys, tempfile
import Quartz  # noqa: F401
import Vision
from Foundation import NSURL

def pts(region):
    if region is None: return []
    p = region.normalizedPoints()
    return [(p[i].x, p[i].y) for i in range(region.pointCount())]

def offset(eye, pupil):
    if len(eye) < 3 or not pupil: return None
    xs, ys = [p[0] for p in eye], [p[1] for p in eye]
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    w, h = max(1e-4, max(xs) - min(xs)), max(1e-4, max(ys) - min(ys))
    return ((pupil[0][0] - cx) / (w / 2), (pupil[0][1] - cy) / (h / 2))

def main():
    video, out = sys.argv[1], sys.argv[2]
    rate = float(sys.argv[3]) if len(sys.argv) > 3 else 4
    ffmpeg = os.path.join(os.path.dirname(__file__), '..', 'node_modules', 'ffmpeg-static', 'ffmpeg')
    res = []
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-i', video, '-vf', f'fps={rate},scale=960:-2', '-q:v', '3', f'{tmp}/%05d.jpg'], check=True)
        for i, name in enumerate(sorted(os.listdir(tmp))):
            req = Vision.VNDetectFaceLandmarksRequest.alloc().init()
            h = Vision.VNImageRequestHandler.alloc().initWithURL_options_(NSURL.fileURLWithPath_(f'{tmp}/{name}'), None)
            ok, _ = h.performRequests_error_([req], None)
            best = None
            for r in (req.results() or []) if ok else []:
                if best is None or r.boundingBox().size.width > best.boundingBox().size.width: best = r
            row = {'t': round((i + 0.5) / rate, 3), 'gx': None, 'gy': None, 'nose': None}
            if best is not None and best.landmarks() is not None:
                L = best.landmarks()
                o = [offset(pts(L.leftEye()), pts(L.leftPupil())), offset(pts(L.rightEye()), pts(L.rightPupil()))]
                o = [x for x in o if x]
                if o: row['gx'], row['gy'] = round(sum(x[0] for x in o) / len(o), 3), round(sum(x[1] for x in o) / len(o), 3)
                nc = pts(L.noseCrest()); fc = pts(L.faceContour())
                if nc and fc:
                    row['nose'] = round((sum(p[0] for p in nc) / len(nc) - (min(p[0] for p in fc) + max(p[0] for p in fc)) / 2) / max(1e-4, max(p[0] for p in fc) - min(p[0] for p in fc)), 3)
            res.append(row)
    json.dump(res, open(out, 'w'))
    print(f'{len(res)} frames')

if __name__ == '__main__':
    main()
