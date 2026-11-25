// The instruments in HIS chosen style (2026-11-25, reference: flat pastel stationery illustration): flat colour
// shapes, rounded ends, thin black detail lines, no gradients, a soft flat shadow for depth. No hands.
// All in WORLD px inside the sheet's SVG. The camera looks from slightly above, so height z shows z·HK higher on
// screen and casts its shadow towards SH. `lift` raises a tool while it moves; `vis` slides it in/out.
import React from 'react';
import {CM, type Pt, add, lerpPt, mul, polar, sub} from './engine';

export const TOOL = {
  lime: '#c9d551',
  lilac: '#b8a4f6',
  ruler: '#fdd995',
  wood: '#fbd8a6',
  coral: '#ff7272',
  teal: '#4fb39a',
  blue: '#5b9bff',
  line: '#1d1d21',
  lead: '#3a3a40',
  shadow: '#2a2440',
};
const HK = 0.42;
const SH = {x: 0.15, y: 0.12}; // short, soft shadows: a long offset blob read as a stain (2026-11-25 stills)
const up = (p: Pt, z: number): Pt => ({x: p.x, y: p.y - z * HK});
const shadowOf = (p: Pt, z: number): Pt => ({x: p.x + SH.x * z, y: p.y + SH.y * z});
const norm = (v: Pt) => {
  const l = Math.hypot(v.x, v.y) || 1;
  return {x: v.x / l, y: v.y / l};
};
const perp = (v: Pt) => ({x: -v.y, y: v.x});
const f = (n: number) => n.toFixed(2);
/** a tapered band from a (width wa) to b (width wb), round ends optional */
const band = (a: Pt, b: Pt, wa: number, wb: number) => {
  const n = perp(norm(sub(b, a)));
  const p1 = add(a, mul(n, wa / 2)), p2 = add(b, mul(n, wb / 2)), p3 = add(b, mul(n, -wb / 2)), p4 = add(a, mul(n, -wa / 2));
  return `M${f(p1.x)} ${f(p1.y)}L${f(p2.x)} ${f(p2.y)}L${f(p3.x)} ${f(p3.y)}L${f(p4.x)} ${f(p4.y)}Z`;
};
const Blur: React.FC<{id: string; s: number}> = ({id, s}) => (
  <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation={s} />
  </filter>
);

// his channel mark on the instruments (2026-11-25): tiny, tone-on-tone like a printed brand on stationery,
// never YouTube red. YouTube play-button shape + @SiddheshArts.
export const ToolMark: React.FC<{x: number; y: number; color: string; bg: string; size?: number; opacity?: number}> = ({x, y, color, bg, size = 13, opacity = 0.55}) => {
  const h = size * 0.95, w = h * 1.42;
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      <rect x={0} y={-h * 0.82} width={w} height={h} rx={h * 0.28} fill={color} />
      <path d={`M${w * 0.4} ${-h * 0.82 + h * 0.27}L${w * 0.68} ${-h * 0.82 + h * 0.5}L${w * 0.4} ${-h * 0.82 + h * 0.73}Z`} fill={bg} />
      <text x={w + size * 0.4} y={0} fontFamily="Geist" fontWeight={600} fontSize={size} letterSpacing={0.2} fill={color}>
        @SiddheshArts
      </text>
    </g>
  );
};

