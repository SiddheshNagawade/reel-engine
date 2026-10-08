import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate} from 'remotion';
import type {CSSProperties} from 'react';
import type {CapWord, Edit, Theme} from '../types';
import {fonts} from './fonts';
import {style} from '../style';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const isLight = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
};

// Stacked extrusion: gives flat text real 3D depth.
export const extrude = (color: string, depth = 8) =>
  Array.from({length: depth}, (_, i) => `${i + 1}px ${i + 1}px 0 ${color}`).join(', ') + ', 0 20px 40px rgba(0,0,0,0.45)';

export const Captions: React.FC<{edit: Edit}> = ({edit}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (!style.captions.enabled) return null;
  // The big hook owns the screen at the start.
  if (style.hook.enabled && edit.hookText && frame < style.hook.seconds * fps) return null;

  const g = edit.captions.find((x) => frame >= x.f0 && frame < x.f1);
  if (!g) return null;
  let current = -1;
  g.words.forEach((w, i) => frame >= w.f0 && (current = i));
  const enter = spring({frame: frame - g.f0, fps, config: {damping: 13, stiffness: 220, mass: 0.6}});
  const exit = interpolate(frame, [g.f1 - 4, g.f1], [1, 0], clamp);
  const props = {words: g.words, current, frame, fps, theme: edit.theme};

  const S = {
    'bold-pop': BoldPop,
    editorial: Editorial,
    'script-accent': ScriptAccent,
    'condensed-stack': CondensedStack,
    'highlight-box': HighlightBox,
    bubble: Bubble,
  }[edit.theme?.captionStyle ?? 'bold-pop'] ?? BoldPop;

  return (
    <AbsoluteFill style={{perspective: 1000}}>
      <div
        style={{
          position: 'absolute',
          top: `${style.captions.top * 100}%`,
          left: '6%',
          width: '88%',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'baseline',
          transformStyle: 'preserve-3d',
          transform: `translateY(-50%) rotateX(${(1 - enter) * 35}deg)`,
          opacity: Math.min(1, enter * 1.8) * exit,
        }}
      >
        <S {...props} />
      </div>
    </AbsoluteFill>
  );
};

type P = {words: CapWord[]; current: number; frame: number; fps: number; theme: Theme};

// Per-word 3D reveal as it's spoken.
const reveal = (frame: number, f0: number, fps: number, axis: 'X' | 'Y' = 'X'): CSSProperties => {
  const t = spring({frame: frame - f0 + 1, fps, config: {damping: 14, stiffness: 200, mass: 0.6}});
  return {
    display: 'inline-block',
    opacity: interpolate(t, [0, 0.4], [0, 1], clamp),
    filter: `blur(${(1 - t) * 8}px)`,
    transform: `translateY(${(1 - t) * 28}px) rotate${axis}(${(1 - t) * -75}deg)`,
    transformOrigin: '50% 100%',
  };
};

const lineBreak = <span style={{flexBasis: '100%', height: 0}} />;

const BoldPop: React.FC<P> = ({words, current, frame, fps, theme}) => (
  <>
    {words.map((w, i) => {
      const pop = spring({frame: frame - w.f0, fps, config: {damping: 10, stiffness: 320, mass: 0.5}});
      const isCur = i === current;
      const color = w.emph && frame >= w.f0 ? theme.accent2 : isCur ? theme.accent : '#fff';
      return (
        <span
          key={i}
          style={{
            fontFamily: fonts.montserrat,
            fontWeight: 900,
            fontSize: style.captions.size * (w.emph ? 1.25 : 1),
            lineHeight: 1.15,
            margin: `0 ${style.captions.size * 0.2}px`,
            color,
            textTransform: 'uppercase',
            WebkitTextStroke: `${style.captions.strokeWidth}px #000`,
            paintOrder: 'stroke fill',
            textShadow: w.emph ? extrude('#000', 7) : '0 10px 30px rgba(0,0,0,0.45)',
            display: 'inline-block',
            transform: `scale(${isCur ? 1 + 0.1 * pop : 1}) rotateY(${isCur ? (1 - pop) * 30 : 0}deg)`,
          }}
        >
          {w.w}
        </span>
      );
    })}
  </>
);

const Editorial: React.FC<P> = ({words, frame, fps, theme}) => (
  <>
    {words.map((w, i) => (
      <span
        key={i}
        style={{
          ...reveal(frame, w.f0, fps),
          fontFamily: w.emph ? fonts.playfairItalic : fonts.inter,
          fontWeight: w.emph ? 700 : 600,
          fontSize: w.emph ? 124 : 74,
          letterSpacing: w.emph ? 0 : -1,
          color: w.emph ? theme.accent : '#fff',
          margin: '0 12px',
          lineHeight: 1.1,
          textShadow: '0 6px 24px rgba(0,0,0,0.55)',
        }}
      >
        {w.w.toLowerCase()}
      </span>
    ))}
  </>
);

