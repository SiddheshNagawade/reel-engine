// Composites the vector character into the handheld plate: camera-tracked, painted onto the wall,
// hidden behind the leaning rod, then leaping off the wall onto the bag.
import React from 'react';
import {AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Character, type HeadMeta} from './Rig';
import {groundFix, PX_PER_UNIT, SEAT_FRAME, SFX, STEPS, storyAt} from './story';

type M2x3 = number[][]; // [[a, c, e], [b, d, f]] as written by scripts/walltrack.py
export type CharTestProps = {
  plate: string;
  wall: M2x3[];
  bag: M2x3[];
  heads: Record<string, HeadMeta>;
  seat: {x: number; y: number}; // wall coords of the spot on the bag where his hips land
  occluders: {from: number; to: number; poly: [number, number][]}[]; // wall-coord polygons that pass in front of him
};

const mul = (A: M2x3, B: M2x3): M2x3 => [
  [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1], A[0][0] * B[0][2] + A[0][1] * B[1][2] + A[0][2]],
  [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1], A[1][0] * B[0][2] + A[1][1] * B[1][2] + A[1][2]],
];
const inv = (A: M2x3): M2x3 => {
  const [[a, c, e], [b, d, f]] = A;
  const det = a * d - b * c;
  return [
    [d / det, -c / det, (c * f - d * e) / det],
    [-b / det, a / det, (b * e - a * f) / det],
  ];
};
const apply = (A: M2x3, x: number, y: number) => [A[0][0] * x + A[0][1] * y + A[0][2], A[1][0] * x + A[1][1] * y + A[1][2]];
const css = (A: M2x3) => `matrix(${A[0][0]},${A[1][0]},${A[0][1]},${A[1][1]},${A[0][2]},${A[1][2]})`;

const Stars: React.FC<{t: number; amount: number}> = ({t, amount}) => (
  <g opacity={amount}>
    {[0, 1, 2].map((i) => {
      const a = t / 5 + (i * Math.PI * 2) / 3;
      const x = Math.cos(a) * 260;
      const y = -1820 + Math.sin(a) * 70;
      return (
        <polygon
          key={i}
          transform={`translate(${x},${y}) scale(${0.8 + 0.25 * Math.sin(a)}) rotate(${t * 6})`}
          points="0,-70 18,-22 68,-22 28,8 44,58 0,28 -44,58 -28,8 -68,-22 -18,-22"
          fill="#FFD43B"
          stroke="#E09B00"
          strokeWidth={8}
        />
      );
    })}
  </g>
);

export const CharTest: React.FC<CharTestProps> = ({plate, wall, bag, heads, seat, occluders}) => {
  const f = useCurrentFrame();
  const s = storyAt(f, seat);
  const i = Math.min(f, wall.length - 1);

  // Camera: wall track, cross-fading to the bag track as he lands on the bag.
  const toBag = mul(mul(bag[i], inv(bag[SEAT_FRAME])), wall[SEAT_FRAME]);
  const blended: M2x3 = s.onBag > 0 ? wall[i].map((r, ri) => r.map((v, ci) => v + (toBag[ri][ci] - v) * s.onBag)) : wall[i];
  const cam: M2x3 = [blended[0], [blended[1][0], blended[1][1], blended[1][2] + groundFix(f) * (1 - s.onBag)]];

  const k = PX_PER_UNIT * s.scale;
  const body = (
    <g transform={`translate(${s.x},${s.y}) rotate(${s.rot}) scale(${k * s.sx},${k * s.sy})`}>
      <Character pose={s.pose} heads={heads} />
      {s.stars > 0 && <Stars t={f} amount={s.stars} />}
    </g>
  );
  const layer = (blend: 'normal' | 'multiply', opacity: number, outline = 0) =>
    opacity <= 0.001 ? null : (
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, mixBlendMode: blend, opacity}}>
        <defs>
          <filter id="outline" x="-20%" y="-20%" width="140%" height="140%">
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
          <g filter={outline > 0 ? 'url(#outline)' : undefined}>{body}</g>
        </g>
      </svg>
    );

  // Things standing in front of the wall: redraw the plate on top, clipped to their (tracked) shape.
  const occ = occluders.filter((o) => f >= o.from && f <= o.to && s.paint > 0.5);
  const fadeOut = interpolate(f, [304, 317], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      <OffthreadVideo src={staticFile(plate)} volume={(fr) => 0.45 * (1 - interpolate(fr, [300, 317], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}))} />
      {layer('normal', s.opacity * (1 - 0.62 * s.paint), s.outline)}
      {layer('multiply', s.opacity * s.paint)}
      {occ.map((o, n) => (
        <AbsoluteFill key={n} style={{clipPath: `polygon(${o.poly.map(([x, y]) => apply(wall[i], x, y).map((v) => `${v.toFixed(1)}px`).join(' ')).join(',')})`}}>
          <OffthreadVideo src={staticFile(plate)} muted />
        </AbsoluteFill>
      ))}
      <AbsoluteFill style={{backgroundColor: 'black', opacity: fadeOut}} />
      {SFX.map((c, n) => (
        <Sequence key={`s${n}`} from={c.at} durationInFrames={40}>
          <Audio src={staticFile(`char-test/sfx/${c.file}.wav`)} volume={c.volume} />
        </Sequence>
      ))}
      {STEPS.map((at, n) => (
        <Sequence key={`t${n}`} from={at} durationInFrames={6}>
          <Audio src={staticFile('char-test/sfx/tap.wav')} volume={0.35} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
