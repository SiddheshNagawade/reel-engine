import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate} from 'remotion';
import type {Edit, Theme} from '../types';
import {fonts} from './fonts';
import {extrude} from './Captions';
import {style} from '../style';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Big keyword font per caption style, so the hook matches the reel's look.
const KEYWORD_FONT: Record<string, {family: string; size: number; upper: boolean}> = {
  'bold-pop': {family: fonts.montserrat, size: 170, upper: true},
  editorial: {family: fonts.playfairItalic, size: 190, upper: false},
  'script-accent': {family: fonts.yellowtail, size: 220, upper: false},
  'condensed-stack': {family: fonts.anton, size: 250, upper: true},
  'highlight-box': {family: fonts.dmSerif, size: 230, upper: false},
  bubble: {family: fonts.chewy, size: 200, upper: false},
};

function splitHook(text: string) {
  const ws = text.replace(/…$/, '').split(/\s+/).filter(Boolean);
  let k = ws.findIndex((w) => /[\d₹%]/.test(w));
  if (k < 0) k = ws.reduce((best, w, i) => (w.length > ws[best].length ? i : best), 0);
  return {before: ws.slice(0, k).join(' '), key: ws[k]?.replace(/[.,!?]$/, '') ?? '', after: ws.slice(k + 1).join(' ')};
}

// Pinned open-loop headline ("my cat died" technique): sits at the top until its payoff.
export const Banner: React.FC<{edit: Edit}> = ({edit}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const b = edit.banner;
  if (!b || frame < b.f0 || frame >= b.f1) return null;
  const enter = spring({frame: frame - b.f0, fps, config: {damping: 14, stiffness: 160}});
  const exit = interpolate(frame, [b.f1 - 8, b.f1], [1, 0], clamp);
  return (
    <AbsoluteFill style={{alignItems: 'center'}}>
      <div
        style={{
          position: 'absolute',
          top: '7%',
          maxWidth: '86%',
          padding: '16px 28px',
          borderRadius: 18,
          background: 'rgba(0,0,0,0.55)',
          border: `2px solid ${edit.theme?.accent ?? '#fff'}`,
          color: '#fff',
          fontFamily: fonts.inter,
          fontWeight: 800,
          fontSize: 52,
          textAlign: 'center',
          lineHeight: 1.15,
          opacity: Math.min(enter, exit),
          transform: `translateY(${(1 - enter) * -40}px)`,
        }}
      >
        {b.text}
      </div>
    </AbsoluteFill>
  );
};

export const Hook: React.FC<{edit: Edit; behind?: boolean}> = ({edit, behind}) => {
  const {fps} = useVideoConfig();
  if (!style.hook.enabled || !edit.hookText || edit.banner) return null; // a pinned banner replaces the hook card
  const frames = Math.round(style.hook.seconds * fps);
  return (
    <Sequence durationInFrames={frames} layout="none">
      <HookTitle text={edit.hookText} frames={frames} theme={edit.theme} behind={behind} />
    </Sequence>
  );
};

