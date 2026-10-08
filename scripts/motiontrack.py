"""Track the speaker's face, hands and body (Apple Vision, built into macOS) so things can be stuck onto them.

Usage: .venv/bin/python scripts/motiontrack.py <video> <out.json> [--rate 15] [--from F --frames N]

Writes {rate, w, h, frames: [{f, face, hands, body}]}. All points are fractions of the frame (origin top-left),
f = 30fps frame of <video>. Missing parts are left out of that sample (the renderer bridges short gaps).
  face:  box [x, y, w, h], roll (deg, + = head tilted clockwise on screen), yaw (deg),
         pts: leye, reye (pupils), nose, mouth, chin, top (top of the head, estimated along the face's up axis)
  hands: [{side: 'L'|'R' (screen side), conf, pts: wrist, thumb, index, middle, ring, little (tips), palm}]
  body:  pts: neck, lsh, rsh (shoulders), lwr, rwr (wrists)
Used by src/layers/Attach.tsx (direction.attach). See .claude/skills/motion-graphics/SKILL.md.
"""
import json
import math
import os
import subprocess
import sys
import tempfile

import Quartz  # noqa: F401  (CoreGraphics types)
import Vision
from Foundation import NSURL

HAND_TIPS = {
    'wrist': Vision.VNHumanHandPoseObservationJointNameWrist,
    'thumb': Vision.VNHumanHandPoseObservationJointNameThumbTip,
    'index': Vision.VNHumanHandPoseObservationJointNameIndexTip,
    'middle': Vision.VNHumanHandPoseObservationJointNameMiddleTip,
    'ring': Vision.VNHumanHandPoseObservationJointNameRingTip,
    'little': Vision.VNHumanHandPoseObservationJointNameLittleTip,
    'palm': Vision.VNHumanHandPoseObservationJointNameMiddleMCP,  # base of the middle finger ≈ centre of the palm
}
BODY = {
    'neck': Vision.VNHumanBodyPoseObservationJointNameNeck,
    'lsh': Vision.VNHumanBodyPoseObservationJointNameLeftShoulder,
    'rsh': Vision.VNHumanBodyPoseObservationJointNameRightShoulder,
    'lwr': Vision.VNHumanBodyPoseObservationJointNameLeftWrist,
    'rwr': Vision.VNHumanBodyPoseObservationJointNameRightWrist,
}


def r3(v):
    return round(float(v), 4)


def flip(p):  # Vision: origin bottom-left → ours: top-left
    return [r3(p[0]), r3(1 - p[1])]


def region_centre(region, box):
    """Mean of a landmark region's points, in image fractions (top-left origin)."""
    if region is None or region.pointCount() == 0:
        return None
    pts = region.normalizedPoints()
    n = region.pointCount()
    bx, by, bw, bh = box
    sx = sum(pts[i].x for i in range(n)) / n
    sy = sum(pts[i].y for i in range(n)) / n
    return flip((bx + sx * bw, by + sy * bh))


def region_lowest(region, box):
    if region is None or region.pointCount() == 0:
        return None
    pts = region.normalizedPoints()
    p = min((pts[i] for i in range(region.pointCount())), key=lambda q: q.y)
    bx, by, bw, bh = box
    return flip((bx + p.x * bw, by + p.y * bh))


def face_of(obs, aspect):
    bb = obs.boundingBox()
    box = (bb.origin.x, bb.origin.y, bb.size.width, bb.size.height)
    lm = obs.landmarks()
    face = {'box': [r3(box[0]), r3(1 - box[1] - box[3]), r3(box[2]), r3(box[3])]}
    pts = {}
    if lm is not None:
        for key, reg in (('leye', lm.leftPupil()), ('reye', lm.rightPupil()), ('nose', lm.nose()), ('mouth', lm.outerLips())):
            c = region_centre(reg, box)
            if c:
                pts[key] = c
        chin = region_lowest(lm.faceContour(), box)
        if chin:
            pts['chin'] = chin
    # Roll from the eye line (more stable than obs.roll(), which is quantised on older macOS).
    roll = None
    if 'leye' in pts and 'reye' in pts:
        a, b = sorted([pts['leye'], pts['reye']])  # screen-left eye first
        roll = math.degrees(math.atan2((b[1] - a[1]), (b[0] - a[0]) * aspect))
    elif obs.roll() is not None:
        roll = -math.degrees(float(obs.roll()))
    face['roll'] = round(roll or 0.0, 1)
    if obs.yaw() is not None:
        face['yaw'] = round(math.degrees(float(obs.yaw())), 1)
    # Top of the head: from the eyes' midpoint, go "up" the face by ~1.25 face heights' worth (hair included).
    cx = face['box'][0] + face['box'][2] / 2
    cy = face['box'][1] + face['box'][3] / 2
    if 'leye' in pts and 'reye' in pts:
        cx = (pts['leye'][0] + pts['reye'][0]) / 2
        cy = (pts['leye'][1] + pts['reye'][1]) / 2
    up = math.radians(face['roll'])
    d = face['box'][3] * 0.95  # eyes → top of hair, in frame heights
    pts['top'] = [r3(cx + math.sin(up) * d / aspect), r3(cy - math.cos(up) * d)]
    face['pts'] = pts
    return face


