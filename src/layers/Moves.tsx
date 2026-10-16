// SCENE-TO-SCENE MOVES (brain/animation-system.md §5, studied frame by frame on the references, 2026-10-17): any insert
// can say how it ARRIVES (enter) and how it LEAVES (exit), so the next scene is born from the last one instead of a cut.
//   dive     zoom-through: leaving = the camera dives into one point (x, y) with motion blur (~0.6 s);
//            arriving = it lands from a dive (starts magnified + blurred, settles)            [luck number → "5"]
//   dot      leaving = the whole scene shrinks into one dot at (x, y) (it becomes a pin in a bigger world);
//            arriving = it grows out of a dot at (x, y)                                       [radar → globe]
//   fly3d    arriving: a card swings in with perspective (tilted → flat ~0.4 s), slight overshoot [stat card]
//   whip-up / whip-down / whip-left / whip-right   leaving / arriving through that edge with a smear (~0.25 s)
//   sheet    leaving: the whole scene slides up as one sheet and reveals what's underneath (light ↔ dark world)
// Also here: Breather (a turning-point question in thin white over the footage dimmed to near black, words appear as
// he says them) and Credit (a creator's name tag bottom-left + "Source: …" bottom-right).
import React from 'react';
import {AbsoluteFill, Easing, interpolate, useVideoConfig} from 'remotion';
import {fonts} from './fonts';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export type MoveSpec = {type: 'dive' | 'dot' | 'fly3d' | 'whip-up' | 'whip-down' | 'whip-left' | 'whip-right' | 'sheet' | 'none'; x?: number; y?: number; seconds?: number};