const ScriptAccent: React.FC<P> = ({words, frame, fps, theme}) => (
  <>
    {words.map((w, i) =>
      w.emph ? (
        <span key={i} style={{display: 'contents'}}>
          {lineBreak}
          <span
            style={{
              ...reveal(frame, w.f0, fps, 'Y'),
              fontFamily: fonts.yellowtail,
              fontSize: 180,
              color: theme.accent,
              lineHeight: 1,
              margin: '-10px 0 4px',
              textShadow: `0 0 24px ${theme.accent}99, 0 0 60px ${theme.accent}55, ${extrude('#00000088', 5)}`,
              rotate: '-5deg',
            }}
          >
            {w.w}
          </span>
          {lineBreak}
        </span>
      ) : (
        <span
          key={i}
          style={{
            ...reveal(frame, w.f0, fps),
            fontFamily: fonts.poppins,
            fontWeight: 600,
            fontSize: 74,
            color: '#fff',
            margin: '0 10px',
            textShadow: '0 6px 22px rgba(0,0,0,0.6)',
          }}
        >
          {w.w}
        </span>
      ),
    )}
  </>
);

const CondensedStack: React.FC<P> = ({words, current, frame, fps, theme}) => {
  const hasEmph = words.some((w) => w.emph);
  return (
    <>
      {words.map((w, i) => {
        if (w.emph) {
          const slam = spring({frame: frame - w.f0, fps, config: {damping: 11, stiffness: 260}});
          return (
            <span key={i} style={{display: 'contents'}}>
              {lineBreak}
              <span
                style={{
                  display: 'inline-block',
                  fontFamily: fonts.anton,
                  fontSize: 215,
                  lineHeight: 0.95,
                  textTransform: 'uppercase',
                  color: theme.accent,
                  opacity: frame >= w.f0 - 1 ? 1 : 0,
                  filter: `blur(${(1 - slam) * 10}px)`,
                  transform: `scale(${1.6 - 0.6 * slam}) rotateX(${(1 - slam) * 50}deg)`,
                  textShadow: extrude('#00000099', 6),
                }}
              >
                {w.w}
              </span>
              {lineBreak}
            </span>
          );
        }
        const isCur = !hasEmph && i === current;
        return (
          <span
            key={i}
            style={{
              ...reveal(frame, w.f0, fps),
              fontFamily: fonts.inter,
              fontWeight: 800,
              fontSize: hasEmph ? 64 : 84,
              color: isCur ? theme.accent : '#fff',
              margin: '0 9px',
              textShadow: '0 6px 22px rgba(0,0,0,0.6)',
            }}
          >
            {w.w}
          </span>
        );
      })}
    </>
  );
};

const HighlightBox: React.FC<P> = ({words, current, frame, fps, theme}) => {
  const ink = isLight(theme.accent) ? '#111' : '#fff';
  return (
    <>
      {words.map((w, i) => {
        const isCur = i === current;
        const box = spring({frame: frame - w.f0, fps, config: {damping: 15, stiffness: 300}});
        return (
          <span key={i} style={{position: 'relative', display: 'inline-block', margin: '4px 6px'}}>
            {isCur && (
              <span
                style={{
                  position: 'absolute',
                  inset: '-2px -12px',
                  background: theme.accent,
                  borderRadius: 14,
                  transform: `scaleX(${box}) rotate(-1.5deg)`,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                }}
              />
            )}
            <span
              style={{
                position: 'relative',
                fontFamily: fonts.inter,
                fontWeight: 800,
                fontSize: 70,
                color: isCur ? ink : '#fff',
                textShadow: isCur ? 'none' : '0 4px 18px rgba(0,0,0,0.7)',
              }}
            >
              {w.w}
            </span>
          </span>
        );
      })}
    </>
  );
};

const Bubble: React.FC<P> = ({words, frame, fps, theme}) => {
  const letters = words.flatMap((w, wi) => [...w.w].map((ch, ci) => ({ch, f0: w.f0 + ci, wi, emph: w.emph})).concat(wi < words.length - 1 ? [{ch: ' ', f0: w.f0, wi, emph: false}] : []));
  const n = letters.length;
  return (
    <div style={{display: 'flex', justifyContent: 'center', flexWrap: 'wrap', width: '100%'}}>
      {letters.map((l, i) => {
        const t = spring({frame: frame - l.f0, fps, config: {damping: 8, stiffness: 260, mass: 0.6}});
        const arc = ((i - (n - 1) / 2) / Math.max(1, n)) * 22; // letters fan out along an arc
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              whiteSpace: 'pre',
              fontFamily: fonts.chewy,
              fontSize: l.emph ? 140 : 116,
              color: l.emph ? theme.accent2 : theme.accent,
              WebkitTextStroke: '14px #fff',
              paintOrder: 'stroke fill',
              textShadow: '0 12px 0 rgba(0,0,0,0.18), 0 18px 40px rgba(0,0,0,0.35)',
              opacity: frame >= l.f0 ? 1 : 0,
              transform: `translateY(${Math.abs(arc) * 2.4 + (1 - t) * 40}px) rotate(${arc + (1 - t) * 20}deg) scale(${t})`,
            }}
          >
            {l.ch}
          </span>
        );
      })}
    </div>
  );
};

