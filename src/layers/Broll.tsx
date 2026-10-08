import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, interpolate} from 'remotion';
import type {Edit, Broll} from '../types';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const BrollLayer: React.FC<{edit: Edit}> = ({edit}) => (
  <>
    {edit.broll.map((b, i) => (
      <Sequence key={i} from={b.f} durationInFrames={b.frames} layout="none">
        <BrollClip b={b} />
      </Sequence>
    ))}
  </>
);

const BrollClip: React.FC<{b: Broll}> = ({b}) => {
  const frame = useCurrentFrame();
  const inT = interpolate(frame, [0, 7], [0, 1], clamp);
  const outT = interpolate(frame, [b.frames - 6, b.frames], [1, 0], clamp);
  const kenBurns = interpolate(frame, [0, b.frames], [1.06, 1.16], clamp);
  const style: React.CSSProperties = {width: '100%', height: '100%', objectFit: 'cover'};
  return (
    <AbsoluteFill
      style={{
        opacity: Math.min(inT, outT),
        filter: `blur(${(1 - inT) * 18}px)`,
        transform: `scale(${kenBurns + (1 - inT) * 0.1})`,
      }}
    >
      {b.isVideo ? <OffthreadVideo src={staticFile(b.src)} muted style={style} /> : <Img src={staticFile(b.src)} style={style} />}
    </AbsoluteFill>
  );
};
