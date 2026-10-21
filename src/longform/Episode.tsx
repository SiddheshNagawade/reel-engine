import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, EASE, clamp, Paper, Drift, src, type Box} from './kit';
import {SCENES} from './scenes';

// Designomics long-form episode (16:9). The base = his cut, cropped, graded talking footage (scripts/longform.mjs).
// Layouts per shot: face (full frame, zoom alternates to hide jump cuts) · left/right (he becomes a card on one side,
// the graphic gets the other side) · small (corner card) · off (graphics full frame, voice continues) · breather
// (dimmed face behind a big line). Layout changes are camera moves (0.55 s ease), never cuts inside one shot.
export type Layout = 'face' | 'left' | 'right' | 'small' | 'off' | 'breather';
// fx/fy = his face centre / eye line in the source frame (0..1, from faceboxes); px = where his face sits across the frame
export type Shot = {s: number; e: number; layout: Layout; zoom?: number; fx?: number; fy?: number; px?: number};
export type Scene = {type: string; at: number; dur: number; box?: 'full' | 'free' | 'right' | 'left'; [k: string]: unknown};
export type EpisodeProps = {
  base: string; frames: number; fps: number; shots: Shot[]; scenes: Scene[];
  sfx?: {src: string; at: number; vol?: number; dur?: number}[];
  music?: {src: string; at: number; dur: number; vol?: number; fadeIn?: number; fadeOut?: number; offset?: number}[];
};

const W = 1920, H = 1080;
type Rect = {x: number; y: number; w: number; h: number; r: number; dim: number; z: number};
const RECTS: Record<Layout, Omit<Rect, 'z'>> = {
  face: {x: 0, y: 0, w: W, h: H, r: 0, dim: 0},
  breather: {x: 0, y: 0, w: W, h: H, r: 0, dim: 0.62},
  left: {x: 60, y: 70, w: 760, h: 940, r: 28, dim: 0},
  right: {x: W - 820, y: 70, w: 760, h: 940, r: 28, dim: 0},
  small: {x: W - 520, y: H - 330, w: 460, h: 270, r: 22, dim: 0},
  off: {x: W - 520 + 230, y: H + 40, w: 460, h: 270, r: 22, dim: 0}, // slides out below the frame
};
export const freeBox = (l: Layout): Box =>
  l === 'left' ? {x: 860, y: 0, w: W - 880, h: H} : l === 'right' ? {x: 20, y: 0, w: W - 880, h: H} : {x: 0, y: 0, w: W, h: H};

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
function rectAt(shots: Shot[], t: number): Rect & {fx: number; fy: number; px: number} {
  const i = Math.max(0, shots.findIndex((s) => t >= s.s && t < s.e));
  const cur = shots[i] ?? shots[shots.length - 1];
  const prev = shots[i - 1];
  const target = {...RECTS[cur.layout], z: cur.zoom ?? 1};
  const fx = cur.fx ?? 0.5, fy = cur.fy ?? 0.36;
  const px = lerpPx(prev, cur, t);
  // a layout change animates; a zoom change between two face shots is a cut (jump-cut punch)
  // same layout, new zoom (a new sentence): the camera glides there (0.8 s), never an instant crop
  if (prev && prev.layout === cur.layout && (prev.zoom ?? 1) !== (cur.zoom ?? 1)) {
    const k = interpolate(t, [cur.s, cur.s + 0.8], [0, 1], {...clamp, easing: EASE});
    return {...target, z: lerp(prev.zoom ?? 1, target.z, k), fx, fy, px};
  }
  if (prev && prev.layout !== cur.layout) {
    const k = interpolate(t, [cur.s, cur.s + 0.55], [0, 1], {...clamp, easing: EASE});
    const a = {...RECTS[prev.layout], z: prev.zoom ?? 1};
    return {x: lerp(a.x, target.x, k), y: lerp(a.y, target.y, k), w: lerp(a.w, target.w, k), h: lerp(a.h, target.h, k), r: lerp(a.r, target.r, k), dim: lerp(a.dim, target.dim, k), z: lerp(a.z, target.z, k), fx, fy, px};
  }
  return {...target, fx, fy, px};
}
// face position glides when only px changes between two face shots of the same layout (camera re-frames)
function lerpPx(prev: Shot | undefined, cur: Shot, t: number) {
  const p1 = cur.px ?? 0.5;
  if (!prev || prev.layout !== cur.layout || (prev.px ?? 0.5) === p1 || (prev.zoom ?? 1) !== (cur.zoom ?? 1)) return p1;
  const k = interpolate(t, [cur.s, cur.s + 0.7], [0, 1], {...clamp, easing: EASE});
  return lerp(prev.px ?? 0.5, p1, k);
}

