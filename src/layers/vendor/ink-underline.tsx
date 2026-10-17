// Ported from remocn (github.com/Remocn/remocn), registry/remocn/ink-underline. MIT License, Copyright (c) 2026 Remocn.
// Adapted for ReelEngine: draws on his word (delay = frames from the item start), sized to our frame.
// A hand-inked brush stroke under a word: heavy at the start, lifting off at the end, drawn in stop-motion steps.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {BrushGrain, type BrushPoint, brushFilterId, brushReach, brushRibbon, sampleCubic, DEFAULT_STEP, hashRange, steppedRamp} from './remocn-brush';

const SAMPLES = 40;
export function inkUnderlineSpine(width: number, thickness: number, seed: string): BrushPoint[] {
  const wobble = hashRange(`${seed}:w`, -1.2, 1.2) * (thickness / 9); // remocn's wobble was for 9px; scale with the stroke
  const mid = thickness / 2 + 2;
  return sampleCubic({x: 2, y: mid}, {x: width * 0.3, y: mid + wobble}, {x: width * 0.7, y: mid - wobble}, {x: width - 2, y: mid + wobble * 0.6}, SAMPLES);
}

export type InkUnderlineProps = {width: number; color?: string; thickness?: number; pressure?: number; release?: number; grain?: number; delay?: number; durationSteps?: number; seed?: string; step?: number};

export const InkUnderline: React.FC<InkUnderlineProps> = ({width, color = '#6f7f35', thickness = 9, pressure = 1, release = 0.15, grain = 1, delay = 0, durationSteps = 5, seed = 'ink', step = DEFAULT_STEP}) => {
  const frame = useCurrentFrame();
  const progress = steppedRamp(frame, delay, delay + durationSteps * step, {step});
  const reach = brushReach(thickness, grain);
  const height = thickness + 4;
  const d = brushRibbon(inkUnderlineSpine(width, thickness, seed), {strokeWidth: thickness, pressure, release, progress});
  return (
    <div style={{width, height, position: 'relative', opacity: progress > 0 ? 1 : 0}}>
      <svg width={width + reach * 2} height={height + reach * 2} viewBox={`${-reach} ${-reach} ${width + reach * 2} ${height + reach * 2}`} style={{position: 'absolute', left: -reach, top: -reach, display: 'block', overflow: 'visible'}}>
        <BrushGrain seed={seed} strokeWidth={thickness} grain={grain} />
        <path d={d} fill={color} opacity={0.85} filter={grain > 0 ? `url(#${brushFilterId(seed, thickness, grain)})` : undefined} />
      </svg>
    </div>
  );
};
