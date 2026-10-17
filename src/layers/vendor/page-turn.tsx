// Ported from remocn (github.com/Remocn/remocn), registry/remocn/page-turn. MIT License, Copyright (c) 2026 Remocn.
// Adapted for ReelEngine: a plain component taking (p, entering) instead of a TransitionPresentation (see cut-types.ts).
// The old shot is a sheet of paper flipped up and away in a few stepped poses (stop-motion feel); the new shot is
// already underneath. Good for "next chapter" / notebook / drawing videos.
import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import type {CutPresentation} from './cut-types';

const LIFT_RATIO = 1.28;

export function pageTurnPose(progress: number, poses: number): number {
  const clamped = Math.min(1, Math.max(0, progress));
  const eased = clamped ** 3;
  if (poses <= 1) return eased >= 1 ? 1 : 0;
  const bucket = Math.min(poses - 1, Math.floor(eased * poses));
  return bucket / (poses - 1);
}

export const PageTurn: CutPresentation = ({children, p, entering, props}) => {
  const {height} = useVideoConfig();
  const {angle = -7, origin = '18% 100%', poses = 8} = props;
  if (entering) return <AbsoluteFill>{children}</AbsoluteFill>;
  const pose = pageTurnPose(p, poses);
  return (
    <AbsoluteFill style={{zIndex: 2, transformOrigin: origin, translate: `0 ${-pose * height * LIFT_RATIO}px`, rotate: `${angle * pose}deg`, boxShadow: pose > 0 ? '0 30px 60px rgba(0,0,0,0.45)' : undefined}}>
      {children}
    </AbsoluteFill>
  );
};
