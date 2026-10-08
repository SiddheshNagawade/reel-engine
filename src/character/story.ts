// The 10s "painted guy on the wall" story for the vector_character_test clip.
// Positions are in WALL coordinates = pixels of frame 0 of the plate; the camera track maps them onto
// every later frame, so the character stays glued to the wall while the phone pans.
import {Easing, interpolate} from 'remotion';
import type {HeadName, Limb, Pose} from './Rig';

export const PX_PER_UNIT = 0.27; // rig units → wall pixels (≈460px tall at frame 0)
export const groundY = (x: number) => 648 + 0.0105 * x; // top edge of the skirting in frame 0
export const BAG_EDGE_X = 3700; // where the bag's left edge meets the wall (nose touches it)
export const SEAT_FRAME = 268; // lands on the bag

// The similarity track drifts off the skirting once the phone turns toward the wall (perspective).
// Measured on the plate: how far (screen px, + = down) the real skirting top sits below the tracked line.
const FIX: [number, number][] = [[0, 0], [100, 0], [150, 30], [190, 40], [205, 65], [220, 80], [235, 85], [252, 80]];
export const groundFix = (f: number) => interpolate(f, FIX.map((k) => k[0]), FIX.map((k) => k[1]), {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lerp = (f: number, a: number, b: number, v0: number, v1: number, ease = Easing.inOut(Easing.quad)) =>
  interpolate(f, [a, b], [v0, v1], {...clamp, easing: ease});

// Wall-x of the feet over time (keyframes): runs with the camera pan.
const XK: [number, number][] = [
  [0, 560], [46, 560], [58, 700], [84, 1300], // run out from behind the rod
  [134, 2520], // three tickly hops over the broom bristles
  [188, 3672], [191, 3684], // runs straight into the bag
  [205, 3520], // knocked back, lands flat
  [252, 3520],
];
const xAt = (f: number) => {
  for (let i = 1; i < XK.length; i++) {
    const [f0, x0] = XK[i - 1];
    const [f1, x1] = XK[i];
    if (f <= f1) return f1 === f0 ? x1 : x0 + (x1 - x0) * Math.min(1, Math.max(0, (f - f0) / (f1 - f0)));
  }
  return XK[XK.length - 1][1];
};

const L = (a: number, b: number): Limb => ({a, b});
const STAND: Pick<Pose, 'legs' | 'arms'> = {legs: [L(0, 0), L(0, 0)], arms: [L(6, 4), L(6, 4)]};

// Run cycle (side view) driven by distance travelled, so the feet don't skate.
const runPose = (dist: number, head: HeadName = 'side'): Pose => {
  const ph = (dist / 470) * Math.PI * 2; // one full cycle per ~470 wall px (two strides)
  const s = Math.sin(ph);
  const c = Math.cos(ph);
  const leg = (p: number, q: number): Limb => ({a: 34 * p, b: -Math.max(0, 70 * -q) - 12});
  return {
    view: 'side',
    head,
    legs: [leg(s, c), leg(-s, -c)],
    arms: [L(-38 * s, 70), L(38 * s, 70)],
    bob: 40 * Math.abs(Math.cos(ph)),
    lean: 8,
  };
};

export type Frame = {
  pose: Pose;
  x: number; // feet position, wall coords
  y: number;
  rot: number; // whole-body rotation around the feet (deg)
  sx: number; // squash/stretch
  sy: number;
  scale: number; // extra scale (coming off the wall toward the camera)
  paint: number; // 1 = painted on the wall (multiply into the plaster), 0 = a normal sticker in front
  outline: number; // white sticker outline once he's off the wall
  opacity: number;
  stars: number; // 0..1 dizzy stars
  onBag: number; // 0..1 → switch from the wall track to the bag track
};

export function storyAt(f: number, seat: {x: number; y: number}): Frame {
  const base: Frame = {pose: {view: 'front', head: 'smile', ...STAND}, x: xAt(f), y: 0, rot: 0, sx: 1, sy: 1, scale: 1, paint: 1, outline: 0, opacity: 1, stars: 0, onBag: 0};
  base.y = groundY(base.x);

  // 0–14 projector flicker-in
  if (f < 14) {
    const flick = [0, 0.6, 0, 0, 0.9, 0.3, 1, 0.5, 1, 1, 0.8, 1, 1, 1][f] ?? 1;
    return {...base, opacity: flick};
  }
  // 14–40 waves at the camera
  if (f < 40) {
    const w = Math.sin((f - 14) / 3.2);
    const up = lerp(f, 14, 19, 0, 1);
    return {...base, pose: {view: 'front', head: 'smile', legs: STAND.legs, arms: [L(6, 4), L(6 + up * 150, up * (28 + 22 * w))], headTilt: 4 * w * up}};
  }
  // 40–46 anticipation: squash, then turns
  if (f < 46) {
    const k = (f - 40) / 6;
    const sq = Math.sin(k * Math.PI) * 0.1;
    return {...base, sx: 1 + sq, sy: 1 - sq, pose: {view: f < 43 ? 'front' : 'side', head: f < 43 ? 'smile' : 'side', ...STAND}};
  }
  // 46–84 runs
  if (f < 84) return {...base, pose: runPose(base.x - 560)};
  // 84–134 bristles tickle his feet → three giggly hops (front view, legs tucked, arms up)
  if (f < 134) {
    const k = ((f - 84) / 50) * 3;
    const hop = Math.sin((k % 1) * Math.PI);
    const tuck = Math.pow(hop, 0.6);
    return {
      ...base,
      y: base.y - hop * 120,
      sx: 1 - 0.06 * hop + (hop < 0.15 ? 0.06 : 0),
      sy: 1 + 0.08 * hop - (hop < 0.15 ? 0.08 : 0),
      rot: 6 * Math.sin(k * Math.PI * 2),
      pose: {view: 'front', head: 'laugh', legs: [L(30 * tuck, -42 * tuck), L(30 * tuck, -42 * tuck)], arms: [L(150 - 20 * hop, 30), L(150 - 20 * hop, 30)], bob: 0},
    };
  }
  // 134–188 keeps running, happy
  if (f < 188) return {...base, pose: runPose(base.x - 560)};
  // 188–205 BONK: squashes on the bag, flies back, lands flat on his back
  if (f < 205) {
    const k = (f - 188) / 17;
    const squash = f < 193 ? Math.sin(((f - 188) / 5) * Math.PI) * 0.28 : 0;
    if (f < 191) return {...base, sx: 1 - squash, sy: 1 + squash * 0.4, pose: {...runPose(base.x - 560), head: 'side', lean: -10}};
    const arc = Math.sin(Math.min(1, k * 1.05) * Math.PI) * 140;
    const rot = lerp(f, 191, 205, 0, -90, Easing.in(Easing.quad));
    const lie = lerp(f, 199, 205, 0, 1);
    return {
      ...base,
      y: base.y - arc - lie * 64 * PX_PER_UNIT * 2,
      rot,
      sx: 1 - squash,
      sy: 1 + squash * 0.5,
      pose: {view: 'front', head: 'shock', legs: [L(10, 0), L(10, 0)], arms: [L(150, 20), L(150, 20)], bob: 0},
    };
  }
  // 205–232 lies there seeing stars
  if (f < 232) {
    return {
      ...base,
      y: base.y - 64 * PX_PER_UNIT * 2,
      rot: -90,
      stars: lerp(f, 205, 210, 0, 1) * lerp(f, 226, 232, 1, 0),
      pose: {view: 'front', head: f < 214 ? 'shock' : 'sad', legs: [L(6, 0), L(6, 0)], arms: [L(120, 10), L(120, 10)]},
    };
  }
  // 232–244 springs back up
  if (f < 244) {
    const k = lerp(f, 232, 240, 0, 1, Easing.out(Easing.back(1.6)));
    return {...base, y: base.y - (1 - k) * 64 * PX_PER_UNIT * 2, rot: -90 * (1 - k), pose: {view: 'front', head: 'sad', ...STAND}};
  }
  // 244–252 looks at the bag, gets an idea, crouches
  if (f < 252) {
    const crouch = lerp(f, 247, 252, 0, 1);
    return {
      ...base,
      sx: 1 + 0.12 * crouch,
      sy: 1 - 0.16 * crouch,
      pose: {view: 'front', head: f < 247 ? 'sad' : 'smile', legs: STAND.legs, arms: [L(20 + 20 * crouch, 30), L(20 + 20 * crouch, 30)], headTilt: -8},
    };
  }
  // 252–268 leaps OFF the wall onto the bag: paint → sticker, comes toward the camera
  if (f < SEAT_FRAME) {
    const k = (f - 252) / (SEAT_FRAME - 252);
    const e = Easing.inOut(Easing.sin)(k);
    const x0 = 3520;
    const y0 = groundY(x0);
    const tx = seat.x;
    const sitFeetY = seat.y + 840 * PX_PER_UNIT * 1.12; // seat = where his hips land
    const arcH = 30;
    return {
      ...base,
      x: x0 + (tx - x0) * e,
      y: y0 + (sitFeetY - y0) * e - Math.sin(k * Math.PI) * arcH,
      rot: Math.sin(k * Math.PI) * 14,
      scale: 1 + 0.12 * e,
      paint: 1 - Easing.out(Easing.quad)(Math.min(1, k * 1.6)),
      outline: Math.min(1, k * 1.6),
      onBag: e,
      pose: {view: 'side', head: 'laugh', legs: [L(70, -120), L(60, -110)], arms: [L(125, 20), L(110, 30)], lean: 10},
    };
  }
  // 268– sits on the bag (side view, thighs forward, legs dangling), turns to camera: waves, blows a kiss
  const sinceLand = f - SEAT_FRAME;
  const land = sinceLand < 6 ? Math.sin((sinceLand / 6) * Math.PI) * 0.12 : 0;
  const swing = Math.sin(sinceLand / 4.5);
  const kiss = f >= 298;
  const w = Math.sin((f - 276) / 3.2);
  const waveUp = lerp(f, 272, 278, 0, 1);
  const blow = lerp(f, 304, 309, 0, 1);
  return {
    ...base,
    x: seat.x,
    y: seat.y + 840 * PX_PER_UNIT * 1.12,
    scale: 1.12,
    paint: 0,
    outline: 1,
    onBag: 1,
    sx: 1 + land,
    sy: 1 - land,
    pose: {
      view: 'side',
      head: kiss ? 'kiss' : 'smile',
      legs: [L(84, -84 + 16 * swing), L(88, -88 - 16 * swing)],
      arms: kiss
        ? [L(40, 40), L(lerp(f, 298, 302, 30, 128) + 20 * blow, lerp(f, 298, 302, 30, 118) * (1 - blow))]
        : [L(40, 40), L(30 + waveUp * 140, waveUp * (25 + 25 * w))],
      lean: -4,
      headTilt: kiss ? -6 : 3 * w * waveUp,
    },
  };
}
// Sound cues (frame → effect) for the same story.
export const SFX: {at: number; file: string; volume: number}[] = [
  {at: 1, file: 'flicker', volume: 0.5},
  {at: 4, file: 'flicker', volume: 0.35},
  {at: 84, file: 'boing', volume: 0.55},
  {at: 101, file: 'boing', volume: 0.55},
  {at: 118, file: 'boing', volume: 0.6},
  {at: 189, file: 'bonk', volume: 0.9},
  {at: 205, file: 'thud', volume: 0.7},
  {at: 207, file: 'twinkle', volume: 0.35},
  {at: 250, file: 'whoosh', volume: 0.5},
  {at: SEAT_FRAME, file: 'pop', volume: 0.6},
  {at: 302, file: 'mwah', volume: 0.6},
];

// Footstep taps while running (one per foot contact).
export const STEPS: number[] = (() => {
  const out: number[] = [];
  let last = -1;
  for (let f = 46; f < 188; f++) {
    if (f >= 84 && f < 134) continue;
    const n = Math.floor((xAt(f) - 560) / 235);
    if (n !== last) {
      if (last >= 0) out.push(f);
      last = n;
    }
  }
  return out;
})();
