// Ported from remocn (github.com/Remocn/remocn), registry/remocn/marker-highlight. MIT License, Copyright (c) 2026 Remocn.
// Adapted for ReelEngine: no white page behind it (it sits on our frame/card), the sweep starts on his word (markAt,
// frames from the item start) instead of a fixed 15 frames, our fonts, and the line can wrap.
// A highlighter pen sweeps left → right behind one phrase of a sentence; the phrase's ink can change colour as it lands.
import React from 'react';
import {interpolate, interpolateColors, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export type MarkerHighlightProps = {
  before?: string; highlight: string; after?: string;
  markerColor?: string; baseColor?: string; highlightedTextColor?: string;
  fontSize?: number; fontWeight?: number; fontFamily?: string; markAt?: number; speed?: number;
};

export const MarkerHighlight: React.FC<MarkerHighlightProps> = ({before = '', highlight, after = '', markerColor = '#facc15', baseColor = '#171717', highlightedTextColor = '#171717', fontSize = 72, fontWeight = 600, fontFamily, markAt = 15, speed = 1}) => {
  const frame = useCurrentFrame() * speed;
  const {fps} = useVideoConfig();
  const markerScale = spring({frame: frame - markAt, fps, config: {damping: 14}});
  const textColor = interpolateColors(interpolate(markerScale, [0.5, 0.8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}), [0, 1], [baseColor, highlightedTextColor]);
  return (
    <span style={{fontSize, fontWeight, color: baseColor, letterSpacing: '-0.03em', lineHeight: 1.15, fontFamily}}>
      {before}
      <span style={{position: 'relative', display: 'inline-block'}}>
        <span aria-hidden style={{position: 'absolute', inset: '0.04em -0.1em', background: markerColor, transformOrigin: 'left center', scale: `${markerScale} 1`, zIndex: 0}} />
        <span style={{position: 'relative', zIndex: 1, color: textColor}}>{highlight}</span>
      </span>
      {after}
    </span>
  );
};