def hands_of(req):
    out = []
    for obs in req.results() or []:
        pts, confs = {}, []
        for key, joint in HAND_TIPS.items():
            p, err = obs.recognizedPointForJointName_error_(joint, None)
            if p is not None and p.confidence() > 0.3:
                pts[key] = flip((p.location().x, p.location().y))
                confs.append(p.confidence())
        if len(pts) >= 4 and 'palm' in pts:
            out.append({'conf': round(sum(confs) / len(confs), 2), 'pts': pts})
    out.sort(key=lambda h: h['pts']['palm'][0])
    if len(out) == 1:
        out[0]['side'] = 'L' if out[0]['pts']['palm'][0] < 0.5 else 'R'
    else:
        for h, s in zip(out, 'LR'):
            h['side'] = s
    return out


def body_of(req):
    res = req.results() or []
    if not res:
        return None
    pts = {}
    for key, joint in BODY.items():
        p, err = res[0].recognizedPointForJointName_error_(joint, None)
        if p is not None and p.confidence() > 0.3:
            pts[key] = flip((p.location().x, p.location().y))
    return {'pts': pts} if pts else None


def main():
    video, out = sys.argv[1], sys.argv[2]
    arg = lambda k, d: type(d)(sys.argv[sys.argv.index(k) + 1]) if k in sys.argv else d
    rate, start, count = arg('--rate', 15), arg('--from', 0), arg('--frames', 0)
    ffmpeg = os.path.join(os.path.dirname(__file__), '..', 'node_modules', 'ffmpeg-static', 'ffmpeg')
    probe = subprocess.run([ffmpeg, '-hide_banner', '-i', video], capture_output=True, text=True).stderr
    import re
    w, h = map(int, re.search(r', (\d{2,5})x(\d{2,5})', probe).groups())
    aspect = w / h
    frames = []
    with tempfile.TemporaryDirectory() as tmp:
        sel = f"select='gte(n\\,{start})'," if start else ''
        trim = ['-frames:v', str(math.ceil(count * rate / 30))] if count else []
        subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-i', video, '-vf', f'{sel}fps={rate},scale=720:-2',
                        *trim, '-q:v', '3', f'{tmp}/%05d.jpg'], check=True)
        files = sorted(os.listdir(tmp))
        for i, name in enumerate(files):
            fr = {'f': start + round(i * 30 / rate)}
            face_req = Vision.VNDetectFaceLandmarksRequest.alloc().init()
            hand_req = Vision.VNDetectHumanHandPoseRequest.alloc().init()
            hand_req.setMaximumHandCount_(2)
            body_req = Vision.VNDetectHumanBodyPoseRequest.alloc().init()
            handler = Vision.VNImageRequestHandler.alloc().initWithURL_options_(NSURL.fileURLWithPath_(f'{tmp}/{name}'), None)
            handler.performRequests_error_([face_req, hand_req, body_req], None)
            faces = face_req.results() or []
            if faces:
                big = max(faces, key=lambda o: o.boundingBox().size.width * o.boundingBox().size.height)  # the speaker
                fr['face'] = face_of(big, aspect)
            hands = hands_of(hand_req)
            if hands:
                fr['hands'] = hands
            body = body_of(body_req)
            if body:
                fr['body'] = body
            frames.append(fr)
            if i % 30 == 0:
                print(f'\r  tracking {i + 1}/{len(files)}', end='', flush=True)
    json.dump({'rate': rate, 'w': w, 'h': h, 'frames': frames}, open(out, 'w'), separators=(',', ':'))
    nf = sum('face' in f for f in frames)
    nh = sum('hands' in f for f in frames)
    print(f'\r  tracked {len(frames)} samples: face in {nf}, hands in {nh} → {out}')


if __name__ == '__main__':
    main()
