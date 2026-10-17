// Ported from remocn (github.com/Remocn/remocn), registry/remocn/zoom-blur. MIT License, Copyright (c) 2026 Remocn.
// Adapted for ReelEngine: a plain component taking (p, entering) instead of a TransitionPresentation (see cut-types.ts).
// The old shot pushes past the lens and blurs away while the new one settles in from slightly small and soft.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {CutPresentation} from './cut-types';

export const ZoomBlur: CutPresentation = ({children, p, entering, props}) => {
  const {blur = 16, rise = 0} = props;
  const style: React.CSSProperties = entering
    ? {opacity: p, transform: `scale(${0.9 + p * 0.1})${rise > 0 ? ` translateY(${(1 - p) * rise}px)` : ''}`, filter: p < 1 ? `blur(${(1 - p) * blur}px)` : undefined}
    : {opacity: 1 - p, transform: `scale(${1 + p * 0.12})${rise > 0 ? ` translateY(${-p * rise}px)` : ''}`, filter: p > 0 ? `blur(${p * blur}px)` : undefined};
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};