const Footage: React.FC<{base: string; shots: Shot[]}> = ({base, shots}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  const r = rectAt(shots, t);
  const full = r.w > W - 2;
  // inside a card the 16:9 frame is cropped (cover) around his face: scale so the card's height shows head + chest
  // cover the box, zoomed; his eye line sits at the same height in every shot (consistent framing across jump cuts)
  const scale = Math.max(r.w / W, r.h / H) * r.z;
  const vw = W * scale, vh = H * scale;
  const eyeAt = full ? 0.4 : 0.34;
  const ox = Math.min(0, Math.max(r.w - vw, r.w * (full ? r.px : 0.5) - r.fx * vw));
  const oy = Math.min(0, Math.max(r.h - vh, r.h * eyeAt - r.fy * vh));
  return (
    <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: r.r, overflow: 'hidden',
      boxShadow: full ? undefined : '0 30px 80px rgba(0,0,0,0.55)', outline: full ? undefined : `1px solid ${C.line}`}}>
      <OffthreadVideo src={src(base)} muted style={{position: 'absolute', left: ox, top: oy, width: vw, height: vh}} />
      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse ${r.w * 0.42}px ${r.h * 0.62}px at ${ox + r.fx * vw}px ${oy + r.fy * vh + r.h * 0.12}px, rgba(0,0,0,0) 45%, rgba(10,8,14,0.38) 100%)`}} />
      {r.dim > 0 && <div style={{position: 'absolute', inset: 0, background: `rgba(14,13,12,${r.dim})`, backdropFilter: `blur(${r.dim * 10}px)`}} />}
    </div>
  );
};

export const Episode: React.FC<EpisodeProps> = ({base, shots, scenes, sfx = [], music = [], fps}) => {
  const layoutAt = (t: number) => (shots.find((s) => t >= s.s && t < s.e) ?? shots[shots.length - 1]).layout;
  return (
    <AbsoluteFill style={{background: C.paper}}>
      <Paper />
      <Footage base={base} shots={shots} />
      {scenes.map((sc, i) => {
        const Comp = SCENES[sc.type];
        if (!Comp) return null;
        const l = layoutAt(sc.at + 0.6);
        const box = sc.box === 'full' ? freeBox('off') : sc.box === 'right' ? freeBox('left') : sc.box === 'left' ? freeBox('right') : freeBox(l);
        const from = Math.max(0, Math.round((sc.at - 0.05) * fps));
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, Math.round((sc.dur + 0.15) * fps))} layout="none">
            <SceneAt Comp={Comp} sc={sc} box={box} offset={from / fps} />
          </Sequence>
        );
      })}
      <Audio src={src(base)} />
      {sfx.map((s, i) => (
        <Sequence key={`s${i}`} from={Math.max(0, Math.round(s.at * fps))} durationInFrames={s.dur ? Math.max(1, Math.round(s.dur * fps)) : undefined} layout="none">
          {/* a sound is cut to its moment (dur) with a short fade, never left ringing over the next line */}
          <Audio src={src(s.src)} volume={(f) => (s.vol ?? 0.4) * (s.dur ? interpolate(f / fps, [s.dur - 0.35, s.dur], [1, 0], clamp) : 1)} />
        </Sequence>
      ))}
      {music.map((m, i) => (
        <Sequence key={`m${i}`} from={Math.round(m.at * fps)} durationInFrames={Math.round(m.dur * fps)} layout="none">
          <Audio loop src={src(m.src)} startFrom={Math.round((m.offset ?? 0) * fps)} volume={(f) => {
            const t = f / fps;
            const a = interpolate(t, [0, m.fadeIn ?? 1], [0, 1], clamp);
            const b = interpolate(t, [m.dur - (m.fadeOut ?? 1.2), m.dur], [1, 0], clamp);
            return (m.vol ?? 0.08) * Math.sqrt(Math.min(a, b)); // equal-power-ish fades
          }} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const DriftAt: React.FC<{at: number; children: React.ReactNode}> = ({at, children}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <Drift t={Math.max(0, f / fps - at)}>{children}</Drift>;
};

// scenes keep absolute times (seconds in the episode): shift the Sequence's local frame back
const SceneAt: React.FC<{Comp: React.FC<any>; sc: Scene; box: Box; offset: number}> = ({Comp, sc, box, offset}) => (
  <div style={{position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h}}>
    {sc.type === 'clip' ? <Comp {...sc} at={sc.at - offset} box={box} /> : <DriftAt at={sc.at - offset}><Comp {...sc} at={sc.at - offset} box={box} /></DriftAt>}
  </div>
);