const HookTitle: React.FC<{text: string; frames: number; theme: Theme; behind?: boolean}> = ({text, frames, theme, behind}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {before, key, after} = splitHook(text);
  const kf = KEYWORD_FONT[theme?.captionStyle] ?? KEYWORD_FONT['bold-pop'];
  const exit = interpolate(frame, [frames - 8, frames], [1, 0], clamp);
  // Behind the head the keyword goes huge, so the head overlaps it (Magnetic-Mask look).
  const fit = behind ? Math.min(420, (1000 / Math.max(1, key.length)) * 2.1) : Math.min(kf.size, (980 / Math.max(1, key.length)) * 1.7);
  const small = (delay: number): React.CSSProperties => {
    const t = spring({frame: frame - delay, fps, config: {damping: 14, stiffness: 180}});
    return {
      fontFamily: fonts.inter,
      fontWeight: 800,
      fontSize: 54,
      color: '#fff',
      textShadow: '0 6px 24px rgba(0,0,0,0.6)',
      opacity: t,
      transform: `translateY(${(1 - t) * 30}px) rotateX(${(1 - t) * 60}deg)`,
      textAlign: 'center',
      textTransform: kf.upper ? 'uppercase' : 'none',
    };
  };
  return (
    <AbsoluteFill style={{alignItems: 'center', perspective: 1100, opacity: exit}}>
      <div style={{position: 'absolute', top: behind ? '16%' : '14%', width: '90%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        {before && !behind && <div style={small(0)}>{before}</div>}
        <div style={{display: 'flex', justifyContent: 'center', transformStyle: 'preserve-3d', margin: '-6px 0'}}>
          {[...(kf.upper ? key.toUpperCase() : key)].map((ch, i) => {
            const t = spring({frame: frame - 4 - i * 2, fps, config: {damping: 12, stiffness: 170, mass: 0.7}});
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  fontFamily: kf.family,
                  fontSize: fit,
                  lineHeight: 1.05,
                  color: theme.accent,
                  textShadow: extrude('#00000088', 9),
                  opacity: interpolate(t, [0, 0.3], [0, 1], clamp),
                  transform: `rotateY(${(1 - t) * 95}deg) translateZ(${(1 - t) * -200}px)`,
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
        {after && !behind && <div style={small(10)}>{after}</div>}
      </div>
    </AbsoluteFill>
  );
};

// For the behind-the-head hook: the small words stay readable on top ("Raat ke" above, "ka idea" below the face).
export const HookLines: React.FC<{edit: Edit}> = ({edit}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (!edit.hookBehind || !edit.hookText) return null;
  const frames = Math.round(style.hook.seconds * fps);
  if (frame >= frames) return null;
  const {before, after} = splitHook(edit.hookText);
  const kf = KEYWORD_FONT[edit.theme?.captionStyle] ?? KEYWORD_FONT['bold-pop'];
  const exit = interpolate(frame, [frames - 8, frames], [1, 0], clamp);
  const line = (delay: number, top: string, text: string): React.ReactNode => {
    const t = spring({frame: frame - delay, fps, config: {damping: 14, stiffness: 180}});
    return (
      <div style={{position: 'absolute', top, width: '100%', textAlign: 'center', fontFamily: fonts.inter, fontWeight: 800, fontSize: 58, color: '#fff',
        textShadow: '0 6px 24px rgba(0,0,0,0.6)', opacity: t * exit, transform: `translateY(${(1 - t) * 24}px)`, textTransform: kf.upper ? 'uppercase' : 'none'}}>
        {text}
      </div>
    );
  };
  return (
    <AbsoluteFill>
      {before && line(0, '8%', before)}
      {after && line(12, '64%', after)}
    </AbsoluteFill>
  );
};

export const Popups: React.FC<{edit: Edit}> = ({edit}) => (
  <>
    {edit.popups.map((p, i) => (
      <Sequence key={i} from={p.f} durationInFrames={p.frames} layout="none">
        <PopupText text={p.text} frames={p.frames} tilt={i % 2 ? 6 : -6} theme={edit.theme} />
      </Sequence>
    ))}
  </>
);

const PopupText: React.FC<{text: string; frames: number; tilt: number; theme: Theme}> = ({text, frames, tilt, theme}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 9, stiffness: 220, mass: 0.7}});
  const exit = interpolate(frame, [frames - 7, frames], [1, 0], clamp);
  const sway = Math.sin(frame / 9) * 6; // gentle 3D float while on screen
  const kf = KEYWORD_FONT[theme?.captionStyle] ?? KEYWORD_FONT['bold-pop'];
  return (
    <AbsoluteFill style={{alignItems: 'center', perspective: 900}}>
      <div
        style={{
          position: 'absolute',
          top: '28%',
          fontFamily: kf.upper ? kf.family : fonts.montserrat,
          fontWeight: 900,
          fontSize: Math.min(style.popup.size, 1500 / Math.max(1, text.length)),
          color: theme?.accent ?? style.popup.color,
          textTransform: 'uppercase',
          textShadow: extrude('#000000cc', 10),
          transform: `translateZ(${(1 - enter) * -500}px) rotateX(${(1 - enter) * 70}deg) rotateY(${tilt * enter + sway}deg) scale(${0.7 + 0.3 * exit})`,
          opacity: Math.min(exit, interpolate(enter, [0, 0.25], [0, 1], clamp)),
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