// ---------------- compass ----------------
const LEG = 11.5 * CM;
export const Compass: React.FC<{x: number; y: number; r: number; ang: number; lift: number; vis: number}> = ({x, y, r, ang, lift, vis}) => {
  if (vis <= 0.001) return null;
  const off = (1 - vis) * 900;
  const N0 = {x: x + off * 0.55, y: y - off * 0.5};
  const T0 = polar(N0, r, ang);
  const zTip = lift * 30 + (1 - vis) * 120;
  const h = Math.sqrt(Math.max(40 * 40, LEG * LEG - (r / 2) * (r / 2)));
  const M0 = lerpPt(N0, T0, 0.5);
  const zH = h + zTip;
  const N = up(N0, zTip), T = up(T0, zTip), H = up(M0, zH);
  const Ns = shadowOf(N0, zTip), Ts = shadowOf(T0, zTip), Hs = shadowOf(M0, zH);
  const top = up(M0, zH + 105);
  const along = (tip: Pt, s: number) => lerpPt(tip, H, s);
  const needleEnd = along(N, 0.08), penEnd = along(T, 0.09), wheel = along(T, 0.13);
  const barA = along(N, 0.42), barB = along(T, 0.42);
  const knob = lerpPt(barA, barB, 0.5);
  const legW = 24;
  return (
    <g opacity={Math.min(1, vis * 1.5)}>
      <defs>
        <Blur id="cg-blur" s={6 + zTip * 0.05} />
      </defs>
      {/* flat soft shadow */}
      <g filter="url(#cg-blur)" opacity={0.08 + 0.04 * (1 - lift)} fill={TOOL.shadow}>
        <path d={band(Ns, Hs, 6, legW)} />
        <path d={band(Ts, Hs, 8, legW)} />
        <circle cx={Hs.x} cy={Hs.y} r={38} />
      </g>
      {/* adjustment bar between the legs */}
      <path d={band(barA, barB, 9, 9)} fill={TOOL.lime} />
      <line x1={barA.x} y1={barA.y} x2={barB.x} y2={barB.y} stroke={TOOL.line} strokeWidth={1.6} strokeDasharray="0 18 6 999" opacity={0.9} />
      <path d={band(add(knob, {x: 0, y: -16}), add(knob, {x: 0, y: 16}), 9, 9)} fill={TOOL.lilac} />
      {/* needle leg */}
      <path d={band(N, needleEnd, 2, 9)} fill={TOOL.lime} />
      <path d={band(needleEnd, H, 13, legW)} fill={TOOL.lime} />
      <line x1={needleEnd.x} y1={needleEnd.y} x2={lerpPt(needleEnd, N, 0.55).x} y2={lerpPt(needleEnd, N, 0.55).y} stroke={TOOL.line} strokeWidth={1.8} strokeLinecap="round" />
      <line x1={add(needleEnd, mul(perp(norm(sub(H, N))), 7)).x} y1={add(needleEnd, mul(perp(norm(sub(H, N))), 7)).y} x2={add(needleEnd, mul(perp(norm(sub(H, N))), -7)).x} y2={add(needleEnd, mul(perp(norm(sub(H, N))), -7)).y} stroke={TOOL.line} strokeWidth={1.8} strokeLinecap="round" />
      {/* pencil leg: lead tip, lilac wheel */}
      <path d={band(T, penEnd, 2, 12)} fill={TOOL.lead} />
      <path d={band(penEnd, H, 13, legW)} fill={TOOL.lime} />
      <circle cx={wheel.x} cy={wheel.y} r={15} fill={TOOL.lilac} />
      <circle cx={wheel.x} cy={wheel.y} r={6} fill="none" stroke={TOOL.line} strokeWidth={1.8} />
      {/* handle with three grooves + head disc */}
      <path d={band(H, top, 26, 26)} fill={TOOL.lime} />
      <circle cx={top.x} cy={top.y} r={13} fill={TOOL.lime} />
      {[-6, 0, 6].map((dx) => (
        <line key={dx} x1={top.x + dx} y1={top.y - 6} x2={H.x + dx} y2={H.y - 30} stroke={TOOL.line} strokeWidth={1.6} strokeLinecap="round" />
      ))}
      <circle cx={H.x} cy={H.y} r={40} fill={TOOL.lilac} />
      <circle cx={H.x} cy={H.y} r={27} fill="none" stroke={TOOL.line} strokeWidth={2} />
    </g>
  );
};

