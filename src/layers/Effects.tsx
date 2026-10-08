import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';
import {noise2D} from '@remotion/noise';
import type {Edit, Effect} from '../types';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// 0→1 strength of an effect at a frame: quick ramp in; fade or hard cut out.
export function effectStrength(fx: Effect, frame: number) {
  const d = frame - fx.f;
  if (d < 0 || d >= fx.frames) return 0;
  const inn = interpolate(d, [0, fx.type === 'rage' ? 8 : 2], [0, 1], clamp);
  const out = fx.end === 'fade' ? interpolate(d, [fx.frames - 10, fx.frames], [1, 0], clamp) : 1;
  return Math.min(inn, out);
}

// What the footage itself should do (CSS filter + shake), used by VideoTrack.
export function footageLook(edit: Edit, frame: number) {
  let gray = 0, dark = 0, red = 0;
  for (const fx of edit.effects ?? []) {
    const k = effectStrength(fx, frame);
    if (!k) continue;
    if (fx.type === 'mono') { gray = Math.max(gray, k); dark = Math.max(dark, 0.35 * k); }
    if (fx.type === 'dark') dark = Math.max(dark, 0.55 * k);
    if (fx.type === 'rage') red = Math.max(red, k);
  }
  const shake = red ? `translate(${noise2D('sx', frame * 0.9, 0) * 9 * red}px, ${noise2D('sy', frame * 0.9, 0) * 9 * red}px)` : '';
  const filter = `${gray ? `grayscale(${gray}) contrast(${1 + 0.25 * gray}) ` : ''}${dark ? `brightness(${1 - dark}) ` : ''}${red ? `saturate(${1 + 0.6 * red}) contrast(${1 + 0.2 * red}) ` : ''}`;
  return {filter, shake};
}

// Overlays: red burning edges for rage, heavy vignette for beats.
export const EffectOverlay: React.FC<{edit: Edit}> = ({edit}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {(edit.effects ?? []).map((fx, i) => {
        const k = effectStrength(fx, frame);
        if (!k) return null;
        if (fx.type === 'rage') {
          const flicker = 0.85 + 0.15 * noise2D('fl', frame * 0.5, i);
          return (
            <AbsoluteFill key={i} style={{opacity: k * flicker}}>
              <AbsoluteFill style={{background: 'rgba(255,30,0,0.28)', mixBlendMode: 'multiply'}} />
              <AbsoluteFill
                style={{
                  background: `radial-gradient(ellipse at 50% 45%, transparent 35%, rgba(255,60,0,0.55) 70%, rgba(120,0,0,0.9) 100%)`,
                  mixBlendMode: 'screen',
                }}
              />
            </AbsoluteFill>
          );
        }
        // mono / dark beats: crush the edges so all attention goes to the held moment
        return <AbsoluteFill key={i} style={{opacity: k, background: 'radial-gradient(ellipse at 50% 45%, transparent 30%, rgba(0,0,0,0.75) 100%)'}} />;
      })}
    </>
  );
};
