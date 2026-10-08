// Character overlay engine: turns a scene.json (a list of beats) into a pose + placement for every frame.
// Positions are WALL coordinates = pixels of the plate's first frame; the camera track maps them onto
// later frames. See brain/genres/character-overlay.md and .claude/skills/character-overlay/SKILL.md.
import {Easing, interpolate} from 'remotion';
import type {HeadName, Limb, Pose} from './Rig';

export type Beat = {
  do: 'appear' | 'stand' | 'wave' | 'turn' | 'walk' | 'run' | 'hop' | 'bonk' | 'lie' | 'getup' | 'think' | 'leap' | 'sit';
  to: number; // end frame (the beat starts where the previous one ended)
  x?: number; // wall-x where his feet are at the end of the beat (appear: where he appears)
  head?: HeadName; // expression override
  count?: number; // hop: number of hops
  height?: number; // hop/leap: jump height (wall px)
  stars?: boolean; // lie: dizzy stars
  anchor?: string; // leap/sit: named spot (scene.anchors), e.g. top of a bag
  wave?: [number, number]; // sit: wave between these frames
  kiss?: number; // sit: blow a kiss from this frame
};

export type Scene = {
  name: string;
  frames: number;
  fps: number;
  character: {pxPerUnit: number; colors?: Record<string, string>};
  ground: {y0: number; slope: number; fix?: [number, number][]}; // floor line in frame 0 (y = y0 + slope*x) + drift fixes
  occluders?: {from: number; to: number; poly: [number, number][]}[]; // real things in front of the wall (frame-0 px)
  anchors?: Record<string, {track: string; frame: number; screen: [number, number]; lock?: number}>;
  beats: Beat[];
  sfx?: {at: number; sound: string; volume?: number}[]; // extra sounds on top of the automatic ones
  mute?: string[]; // automatic sounds to drop (e.g. ["tap"])
  audio?: {plateVolume?: number};
  fadeOut?: number; // frames of fade to black at the end
};

