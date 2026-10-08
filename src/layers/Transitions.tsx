import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';
import type {Edit} from '../types';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Camera moves applied to the footage around a transition frame.
export function transitionMotion(edit: Edit, frame: number) {
  let x = 0, rotY = 0, zoom = 1, blur = 0;
  for (const t of edit.transitions ?? []) {
    const d = frame - t.f;
    if (d < -7 || d > 7) continue;
    const k = d < 0 ? ((d + 7) / 7) ** 2 : ((7 - d) / 7) ** 2; // 0 → 1 at the cut → 0
    if (t.type === 'whip') {
      x += (d < 0 ? -1 : 1) * 38 * k;
      blur += 18 * k;
    } else if (t.type === 'zoomblur') {
      zoom *= 1 + 0.4 * k;
      blur += 14 * k;
    } else if (t.type === 'tilt3d') {
      rotY += (d < 0 ? -1 : 1) * 32 * k;
      zoom *= 1 - 0.1 * k;
      blur += 5 * k;
    } else if (t.type === 'flash') {
      zoom *= 1 + 0.08 * k;
    }
  }
  return {x, rotY, zoom, blur};
}

// Light-based transitions drawn over the footage.
export const TransitionOverlay: React.FC<{edit: Edit}> = ({edit}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {(edit.transitions ?? []).map((t, i) => {
        const d = frame - t.f;
        if (t.type === 'flash' && d >= -2 && d <= 9) {
          const o = interpolate(d, [-2, 0, 9], [0, 0.95, 0], clamp);
          return <AbsoluteFill key={i} style={{background: '#fff', opacity: o}} />;
        }
        if (t.type === 'lightleak' && d >= -10 && d <= 14) {
          const p = interpolate(d, [-10, 14], [0, 1], clamp);
          const o = interpolate(d, [-10, 0, 14], [0, 0.9, 0], clamp);
          return (
            <AbsoluteFill
              key={i}
              style={{
                mixBlendMode: 'screen',
                opacity: o,
                background: `radial-gradient(60% 45% at ${-20 + p * 140}% ${30 + p * 30}%, rgba(255,170,60,0.95), transparent 70%),
                  radial-gradient(40% 35% at ${110 - p * 120}% ${70 - p * 20}%, rgba(255,60,90,0.8), transparent 70%),
                  radial-gradient(80% 30% at 50% ${p * 100}%, rgba(255,240,200,0.6), transparent 70%)`,
              }}
            />
          );
        }
        return null;
      })}
    </>
  );
};
