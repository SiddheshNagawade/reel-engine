// Ported from remocn (github.com/Remocn/remocn), registry/remocn/whip-pan. MIT License, Copyright (c) 2026 Remocn.
// Adapted for ReelEngine: a plain component taking (p, entering) instead of a TransitionPresentation (see cut-types.ts).
// The camera whips: the old shot races out with a stretch + directional blur, the new one races in behind it.
import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import type {CutPresentation} from './cut-types';

const clampOpts = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

export const WhipPan: CutPresentation = ({children, p, entering, props}) => {
  const {direction = 'left', blur = 24} = props;
  const travel = interpolate(p, [0, 1], [0, 1], {...clampOpts, easing: Easing.bezier(0.7, 0, 0.2, 1)});
  const velocity = Math.sin(Math.PI * travel);
  const axis: 'x' | 'y' = direction === 'left' || direction === 'right' ? 'x' : 'y';
  const sign = direction === 'left' || direction === 'up' ? -1 : 1;
  const offset = entering ? (travel - 1) * 110 * sign : travel * 110 * sign;
  const stretch = 1 + velocity * 0.12;
  return (
    <AbsoluteFill style={{
      translate: axis === 'x' ? `${offset}%` : `0 ${offset}%`,
      scale: axis === 'x' ? `${stretch} 1` : `1 ${stretch}`,
      filter: `blur(${velocity * blur}px)`,
    }}>{children}</AbsoluteFill>
  );
};
