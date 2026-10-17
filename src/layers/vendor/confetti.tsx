// Ported from remocn (github.com/Remocn/remocn), registry/remocn/confetti. MIT License, Copyright (c) 2026 Remocn.
// Adapted for ReelEngine: fires at `startFrame` = his word (frames from the item start); otherwise unchanged.
// A deterministic burst (same seed = same burst every render): pieces fly out, flutter, fall with gravity, fade.
// Only for a REAL win/celebration moment, never as decoration.
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

export type ConfettiProps = {particleCount?: number; colors?: string[]; originX?: number; originY?: number; startFrame?: number; lifetime?: number; power?: number; gravity?: number; size?: number; seed?: number};
type Particle = {angle: number; speed: number; color: string; size: number; rot0: number; spin: number; drift: number};
const DEFAULT_COLORS = ['#1d9bf0', '#ff5da2', '#ffd23f', '#22c55e', '#a855f7', '#ff7a45'];

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function makeParticles({count, seed, colors}: {count: number; seed: number; colors: string[]}): Particle[] {
  const rand = mulberry32(seed);
  const palette = colors.length > 0 ? colors : DEFAULT_COLORS;
  return Array.from({length: count}, () => ({
    angle: rand() * Math.PI * 2, speed: 0.35 + 0.65 * rand(), color: palette[Math.floor(rand() * palette.length)],
    size: 0.7 + 0.6 * rand(), rot0: rand() * Math.PI * 2, spin: (rand() - 0.5) * 0.6, drift: (rand() - 0.5) * 2,
  }));
}
export function particleOpacity(tt: number, lifetime: number): number {
  if (tt < 0 || tt > lifetime) return 0;
  const c = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
  return Math.min(interpolate(tt, [0, 4], [0, 1], c), interpolate(tt, [lifetime * 0.7, lifetime], [1, 0], c));
}

export const Confetti: React.FC<ConfettiProps> = ({particleCount = 140, colors = DEFAULT_COLORS, originX = 0.5, originY = 0.5, startFrame = 0, lifetime = 90, power = 17, gravity = 0.45, size = 13, seed = 1}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const tt = frame - startFrame;
  if (tt < 0 || tt > lifetime) return null;
  const sc = height / 720;
  const ox = width * originX, oy = height * originY;
  const opacity = particleOpacity(tt, lifetime);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {makeParticles({count: particleCount, seed, colors}).map((p, i) => {
        const vx = Math.cos(p.angle) * p.speed * power + p.drift;
        const vy = Math.sin(p.angle) * p.speed * power;
        const w = size * p.size * sc;
        return (
          <div key={i} style={{position: 'absolute', left: ox + vx * tt * sc, top: oy + (vy * tt + 0.5 * gravity * tt * tt) * sc, width: w, height: w * 0.62, borderRadius: 2,
            background: p.color, opacity, translate: '-50% -50%', rotate: `${p.rot0 + p.spin * tt}rad`, scale: `${Math.cos(p.rot0 + p.spin * tt * 1.6)} 1`}} />
        );
      })}
    </AbsoluteFill>
  );
};
