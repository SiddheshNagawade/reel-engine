import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing} from 'remotion';
import {fonts} from '../layers/fonts';

// Number roll: values roll like a slot machine (Day 1 → Day 30, 2021 → 2024, 0 → 12 hours) with a giant faded
// version of the current value behind it. Calm background, one idea on screen.
export const NumberRoll: React.FC<{values: (string | number)[]; label?: string; prefix?: string; suffix?: string; frames: number; bg?: string; ink?: string; accent?: string}> = ({
  values, label, prefix = '', suffix = '', frames, bg = '#f4f3ef', ink = '#111', accent = '#e8502f',
}) => {
  const frame = useCurrentFrame();
  const {height: H} = useVideoConfig();
  const holdEnd = frames * 0.8;
  const pos = interpolate(frame, [6, holdEnd], [0, values.length - 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  const idx = Math.round(pos);
  const size = H * 0.085;
  const exit = interpolate(frame, [frames - 8, frames], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: bg, alignItems: 'center', justifyContent: 'center', opacity: exit}}>
      {/* giant faded echo of the current value */}
      <div style={{position: 'absolute', fontFamily: fonts.dmSerif, fontSize: H * 0.42, color: ink, opacity: 0.06, lineHeight: 1}}>{values[idx]}</div>
      <div style={{position: 'relative', height: size * 1.2, overflow: 'hidden', fontFamily: fonts.dmSerif, fontSize: size, color: ink, lineHeight: 1.2}}>
        <div style={{transform: `translateY(${-pos * size * 1.2}px)`, filter: `blur(${Math.min(6, Math.abs(pos - idx) * 14)}px)`}}>
          {values.map((v, i) => (
            <div key={i} style={{height: size * 1.2, textAlign: 'center'}}>{prefix}{v}{suffix}</div>
          ))}
        </div>
      </div>
      {label && <div style={{marginTop: size * 0.3, fontFamily: fonts.inter, fontWeight: 700, fontSize: size * 0.32, color: accent, letterSpacing: 1, textTransform: 'uppercase'}}>{label}</div>}
    </AbsoluteFill>
  );
};
