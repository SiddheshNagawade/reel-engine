// Things stuck onto the speaker (face, hands, body) or the screen, following scripts/motiontrack.py tracks.
// Drawn INSIDE the video's camera transform, so they zoom/pan with the footage like they're really there.
import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Attach, Motion, MotionSample} from '../types';
import {PROPS, type Anchor} from './props';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
type P = [number, number];

// Pick one point out of a sample for an anchor.
const pick = (s: MotionSample, a: Anchor): P | null => {
  const fp = s.face?.pts;
  const hand = (side?: 'L' | 'R') => {
    const hs = (s.hands ?? []).filter((h) => !side || h.side === side);
    return hs.length ? hs.reduce((a, b) => (b.conf > a.conf ? b : a)) : null;
  };
  switch (a) {
    case 'eyes':
      return fp?.leye && fp?.reye ? [(fp.leye[0] + fp.reye[0]) / 2, (fp.leye[1] + fp.reye[1]) / 2] : null;
    case 'leye': case 'reye': case 'nose': case 'mouth': case 'chin':
      return fp?.[a] ?? null;
    case 'head':
      return fp?.top ?? null;
    case 'face': {
      const b = s.face?.box;
      return b ? [b[0] + b[2] / 2, b[1] + b[3] / 2] : null;
    }
    case 'hand': case 'hand.L': case 'hand.R':
      return hand(a === 'hand' ? undefined : (a.slice(-1) as 'L' | 'R'))?.pts.palm ?? null;
    case 'finger': case 'finger.L': case 'finger.R': {
      const h = hand(a === 'finger' ? undefined : (a.slice(-1) as 'L' | 'R'));
      return h?.pts.index ?? h?.pts.palm ?? null;
    }
    case 'neck':
      return s.body?.pts.neck ?? null;
    case 'shoulder.L': case 'shoulder.R': {
      const b = s.body?.pts;
      if (!b?.lsh || !b?.rsh) {
        // close-up selfies: no body pose → estimate from the face (shoulders ~1 face width out, under the chin)
        const fb = s.face?.box;
        if (!fb) return null;
        const cx = fb[0] + fb[2] / 2;
        return [Math.min(0.9, Math.max(0.1, cx + (a === 'shoulder.L' ? -1 : 1) * fb[2] * 0.95)), Math.min(0.9, fb[1] + fb[3] * 1.45)];
      }
      const [l, r] = b.lsh[0] < b.rsh[0] ? [b.lsh, b.rsh] : [b.rsh, b.lsh]; // screen left / right
      return a === 'shoulder.L' ? l : r;
    }
    default:
      return null;
  }
};

// Smoothed value around a frame: gaussian-weighted average of the samples that have it (bridges small gaps).
// Values are arrays (a point = [x, y], a number = [v]); `nearest` = frames to the closest real sample.
function smooth(m: Motion, byFrame: MotionSample[], f: number, get: (s: MotionSample) => number[] | null, sigma = 3, reach = 10) {
  let w = 0;
  let acc: number[] = [];
  let nearest = Infinity;
  const step = 30 / m.rate;
  const i0 = Math.max(0, Math.floor((f - reach) / step));
  const i1 = Math.min(byFrame.length - 1, Math.ceil((f + reach) / step));
  for (let i = i0; i <= i1; i++) {
    const s = byFrame[i];
    const v = s ? get(s) : null;
    if (!s || !v) continue;
    const d = s.f - f;
    nearest = Math.min(nearest, Math.abs(d));
    const k = Math.exp(-(d * d) / (2 * sigma * sigma));
    w += k;
    acc = v.map((x, j) => (acc[j] ?? 0) + x * k);
  }
  return w ? {v: acc.map((x) => x / w), nearest} : null;
}
const num = (x: number | undefined | null) => (x == null ? null : [x]);

const FACE_ANCHORS: Anchor[] = ['eyes', 'leye', 'reye', 'nose', 'mouth', 'chin', 'head', 'face'];

