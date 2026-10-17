// Ported from remocn (github.com/Remocn/remocn), registry/remocn/glitch-cut. MIT License, Copyright (c) 2026 Remocn.
// Adapted for ReelEngine: remocn draws this with a WebGL shader over captured scene textures, with a CSS fallback.
// Our render has no scene textures, so this is their CSS fallback (horizontal bands that tear sideways, hand over
// from the old shot to the new one at slightly different moments, and flash pink/cyan), as a plain (p, entering)
// component (see cut-types.ts). Use for a sharp "something broke / switched" cut, never for a calm one.
import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import type {CutPresentation} from './cut-types';

const STEPS = 22;
const bandCut = (band: number, seed: string) => 0.5 + (random(`glitch-cut-handoff-${seed}-${band}`) - 0.5) * 0.32;

export const GlitchCut: CutPresentation = ({children, p, entering, props, seed = 'g'}) => {
  const {intensity = 1, slices = 24, rgbSplit = 1} = props;
  const energy = Math.max(0, Math.sin(p * Math.PI)) ** 0.7;
  if (energy < 0.002) {
    const settled = entering ? (p >= 0.5 ? 1 : 0) : p < 0.5 ? 1 : 0;
    return <AbsoluteFill style={{opacity: settled}}>{children}</AbsoluteFill>;
  }
  const clock = Math.floor(p * STEPS);
  const bands = Math.max(2, Math.min(6, Math.round(slices / 5)));
  const height = 100 / bands;
  return (
    <AbsoluteFill>
      {Array.from({length: bands}, (_, band) => {
        const shown = p >= bandCut(band, seed) ? entering : !entering;
        if (!shown) return null;
        // shift scaled from remocn's 1280-wide reference to our frame (52px of 1280 ≈ 4 %)
        const shift = (random(`glitch-cut-shift-${seed}-${clock}-${band}`) - 0.5) * 4 * intensity * energy;
        const tint = band % 2 === 0 ? 'rgb(255, 42, 90)' : 'rgb(0, 224, 255)';
        const tintOpacity = rgbSplit * 0.2 * energy * random(`glitch-cut-tint-${seed}-${clock}-${band}`);
        return (
          <AbsoluteFill key={band} style={{clipPath: `inset(${band * height}% 0 ${100 - (band + 1) * height}% 0)`, translate: `${shift}%`}}>
            {children}
            <AbsoluteFill style={{background: tint, mixBlendMode: 'screen', opacity: tintOpacity}} />
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
