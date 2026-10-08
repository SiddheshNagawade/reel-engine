import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring, Easing} from 'remotion';
import type {Edit} from '../types';
import {style} from '../style';
import {transitionMotion} from './Transitions';
import {footageLook} from './Effects';
import {AttachLayer} from '../motion/Attach';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Lagged, smoothed face position: average of samples in the last `win`*2 frames (camera trails the head slightly).
export function faceAt(faces: [number, number, number, number?][] | undefined, frame: number, win: number): [number, number] | null {
  if (!faces?.length) return null;
  let sx = 0, sy = 0, n = 0;
  for (const [f, x, y] of faces) {
    if (f < frame - win * 2 || f > frame) continue;
    const w = 1 - (frame - f) / (win * 2 + 1); // recent samples count more
    sx += x * w; sy += y * w; n += w;
  }
  if (n) return [sx / n, sy / n];
  let best = faces[0];
  for (const p of faces) if (Math.abs(p[0] - frame) < Math.abs(best[0] - frame)) best = p;
  return [best[1], best[2]];
}

export const VideoTrack: React.FC<{edit: Edit; behind?: React.ReactNode}> = ({edit, behind}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const m = style.motion;
  const f = style.film;

  if (!edit.video || edit.segments.length === 0) {
    return <AbsoluteFill style={{background: 'linear-gradient(160deg,#1b1b2f,#0b0b0f)'}} />;
  }

  const idx = Math.max(0, edit.segments.findIndex((s) => frame >= s.outFrame && frame < s.outFrame + s.frames));
  const seg = edit.segments[idx];
  const local = frame - seg.outFrame;

  // Slow push through each shot keeps the frame alive.
  const push = interpolate(local, [0, seg.frames], [0, m.pushPerSegment], clamp);

  // Snap: each jump cut lands slightly over-zoomed and settles, with a short blur.
  const prevZoom = idx > 0 ? edit.segments[idx - 1].zoom : seg.zoom;
  const snapActive = idx > 0 && prevZoom !== seg.zoom;
  const snapT = interpolate(local, [0, 6], [1, 0], {...clamp, easing: Easing.out(Easing.cubic)});
  const snap = snapActive ? snapT * m.cutSnap : 0;
  const snapBlur = snapActive ? snapT * 4 : 0;

  // Emphasis punch-in: springs in on the word, eases back out.
  let punch = 0;
  for (const ef of edit.emphasisFrames) {
    const d = frame - ef;
    if (d < -2 || d > 40) continue;
    const inP = spring({frame: d + 2, fps, config: {damping: 14, stiffness: 200}});
    const outP = interpolate(d, [22, 40], [1, 0], clamp);
    punch = Math.max(punch, inP * outP * m.emphasisPunch);
  }

  // Camera moves at new sections: a slow push-in that holds then relaxes, or a gentle pull-out.
  let move = 0;
  for (const mv of edit.moves ?? []) {
    const d = frame - mv.f;
    if (d < 0 || d > 200) continue;
    if (mv.type === 'push') move += interpolate(d, [0, 28, 140, 200], [0, 0.08, 0.08, 0], {...clamp, easing: Easing.inOut(Easing.cubic)});
    else move += interpolate(d, [0, 10, 70], [0, 0.07, 0], {...clamp, easing: Easing.out(Easing.cubic)});
  }

  const scale = seg.zoom + push + punch + snap + move;

  // Follow the speaker's head like a camera operator: zoom grows from the face, and the frame drifts to re-centre
  // the face a little behind his movement (lagged average). Never pans past the frame edge.
  const face = faceAt(edit.faces, frame, 14);
  const originX = face ? face[0] * 100 : 50;
  const originY = face ? face[1] * 100 : m.focusY * 100;
  const room = (scale - 1) / 2; // how far we can shift without showing edges (fraction of width)
  const camX = face ? Math.max(-room, Math.min(room, (0.5 - face[0]) * (scale - 1))) * 100 : 0;
  const camY = face ? Math.max(-room, Math.min(room, (0.42 - face[1]) * (scale - 1))) * 100 : 0;
  const tr = transitionMotion(edit, frame);
  const look = footageLook(edit, frame);

  return (
    <AbsoluteFill
      style={{
        transform: `${look.shake} perspective(1200px) translate(${tr.x + camX}%, ${camY}%) rotateY(${tr.rotY}deg) scale(${scale * tr.zoom})`,
        transformOrigin: `${originX}% ${originY}%`,
        filter: `contrast(${f.contrast}) saturate(${f.saturate}) brightness(${f.brightness}) blur(${snapBlur + tr.blur}px) ${look.filter}`,
      }}
    >
      {edit.segments.map((s, i) => (
        <Sequence key={i} from={s.outFrame} durationInFrames={s.frames} premountFor={30}>
          <OffthreadVideo
            src={staticFile(edit.video)}
            trimBefore={s.srcFrame}
            // 2-frame audio ramps so cuts never click
            volume={(vf) => {
              const ramp = interpolate(vf, [0, 2, s.frames - 2, s.frames], [0, 1, 1, 0], clamp);
              const endF = edit.endFade ?? 0;
              const end = endF ? interpolate(s.outFrame + vf, [edit.durationInFrames - endF, edit.durationInFrames], [1, 0], clamp) : 1;
              return ramp * end;
            }}
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        </Sequence>
      ))}
      {/* text / props that sit behind the person, then the person cut-out on top of it */}
      {behind}
      <AttachLayer items={edit.attach} motion={edit.motion} layer="behind" />
      {(edit.foreground ?? []).map((fg, i) =>
        fg.src ? (
          <Sequence key={`fg${i}`} from={fg.f} durationInFrames={fg.frames} premountFor={30}>
            <OffthreadVideo src={staticFile(fg.src)} transparent muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </Sequence>
        ) : null,
      )}
      <AttachLayer items={edit.attach} motion={edit.motion} layer="front" />
    </AbsoluteFill>
  );
};