const Item: React.FC<{a: Attach; m: Motion | undefined; byFrame: MotionSample[]; seed: number}> = ({a, m, byFrame, seed}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const def = PROPS[a.what] ?? PROPS.image;
  // 'hand' / 'finger' without a side: lock onto the hand seen most during this item (never average two hands).
  const sideOf = useMemo(() => {
    let l = 0, r = 0;
    for (const s of byFrame) if (s && s.f >= a.f && s.f < a.f + a.frames) for (const h of s.hands ?? []) h.side === 'L' ? l++ : r++;
    return l >= r ? 'L' : 'R';
  }, [byFrame, a.f, a.frames]);
  const t = frame - a.f;
  if (t < 0 || t >= a.frames) return null;
  let to = (a.to ?? def.to) as Anchor;
  if (to === 'hand' || to === 'finger') to = `${to}.${sideOf}` as Anchor;

  // Where + how big: unit = face height (px), smoothed; falls back to a fixed size on screen.
  let x = (a.screen?.[0] ?? 0.5) * width;
  let y = (a.screen?.[1] ?? 0.35) * height;
  let unit = 0.28 * height;
  let rot = 0;
  let seen = 1;
  if (m && byFrame.length) {
    const fh = smooth(m, byFrame, frame, (s) => num(s.face?.box[3]), 4, 30);
    if (fh) unit = fh.v[0] * height;
    if (to !== 'screen') {
      const p = smooth(m, byFrame, frame, (s) => pick(s, to));
      if (!p) return null;
      x = p.v[0] * width;
      y = p.v[1] * height;
      seen = interpolate(p.nearest, [4, 10], [1, 0], clamp); // anchor lost (hand left the frame) → fade away
    }
    if (a.tilt ?? def.tilt ?? FACE_ANCHORS.includes(to)) rot = smooth(m, byFrame, frame, (s) => num(s.face?.roll), 3, 12)?.v[0] ?? 0;
  }
  if (to === 'screen') unit = width * 0.38; // on-screen items are sized by the frame, not the face
  const s = (unit / 100) * (a.size ?? 1);
  let [ox, oy] = a.offset ?? def.offset ?? [0, 0];
  // Bubbles / labels / notes: put them on the roomier side of the anchor and keep them fully inside the frame
  // (with a margin, since the camera can zoom in a little).
  if (def.box) {
    const [hw, hh] = def.box({text: a.text}).map((v) => v * s);
    if (!a.offset && to !== 'screen' && Math.sign(ox) === Math.sign(x - width / 2)) ox = -ox;
    const mx = width * 0.07, myTop = height * 0.1, myBot = height * 0.2; // Instagram UI covers the top and bottom
    const cx = Math.min(width - mx - hw, Math.max(mx + hw, x + ox * s));
    const cy = Math.min(height - myBot - hh, Math.max(myTop + hh, y + oy * s));
    ox = (cx - x) / s;
    oy = (cy - y) / s;
  }

  // Entrance / idle / exit
  const enter = a.enter ?? def.enter ?? 'pop';
  const inS = spring({frame: t, fps, config: {damping: 10, stiffness: 170, mass: 0.6}});
  const outT = interpolate(t, [a.frames - 7, a.frames], [0, 1], clamp);
  let scale = 1, dy = 0, dx = 0, op = 1;
  const k = enter === 'draw' ? interpolate(t, [0, 14], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)}) : 1;
  if (enter === 'pop') scale = inS;
  if (enter === 'fade') op = interpolate(t, [0, 8], [0, 1], clamp);
  if (enter === 'drop') dy = -interpolate(t, [0, 12], [1, 0], {...clamp, easing: Easing.out(Easing.bounce)}) * (y + 200);
  if (enter === 'slide') dx = interpolate(t, [0, 10], [1, 0], {...clamp, easing: Easing.out(Easing.cubic)}) * width * 0.7;
  if (enter === 'draw') op = interpolate(t, [0, 3], [0, 1], clamp);
  const exitStyle = a.exit ?? (enter === 'drop' || enter === 'slide' ? 'fade' : enter === 'draw' ? 'fade' : 'pop');
  if (exitStyle === 'pop') scale *= 1 - Easing.in(Easing.back(2))(outT);
  else op *= 1 - outT;
  const idle = a.idle ?? def.idle ?? 'none';
  let ir = 0;
  if (idle === 'bob') dy += Math.sin(t / 7) * 2.5 * s;
  if (idle === 'float') dy += Math.sin(t / 11) * 4 * s;
  if (idle === 'wiggle') ir = Math.sin(t / 4) * 6;
  if (idle === 'pulse') scale *= 1 + 0.08 * Math.sin(t / 3);
  if (idle === 'spin') ir = t * 4;

  return (
    <svg width={width} height={height} style={{position: 'absolute', inset: 0, overflow: 'visible', opacity: op * seen}}>
      <g transform={`translate(${x + dx},${y + dy}) rotate(${rot}) scale(${s})`}>
        <g transform={`translate(${ox},${oy}) rotate(${ir}) scale(${Math.max(0, scale)})`}>
          {def.draw({t, k, n: a.frames, text: a.text, color: a.color, src: a.src, seed, back: [-ox, -oy]})}
        </g>
      </g>
    </svg>
  );
};

// layer: 'behind' = under the person cut-out, 'front' = on the footage, 'screen' = fixed on screen (outside the camera).
export const AttachLayer: React.FC<{items?: Attach[]; motion?: Motion; layer: 'behind' | 'front' | 'screen'}> = ({items, motion, layer}) => {
  // Samples indexed by sample number, so lookups around a frame are O(window).
  const byFrame = useMemo(() => {
    const arr: MotionSample[] = [];
    if (motion) for (const s of motion.frames) arr[Math.round(s.f / (30 / motion.rate))] = s;
    return arr;
  }, [motion]);
  const where = (a: Attach) => ((a.to ?? PROPS[a.what]?.to) === 'screen' ? 'screen' : a.behind ? 'behind' : 'front');
  const list = (items ?? []).filter((a) => where(a) === layer);
  if (!list.length) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {list.map((a, i) => <Item key={i} a={a} m={motion} byFrame={byFrame} seed={i + 1} />)}
    </AbsoluteFill>
  );
};
