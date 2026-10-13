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
        {m.visual && (m.clip ? <ClipMeme m={m} headTop={headTopAt(edit, m.f)} /> : m.sticker ? <Sticker m={m} headTop={headTopAt(edit, m.f)} /> : <Card m={m} accent={edit.theme?.accent ?? '#fff'} />)}
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

// ── Video memes (Library/clips), shown four ways (brain/memes.md). Each is a choice for the moment:
//   card  a framed clip SLAMS in (overshoot + small shake), tilted, beside his head, never over his face
//   half  the meme owns the top half; his footage glides to the bottom half (RoomFrame layout added by the planner)
//   full  hard cut to the meme full screen: 2-frame flash, slight punch-in; captions step aside
//   zoom  the meme appears as a small card, then the camera zooms INTO it until it fills the screen
// Exits are quick (≤ 6 frames): the story goes on.
export const ClipMeme: React.FC<{m: Meme; headTop: {top: number; x: number} | null}> = ({m, headTop}) => {
  const frame = useCurrentFrame();
  const {fps, width: W, height: H} = useVideoConfig();
  const n = m.frames;
  const out = interpolate(frame, [n - 6, n], [1, 0], clamp);
  const ar = m.w && m.h ? m.w / m.h : 1;
  const video = <OffthreadVideo src={staticFile(m.visual!)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />;

  if (m.placement === 'full') {
    const flash = interpolate(frame, [0, 1, 4], [0.9, 0.6, 0], clamp);
    const push = interpolate(frame, [0, n], [1.0, 1.08]);
    return (
      <AbsoluteFill style={{background: '#000'}}>
        <AbsoluteFill style={{transform: `scale(${push})`}}>{video}</AbsoluteFill>
        <AbsoluteFill style={{background: '#fff', opacity: flash}} />
      </AbsoluteFill>
    );
  }
  if (m.placement === 'zoom') {
    // card → full screen over ~0.35 s (ease in-out), hold, quick cut out
    const z = interpolate(frame, [4, 4 + Math.round(fps * 0.35)], [0, 1], {...clamp, easing: (t) => t * t * (3 - 2 * t)});
    const pop = spring({frame, fps, config: {damping: 12, stiffness: 200, mass: 0.6}});
    const cw = W * 0.46, ch = cw / ar;
    const w = cw + (W - cw) * z, h = ch + (H - ch) * z;
    const x = (W - w) / 2, y = H * 0.12 * (1 - z) + 0 * z;
    return (
      <AbsoluteFill style={{background: `rgba(0,0,0,${0.55 * z})`}}>
        <div style={{position: 'absolute', left: x, top: y, width: w, height: z > 0.98 ? H : h, borderRadius: 28 * (1 - z), overflow: 'hidden',
          border: `${8 * (1 - z)}px solid #fff`, boxShadow: '0 30px 70px rgba(0,0,0,0.5)', transform: `scale(${(0.7 + 0.3 * pop) * out + (1 - out) * 0.9})`, opacity: out}}>
          {video}
        </div>
      </AbsoluteFill>
    );
  }
  if (m.placement === 'half' && W > H) {
    // 16:9 (vlog): side by side, the meme slides into the right half
    const inn = interpolate(frame, [0, 8], [0, 1], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
    const x = W * 0.5 + W * 0.5 * (1 - inn) + W * 0.5 * (1 - out);
    return (
      <AbsoluteFill>
        <div style={{position: 'absolute', left: x, top: 0, width: W * 0.5, height: H, overflow: 'hidden', borderLeft: '6px solid #fff', boxShadow: '-20px 0 50px rgba(0,0,0,0.55)'}}>
          {video}
        </div>
      </AbsoluteFill>
    );
  }
  if (m.placement === 'half') {
    const inn = interpolate(frame, [0, 8], [0, 1], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
    const y = -H * 0.5 * (1 - inn) - H * 0.5 * (1 - out);
    return (
      <AbsoluteFill>
        <div style={{position: 'absolute', left: 0, top: y, width: W, height: H * 0.5, overflow: 'hidden', borderBottom: '6px solid #fff', boxShadow: '0 20px 50px rgba(0,0,0,0.55)'}}>
          {video}
        </div>
      </AbsoluteFill>
    );
  }
  // card (default): slam
  const slam = spring({frame, fps, config: {damping: 9, stiffness: 320, mass: 0.7}});
  const shake = frame < 9 ? Math.sin(frame * 2.6) * (9 - frame) * 1.6 : 0;
  const cw = Math.min(W * 0.6, (H * 0.3) * ar), ch = cw / ar;
  // above his head when there's room, else beside it on the emptier side
  const room = headTop ? headTop.top * H - 40 : H * 0.3;
  const side = m.side ?? (headTop && headTop.x > 0.5 ? 'left' : 'right');
  const top = room >= ch + 90 ? Math.max(H * 0.07, room - ch - 60) : H * 0.1; // clear of his hair, not just his face
  const left = room >= ch + 90 ? (W - cw) / 2 : side === 'left' ? W * 0.05 : W * 0.95 - cw;
  const tilt = (m.tilt ?? 0) * 0.6 + (side === 'left' ? -3 : 3);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: left + shake, top, width: cw, height: ch, borderRadius: 26, overflow: 'hidden', border: '9px solid #fff',
        boxShadow: '0 28px 60px rgba(0,0,0,0.55)', transform: `scale(${(1.35 - 0.35 * slam) * (0.6 + 0.4 * out)}) rotate(${tilt}deg)`, opacity: Math.min(1, slam * 3) * out}}>
        {video}
      </div>
    </AbsoluteFill>
  );
};
