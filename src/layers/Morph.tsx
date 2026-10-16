// Shape-morph transition: the old scene closes in on ONE object, that object's outline morphs into the next scene's
// object, and the new scene opens out of it. Ported from cth9191/animate kit/morph.js (MIT), rebuilt for Remotion:
//   shrink [tc-d, tc-m]  the old picture is seen through a window shaped like object A, shrinking onto the object
//                        while everything outside turns into plain paper; near the end the window fills with A's colour
//   morph  [tc-m, tc+m]  on blank paper, A's outline blends into B's (both resampled by angle around their centres,
//                        position, size, rotation and colour blended)
//   grow   [tc+m, tc+d]  the new picture opens out of a window shaped like B until it covers the frame
// d = half-length (default 0.6 s, so a bridge costs 1.2 s; short reels 0.4), m = the morph's half (default d/3).
// The live picture is used on both sides (before tc the old scene is still playing, after tc the new one), so it works
// across footage, full-screen inserts, charts, illos and iso scenes alike: nothing has to render twice.
// Switched on from direction.json: direction.morphs [{at, from: {shape, x, y, size, color}, to: {...}, seconds?, paper?}]
// (scripts/lib/plan.mjs → edit.transitions {type: 'morph', morph}). Place x/y exactly on the object in both scenes.
import React from 'react';
import {AbsoluteFill, Easing, useCurrentFrame, useVideoConfig} from 'remotion';
import {getLength, getPointAtLength} from '@remotion/paths';
import type {Edit} from '../types';

export type MorphShapeName = 'circle' | 'square' | 'star' | 'spark' | 'heart' | 'drop' | 'bubble' | 'pin' | 'phone' | 'hex' | 'diamond' | 'triangle' | 'cloud' | 'bolt' | 'coin';
export type MorphEnd = {
  shape?: MorphShapeName; // the object's silhouette (default circle)
  d?: string; // or an SVG path (any units; it is fitted to `size`) e.g. the outline of an illo object
  x?: number; y?: number; // where the object sits on screen (fractions of the frame, default centre)
  size?: number; // radius as a fraction of the frame width (default 0.14)
  rot?: number; // degrees
  color?: string; // the object's colour (the blob takes it during the morph)
};
export type MorphSpec = {from: MorphEnd; to: MorphEnd; d?: number; m?: number; paper?: string; outline?: boolean};

type Pt = [number, number];
const TAU = Math.PI * 2;
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const seg = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));

