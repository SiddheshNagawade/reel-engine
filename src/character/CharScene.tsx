// Composites a vector character into a tracked plate from a scene.json (see engine.ts):
// painted into the wall (multiply), hidden behind real things in front of the wall (occluders),
// and popping off the wall as a sticker onto anchors that follow their own track.
import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Character, type HeadMeta} from './Rig';
import {frameAt, soundCues, spans, type Scene} from './engine';

type M2x3 = number[][]; // [[a, c, e], [b, d, f]] as written by scripts/walltrack.py
export type CharSceneProps = {
  scene: Scene;
  plate: string; // inside public/
  size: {w: number; h: number}; // plate size = composition size
  sfxDir: string; // inside public/
  tracks: Record<string, M2x3[]>; // 'wall' + any anchor tracks (e.g. 'dark')
  heads: Record<string, HeadMeta>;
  anchors: Record<string, {x: number; y: number}>; // anchor spots in wall coords (computed by scripts/char.mjs)
};

const mul = (A: M2x3, B: M2x3): M2x3 => [0, 1].map((r) => [
  A[r][0] * B[0][0] + A[r][1] * B[1][0],
  A[r][0] * B[0][1] + A[r][1] * B[1][1],
  A[r][0] * B[0][2] + A[r][1] * B[1][2] + A[r][2],
]);
const inv = (A: M2x3): M2x3 => {
  const [[a, c, e], [b, d, f]] = A;
  const det = a * d - b * c;
  return [[d / det, -c / det, (c * f - d * e) / det], [-b / det, a / det, (b * e - a * f) / det]];
};
const apply = (A: M2x3, x: number, y: number) => [A[0][0] * x + A[0][1] * y + A[0][2], A[1][0] * x + A[1][1] * y + A[1][2]];
const css = (A: M2x3) => `matrix(${A[0][0]},${A[1][0]},${A[0][1]},${A[1][1]},${A[0][2]},${A[1][2]})`;

const Stars: React.FC<{t: number; amount: number}> = ({t, amount}) => (
  <g opacity={amount}>
    {[0, 1, 2].map((i) => {
      const a = t / 5 + (i * Math.PI * 2) / 3;
      return (
        <polygon
          key={i}
          transform={`translate(${Math.cos(a) * 260},${-1820 + Math.sin(a) * 70}) scale(${0.8 + 0.25 * Math.sin(a)}) rotate(${t * 6})`}
          points="0,-70 18,-22 68,-22 28,8 44,58 0,28 -44,58 -28,8 -68,-22 -18,-22"
          fill="#FFD43B"
          stroke="#E09B00"
          strokeWidth={8}
        />
      );
    })}
  </g>
);

export const CharScene: React.FC<CharSceneProps> = ({scene, plate, size, sfxDir, tracks, heads, anchors}) => {
  const f = useCurrentFrame();
  const all = useMemo(() => spans(scene), [scene]);
  const cues = useMemo(() => soundCues(scene, all), [scene, all]);
  const s = frameAt(f, scene, anchors, all);
  const wall = tracks.wall;
  const i = Math.min(f, wall.length - 1);
  const clampOpts = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

  // Camera: wall track (+ measured drift fix), cross-fading to an anchor's own track when he's on it.
  const fix = scene.ground.fix?.length ? interpolate(f, scene.ground.fix.map((k) => k[0]), scene.ground.fix.map((k) => k[1]), clampOpts) : 0;
  let cam: M2x3 = [wall[i][0], [wall[i][1][0], wall[i][1][1], wall[i][1][2] + fix * (1 - s.onAnchor)]];
  const anc = s.anchor ? scene.anchors?.[s.anchor] : undefined;
  if (anc && s.onAnchor > 0 && tracks[anc.track]) {
    const T = tracks[anc.track];
    const lock = Math.min(anc.lock ?? anc.frame, T.length - 1);
    const toAnchor = mul(mul(T[i], inv(T[lock])), wall[lock]);
    cam = cam.map((r, ri) => r.map((v, ci) => v + (toAnchor[ri][ci] - v) * s.onAnchor));
  }

  const k = scene.character.pxPerUnit * s.scale;
  const flipX = s.flip && s.pose.view === 'side' ? -1 : 1;
  const body = (
    <g transform={`translate(${s.x},${s.y}) rotate(${s.rot}) scale(${k * s.sx * flipX},${k * s.sy})`}>
      <Character pose={s.pose} heads={heads} colors={scene.character.colors} />
      {s.stars > 0 && <Stars t={f} amount={s.stars} />}
    </g>
  );
  const layer = (blend: 'normal' | 'multiply', opacity: number, outline = 0) =>
    opacity <= 0.001 ? null : (
      <svg width={size.w} height={size.h} style={{position: 'absolute', inset: 0, mixBlendMode: blend, opacity}}>
        <defs>
          <filter id={`outline-${blend}`} x="-20%" y="-20%" width="140%" height="140%">
            <feMorphology in="SourceAlpha" operator="dilate" radius={11} result="fat" />
            <feFlood floodColor="#FFFFFF" floodOpacity={outline} />
            <feComposite in2="fat" operator="in" result="ring" />
            <feMerge>
              <feMergeNode in="ring" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g transform={css(cam)}>
          <g filter={outline > 0 ? `url(#outline-${blend})` : undefined}>{body}</g>
        </g>
      </svg>
    );

  // Things standing in front of the wall: redraw the plate on top, clipped to their tracked outline.
  const occ = (scene.occluders ?? []).filter((o) => f >= o.from && f <= o.to && s.paint > 0.5);
  const fade = scene.fadeOut ?? 14;
  const end = scene.frames - 1;
  const fadeOut = fade > 0 ? interpolate(f, [end - fade, end], [0, 1], clampOpts) : 0;
  const plateVol = scene.audio?.plateVolume ?? 0.45;

  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      <OffthreadVideo src={staticFile(plate)} volume={(fr) => plateVol * (1 - (fade > 0 ? interpolate(fr, [end - fade - 4, end], [0, 1], clampOpts) : 0))} />
      {layer('normal', s.opacity * (1 - 0.62 * s.paint), s.outline)}
      {layer('multiply', s.opacity * s.paint)}
      {occ.map((o, n) => (
        <AbsoluteFill key={n} style={{clipPath: `polygon(${o.poly.map(([x, y]) => apply(wall[i], x, y).map((v) => `${v.toFixed(1)}px`).join(' ')).join(',')})`}}>
          <OffthreadVideo src={staticFile(plate)} muted />
        </AbsoluteFill>
      ))}
      <AbsoluteFill style={{backgroundColor: 'black', opacity: fadeOut}} />
      {cues.map((c, n) => (
        <Sequence key={n} from={c.at} durationInFrames={c.sound === 'tap' ? 6 : 40}>
          <Audio src={staticFile(`${sfxDir}/${c.sound}.wav`)} volume={c.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
