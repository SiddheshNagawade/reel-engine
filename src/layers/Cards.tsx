import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate, Easing} from 'remotion';
import type {Edit, TextCard} from '../types';
import {fonts} from './fonts';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const easeOut = Easing.bezier(0.16, 1, 0.3, 1); // smooth "expensive" ease: fast start, long soft landing

// Minimal "expensive" text cards: less, but better. Clean type on a calm background, one intentional motion.
//   typewriter: letters appear one by one (pairs with a soft tick sound)
//   wave: letters rise in with a slight tilt + blur, staggered, then settle
//   slam: one big bold word hits the screen
// bg: white | black | accent | blur (frosted footage: keeps the speaker present in talking-head reels)
export const Cards: React.FC<{edit: Edit}> = ({edit}) => (
  <>
    {(edit.cards ?? []).map((c, i) => (
      <Sequence key={i} from={c.f} durationInFrames={c.frames} layout="none">
        <Card c={c} accent={edit.theme?.accent ?? '#ffd400'} />
      </Sequence>
    ))}
  </>
);

const BG: Record<string, string> = {white: '#f7f7f5', black: '#0b0b0c'};

const Card: React.FC<{c: TextCard; accent: string}> = ({c, accent}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const bgKind = c.bg ?? 'black';
  const ink = bgKind === 'white' ? '#111' : '#fff';
  const exit = interpolate(frame, [c.frames - 6, c.frames], [1, 0], clamp);
  const inn = interpolate(frame, [0, 5], [0, 1], clamp);
  const background =
    bgKind === 'accent' ? accent : bgKind === 'blur' ? 'rgba(10,10,12,0.45)' : BG[bgKind] ?? BG.black;
  const size = c.size ?? (c.mode === 'slam' ? Math.min(260, (width * 1.6) / Math.max(4, c.text.length)) : Math.min(84, (width * 1.5) / Math.max(10, c.text.length)));
  const letters = [...c.text];
  const accentWord = c.accentWord?.toLowerCase();

  let content: React.ReactNode;
  if (c.mode === 'typewriter') {
    const shown = Math.floor(interpolate(frame, [2, 2 + letters.length * (c.speed ?? 1.2)], [0, letters.length], clamp));
    content = (
      <span>
        {c.text.slice(0, shown)}
        <span style={{opacity: frame % 16 < 9 ? 1 : 0, marginLeft: 4, fontWeight: 400}}>|</span>
      </span>
    );
  } else if (c.mode === 'slam') {
    const t = spring({frame, fps, config: {damping: 12, stiffness: 260, mass: 0.6}});
    content = (
      <span style={{display: 'inline-block', fontFamily: fonts.anton, textTransform: 'uppercase', letterSpacing: 1, color: c.color ?? (bgKind === 'white' ? '#111' : accent),
        transform: `scale(${1.5 - 0.5 * t})`, filter: `blur(${(1 - t) * 10}px)`, opacity: Math.min(1, t * 2)}}>
        {c.text}
      </span>
    );
  } else {
    // wave: per-letter rise + tilt + blur, staggered (the classic smooth kinetic subtitle)
    let wordIdx = 0;
    content = letters.map((ch, i) => {
      if (ch === ' ') wordIdx++;
      const isAccent = accentWord && c.text.toLowerCase().split(' ')[wordIdx] === accentWord;
      const d = frame - i * (c.speed ?? 0.9);
      const t = interpolate(d, [0, 9], [0, 1], {...clamp, easing: easeOut});
      return (
        <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', opacity: t, filter: `blur(${(1 - t) * 6}px)`,
          transform: `translateY(${(1 - t) * 26}px) rotate(${(1 - t) * 18}deg) scale(${0.7 + 0.3 * t})`,
          fontFamily: isAccent ? fonts.playfairItalic : undefined, color: isAccent ? accent : undefined}}>
          {ch}
        </span>
      );
    });
  }

  return (
    <AbsoluteFill>
      {/* frosted background animates its blur (backdrop blur doesn't render under a fading parent) */}
      {bgKind === 'blur' ? (
        <AbsoluteFill style={{background: `rgba(10,10,12,${0.45 * Math.min(inn, exit)})`, backdropFilter: `blur(${28 * Math.min(inn, exit)}px) saturate(1.1)`}} />
      ) : (
        <AbsoluteFill style={{background, opacity: Math.min(inn, exit)}} />
      )}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', padding: '0 8%', opacity: exit}}>
        <div style={{fontFamily: fonts.inter, fontWeight: 800, fontSize: size, color: ink, textAlign: 'center', lineHeight: 1.15, letterSpacing: -0.5,
          textShadow: bgKind === 'black' || bgKind === 'blur' ? `0 0 ${c.glow ? 30 : 0}px ${accent}66` : 'none'}}>
          {content}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
