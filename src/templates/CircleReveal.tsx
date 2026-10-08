import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig, interpolate, Easing} from 'remotion';

// Circle reveal (before → after): a soft-edged spotlight travels across the frame showing the AFTER inside it,
// then opens up to reveal it fully. Made for sketch → finished drawing, raw → graded, old → new.
export type RevealSide = {src: string; video?: boolean; trimBefore?: number; filter?: string};

export const CircleReveal: React.FC<{before: RevealSide; after: RevealSide; frames: number; path?: [number, number][]}> = ({before, after, frames, path}) => {
  const frame = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const pts = path ?? [[0.3, 0.35], [0.7, 0.5], [0.4, 0.65], [0.5, 0.5]];
  const travelEnd = frames * 0.65;
  const seg = interpolate(frame, [0, travelEnd], [0, pts.length - 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const k = Math.min(pts.length - 2, Math.floor(seg));
  const t = seg - k;
  const cx = (pts[k][0] + (pts[k + 1][0] - pts[k][0]) * t) * W;
  const cy = (pts[k][1] + (pts[k + 1][1] - pts[k][1]) * t) * H;
  const r0 = Math.min(W, H) * 0.22;
  const r = interpolate(frame, [0, 8, travelEnd, frames - 6], [0, r0, r0, Math.hypot(W, H)], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const media = (s: RevealSide) => {
    const st: React.CSSProperties = {width: '100%', height: '100%', objectFit: 'cover', filter: s.filter};
    return s.video ? <OffthreadVideo src={staticFile(s.src)} trimBefore={s.trimBefore ?? 0} muted style={st} /> : <Img src={staticFile(s.src)} style={st} />;
  };
  const mask = `radial-gradient(circle ${r}px at ${cx}px ${cy}px, #000 ${Math.max(0, r - 18)}px, transparent ${r}px)`;
  return (
    <AbsoluteFill>
      <AbsoluteFill>{media(before)}</AbsoluteFill>
      <AbsoluteFill style={{WebkitMaskImage: mask, maskImage: mask}}>{media(after)}</AbsoluteFill>
      {/* thin ring so the eye tracks the spotlight */}
      <div style={{position: 'absolute', left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: '50%',
        border: '3px solid rgba(255,255,255,0.7)', opacity: interpolate(frame, [travelEnd, travelEnd + 10], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}} />
    </AbsoluteFill>
  );
};
