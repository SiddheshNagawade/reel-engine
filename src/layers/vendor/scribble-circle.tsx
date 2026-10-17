// Ported from remocn (github.com/Remocn/remocn), registry/remocn/scribble-circle. MIT License, Copyright (c) 2026 Remocn.
// Adapted for ReelEngine: drawn on his word (delay = frames from the item start), the box is any region of the frame
// (a number on a chart, a line on a screenshot, a thing in his footage).
// A loose hand-drawn loop (a bit more than one lap, slightly off-centre) circles the thing he is talking about.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {BrushGrain, type BrushPoint, brushFilterId, brushReach, brushRibbon, DEFAULT_STEP, hashRange, steppedRamp} from './remocn-brush';

const SAMPLES_PER_LAP = 48;
const NOISE = 0.035;
const CENTRE = 0.02;

export function scribbleCirclePoints(args: {width: number; height: number; laps?: number; seed?: string; points?: number}): BrushPoint[] {
  const laps = args.laps ?? 1.15;
  const seed = args.seed ?? 'scribble';
  const count = Math.max(2, Math.ceil(laps * (args.points ?? SAMPLES_PER_LAP)));
  const rx = args.width / 2, ry = args.height / 2;
  const cx = args.width / 2 + hashRange(`${seed}:cx`, -CENTRE, CENTRE) * args.width;
  const cy = args.height / 2 + hashRange(`${seed}:cy`, -CENTRE, CENTRE) * args.height;
  return Array.from({length: count}, (_, i) => {
    const angle = laps * Math.PI * 2 * (i / (count - 1)) - Math.PI * 0.6; // start top-left like a hand does
    const scale = 1 + hashRange(`${seed}:r${i}`, -NOISE, NOISE);
    return {x: cx + rx * scale * Math.cos(angle), y: cy + ry * scale * Math.sin(angle)};
  });
}

export type ScribbleCircleProps = {width: number; height: number; color?: string; strokeWidth?: number; pressure?: number; release?: number; grain?: number; delay?: number; durationSteps?: number; laps?: number; seed?: string; step?: number};

export const ScribbleCircle: React.FC<ScribbleCircleProps> = ({width, height, color = '#6f7f35', strokeWidth = 14, pressure = 0.2, release = 1, grain = 1, delay = 0, durationSteps = 10, laps = 1.15, seed = 'scribble', step = DEFAULT_STEP}) => {
  const frame = useCurrentFrame();
  const progress = steppedRamp(frame, delay, delay + durationSteps * step, {step});
  const reach = brushReach(strokeWidth, grain);
  const marginX = reach + (width / 2) * NOISE + width * CENTRE;
  const marginY = reach + (height / 2) * NOISE + height * CENTRE;
  const d = brushRibbon(scribbleCirclePoints({width, height, laps, seed}), {strokeWidth, pressure, release, progress});
  return (
    <div style={{position: 'relative', width, height, opacity: progress > 0 ? 1 : 0}}>
      <svg width={width + marginX * 2} height={height + marginY * 2} viewBox={`${-marginX} ${-marginY} ${width + marginX * 2} ${height + marginY * 2}`} style={{position: 'absolute', left: -marginX, top: -marginY, display: 'block', overflow: 'visible'}}>
        <BrushGrain seed={seed} strokeWidth={strokeWidth} grain={grain} />
        <path d={d} fill={color} opacity={0.85} filter={grain > 0 ? `url(#${brushFilterId(seed, strokeWidth, grain)})` : undefined} />
      </svg>
    </div>
  );
};
