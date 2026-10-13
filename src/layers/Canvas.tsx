// CANVAS MODE (his idea, 2026-10-14): the base of the reel is a canvas, not his footage. His footage is ONE layer
// on it, like the photos, text and graphics, and ONE camera moves over the whole canvas. So the footage can shrink
// into a rounded card beside a graphic, tilt, become a circle, or become just HIM (person cut-out) standing on the
// canvas background; the camera can pan from him to a graphic next to him, or pull out so he becomes one element
// among others, in one continuous move. Without `edit.canvas` the reel works exactly as before (footage = base).
//   edit.canvas = {bg, cam: [{at, x, y, zoom, rot}], footage: [{at, x, y, w, rot, shape, cut}], items: [scene items]}
//   World coordinates = fractions of the frame (0..1 is the first screen); the footage at {x: .5, y: .5, w: 1} with
//   the camera at {x: .5, y: .5, zoom: 1} looks exactly like a normal reel. Keys glide (slow-fast-slow).
import React from 'react';
import {AbsoluteFill, Easing, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Edit} from '../types';
import {Scene, type SceneCam, type SceneItem, type SceneSpec} from '../templates/Scene';

export type FootageKey = {at: number; x?: number; y?: number; w?: number; rot?: number; shape?: 'rect' | 'round' | 'circle'; cut?: boolean};
export type CanvasSpec = {bg?: SceneSpec['bg']; cam?: SceneCam[]; footage?: FootageKey[]; items?: SceneItem[]};

const glide = Easing.bezier(0.6, 0, 0.25, 1);

// state at time t: each key's state is reached over its first ≤ 0.8 s, starting from the previous key's state
function stateAt(keys: FootageKey[], t: number) {
  const ks = [...keys].sort((a, b) => a.at - b.at);
  const v = (k: FootageKey) => ({x: k.x ?? 0.5, y: k.y ?? 0.5, w: k.w ?? 1, rot: k.rot ?? 0, round: k.shape === 'round' ? 1 : 0, circle: k.shape === 'circle' ? 1 : 0});
  const base = {x: 0.5, y: 0.5, w: 1, rot: 0, round: 0, circle: 0};
  let cur = base, cut = false;
  for (let i = 0; i < ks.length; i++) {
    const k = ks[i];
    if (t < k.at) break;
    const target = v(k);
    const p = glide(Math.min(1, (t - k.at) / 22));
    cur = Object.fromEntries(Object.keys(base).map((n) => [n, (cur as Record<string, number>)[n] + ((target as Record<string, number>)[n] - (cur as Record<string, number>)[n]) * p])) as typeof base;
    cut = !!k.cut;
  }
  return {...cur, cut};
}

const Footage: React.FC<{edit: Edit; children: React.ReactNode}> = ({edit, children}) => {
  const t = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const s = stateAt(edit.canvas?.footage ?? [], t);
  const small = s.w < 0.995 || s.rot !== 0 || s.round > 0 || s.circle > 0;
  const R = (Math.min(W, H) * 0.06 * s.round) / Math.max(0.2, s.w); // ~6 % of the frame at the card's final size
  // circle: a face-sized circle around the upper middle of the frame
  const clip = s.circle > 0.01
    ? `circle(${(1 - s.circle) * 75 + s.circle * 30}% at 50% ${45 - s.circle * 5}%)`
    : s.round > 0.01 ? `inset(0 round ${R}px)` : undefined;
  // the person-only cut-out for the frames where the footage is "just him" on the canvas
  const fg = s.cut ? (edit.foreground ?? []).find((x) => x.src && x.canvas && t >= x.f && t < x.f + x.frames) : undefined;
  return (
    <div style={{position: 'absolute', left: s.x * W - W / 2, top: s.y * H - H / 2, width: W, height: H,
      transform: `rotate(${s.rot}deg) scale(${s.w})`, transformOrigin: '50% 50%',
      filter: small && !fg ? 'drop-shadow(0 30px 50px rgba(0,0,0,0.55))' : fg ? 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))' : undefined}}>
      <div style={{position: 'absolute', inset: 0, clipPath: clip, overflow: 'hidden'}}>
        {/* the footage always plays (his voice), hidden while only his cut-out is shown */}
        <AbsoluteFill style={{opacity: fg ? 0 : 1}}>{children}</AbsoluteFill>
        {fg && (
          <Sequence from={fg.f} durationInFrames={fg.frames} layout="absolute-fill">
            <OffthreadVideo src={staticFile(fg.src!)} transparent muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </Sequence>
        )}
      </div>
    </div>
  );
};

// The whole picture in canvas mode: canvas background → (one camera) → his footage layer + graphics in one world.
// His audio keeps playing from the footage layer even while the picture shows only his cut-out.
export const CanvasWorld: React.FC<{edit: Edit; footage: React.ReactNode}> = ({edit, footage}) => {
  const c = edit.canvas!;
  return (
    <AbsoluteFill>
      <Scene frames={edit.durationInFrames} bg={c.bg ?? {color: '#14141c', style: 'radial'}} cam={c.cam ?? [{at: 0, x: 0.5, y: 0.5, zoom: 1}]}
        items={c.items ?? []} under={<Footage edit={edit}>{footage}</Footage>} />
    </AbsoluteFill>
  );
};
