// A flat-design character rig: vector body + expression heads cut from the character sheet.
// Units: "rig units" (1 unit = 1 point on the sheet). Origin = between the feet on the ground, y up is negative.
// Body ~1700 units tall. The heads come from scripts/char-parts.py (public/char-test/parts).
import React, {createContext, useContext} from 'react';
import {staticFile} from 'remotion';

export const COLORS = {
  sweater: '#F5B02D',
  sweaterDark: '#D9951C',
  sweaterLine: '#B97C1E',
  jeans: '#1E2D46',
  jeansDark: '#16223A',
  skin: '#F38675',
  shoe: '#7C92A8',
  shoeDark: '#62788F',
  sole: '#E6E6E6',
};

// Per-character colours (scene.character.colors overrides these defaults).
const Palette = createContext(COLORS);

export type HeadName = 'smile' | 'shock' | 'laugh' | 'sad' | 'kiss' | 'side';
export type Limb = {a: number; b: number}; // a: root angle, b: bend at the middle joint (degrees, 0 = straight down)

export type Pose = {
  view: 'front' | 'side';
  head: HeadName;
  legs: [Limb, Limb]; // side: [far, near]; front: [screen-left, screen-right]
  arms: [Limb, Limb];
  bob?: number; // lifts the upper body (units, + = up)
  lean?: number; // torso lean (deg, + = forward / clockwise)
  headTilt?: number;
  sit?: boolean; // front view sitting: thighs foreshortened toward the camera
};

export type HeadMeta = {file: string /* path inside public/ */; w: number; h: number; anchorX: number; anchorY: number};

const HIP_Y = -840;
const THIGH = 380;
const SHIN = 360;
const SHOULDER_Y = -1350;
const UPPER = 300;
const FORE = 280;
const HEAD_SCALE = 1.22; // slightly big heads read better on a phone

const rad = (d: number) => (d * Math.PI) / 180;
const step = (x: number, y: number, ang: number, len: number) => [x + Math.sin(rad(ang)) * len, y + Math.cos(rad(ang)) * len];

// A two-segment limb (thigh+shin or upper arm+forearm) as one rounded stroke.
const chain = (x: number, y: number, l: Limb, len1: number, len2: number, dir: 1 | -1 = 1) => {
  const [kx, ky] = step(x, y, dir * l.a, len1);
  const [ex, ey] = step(kx, ky, dir * (l.a + l.b), len2);
  return {kx, ky, ex, ey, end: dir * (l.a + l.b), d: `M${x},${y} L${kx},${ky} L${ex},${ey}`};
};

const Shoe: React.FC<{x: number; y: number; ang: number; side: boolean; flip?: boolean; dark?: boolean}> = ({x, y, ang, side, flip, dark}) => {
  const P = useContext(Palette);
  const fill = dark ? P.shoeDark : P.shoe;
  // keep the sole roughly level: only a bit of the shin angle carries into the foot
  const r = side ? ang * 0.35 : ang * 0.5;
  return (
    <g transform={`translate(${x},${y}) rotate(${-r}) scale(${flip ? -1 : 1},1)`}>
      {side ? (
        <>
          <path d="M-58,-30 L-58,92 L140,92 Q170,92 168,58 Q160,0 70,-22 Q20,-40 -58,-30 Z" fill={fill} />
          <rect x={-58} y={84} width={226} height={16} rx={8} fill={P.sole} />
          <path d="M10,-8 L58,22 M40,-14 L-2,24" stroke="#1B1B1B" strokeWidth={7} strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M-74,96 L74,96 Q86,20 34,-34 L-34,-34 Q-86,20 -74,96 Z" fill={fill} />
          <path d="M-28,0 L28,24 M28,0 L-28,24" stroke="#1B1B1B" strokeWidth={7} strokeLinecap="round" />
        </>
      )}
    </g>
  );
};

const Arm: React.FC<{x: number; y: number; l: Limb; dir: 1 | -1; dark?: boolean}> = ({x, y, l, dir, dark}) => {
  const P = useContext(Palette);
  const c = chain(x, y, l, UPPER, FORE, dir);
  const [hx, hy] = step(c.ex, c.ey, c.end, 34);
  return (
    <g>
      <path d={c.d} stroke={dark ? P.sweaterDark : P.sweater} strokeWidth={104} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx={hx} cy={hy} r={44} fill={P.skin} />
    </g>
  );
};

