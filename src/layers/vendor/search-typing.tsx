// Ported from snapcn (github.com/snapcndev/snapcn), registry/snap-cn/search-typing. MIT License,
// Copyright (c) 2026 Sri Nath (snap-cn). Adapted for ReelEngine: kept the humanised typing schedule (word/punctuation
// pauses, seeded jitter), the soft caret blink and the camera (dolly in while typing, recede after); dropped the DOM
// measuring of letter widths (the field scrolls its own text like a real input instead), our tokens, his word = start.
// A search / AI prompt bar fills the frame and a query types itself in: "what I googled", "I asked ChatGPT…".
import React from 'react';
import {Easing, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Outfit';
import {snapTheme, mix} from './snapcn-theme';

const {fontFamily: OUTFIT} = loadFont('normal', {weights: ['300', '400'], subsets: ['latin']});
const R = {radius: 0.276, fontSize: 0.379, iconInset: 0.357, iconSize: 0.378, rightPad: 0.4, caretWidth: 0.024, caretHeight: 0.434};
const LAYOUT_UNIT = 240;
const PUNCTUATION = /[.,!?;:]/;
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const smoothstep = (t: number) => { const x = clamp01(t); return x * x * (3 - 2 * x); };
const c = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Frame (from typing start) at which each character lands: human rhythm, longer after spaces and punctuation.
export function buildTypingSchedule(text: string, o: {fps: number; charsPerSecond: number; humanize: number; wordPause: number; punctuationPause: number; seed: string}): number[] {
  const base = o.fps / Math.max(0.1, o.charsPerSecond);
  const jitter = clamp01(o.humanize);
  const schedule = [0];
  let acc = 0;
  for (let i = 0; i < text.length; i++) {
    const prev = i > 0 ? text[i - 1] : '';
    let interval = base;
    if (prev === ' ') interval *= o.wordPause;
    else if (prev !== '' && PUNCTUATION.test(prev)) interval *= o.punctuationPause;
    if (jitter > 0) interval *= 1 + (random(`${o.seed}-key-${i}`) * 2 - 1) * 0.35 * jitter;
    acc += Math.max(0.001, interval);
    schedule.push(acc);
  }
  return schedule;
}
export function typedCount(localFrame: number, schedule: number[]): number {
  if (localFrame <= 0 || schedule.length <= 1) return 0;
  let n = 0;
  while (n + 1 < schedule.length && schedule[n + 1] <= localFrame) n++;
  return n;
}
export function caretOpacity(frame: number, fps: number, blinksPerSecond: number, softness = 0.12): number {
  if (blinksPerSecond <= 0 || fps <= 0) return 1;
  const period = fps / blinksPerSecond;
  const t = (((frame % period) + period) % period) / period;
  const edge = Math.min(0.25, Math.max(0, softness));
  if (t < 0.5 - edge) return 1;
  if (t < 0.5) return 1 - smoothstep((t - (0.5 - edge)) / edge);
  if (t < 1 - edge) return 0;
  return smoothstep((t - (1 - edge)) / edge);
}
const SearchGlyph: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{display: 'block', flexShrink: 0, overflow: 'visible'}}>
    <circle cx="9" cy="9" r="7.98" stroke={color} strokeWidth={2.03} />
    <path d="M14.65 14.65 L22.98 22.98" stroke={color} strokeWidth={2.03} strokeLinecap="round" />
  </svg>
);
const SparkleGlyph: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{display: 'block', flexShrink: 0, overflow: 'visible'}}>
    <path d="M12 2.6 L13.9 9.1 L20.4 11 L13.9 12.9 L12 19.4 L10.1 12.9 L3.6 11 L10.1 9.1 Z" fill={color} />
    <path d="M18.9 16.4 L19.7 19.1 L22.4 19.9 L19.7 20.7 L18.9 23.4 L18.1 20.7 L15.4 19.9 L18.1 19.1 Z" fill={color} opacity={0.55} />
  </svg>
);

export type SearchTypingProps = {text: string; charsPerSecond?: number; humanize?: number; wordPause?: number; punctuationPause?: number; startDelay?: number; dollyFrames?: number;
  holdFrames?: number; recedeFrames?: number; dolly?: number; fieldWidth?: number; caret?: boolean; surface?: 'shadcn' | 'glass'; mode?: 'light' | 'dark'; icon?: 'search' | 'sparkle' | 'none'; fontFamily?: string; seed?: string; y?: number};

