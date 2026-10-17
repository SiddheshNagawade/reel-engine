// Ported from remocn (github.com/Remocn/remocn), registry/remocn/brush + registry/remocn/stop-motion.
// MIT License, Copyright (c) 2026 Remocn. Kept as close to the original as possible: the tapered brush ribbon with
// paper grain used by ink-underline and scribble-circle, and the stepped (stop-motion) clock they draw on.
import React from 'react';

// ── stop-motion clock ───────────────────────────────────────────────────────────────────────────────────────────
export const DEFAULT_STEP = 3;
export const qf = (frame: number, step = DEFAULT_STEP): number => Math.floor(frame / step) * step;
export const hash01 = (seed: string): number => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h = Math.imul(h ^ (h >>> 13), 2246822519);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
export const hashRange = (seed: string, lo: number, hi: number): number => lo + hash01(seed) * (hi - lo);
export const steppedRamp = (frame: number, from: number, to: number, options?: {ease?: (t: number) => number; step?: number}): number => {
  const f = qf(frame, options?.step ?? DEFAULT_STEP);
  if (f <= from) return 0;
  if (f >= to) return 1;
  const ease = options?.ease ?? ((t: number) => t);
  return ease((f - from) / (to - from));
};

// ── brush ───────────────────────────────────────────────────────────────────────────────────────────────────────
const GRAIN_RATIO = 0.5;
const GRAIN_FREQUENCY = 0.7;
const GRAIN_OCTAVES = 3;
export type BrushPoint = {x: number; y: number};
export type BrushTaper = {strokeWidth: number; pressure?: number; release?: number};

export function brushHalfWidth(taper: BrushTaper, t: number): number {
  const pressure = taper.pressure ?? 0.2;
  const release = taper.release ?? 1;
  return (taper.strokeWidth / 2) * (pressure + (release - pressure) * t);
}
export const brushGrainScale = (strokeWidth: number, grain: number) => strokeWidth * GRAIN_RATIO * grain;
export const brushReach = (strokeWidth: number, grain: number) => strokeWidth / 2 + brushGrainScale(strokeWidth, grain) / 2;
export const brushFilterId = (seed: string, strokeWidth: number, grain: number) => `remocn-brush-${Math.floor(hash01(`${seed}:${strokeWidth}:${grain}`) * 1e9)}`;

export function sampleCubic(from: BrushPoint, c1: BrushPoint, c2: BrushPoint, to: BrushPoint, points = 32): BrushPoint[] {
  const count = Math.max(2, points);
  return Array.from({length: count}, (_, i) => {
    const t = i / (count - 1);
    const u = 1 - t;
    const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    return {x: a * from.x + b * c1.x + c * c2.x + d * to.x, y: a * from.y + b * c1.y + c * c2.y + d * to.y};
  });
}

const normalAt = (points: BrushPoint[], i: number): BrushPoint => {
  const before = points[i - 1] ?? points[i];
  const after = points[i + 1] ?? points[i];
  const tx = after.x - before.x, ty = after.y - before.y;
  const length = Math.hypot(tx, ty) || 1;
  return {x: -ty / length, y: tx / length};
};
const curveSegments = (points: BrushPoint[]): string =>
  points
    .slice(0, -1)
    .map((p1, i) => {
      const p0 = points[i - 1] ?? p1;
      const p2 = points[i + 1];
      const p3 = points[i + 2] ?? p2;
      return `C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}, ${p2.x} ${p2.y}`;
    })
    .join(' ');

// A filled ribbon around a spine: pressure at the start, release at the end, cut at `progress` (the pen's head).
export function brushRibbon(spine: BrushPoint[], options: BrushTaper & {progress?: number}): string {
  const progress = options.progress ?? 1;
  const drawn = Math.max(2, Math.round(progress * (spine.length - 1)) + 1);
  const left: BrushPoint[] = [], right: BrushPoint[] = [];
  for (let i = 0; i < drawn; i++) {
    const half = brushHalfWidth(options, i / (spine.length - 1));
    const n = normalAt(spine, i);
    left.push({x: spine[i].x + n.x * half, y: spine[i].y + n.y * half});
    right.push({x: spine[i].x - n.x * half, y: spine[i].y - n.y * half});
  }
  const back = right.slice().reverse();
  return `M ${left[0].x} ${left[0].y} ${curveSegments(left)} L ${back[0].x} ${back[0].y} ${curveSegments(back)} Z`;
}

// Paper grain: the ribbon's edge is displaced by fractal noise, so it reads as a real marker/brush.
export const BrushGrain: React.FC<{seed: string; strokeWidth: number; grain: number}> = ({seed, strokeWidth, grain}) => (
  <defs>
    <filter id={brushFilterId(seed, strokeWidth, grain)} x="-30%" y="-30%" width="160%" height="160%">
      <feTurbulence type="fractalNoise" baseFrequency={GRAIN_FREQUENCY} numOctaves={GRAIN_OCTAVES} seed={Math.floor(hash01(`${seed}:grain`) * 1000)} result="brushGrain" />
      <feDisplacementMap in="SourceGraphic" in2="brushGrain" scale={brushGrainScale(strokeWidth, grain)} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </defs>
);