const Leg: React.FC<{x: number; y: number; l: Limb; dir: 1 | -1; side: boolean; dark?: boolean; flip?: boolean; thigh?: number}> = ({x, y, l, dir, side, dark, flip, thigh = THIGH}) => {
  const P = useContext(Palette);
  const c = chain(x, y, l, thigh, SHIN, dir);
  return (
    <g>
      <path d={c.d} stroke={dark ? P.jeansDark : P.jeans} strokeWidth={side ? 128 : 124} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Shoe x={c.ex} y={c.ey + 10} ang={c.end} side={side} flip={flip} dark={dark} />
    </g>
  );
};

const Head: React.FC<{meta: HeadMeta; x: number; y: number; mirror?: boolean; tilt?: number}> = ({meta, x, y, mirror, tilt = 0}) => (
  <g transform={`translate(${x},${y}) rotate(${tilt}) scale(${(mirror ? -1 : 1) * HEAD_SCALE},${HEAD_SCALE})`}>
    <image href={staticFile(meta.file)} x={-meta.anchorX} y={-meta.anchorY} width={meta.w} height={meta.h} />
  </g>
);

export const Character: React.FC<{pose: Pose; heads: Record<string, HeadMeta>; colors?: Partial<typeof COLORS>}> = ({pose, heads, colors}) => (
  <Palette.Provider value={{...COLORS, ...colors}}>
    <Body pose={pose} heads={heads} />
  </Palette.Provider>
);

const Body: React.FC<{pose: Pose; heads: Record<string, HeadMeta>}> = ({pose, heads}) => {
  const P = useContext(Palette);
  const {view, legs, arms, bob = 0, lean = 0, headTilt = 0, sit} = pose;
  const hipY = HIP_Y - bob;
  const head = heads[pose.head] ?? heads.smile;

  if (view === 'side') {
    // Facing +x (right). Far limbs drawn first and darker.
    return (
      <g>
        <Leg x={-10} y={hipY} l={legs[0]} dir={1} side dark />
        <Arm x={-5} y={SHOULDER_Y - bob} l={arms[0]} dir={1} dark />
        <g transform={`rotate(${lean},0,${hipY})`}>
          {pose.head === 'side' && heads.side && <Head meta={heads.side} x={18} y={SHOULDER_Y - bob + 30} mirror tilt={headTilt} />}
          <path
            d={`M-100,${SHOULDER_Y - bob - 30} Q20,${SHOULDER_Y - bob - 70} 80,${SHOULDER_Y - bob - 20} Q128,${SHOULDER_Y - bob + 160} 118,${hipY + 30} Q0,${hipY + 52} -112,${hipY + 30} Q-118,${SHOULDER_Y - bob + 120} -100,${SHOULDER_Y - bob - 30} Z`}
            fill={P.sweater}
          />
        </g>
        <Leg x={10} y={hipY} l={legs[1]} dir={1} side />
        {(pose.head !== 'side' || !heads.side) && (
          // turns his face to the camera (front expression head on the side body)
          <g transform={`rotate(${lean},0,${hipY})`}>
            <Head meta={head} x={10} y={SHOULDER_Y - bob + 58} tilt={headTilt} />
          </g>
        )}
        <Arm x={5} y={SHOULDER_Y - bob} l={arms[1]} dir={1} />
      </g>
    );
  }

  const thigh = sit ? THIGH * 0.32 : THIGH;
  const sy = SHOULDER_Y - bob;
  return (
    <g>
      <Leg x={-72} y={hipY} l={legs[0]} dir={-1} side={false} thigh={thigh} />
      <Leg x={72} y={hipY} l={legs[1]} dir={1} side={false} thigh={thigh} />
      <g transform={`rotate(${lean},0,${hipY})`}>
        <path
          d={`M-165,${sy - 20} Q0,${sy - 52} 165,${sy - 20} Q175,${sy + 200} 162,${hipY + 36} Q0,${hipY + 58} -162,${hipY + 36} Q-175,${sy + 200} -165,${sy - 20} Z`}
          fill={P.sweater}
        />
        <path d={`M-108,${sy + 130} L-100,${sy + 360} M108,${sy + 130} L100,${sy + 360}`} stroke={P.sweaterLine} strokeWidth={6} strokeLinecap="round" />
        <Arm x={-170} y={sy + 20} l={arms[0]} dir={-1} />
        <Arm x={170} y={sy + 20} l={arms[1]} dir={1} />
        <Head meta={head} x={0} y={sy + 58} tilt={headTilt} />
      </g>
    </g>
  );
};

export const RIG = {HIP_Y, THIGH, SHIN, SHOULDER_Y, HEIGHT: 1700};