export type Frame = {
  pose: Pose;
  x: number;
  y: number; // feet, wall coords
  rot: number;
  sx: number;
  sy: number;
  flip: boolean; // facing left
  scale: number; // extra scale (coming off the wall toward the camera)
  paint: number; // 1 = painted into the wall, 0 = sticker in front
  outline: number;
  opacity: number;
  stars: number;
  anchor?: string; // following an anchor's track instead of the wall
  onAnchor: number;
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lerp = (f: number, a: number, b: number, v0: number, v1: number, ease = Easing.inOut(Easing.quad)) =>
  b <= a ? (f >= b ? v1 : v0) : interpolate(f, [a, b], [v0, v1], {...clamp, easing: ease});
const L = (a: number, b: number): Limb => ({a, b});
const STAND: Pick<Pose, 'legs' | 'arms'> = {legs: [L(0, 0), L(0, 0)], arms: [L(6, 4), L(6, 4)]};
const OFF_WALL_SCALE = 1.12;
const SIT_HIP = 840; // rig units from the feet origin to the hips

// Run / walk cycles (side view) driven by distance travelled, so the feet don't skate.
const cycle = (dist: number, run: boolean, head: HeadName): Pose => {
  const ph = (dist / (run ? 470 : 380)) * Math.PI * 2;
  const s = Math.sin(ph);
  const c = Math.cos(ph);
  const swing = run ? 34 : 24;
  const leg = (p: number, q: number): Limb => ({a: swing * p, b: -Math.max(0, (run ? 70 : 45) * -q) - (run ? 12 : 4)});
  return {
    view: 'side',
    head,
    legs: [leg(s, c), leg(-s, -c)],
    arms: [L(-(run ? 38 : 26) * s, run ? 70 : 20), L((run ? 38 : 26) * s, run ? 70 : 20)],
    bob: (run ? 40 : 18) * Math.abs(c),
    lean: run ? 8 : 3,
  };
};
export const STEP_PX = {run: 235, walk: 190};

type Span = Beat & {from: number; x0: number; x1: number; i: number};
export function spans(scene: Scene): Span[] {
  let from = 0;
  let x = scene.beats.find((b) => b.x !== undefined)?.x ?? 0;
  return scene.beats.map((b, i) => {
    const x0 = b.do === 'appear' ? (b.x ?? x) : x;
    const x1 = b.x ?? x0;
    const s = {...b, from, x0, x1, i};
    from = b.to;
    x = b.do === 'leap' || b.do === 'sit' ? x : x1;
    return s;
  });
}

export function frameAt(f: number, scene: Scene, anchors: Record<string, {x: number; y: number}>, all = spans(scene)): Frame {
  const px = scene.character.pxPerUnit;
  const groundY = (x: number) => scene.ground.y0 + scene.ground.slope * x;
  const LIFT = 128 * px; // lying down: half his body thickness above the floor line
  const b = all.find((s) => f < s.to) ?? all[all.length - 1];
  const {from, to, x0, x1} = b;
  const k = to > from ? Math.min(1, Math.max(0, (f - from) / (to - from))) : 1;
  const x = x0 + (x1 - x0) * k;
  const base: Frame = {
    pose: {view: 'front', head: b.head ?? 'smile', ...STAND},
    x, y: groundY(x), rot: 0, sx: 1, sy: 1, flip: x1 < x0, scale: 1, paint: 1, outline: 0, opacity: 1, stars: 0, onAnchor: 0,
  };
  const prevFlip = (() => {
    for (let i = b.i - 1; i >= 0; i--) if (all[i].do !== 'bonk' && all[i].x1 !== all[i].x0) return all[i].x1 < all[i].x0; // bonk = knocked backwards, still facing
    return false;
  })();
  if (x1 === x0) base.flip = prevFlip;

  switch (b.do) {
    case 'appear': {
      // projector flicker-in
      const pattern = [0, 0.6, 0, 0, 0.9, 0.3, 1, 0.5, 1, 1, 0.8, 1, 1, 1];
      const idx = Math.floor(((f - from) / Math.max(1, to - from)) * pattern.length);
      return {...base, opacity: pattern[Math.min(pattern.length - 1, idx)]};
    }
    case 'stand':
      return base;
    case 'wave': {
      const w = Math.sin((f - from) / 3.2);
      const up = lerp(f, from, from + 5, 0, 1) * lerp(f, to - 4, to, 1, 0);
      return {...base, pose: {view: 'front', head: b.head ?? 'smile', legs: STAND.legs, arms: [L(6, 4), L(6 + up * 150, up * (28 + 22 * w))], headTilt: 4 * w * up}};
    }
    case 'turn': {
      const sq = Math.sin(k * Math.PI) * 0.1;
      const side = k >= 0.5;
      return {...base, sx: 1 + sq, sy: 1 - sq, pose: {view: side ? 'side' : 'front', head: side ? 'side' : (b.head ?? 'smile'), ...STAND}};
    }
    case 'walk':
    case 'run':
      return {...base, pose: cycle(Math.abs(x), b.do === 'run', b.head ?? 'side')};
    case 'hop': {
      // giggly hops, front view, legs tucked, arms up
      const n = b.count ?? 3;
      const kk = k * n;
      const hop = Math.sin((kk % 1) * Math.PI);
      const tuck = Math.pow(hop, 0.6);
      return {
        ...base,
        y: base.y - hop * (b.height ?? 120),
        sx: 1 - 0.06 * hop + (hop < 0.15 ? 0.06 : 0),
        sy: 1 + 0.08 * hop - (hop < 0.15 ? 0.08 : 0),
        rot: 6 * Math.sin(kk * Math.PI * 2),
        pose: {view: 'front', head: b.head ?? 'laugh', legs: [L(30 * tuck, -42 * tuck), L(30 * tuck, -42 * tuck)], arms: [L(150 - 20 * hop, 30), L(150 - 20 * hop, 30)]},
      };
    }
    case 'bonk': {
      // runs into something: squashes against it, flies back to x, lands flat on his back
      const dir = prevFlip ? -1 : 1;
      const squash = f < from + 5 ? Math.sin(((f - from) / 5) * Math.PI) * 0.28 : 0;
      if (f < from + 3) {
        const cx = x0 + dir * 12 * ((f - from) / 3);
        return {...base, x: cx, y: groundY(cx), flip: prevFlip, sx: 1 - squash, sy: 1 + squash * 0.4, pose: {...cycle(Math.abs(cx), true, 'side'), lean: -10}};
      }
      const kf = (f - from - 3) / Math.max(1, to - from - 3);
      const bx = x0 + dir * 12 + (x1 - x0 - dir * 12) * kf;
      const arc = Math.sin(Math.min(1, k * 1.05) * Math.PI) * 140;
      const lie = lerp(f, to - 6, to, 0, 1);
      return {
        ...base,
        x: bx,
        y: groundY(bx) - arc - lie * LIFT,
        flip: false,
        rot: lerp(f, from + 3, to, 0, -90 * dir, Easing.in(Easing.quad)),
        sx: 1 - squash,
        sy: 1 + squash * 0.5,
        pose: {view: 'front', head: b.head ?? 'shock', legs: [L(10, 0), L(10, 0)], arms: [L(150, 20), L(150, 20)]},
      };
    }
    case 'lie': {
      const bonk = all.slice(0, b.i).reverse().find((s) => s.do === 'bonk');
      const dir = bonk && bonk.x1 > bonk.x0 ? -1 : 1; // fell back the way he came
      return {
        ...base,
        flip: false,
        y: base.y - LIFT,
        rot: -90 * dir,
        stars: b.stars === false ? 0 : lerp(f, from, from + 5, 0, 1) * lerp(f, to - 6, to, 1, 0),
        pose: {view: 'front', head: b.head ?? (f < from + 9 ? 'shock' : 'sad'), legs: [L(6, 0), L(6, 0)], arms: [L(120, 10), L(120, 10)]},
      };
    }
    case 'getup': {
      const bonk = all.slice(0, b.i).reverse().find((s) => s.do === 'bonk');
      const lyingRot = bonk && bonk.x1 > bonk.x0 ? 90 : -90;
      const kk = lerp(f, from, from + 8, 0, 1, Easing.out(Easing.back(1.6)));
      return {...base, flip: false, y: base.y - (1 - kk) * LIFT, rot: lyingRot * (1 - kk), pose: {view: 'front', head: b.head ?? 'sad', ...STAND}};
    }
    case 'think': {
      // looks at something, gets an idea, crouches to jump
      const crouch = lerp(f, from + 3, to, 0, 1);
      return {
        ...base,
        flip: false,
        sx: 1 + 0.12 * crouch,
        sy: 1 - 0.16 * crouch,
        pose: {view: 'front', head: b.head ?? (f < from + 3 ? 'sad' : 'smile'), legs: STAND.legs, arms: [L(20 + 20 * crouch, 30), L(20 + 20 * crouch, 30)], headTilt: -8},
      };
    }
    case 'leap': {
      // jumps OFF the wall onto an anchor: paint → sticker, comes toward the camera
      const a = anchors[b.anchor ?? ''] ?? {x: x0, y: groundY(x0)};
      const e = Easing.inOut(Easing.sin)(k);
      const sx0 = x0;
      const sy0 = groundY(x0);
      const ty = a.y + SIT_HIP * px * OFF_WALL_SCALE;
      return {
        ...base,
        x: sx0 + (a.x - sx0) * e,
        y: sy0 + (ty - sy0) * e - Math.sin(k * Math.PI) * (b.height ?? 30),
        flip: a.x < sx0,
        rot: Math.sin(k * Math.PI) * 14 * (a.x < sx0 ? -1 : 1),
        scale: 1 + (OFF_WALL_SCALE - 1) * e,
        paint: 1 - Easing.out(Easing.quad)(Math.min(1, k * 1.6)),
        outline: Math.min(1, k * 1.6),
        anchor: b.anchor,
        onAnchor: e,
        pose: {view: 'side', head: b.head ?? 'laugh', legs: [L(70, -120), L(60, -110)], arms: [L(125, 20), L(110, 30)], lean: 10},
      };
    }
    case 'sit': {
      // sits on the anchor (side view, legs dangling), turns his face to the camera; optional wave + kiss
      const a = anchors[b.anchor ?? ''] ?? {x: x0, y: groundY(x0)};
      const since = f - from;
      const land = since < 6 && all[b.i - 1]?.do === 'leap' ? Math.sin((since / 6) * Math.PI) * 0.12 : 0;
      const swing = Math.sin(since / 4.5);
      const kiss = b.kiss !== undefined && f >= b.kiss;
      const [w0, w1] = b.wave ?? [-1, -1];
      const w = Math.sin((f - w0 - 4) / 3.2);
      const waveUp = w0 >= 0 ? lerp(f, w0, w0 + 6, 0, 1) * lerp(f, w1 - 4, w1, 1, 0) : 0;
      const kf = b.kiss ?? 0;
      const blow = lerp(f, kf + 6, kf + 11, 0, 1);
      const offWall = !!b.anchor;
      const leap = all[b.i - 1]?.do === 'leap' ? all[b.i - 1] : undefined;
      const facing = leap ? a.x < leap.x0 : prevFlip;
      return {
        ...base,
        x: a.x,
        y: a.y + SIT_HIP * px * (offWall ? OFF_WALL_SCALE : 1),
        flip: facing,
        scale: offWall ? OFF_WALL_SCALE : 1,
        paint: offWall ? 0 : 1,
        outline: offWall ? 1 : 0,
        anchor: b.anchor,
        onAnchor: offWall ? 1 : 0,
        sx: 1 + land,
        sy: 1 - land,
        pose: {
          view: 'side',
          head: b.head ?? (kiss ? 'kiss' : 'smile'),
          legs: [L(84, -84 + 16 * swing), L(88, -88 - 16 * swing)],
          arms: kiss
            ? [L(40, 40), L(lerp(f, kf, kf + 4, 30, 128) + 20 * blow, lerp(f, kf, kf + 4, 30, 118) * (1 - blow))]
            : [L(40, 40), L(30 + waveUp * 140, waveUp * (25 + 25 * w))],
          lean: -4,
          headTilt: kiss ? -6 : 3 * w * waveUp,
        },
      };
    }
  }
}

// Sounds that follow from the beats (files in the shared sfx folder), plus the scene's extra ones.
export function soundCues(scene: Scene, all = spans(scene)) {
  const cues: {at: number; sound: string; volume: number}[] = [];
  const add = (at: number, sound: string, volume: number) => cues.push({at: Math.max(0, Math.round(at)), sound, volume});
  for (const b of all) {
    if (b.do === 'appear') add(b.from + 1, 'flicker', 0.5), add(b.from + 4, 'flicker', 0.35);
    if (b.do === 'hop') for (let n = 0; n < (b.count ?? 3); n++) add(b.from + ((b.to - b.from) / (b.count ?? 3)) * n, 'boing', 0.55);
    if (b.do === 'bonk') add(b.from + 1, 'bonk', 0.9), add(b.to, 'thud', 0.7);
    if (b.do === 'lie' && b.stars !== false) add(b.from + 2, 'twinkle', 0.35);
    if (b.do === 'leap') add(b.from - 2, 'whoosh', 0.5);
    if (b.do === 'sit' && all[b.i - 1]?.do === 'leap') add(b.from, 'pop', 0.6);
    if (b.do === 'sit' && b.kiss !== undefined) add(b.kiss + 4, 'mwah', 0.6);
    if (b.do === 'run' || b.do === 'walk') {
      const stride = STEP_PX[b.do];
      let last = Math.floor(Math.abs(b.x0) / stride);
      for (let f = b.from; f < b.to; f++) {
        const n = Math.floor(Math.abs(b.x0 + ((b.x1 - b.x0) * (f - b.from)) / (b.to - b.from)) / stride);
        if (n !== last) add(f, 'tap', b.do === 'run' ? 0.35 : 0.25);
        last = n;
      }
    }
  }
  for (const s of scene.sfx ?? []) add(s.at, s.sound, s.volume ?? 0.6);
  return cues.filter((c) => !(scene.mute ?? []).includes(c.sound));
}

export const OFF_WALL = OFF_WALL_SCALE;