export const SearchTyping: React.FC<SearchTypingProps> = ({text, charsPerSecond = 14, humanize = 0.35, wordPause = 1.55, punctuationPause = 2.2, startDelay = 12, dollyFrames = 24, holdFrames = 27, recedeFrames = 0, dolly = 1.25,
  fieldWidth = 0.86, caret = true, surface = 'shadcn', mode = 'light', icon = 'search', fontFamily, seed = 'search-typing', y = 0.5}) => {
  const frame = useCurrentFrame();
  const {fps, width: W, height: Hc} = useVideoConfig();
  const t = snapTheme(mode);
  const H = LAYOUT_UNIT;
  const fontSize = R.fontSize * H, iconSize = R.iconSize * H;
  const schedule = buildTypingSchedule(text, {fps, charsPerSecond, humanize, wordPause, punctuationPause, seed});
  const typingEnd = startDelay + schedule[schedule.length - 1];
  const count = typedCount(frame - startDelay, schedule);
  // camera: rests a little back, dollies in as typing starts, optionally recedes after the hold
  const push = interpolate(frame, [startDelay, startDelay + dollyFrames], [0, 1], {...c, easing: Easing.inOut(Easing.sin)});
  const back = recedeFrames > 0 ? interpolate(frame, [typingEnd + holdFrames, typingEnd + holdFrames + recedeFrames], [0, 1], {...c, easing: Easing.inOut(Easing.cubic)}) : 0;
  const units = Math.max(4.2, 1.7 + text.length * 0.17); // the field grows with the query so it fits the frame
  const frontScale = (W * fieldWidth) / (H * units);
  const scale = (frontScale / dolly) * (1 + (dolly - 1) * push) * (1 - 0.25 * back);
  const glass = surface === 'glass';
  const border = Math.max(1, 0.009 * H);
  const field: React.CSSProperties = glass
    ? {background: 'linear-gradient(180deg, #C4C4C4 0%, #D6D6D6 15%, #E7E7E7 30%, #F3F3F3 40%, #FDFDFD 50%, #FDFDFD 100%)', boxShadow: `0 ${0.045 * H}px ${0.12 * H}px rgba(9, 9, 12, 0.45)`}
    : {background: t.card, border: `${border}px solid ${mix(t.border, t.foreground, 0.28)}`, boxShadow: `0 ${0.06 * H}px ${0.2 * H}px rgba(0,0,0,0.25)`};
  const ink = glass ? '#000000' : t.foreground;
  const iconColor = glass ? '#000000' : t.mutedForeground;
  const blink = frame < typingEnd && count > 0 ? 1 : caretOpacity(frame, fps, 1);
  return (
    <div style={{position: 'absolute', left: W / 2, top: Hc * y, transform: `translate(-50%, -50%) scale(${scale})`}}>
      <div style={{display: 'flex', alignItems: 'center', width: H * units, height: H, paddingLeft: R.iconInset * H, paddingRight: R.rightPad * H, gap: 0.25 * H, borderRadius: R.radius * H, boxSizing: 'border-box', ...field}}>
        {icon === 'search' && <SearchGlyph size={iconSize} color={iconColor} />}
        {icon === 'sparkle' && <SparkleGlyph size={iconSize} color={iconColor} />}
        {/* the text box keeps the caret in view: once the query is longer than the field it scrolls left */}
        <div style={{flex: 1, overflow: 'hidden', display: 'flex', justifyContent: 'flex-end', minWidth: 0}}>
          <div style={{display: 'flex', alignItems: 'center', whiteSpace: 'pre', marginRight: 'auto', maxWidth: 'none'}}>
            <span style={{fontSize, fontWeight: 300, fontFamily: fontFamily ?? OUTFIT, color: ink, lineHeight: 1.4}}>{text.slice(0, count)}</span>
            {caret && <span style={{width: Math.max(1, R.caretWidth * H), height: R.caretHeight * H, background: ink, opacity: blink, marginLeft: 0.01 * H, borderRadius: 2}} />}
          </div>
        </div>
      </div>
    </div>
  );
};
