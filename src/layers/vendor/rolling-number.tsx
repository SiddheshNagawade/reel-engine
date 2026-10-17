// Ported from remocn (github.com/Remocn/remocn), registry/remocn/rolling-number. MIT License, Copyright (c) 2026 Remocn.
// Adapted for ReelEngine: the roll lasts `rollFrames` (not the whole composition), starts at `delay` (his word),
// prefix/suffix (₹, %, "k") and our fonts; renders inline so layers/Vendor.tsx can place it.
// Odometer digits: every column spins to its digit, higher places rise in only once the number reaches them.
import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';

const {fontFamily: MONO_FAMILY} = loadMono('normal', {weights: ['800'], subsets: ['latin']});
const COUNT_EASING = Easing.out(Easing.poly(4));
const REVEAL_BAND = 0.4;
const REVEAL_EASING = Easing.inOut(Easing.sin);
const REVEAL_RISE_EM = 0.32;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

function placeTravel(start: number, end: number, place: number): number {
  const pow = 10 ** place;
  const up = end >= start;
  const diff = Math.abs(end - start);
  const startDigit = Math.floor(start / pow) % 10;
  const finalDigit = Math.floor(end / pow) % 10;
  const fullTurns = Math.floor(diff / (pow * 10));
  const stepDelta = up ? (finalDigit - startDigit + 10) % 10 : (startDigit - finalDigit + 10) % 10;
  const magnitude = fullTurns * 10 + stepDelta;
  return up ? magnitude : -magnitude;
}
function placeReveal(current: number, place: number): number {
  if (place === 0) return 1;
  const threshold = 10 ** place;
  return interpolate(current, [threshold * REVEAL_BAND, threshold], [0, 1], {...clamp, easing: REVEAL_EASING});
}
const wrap10 = (v: number) => ((v % 10) + 10) % 10;

const DigitColumn: React.FC<{value: number; fontSize: number; reveal: number}> = ({value, fontSize, reveal}) => {
  const cellHeight = fontSize * 1.1;
  return (
    <span style={{display: 'inline-block', overflow: 'hidden', height: cellHeight, width: '0.62em', verticalAlign: 'top', textAlign: 'center', opacity: reveal, translate: `0 ${(1 - reveal) * fontSize * REVEAL_RISE_EM}px`}}>
      <span style={{display: 'flex', flexDirection: 'column', translate: `0 ${-value * cellHeight}px`}}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, i) => <span key={i} style={{height: cellHeight, lineHeight: `${cellHeight}px`}}>{d}</span>)}
      </span>
    </span>
  );
};

export type RollingNumberProps = {from?: number; to?: number; fontSize?: number; color?: string; delay?: number; rollFrames?: number; prefix?: string; suffix?: string; fontFamily?: string; separator?: 'thin' | 'comma' | 'none'};

export const RollingNumber: React.FC<RollingNumberProps> = ({from = 0, to = 24813, fontSize = 120, color = '#171717', delay = 0, rollFrames = 45, prefix, suffix, fontFamily, separator = 'thin'}) => {
  const frame = useCurrentFrame();
  const start = Math.max(0, Math.round(from));
  const end = Math.max(0, Math.round(to));
  const e = interpolate(frame - delay, [0, Math.max(1, rollFrames)], [0, 1], {...clamp, easing: COUNT_EASING});
  const current = start + e * (end - start);
  const digits = String(Math.max(start, end));
  const cellHeight = fontSize * 1.1;
  const cells: React.ReactNode[] = [];
  for (let place = 0; place < digits.length; place++) {
    if (place > 0 && place % 3 === 0 && separator !== 'none') {
      cells.unshift(separator === 'comma'
        ? <span key={`s${place}`} style={{display: 'inline-block', width: '0.34em', height: cellHeight, opacity: placeReveal(current, place)}}>,</span>
        : <span key={`s${place}`} style={{display: 'inline-block', width: '0.34em', height: cellHeight}} />);
    }
    const pow = 10 ** place;
    const startDigit = Math.floor(start / pow) % 10;
    const pos = startDigit + e * placeTravel(start, end, place);
    cells.unshift(<DigitColumn key={`d${place}`} value={wrap10(pos)} fontSize={fontSize} reveal={placeReveal(current, place)} />);
  }
  return (
    <div style={{display: 'flex', alignItems: 'flex-start', fontSize, fontWeight: 800, color, fontFamily: fontFamily ?? MONO_FAMILY, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', lineHeight: 1}}>
      {prefix && <span style={{height: cellHeight, lineHeight: `${cellHeight}px`, marginRight: '0.05em'}}>{prefix}</span>}
      {cells}
      {suffix && <span style={{height: cellHeight, lineHeight: `${cellHeight}px`, marginLeft: '0.05em', fontSize: '0.7em'}}>{suffix}</span>}
    </div>
  );
};
