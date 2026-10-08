import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate} from 'remotion';
import type {Edit, Meme} from '../types';
import {faceAt} from './VideoTrack';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const MemeLayer: React.FC<{edit: Edit}> = ({edit}) => (
  <>
    {(edit.memes ?? []).map((m, i) => (
      <Sequence key={i} from={m.f} durationInFrames={m.frames} layout="none">
        {m.sound && (
          <Audio
            src={staticFile(m.sound)}
            volume={(f) => {
              // the speaker's voice always wins: duck the meme while he is talking, fade out trimmed sounds
              const talking = edit.speech.some(([a, b]) => m.f + f >= a && m.f + f <= b);
              const fade = m.fadeOut ? interpolate(f, [m.frames - m.fadeOut, m.frames], [1, 0], clamp) : 1;
              return m.volume * (talking ? 0.3 : 1) * fade;
            }}
          />
        )}
        {m.visual && (m.sticker ? <Sticker m={m} headTop={headTopAt(edit, m.f)} /> : <Card m={m} accent={edit.theme?.accent ?? '#fff'} />)}
      </Sequence>
    ))}
  </>
);

// Top of the speaker's head (fraction of frame height) around a frame, from face tracking.
function headTopAt(edit: Edit, f: number) {
  const pts = (edit.faces ?? []).filter(([pf]) => Math.abs(pf - f) < 30);
  if (!pts.length) return null;
  return {
    top: Math.min(...pts.map(([, , y, h]) => y - (h ?? 0.3) * 0.85)), // face box centre minus ~hair height
    x: pts.reduce((a, [, x]) => a + x, 0) / pts.length,
  };
}

const Media: React.FC<{m: Meme; style: React.CSSProperties}> = ({m, style}) =>
  m.isVideo ? (
    <OffthreadVideo src={staticFile(m.visual!)} muted transparent={m.sticker} style={style} />
  ) : (
    <Img src={staticFile(m.visual!)} style={style} />
  );

// Transparent cut-out sticker with several entrance styles.
const Sticker: React.FC<{m: Meme; headTop: {top: number; x: number} | null}> = ({m, headTop}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const inn = spring({frame, fps, config: {damping: 11, stiffness: 180, mass: 0.7}});
  const out = spring({frame: frame - (m.frames - 8), fps, config: {damping: 16, stiffness: 240}});
  const t = Math.max(0, inn - out); // 0 hidden → 1 fully in
  const wobble = Math.sin(frame / 7) * 3;
  // Sticker height on a 1920-tall frame (varies a little per appearance). A sticker is ALWAYS fully inside the frame:
  // a corner sticker shrinks to fit above the head; if there isn't room, it moves to the side away from the face.
  let H = 480 * (m.scale ?? 1);
  let placement = m.placement;
  const above = headTop ? headTop.top * height - 40 : Infinity; // free space above the head
  if (placement === 'corner-left' || placement === 'corner-right' || placement === 'drop-top') {
    if (above >= 280) H = Math.min(H, above - 20);
    else placement = headTop && headTop.x < 0.5 ? 'peek-right' : 'peek-left';
  }
  const lift = (m.lift ?? 0) * 12;
  const shadow = 'drop-shadow(0 18px 30px rgba(0,0,0,0.45))';
  // never sit on the head: if the head is high in frame, go higher (even peeking down from the top edge)
  const cornerTop = Math.max(24, Math.min(height * 0.06 + lift, above - H));
  let box: React.CSSProperties = {};

  switch (placement) {
    case 'peek-left': // slides in from the left edge, half hidden, tilted toward the speaker
      box = {left: -H * 0.06 + (1 - t) * -H, top: Math.min(height - H - 40, height * 0.24 + lift), transform: `rotate(${(12 + (m.tilt ?? 0)) * t + wobble * 0.5}deg)`, transformOrigin: '0% 50%'};
      break;
    case 'peek-right':
      box = {right: -H * 0.06 + (1 - t) * -H, top: Math.min(height - H - 40, height * 0.24 + lift), transform: `rotate(${(-12 - (m.tilt ?? 0)) * t - wobble * 0.5}deg)`, transformOrigin: '100% 50%'};
      break;
    case 'corner-left': // pops up in the top-left corner with a bounce, always above the head
      box = {left: 40, top: cornerTop, transform: `scale(${t}) rotate(${-8 + wobble}deg)`, transformOrigin: '30% 100%'};
      break;
    case 'corner-right':
      box = {right: 40, top: cornerTop, transform: `scale(${t}) rotate(${8 - wobble}deg)`, transformOrigin: '70% 100%'};
      break;
    case 'drop-top': // dangles down from the top edge, beside the head (not over the face)
    default:
      box = {right: width * 0.06, top: -H + t * (H + Math.max(24, Math.min(height * 0.02, above - H))), transform: `rotate(${wobble * 1.5}deg)`, transformOrigin: '50% 0%'};
  }

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', height: H, opacity: interpolate(t, [0, 0.15], [0, 1], clamp), filter: shadow, ...box}}>
        <Media m={m} style={{height: '100%', width: 'auto'}} />
      </div>
    </AbsoluteFill>
  );
};

// Framed card (for non-transparent meme clips) that swings in in 3D.
const Card: React.FC<{m: Meme; accent: string}> = ({m, accent}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const dir = m.placement === 'corner-right' || m.placement === 'peek-right' ? 1 : -1;
  const enter = spring({frame, fps, config: {damping: 12, stiffness: 170, mass: 0.8}});
  const exit = spring({frame: frame - (m.frames - 9), fps, config: {damping: 14, stiffness: 220}});
  const t = enter - exit;
  const float = Math.sin(frame / 10) * 6;
  return (
    <AbsoluteFill style={{perspective: 1100}}>
      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: dir < 0 ? '10%' : '44%',
          width: 460,
          height: 460,
          borderRadius: 36,
          overflow: 'hidden',
          border: '8px solid #fff',
          boxShadow: `0 30px 70px rgba(0,0,0,0.5), 0 0 0 3px ${accent}`,
          opacity: interpolate(t, [0, 0.2], [0, 1], clamp),
          transform: `translateY(${float + (1 - t) * 80}px) rotateY(${(1 - t) * 70 * dir}deg) rotateZ(${dir * 4 * t}deg) scale(${0.6 + 0.4 * t})`,
        }}
      >
        <Media m={m} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
    </AbsoluteFill>
  );
};
