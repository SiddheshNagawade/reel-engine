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
export const Scale: React.FC<{x: number; y: number; ang: number; side: number; vis: number; hl?: number}> = ({x, y, ang, side, vis, hl = 0}) => {
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
    if (mm % 10 === 0) {
      // the reading: the number where the measurement ends grows a little and goes bold
      const hit = hl > 0.05 ? Math.max(0, 1 - Math.abs(hl - mm / 10) * 2.5) : 0;
      const k = 1 + hit * 0.45;
      ticks.push(
        <text key={'n' + mm} x={X} y={46} transform={`translate(${X} ${s < 0 ? 46 - 13 / 2 : 46 - 13 / 2}) scale(${k} ${k * s}) translate(${-X} ${-(46 - 13 / 2)})`} textAnchor="middle" fontFamily="Geist Mono" fontWeight={hit > 0.5 ? 700 : 500} fontSize={16} fill={TOOL.line}>
          {mm / 10}
        </text>,
      );
    }
  }
  return (
    <g transform={`translate(${x + off * 0.6} ${y - off * 0.35}) rotate(${ang}) scale(1 ${s})`} opacity={Math.min(1, vis * 1.4)}>
      <defs>
        <Blur id="sc-blur" s={3 + z * 0.06} />
      </defs>
      <rect x={L0 + SH.x * z} y={SH.y * z * s + 3} width={L1 - L0} height={W} rx={10} fill={TOOL.shadow} opacity={0.1} filter="url(#sc-blur)" />
      <rect x={L0} y={0} width={L1 - L0} height={W} rx={10} fill={TOOL.ruler} fillOpacity={0.94} />
      {hl > 0.02 && (
        <g>
          {/* the measured length, marked on the ruler from 0 to the reading */}
          <rect x={0} y={0} width={hl * CM} height={30} fill="#f0b74c" opacity={0.55} />
          <line x1={hl * CM} y1={0} x2={hl * CM} y2={34} stroke={TOOL.line} strokeWidth={3} strokeLinecap="round" />
        </g>
      )}
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

// ---------------- protractor (same flat pastel family: translucent lilac, black ticks) ----------------
export const Protractor: React.FC<{x: number; y: number; ang: number; s: number; hl: number; vis: number}> = ({x, y, ang, s, hl, vis}) => {
  if (vis <= 0.001) return null;
  const off = (1 - vis) * 900;
  const cx = x + off * 0.55, cy = y - off * 0.45;
  const R = 5.2 * CM, r0 = 0.75 * CM;
  const sg = s >= 0 ? 1 : -1;
  const z = (1 - vis) * 60 + 3;
  const ticks: React.ReactNode[] = [];
  for (let d = 0; d <= 180; d++) {
    const len = d % 10 === 0 ? 22 : d % 5 === 0 ? 15 : 8;
    const a = (d * Math.PI) / 180;
    ticks.push(<line key={d} x1={Math.cos(a) * R} y1={Math.sin(a) * R} x2={Math.cos(a) * (R - len)} y2={Math.sin(a) * (R - len)} stroke={TOOL.line} strokeWidth={d % 10 === 0 ? 1.6 : 1} />);
  }
  // numbers are placed in WORLD space so they never read mirrored or upside down
  const nums: React.ReactNode[] = [];
  for (let d = 0; d <= 180; d += 10) {
    const wa = ang + sg * d;
    const p = polar({x: cx, y: cy}, R - 38, wa);
    let rot = wa + 90;
    while (rot > 90) rot -= 180;
    while (rot <= -90) rot += 180;
    const hit = hl > 0.5 ? Math.max(0, 1 - Math.abs(hl - d) / 4) : 0;
    nums.push(
      <text key={d} x={p.x} y={p.y} transform={`rotate(${rot} ${p.x} ${p.y})`} textAnchor="middle" dominantBaseline="central" fontFamily="Geist Mono" fontWeight={hit > 0.5 ? 700 : 500} fontSize={14 * (1 + hit * 0.5)} fill={TOOL.line}>
        {d}
      </text>,
    );
  }
  const band = hl > 0.3 ? (() => {
    const a1 = (Math.min(180, hl) * Math.PI) / 180;
    const ro = R - 2, ri = R - 26;
    const large = hl > 180 ? 1 : 0;
    return `M${ro} 0A${ro} ${ro} 0 ${large} 1 ${Math.cos(a1) * ro} ${Math.sin(a1) * ro}L${Math.cos(a1) * ri} ${Math.sin(a1) * ri}A${ri} ${ri} 0 ${large} 0 ${ri} 0Z`;
  })() : '';
  const a1 = (hl * Math.PI) / 180;
  return (
    <g opacity={Math.min(1, vis * 1.4)}>
      <defs>
        <Blur id="pr-blur" s={4 + z * 0.06} />
      </defs>
      <g transform={`translate(${cx} ${cy}) rotate(${ang}) scale(1 ${sg})`}>
        <path d={`M${R + 12} -16H${-R - 12}V0A${R} ${R} 0 0 0 ${R} 0H${R + 12}Z`} transform={`translate(${SH.x * z} ${SH.y * z * sg + 3})`} fill={TOOL.shadow} opacity={0.08} filter="url(#pr-blur)" />
        {/* body: half disc + a straight edge strip, the little centre window cut out */}
        <path d={`M${R + 12} -16H${-R - 12}V0H${-R}A${R} ${R} 0 0 0 ${R} 0H${R + 12}ZM${r0} 0A${r0} ${r0} 0 0 1 ${-r0} 0Z`} fill={TOOL.lilac} fillOpacity={0.55} fillRule="evenodd" />
        {band && <path d={band} fill="#8f78e8" opacity={0.45} />}
        {hl > 0.3 && <line x1={0} y1={0} x2={Math.cos(a1) * R} y2={Math.sin(a1) * R} stroke={TOOL.line} strokeWidth={2} strokeDasharray="6 6" opacity={0.7} />}
        <line x1={-R} y1={0} x2={R} y2={0} stroke={TOOL.line} strokeWidth={1.4} />
        <line x1={0} y1={-12} x2={0} y2={14} stroke={TOOL.line} strokeWidth={1.8} />
        {ticks}
        <path d={`M${R * 0.68} 0A${R * 0.68} ${R * 0.68} 0 0 1 ${-R * 0.68} 0`} fill="none" stroke={TOOL.line} strokeWidth={1} opacity={0.5} />
        <g transform={`translate(${-2.1 * CM} ${R * 0.42}) scale(1 ${sg})`}>
          <ToolMark x={0} y={0} color="#7d68cf" bg="#d9cffb" size={14} opacity={0.6} />
        </g>
      </g>
      {nums}
    </g>
  );
};

// ---------------- eraser (white rubber in a lilac paper sleeve) ----------------
export const Eraser: React.FC<{x: number; y: number; ang: number; lift: number; vis: number}> = ({x, y, ang, lift, vis}) => {
  if (vis <= 0.001) return null;
  const off = (1 - vis) * 800;
  const z = lift * 30 + (1 - vis) * 80;
  const b0 = {x: x + off * 0.6, y: y - off * 0.4};
  const b = up(b0, z), sh = shadowOf(b0, z);
  const W = 3.4 * CM, H = 1.6 * CM;
  return (
    <g opacity={Math.min(1, vis * 1.4)}>
      <defs>
        <Blur id="er-blur" s={5 + z * 0.05} />
      </defs>
      <rect x={sh.x - W / 2} y={sh.y - H / 2} width={W} height={H} rx={14} transform={`rotate(${ang} ${sh.x} ${sh.y})`} fill={TOOL.shadow} opacity={0.1} filter="url(#er-blur)" />
      <g transform={`translate(${b.x} ${b.y}) rotate(${ang})`}>
        <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={14} fill="#fbf7f1" stroke={TOOL.line} strokeWidth={1.8} />
        <rect x={-W / 2 + W * 0.36} y={-H / 2 - 3} width={W * 0.64 + 3} height={H + 6} rx={6} fill={TOOL.lilac} />
        <line x1={-W / 2 + W * 0.36} y1={-H / 2 - 3} x2={-W / 2 + W * 0.36} y2={H / 2 + 3} stroke={TOOL.line} strokeWidth={1.6} />
        <ToolMark x={-W / 2 + W * 0.42} y={7} color="#7d68cf" bg={TOOL.lilac} size={11} opacity={0.65} />
      </g>
    </g>
  );
};