// unit silhouettes (radius ~1 around 0,0), sampled densely; byAngle() makes any two comparable point for point
const polar = (f: (a: number) => number, n = 180): Pt[] => Array.from({length: n}, (_, i) => { const a = (i / n) * TAU; const r = f(a); return [Math.cos(a) * r, Math.sin(a) * r]; });
const poly = (pts: Pt[], n = 180): Pt[] => {
  const L = pts.map((p, i) => Math.hypot(pts[(i + 1) % pts.length][0] - p[0], pts[(i + 1) % pts.length][1] - p[1]));
  const tot = L.reduce((a, b) => a + b, 0), out: Pt[] = [];
  for (let k = 0; k < n; k++) {
    let d = (k / n) * tot, i = 0;
    while (d > L[i]) { d -= L[i]; i++; }
    const a = pts[i], b = pts[(i + 1) % pts.length], u = d / L[i];
    out.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u)]);
  }
  return out;
};
const ngon = (n: number, r0 = -Math.PI / 2): Pt[] => Array.from({length: n}, (_, i) => [Math.cos(r0 + (i / n) * TAU), Math.sin(r0 + (i / n) * TAU)] as Pt);
const rrect = (w: number, h: number, r: number): Pt[] => {
  const out: Pt[] = [];
  const cs: [number, number, number][] = [[w - r, -h + r, -Math.PI / 2], [w - r, h - r, 0], [-w + r, h - r, Math.PI / 2], [-w + r, -h + r, Math.PI]];
  for (const [cx, cy, a0] of cs) for (let i = 0; i <= 8; i++) { const a = a0 + (i / 8) * (Math.PI / 2); out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return out;
};
const UNIT: Record<MorphShapeName, () => Pt[]> = {
  circle: () => polar(() => 1),
  coin: () => polar(() => 1),
  square: () => poly(rrect(0.9, 0.9, 0.22)),
  phone: () => poly(rrect(0.55, 1, 0.16)),
  star: () => poly(Array.from({length: 10}, (_, i) => { const a = -Math.PI / 2 + (i / 10) * TAU, r = i % 2 ? 0.45 : 1; return [Math.cos(a) * r, Math.sin(a) * r] as Pt; })),
  spark: () => polar((a) => 0.42 + 0.58 * (0.5 + 0.5 * Math.cos(4 * (a + Math.PI / 2))) ** 3), // animate's hero spark
  heart: () => Array.from({length: 180}, (_, i) => { const t = (i / 180) * TAU; return [(16 * Math.sin(t) ** 3) / 17, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17 + 0.1] as Pt; }),
  drop: () => polar((a) => { const u = (a + Math.PI / 2 + TAU) % TAU; return 0.62 + 0.38 * Math.abs(Math.cos(u / 2)) ** 6; }).map(([x, y]) => [x, y + 0.2] as Pt),
  bubble: () => poly([...rrect(1, 0.68, 0.3).slice(0, 18), [-0.2, 0.68], [-0.5, 1], [-0.45, 0.68], ...rrect(1, 0.68, 0.3).slice(18)]),
  pin: () => polar((a) => { const u = (a - Math.PI / 2 + TAU) % TAU; const k = Math.max(0, Math.cos(u)) ** 8; return 0.62 + 0.62 * k; }).map(([x, y]) => [x, y - 0.25] as Pt),
  hex: () => poly(ngon(6, 0)),
  diamond: () => poly(ngon(4)),
  triangle: () => poly(ngon(3)),
  cloud: () => polar((a) => 0.78 + 0.16 * Math.abs(Math.sin(a * 3)) + 0.06 * Math.sin(a * 5)),
  bolt: () => poly([[0.15, -1], [-0.55, 0.12], [-0.05, 0.12], [-0.2, 1], [0.55, -0.15], [0.05, -0.15]]),
};
// any SVG path fitted into the unit box (so `size` means the same thing for a path as for a named shape)
const pathCache = new Map<string, Pt[]>();
const fromPath = (d: string): Pt[] => {
  if (pathCache.has(d)) return pathCache.get(d)!;
  const L = getLength(d), raw: Pt[] = Array.from({length: 240}, (_, i) => { const p = getPointAtLength(d, (i / 240) * L) ?? {x: 0, y: 0}; return [p.x, p.y]; });
  const xs = raw.map((p) => p[0]), ys = raw.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const s = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 || 1;
  const out = raw.map(([x, y]) => [(x - cx) / s, (y - cy) / s] as Pt);
  pathCache.set(d, out);
  return out;
};

// resample a closed outline to m points by angle around its centroid (animate's byAngle: farthest point per ray)
const byAngle = (P: Pt[], m = 120): {P: Pt[]; c: Pt} => {
  const c: Pt = P.reduce((a, p) => [a[0] + p[0] / P.length, a[1] + p[1] / P.length], [0, 0]);
  const out: Pt[] = [];
  for (let i = 0; i < m; i++) {
    const a = -Math.PI + (i / m) * TAU;
    let best: Pt = P[0], bd = 1e9, br = -1;
    for (const q of P) {
      let d = Math.atan2(q[1] - c[1], q[0] - c[0]) - a;
      d = Math.abs(Math.atan2(Math.sin(d), Math.cos(d)));
      const r = Math.hypot(q[0] - c[0], q[1] - c[1]);
      if (d < bd - 1e-3 || (Math.abs(d - bd) < 1e-3 && r > br)) { bd = d; br = r; best = q; }
    }
    out.push(best);
  }
  return {P: out, c};
};

const placed = (e: MorphEnd, W: number, H: number): Pt[] => {
  const unit = e.d ? fromPath(e.d) : UNIT[e.shape ?? 'circle']();
  const r = (e.size ?? 0.14) * W, cx = (e.x ?? 0.5) * W, cy = (e.y ?? 0.5) * H, a = ((e.rot ?? 0) * Math.PI) / 180;
  return unit.map(([x, y]) => [cx + (x * Math.cos(a) - y * Math.sin(a)) * r, cy + (x * Math.sin(a) + y * Math.cos(a)) * r]);
};
const toD = (P: Pt[]) => 'M' + P.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L') + 'Z';
const scaled = (P: Pt[], c: Pt, k: number): Pt[] => P.map(([x, y]) => [c[0] + (x - c[0]) * k, c[1] + (y - c[1]) * k]);
// how far the window must scale about its centre to uncover the whole frame
const kMax = (P: Pt[], W: number, H: number) => {
  const {P: Q, c} = byAngle(P, 48);
  const rmin = Math.max(6, Math.min(...Q.map((p) => Math.hypot(p[0] - c[0], p[1] - c[1]))));
  const far = Math.max(...([[0, 0], [W, 0], [0, H], [W, H]] as Pt[]).map((q) => Math.hypot(q[0] - c[0], q[1] - c[1])));
  return {c, k: (far / rmin) * 1.08};
};
const hex = (h: string) => { const s = h.replace('#', ''); const f = s.length === 3 ? s.split('').map((x) => x + x).join('') : s; return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16)); };
const mixHex = (a: string, b: string, u: number) => { const x = hex(a), y = hex(b); return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], u))).join(',')})`; };

const In = Easing.in(Easing.quad), Out = Easing.out(Easing.quad), InOut = Easing.inOut(Easing.cubic);

// One frame of one bridge (null when the frame is outside it).
const Bridge: React.FC<{tc: number; s: MorphSpec; frame: number}> = ({tc, s, frame}) => {
  const {fps, width: W, height: H} = useVideoConfig();
  const D = Math.round((s.d ?? 0.6) * fps), M = Math.max(2, Math.round((s.m ?? (s.d != null ? s.d / 3 : 0.2)) * fps));
  if (frame < tc - D || frame >= tc + D) return null;
  const paper = s.paper ?? '#f4efe4';
  const cA = s.from.color ?? '#1d1d1f', cB = s.to.color ?? cA;
  const PA = placed(s.from, W, H), PB = placed(s.to, W, H);
  const frameRect = `M0,0H${W}V${H}H0Z`;
  const ring = (P: Pt[], col: string, o: number) => (s.outline !== false && o > 0.01 ? <path d={toD(P)} fill="none" stroke={col} strokeWidth={W * 0.006} opacity={o} /> : null);
  let body: React.ReactNode;
  if (frame < tc - M) {
    // shrink: the old scene through an A-shaped window closing onto the object (log scale = constant-feeling speed)
    const u = In(seg(frame, tc - D, tc - M)), {c, k} = kMax(PA, W, H), kk = Math.exp(lerp(Math.log(k), 0, u));
    const win = scaled(PA, c, kk), fill = seg(u, 0.72, 1);
    body = (<>
      <path d={frameRect + toD(win)} fillRule="evenodd" fill={paper} opacity={Math.min(1, u * 3)} />
      {fill > 0 && <path d={toD(win)} fill={cA} opacity={fill} />}
      {ring(win, cA, u)}
    </>);
  } else if (frame < tc + M) {
    // morph: on blank paper, A's outline becomes B's (centres travel, colour blends)
    const u = InOut(seg(frame, tc - M, tc + M));
    const A2 = byAngle(PA), B2 = byAngle(PB);
    const P = A2.P.map((p, i) => [lerp(p[0], B2.P[i][0], u), lerp(p[1], B2.P[i][1], u)] as Pt);
    body = (<>
      <rect width={W} height={H} fill={paper} />
      <path d={toD(P)} fill={mixHex(cA, cB, u)} />
    </>);
  } else {
    // grow: the new scene opens out of a B-shaped window
    const u = Out(seg(frame, tc + M, tc + D)), {c, k} = kMax(PB, W, H), kk = Math.exp(lerp(0, Math.log(k), u));
    const win = scaled(PB, c, kk), fill = 1 - seg(u, 0, 0.28);
    body = (<>
      <path d={frameRect + toD(win)} fillRule="evenodd" fill={paper} opacity={Math.min(1, (1 - u) * 3)} />
      {fill > 0 && <path d={toD(win)} fill={cB} opacity={fill} />}
      {ring(win, cB, 1 - u)}
    </>);
  }
  return <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>{body}</svg>;
};

export const MorphOverlay: React.FC<{edit: Edit}> = ({edit}) => {
  const frame = useCurrentFrame();
  const bridges = (edit.transitions ?? []).filter((t) => t.type === 'morph' && t.morph);
  if (!bridges.length) return null;
  return <AbsoluteFill style={{pointerEvents: 'none'}}>{bridges.map((t, i) => <Bridge key={i} tc={t.f} s={t.morph!} frame={frame} />)}</AbsoluteFill>;
};