// ---------------- scale (ruler) ----------------
export const Scale: React.FC<{x: number; y: number; ang: number; side: number; vis: number}> = ({x, y, ang, side, vis}) => {
  if (vis <= 0.001) return null;
  const off = (1 - vis) * 1000;
  const W = 2.6 * CM, L0 = -0.35 * CM, L1 = 15.9 * CM;
  const z = (1 - vis) * 60 + 3;
  const s = side >= 0 ? 1 : -1;
  const ticks: React.ReactNode[] = [];
  for (let mm = 0; mm <= 150; mm++) {
    const X = (mm / 10) * CM;
    const len = mm % 10 === 0 ? 24 : mm % 5 === 0 ? 16 : 9;
    ticks.push(<line key={mm} x1={X} y1={2} x2={X} y2={len} stroke={TOOL.line} strokeWidth={mm % 10 === 0 ? 1.8 : 1.1} strokeLinecap="round" />);
    if (mm % 10 === 0)
      ticks.push(
        <text key={'n' + mm} x={X} y={46} transform={s < 0 ? `scale(1,-1) translate(0,${-46 * 2 + 13})` : undefined} textAnchor="middle" fontFamily="Geist Mono" fontWeight={500} fontSize={16} fill={TOOL.line}>
          {mm / 10}
        </text>,
      );
  }
  return (
    <g transform={`translate(${x + off * 0.6} ${y - off * 0.35}) rotate(${ang}) scale(1 ${s})`} opacity={Math.min(1, vis * 1.4)}>
      <defs>
        <Blur id="sc-blur" s={3 + z * 0.06} />
      </defs>
      <rect x={L0 + SH.x * z} y={SH.y * z * s + 3} width={L1 - L0} height={W} rx={10} fill={TOOL.shadow} opacity={0.1} filter="url(#sc-blur)" />
      <rect x={L0} y={0} width={L1 - L0} height={W} rx={10} fill={TOOL.ruler} fillOpacity={0.94} />
      {ticks}
      <circle cx={L1 - 22} cy={W - 24} r={8} fill="#fff" stroke={TOOL.line} strokeWidth={1.8} />
      <g transform={`translate(0 ${W * 0.78}) scale(1 ${s})`}>
        <ToolMark x={4.4 * CM} y={6} color="#c99a45" bg={TOOL.ruler} size={17} opacity={0.5} />
      </g>
    </g>
  );
};

// ---------------- pencil ----------------
const AX = norm({x: 0.45, y: -0.25 - 0.86 * HK}); // screen direction from the tip to the back
const AXS = norm({x: 0.45 + SH.x * 0.86, y: -0.25 + SH.y * 0.86});
const AXA = (Math.atan2(AX.y, AX.x) * 180) / Math.PI;
export const Pencil: React.FC<{x: number; y: number; lift: number; vis: number}> = ({x, y, lift, vis}) => {
  if (vis <= 0.001) return null;
  const off = (1 - vis) * 700;
  const z = lift * 34 + (1 - vis) * 80;
  const tip0 = {x: x + off * 0.7, y: y - off * 0.3};
  const tip = up(tip0, z), tipS = shadowOf(tip0, z);
  const sEnd = add(tipS, mul(AXS, 210));
  const R = 17; // half thickness
  return (
    <g opacity={Math.min(1, vis * 1.4)}>
      <defs>
        <Blur id="pc-blur" s={5 + z * 0.06} />
      </defs>
      <path d={band(add(tipS, mul(AXS, 10)), sEnd, 4, 22)} fill={TOOL.shadow} opacity={0.08} filter="url(#pc-blur)" />
      <g transform={`translate(${tip.x} ${tip.y}) rotate(${AXA})`}>
        {/* lead + wood cone with the scalloped edge */}
        <path d={`M0 0L52 ${-R}L52 ${R}Z`} fill={TOOL.wood} />
        <path d="M0 0L15 -5L15 5Z" fill={TOOL.lead} />
        {/* body */}
        <path d={`M52 ${-R}H292V${R}H52Z`} fill={TOOL.coral} />
        <path d={`M52 ${-R}A${R / 3} ${R / 3} 0 0 1 52 ${-R / 3}A${R / 3} ${R / 3} 0 0 1 52 ${R / 3}A${R / 3} ${R / 3} 0 0 1 52 ${R}`} fill={TOOL.wood} stroke={TOOL.line} strokeWidth={1.6} />
        <line x1={64} y1={0} x2={290} y2={0} stroke={TOOL.line} strokeWidth={1.6} />
        <ToolMark x={128} y={12.5} color="#c94f4f" bg={TOOL.coral} size={9.5} opacity={0.6} />
        {/* ferrule + eraser */}
        <path d={`M292 ${-R}H314V${R}H292Z`} fill={TOOL.teal} />
        <line x1={292} y1={-R} x2={292} y2={R} stroke={TOOL.line} strokeWidth={1.6} />
        <path d={`M314 ${-R}H330A${R} ${R} 0 0 1 330 ${R}H314Z`} fill={TOOL.lime} />
      </g>
    </g>
  );
};