// transform + filter for an insert at local time t (frames) of n
export function moveStyle(enter: MoveSpec | undefined, exit: MoveSpec | undefined, t: number, n: number, fps: number, W: number, H: number): React.CSSProperties | null {
  if (!enter && !exit) return null;
  let tf = '', blur = 0, op = 1, origin = '50% 50%', persp = false;
  const whip = (type: string, k: number) => {
    const d = type === 'whip-up' ? [0, -H] : type === 'whip-down' ? [0, H] : type === 'whip-left' ? [-W, 0] : [W, 0];
    tf += ` translate(${d[0] * k}px, ${d[1] * k}px)`;
    blur += Math.sin(Math.min(1, k) * Math.PI) * 18 + (k > 0.6 ? 6 : 0);
  };
  if (enter && enter.type !== 'none') {
    const d = Math.round((enter.seconds ?? (enter.type === 'dive' ? 0.45 : enter.type === 'fly3d' ? 0.4 : enter.type === 'dot' ? 0.5 : 0.25)) * fps);
    const k = interpolate(t, [0, d], [1, 0], {...clamp, easing: Easing.out(Easing.cubic)}); // 1 = far, 0 = settled
    if (k > 0) {
      if (enter.type === 'dive') { tf += ` scale(${1 + 1.6 * k})`; blur += 14 * k; origin = `${(enter.x ?? 0.5) * 100}% ${(enter.y ?? 0.5) * 100}%`; }
      else if (enter.type === 'dot') { tf += ` scale(${Math.max(0.02, 1 - k)})`; op *= Math.min(1, (1 - k) * 4); origin = `${(enter.x ?? 0.5) * 100}% ${(enter.y ?? 0.5) * 100}%`; }
      else if (enter.type === 'fly3d') {
        const b = Easing.out(Easing.back(1.4))(1 - k);
        tf += ` rotateY(${(1 - b) * -65}deg) rotateX(${(1 - b) * 18}deg) scale(${0.6 + 0.4 * b})`; op *= Math.min(1, (1 - k) * 3); persp = true;
      } else if (enter.type.startsWith('whip')) whip(enter.type === 'whip-up' ? 'whip-down' : enter.type === 'whip-down' ? 'whip-up' : enter.type === 'whip-left' ? 'whip-right' : 'whip-left', k);
    }
  }
  if (exit && exit.type !== 'none') {
    const d = Math.round((exit.seconds ?? (exit.type === 'dive' ? 0.6 : exit.type === 'dot' ? 0.5 : exit.type === 'sheet' ? 0.3 : 0.25)) * fps);
    const k = interpolate(t, [n - d, n], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
    if (k > 0) {
      if (exit.type === 'dive') { tf += ` scale(${1 + 7 * k})`; blur += 22 * k; origin = `${(exit.x ?? 0.5) * 100}% ${(exit.y ?? 0.5) * 100}%`; op *= 1 - interpolate(k, [0.8, 1], [0, 1], clamp); }
      else if (exit.type === 'dot') { tf += ` scale(${Math.max(0.01, 1 - k)})`; origin = `${(exit.x ?? 0.5) * 100}% ${(exit.y ?? 0.5) * 100}%`; }
      else if (exit.type === 'sheet') tf += ` translateY(${-H * k}px)`;
      else if (exit.type.startsWith('whip')) whip(exit.type, k);
    }
  }
  if (!tf && !blur && op === 1) return null;
  return {transform: `${persp ? `perspective(${W * 1.6}px) ` : ''}${tf}`, transformOrigin: origin, filter: blur > 0.3 ? `blur(${blur}px)` : undefined, opacity: op};
}

// backdrop: a full-screen scene's own colour stays still behind a dive / dot, so only its content zooms or shrinks
// (the new world is already there around the dot) and the footage never peeks through
export const Moved: React.FC<{x: {enter?: MoveSpec; exit?: MoveSpec; frames: number}; t: number; backdrop?: string; children: React.ReactNode}> = ({x, t, backdrop, children}) => {
  const {fps, width: W, height: H} = useVideoConfig();
  const st = moveStyle(x.enter, x.exit, t, x.frames, fps, W, H);
  if (!st) return <>{children}</>;
  const still = backdrop && [x.enter?.type, x.exit?.type].some((k) => k === 'dive' || k === 'dot');
  return (
    <AbsoluteFill>
      {still && <AbsoluteFill style={{background: backdrop}} />}
      <AbsoluteFill style={st}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── breather text ───────────────────────────────────────────────────────────────────────────────────────────────
export type BreatherSpec = {words: {w: string; at: number}[]; dim?: number; y?: number};
export const Breather: React.FC<{x: BreatherSpec & {frames: number}; t: number}> = ({x, t}) => {
  const {fps, width: W, height: H} = useVideoConfig();
  const U = Math.min(W, H * 0.5625);
  const io = Math.min(interpolate(t, [0, Math.round(0.3 * fps)], [0, 1], clamp), interpolate(t, [x.frames - Math.round(0.3 * fps), x.frames], [1, 0], clamp));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: '#050506', opacity: (x.dim ?? 0.86) * io}} />
      <div style={{position: 'absolute', left: W * 0.1, width: W * 0.8, top: H * (x.y ?? 0.46), transform: 'translateY(-50%)', textAlign: 'center', opacity: io,
        fontFamily: fonts.inter, fontWeight: 500, fontSize: U * 0.05, lineHeight: 1.35, color: '#f4f2ee', letterSpacing: '-0.01em'}}>
        {x.words.map((w, i) => {
          const k = interpolate(t, [w.at - 1, w.at + 3], [0, 1], clamp);
          return <span key={i} style={{opacity: 0.12 + 0.88 * k}}>{w.w} </span>;
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── credit (name lower-third + source) ──────────────────────────────────────────────────────────────────────────
export type CreditSpec = {name?: string; role?: string; source?: string; color?: string};
export const Credit: React.FC<{x: CreditSpec & {frames: number}; t: number}> = ({x, t}) => {
  const {fps, width: W, height: H} = useVideoConfig();
  const U = Math.min(W, H * 0.5625);
  const k = interpolate(t, [0, Math.round(0.35 * fps)], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const out = interpolate(t, [x.frames - Math.round(0.3 * fps), x.frames], [1, 0], clamp);
  const col = x.color ?? '#137a52';
  const tall = H > W * 1.2;
  return (
    <AbsoluteFill style={{opacity: out}}>
      {x.name && (
        <div style={{position: 'absolute', left: W * 0.04, bottom: H * (tall ? 0.24 : 0.07), display: 'flex', alignItems: 'stretch', transform: `translateX(${(1 - k) * -W * 0.35}px)`}}>
          <div style={{width: U * 0.012, background: '#f2d27a'}} />
          <div style={{background: col, padding: `${U * 0.012}px ${U * 0.025}px`}}>
            <div style={{fontFamily: fonts.inter, fontWeight: 800, fontSize: U * 0.032, color: '#fff'}}>{x.name}</div>
            {x.role && <div style={{fontFamily: fonts.inter, fontWeight: 500, fontSize: U * 0.022, color: '#ffffffcc'}}>{x.role}</div>}
          </div>
        </div>
      )}
      {x.source && (
        <div style={{position: 'absolute', right: W * 0.04, bottom: H * (tall ? 0.22 : 0.035), fontFamily: fonts.inter, fontWeight: 500, fontSize: U * 0.02, color: '#ffffff',
          opacity: 0.75 * k, textShadow: '0 1px 4px rgba(0,0,0,0.6)'}}>Source: {x.source}</div>
      )}
    </AbsoluteFill>
  );
};
