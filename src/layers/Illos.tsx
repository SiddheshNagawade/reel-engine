// ILLUSTRATED OBJECTS that act out what he says (brain/explainers.md "Objects (the metaphor)"): direction.illos →
// edit.inserts kind 'illo'. Flat vector drawings built in code, so they can MOVE like the thing they are:
//   printer   a receipt/bill printer; the paper prints out line by line (his real bill lines), can be torn off
//   globe     a real rotating globe (continents projected on a sphere); pins drop on places
//   satellite solar panels + dish; orbits any other object (orbit), sends signal waves
//   phone     a notification card drops in on 'ping' · laptop a screen with a title + text lines
//   bulb      lights up on 'on' (glow + rays) · coins a stack that grows coin by coin · cash a stack of notes
//   beaker    a glass that fills to a % (counts up) · clock hands spin when time passes · box flaps open
//   document  a page with lines; a stamp (PAID / REJECTED / IMPORTED) slams onto it on 'stamp'
//   svg       ANY vector file (Library/illustrations, an icon from the internet): drawn on the same way
// Every object is DRAWN ON, never popped in: its outlines trace in part by part (~0.9 s), then the flat colours flood
// in, then it lives (gentle float) and reacts on his words (acts). Generic acts for every object: pop, shake, fall
// (gravity, out of frame: "this idea died"), out. One insert = a small board of objects (items) that build in the
// order he says them; style 'full' = its own coloured canvas, 'over' = floating over the footage/canvas.
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Easing, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {fonts} from './fonts';
import {isLight} from './Captions';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const back = Easing.out(Easing.back(1.8));

export type IlloPalette = {ink?: string; paper?: string; light?: string; mid?: string; dark?: string; accent?: string; blue?: string; green?: string; red?: string; gold?: string};
export type IlloAct = {at: number; do: string; to?: number; n?: number; text?: string; color?: string; seconds?: number};
export type IlloPin = {at: number; lon: number; lat: number; label?: string; color?: string};
export type IlloItem = {
  obj: string; // printer | globe | satellite | phone | laptop | bulb | coins | cash | beaker | clock | box | document | svg
  at: number; // frames from the insert start when it starts drawing (plan.mjs: word / s)
  out?: number; // frames from the insert start when it leaves early
  x?: number; y?: number; // centre (fractions of the frame)
  size?: number; // 100 drawing units = size × the frame's unit width (default 0.5)
  rot?: number; flip?: boolean;
  enter?: 'draw' | 'pop' | 'drop' | 'none';
  build?: number; // seconds the draw-on takes (default 0.9)
  idle?: 'float' | 'none';
  color?: string; accent?: string; // main / highlight colour of this object
  text?: string; title?: string; lines?: string[]; total?: string; value?: number; // what the object shows (receipt lines, %, count…)
  label?: string; // a tag under the object, pops in after it's drawn
  src?: string; // svg: file in public/ (assets/library/illustrations/… is staged from the T7)
  outline?: boolean; // svg: keep the drawn outline after the fill floods in (default true)
  spin?: number; lon?: number; tilt?: number; // globe: degrees per second (default 18), facing longitude, view latitude
  pins?: IlloPin[];
  orbit?: {around?: number | [number, number]; rx?: number; ry?: number; period?: number; phase?: number; tilt?: number};
  acts?: IlloAct[];
};
export type IlloSpec = {
  style?: 'full' | 'over';
  bg?: string; // full: canvas colour
  palette?: IlloPalette;
  hideCaptions?: boolean;
  zoom?: number; // full: slow push-in over the insert (default 1.05)
  items: IlloItem[];
};

const PAL: Required<IlloPalette> = {ink: '#1b1b1f', paper: '#f3eee4', light: '#ece6da', mid: '#c8c0b0', dark: '#34343b', accent: '#f5b82e', blue: '#4f9ee8', green: '#3fae6a', red: '#e5533d', gold: '#f2b632'};
const SW = 2.6; // outline width (units; 100 units = the object's size)

const rr = (x: number, y: number, w: number, h: number, r: number) => {
  r = Math.min(r, w / 2, h / 2);
  return `M${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} H${x + r} Q${x},${y + h} ${x},${y + h - r} V${y + r} Q${x},${y} ${x + r},${y} Z`;
};
const circ = (cx: number, cy: number, r: number) => `M${cx - r},${cy} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0 Z`;
const ell = (cx: number, cy: number, rx: number, ry: number) => `M${cx - rx},${cy} a${rx},${ry} 0 1,0 ${2 * rx},0 a${rx},${ry} 0 1,0 ${-2 * rx},0 Z`;
const mix = (a: string, b: string, p: number) => {
  const h = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) return p < 0.5 ? a : b;
  const A = h(a), B = h(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * p)).join(',')})`;
};

// ── drawing context: build progress per part, acts, palette ────────────────────────────────────────────────────
type Ctx = {
  t: number; // frames since the item started drawing
  fps: number;
  P: Required<IlloPalette>;
  it: IlloItem;
  main: string; acc: string;
  built: number; // frame (item-local) when the draw-on is finished
  part: (o: number) => {k: number; f: number}; // outline progress, fill progress of part o
  act: (name: string) => {t: number; a: IlloAct} | null; // latest act of that name that has started
  acts: (name: string) => {t: number; a: IlloAct}[];
};
// one drawn shape: its outline traces in, then its colour floods in
const D: React.FC<{c: Ctx; o: number; d: string; fill?: string; stroke?: string | null; w?: number; op?: number; cap?: boolean}> = ({c, o, d, fill = 'none', stroke, w = SW, op = 1, cap}) => {
  const {k, f} = c.part(o);
  if (k <= 0) return null;
  return (
    <path d={d} pathLength={1} fill={fill} fillOpacity={fill === 'none' ? 0 : f * op} stroke={stroke === null ? 'none' : stroke ?? c.P.ink} strokeWidth={w}
      strokeDasharray="1 1" strokeDashoffset={1 - k} strokeLinejoin="round" strokeLinecap={cap ? 'round' : 'butt'} />
  );
};
const T: React.FC<{x: number; y: number; s: number; children: React.ReactNode; fill?: string; family?: string; weight?: number; anchor?: 'start' | 'middle' | 'end'; op?: number}> = ({x, y, s, children, fill = '#1b1b1f', family = fonts.inter, weight = 800, anchor = 'middle', op = 1}) => (
  <text x={x} y={y} fontFamily={family} fontWeight={weight} fontSize={s} fill={fill} textAnchor={anchor} opacity={op} dominantBaseline="middle">{children}</text>
);

// ── objects ─────────────────────────────────────────────────────────────────────────────────────────────────────
type Obj = {parts: number; draw: (c: Ctx) => React.ReactNode; auto?: string}; // auto = act played right after the build

// PRINTER: the paper comes out of the top slot line by line (each line a short jerk, like a real thermal printer)
const printer: Obj = {
  parts: 7,
  auto: 'print',
  draw: (c) => {
    const lines = c.it.lines ?? (c.it.text ? [c.it.text] : ['RECEIPT', '- - - - - - - -', 'Item 1', 'Item 2']);
    const rows = lines.length + (c.it.total ? 2 : 0);
    const pr = c.act('print');
    const step = Math.round(0.2 * c.fps);
    const done = pr ? Math.min(rows + 1, pr.t / step) : 0; // rows printed (fractional = the jerk of the current row)
    const whole = Math.floor(done), frac = easeOut(Math.min(1, (done - whole) * 1.6));
    const rowH = 8;
    const len = pr ? Math.min(rows + 1, whole + frac) * rowH + 4 : 0;
    const tear = c.act('tear');
    const tp = tear ? interpolate(tear.t, [0, Math.round(0.7 * c.fps)], [0, 1], {...clamp, easing: Easing.in(Easing.quad)}) : 0;
    const printing = pr && done < rows + 1;
    const jx = printing ? Math.sin(c.t * 2.7) * 0.5 : 0;
    const top = -26 - len;
    const paperW = 58;
    const totalS = c.it.total ? Math.min(6.6, (paperW - 6) / (c.it.total.length * 0.62)) : 6.6;
    return (
      <g transform={`translate(${jx},0)`}>
        {len > 0 && (
          <g clipPath={tear ? undefined : 'url(#slot)'} transform={tear ? `translate(${tp * 20},${-tp * 120}) rotate(${tp * 25},0,${top})` : undefined} opacity={1 - tp * 0.9}>
            <defs><clipPath id="slot"><rect x={-80} y={-400} width={160} height={400 - 25} /></clipPath></defs>
            <path d={`M${-paperW / 2},-22 V${top + 3} ${Array.from({length: 12}, (_, i) => `L${-paperW / 2 + ((i + 0.5) * paperW) / 12},${top + (i % 2 ? 3 : 0)}`).join(' ')} L${paperW / 2},${top + 3} V-22 Z`}
              fill="#ffffff" stroke={c.P.ink} strokeWidth={SW * 0.8} strokeLinejoin="round" />
            {lines.map((l, i) => (
              <T key={i} x={i === 0 ? 0 : -paperW / 2 + 4} anchor={i === 0 ? 'middle' : 'start'} y={top + 8 + i * rowH} s={i === 0 ? 5.4 : 4.4} family="'Courier New', monospace" weight={700}>{l}</T>
            ))}
            {c.it.total && (
              <>
                <line x1={-paperW / 2 + 4} x2={paperW / 2 - 4} y1={top + 8 + (lines.length + 0.4) * rowH - 4} y2={top + 8 + (lines.length + 0.4) * rowH - 4} stroke={c.P.ink} strokeWidth={0.6} strokeDasharray="1.5 1.5" />
                <T x={0} y={top + 8 + (lines.length + 1) * rowH - 2} s={totalS} family="'Courier New', monospace" weight={800}>{c.it.total}</T>
              </>
            )}
          </g>
        )}
        <D c={c} o={0} d={rr(-44, -24, 88, 48, 9)} fill={c.main} />
        <D c={c} o={1} d={rr(-36, -32, 72, 10, 4)} fill={c.P.mid} />
        <D c={c} o={2} d={rr(-27, -26.5, 54, 4, 2)} fill={c.P.dark} />
        <D c={c} o={3} d={rr(-32, -8, 64, 22, 4)} fill={c.P.light} />
        <D c={c} o={4} d={rr(-27, -3.5, 28, 12, 2)} fill={c.P.dark} />
        {c.part(4).f > 0.5 && <T x={-13} y={2.5} s={6} fill={c.P.green} family="'Courier New', monospace" op={printing ? 0.6 + 0.4 * Math.sin(c.t) : 1}>{printing ? '...' : !pr ? 'READY' : c.it.total ? 'PAID' : 'DONE'}</T>}
        <D c={c} o={5} d={circ(13, 2.5, 4.2)} fill={c.acc} />
        <D c={c} o={5} d={circ(24, 2.5, 4.2)} fill={c.P.mid} />
        <D c={c} o={6} d={rr(-38, 24, 14, 5, 2)} fill={c.P.dark} />
        <D c={c} o={6} d={rr(24, 24, 14, 5, 2)} fill={c.P.dark} />
        {c.part(6).f > 0 && <circle cx={34} cy={-15} r={2} fill={printing ? (Math.floor(c.t / 4) % 2 ? c.P.green : '#a8e6bd') : c.P.green} opacity={c.part(6).f} />}
      </g>
    );
  },
};

// GLOBE: continents as lon/lat outlines projected on a sphere (orthographic), so it really turns
const LAND: [number, number][][] = [
  [[-165, 65], [-140, 70], [-95, 72], [-75, 62], [-60, 50], [-75, 40], [-80, 27], [-97, 18], [-87, 14], [-105, 22], [-118, 33], [-125, 48], [-150, 58]],
  [[-80, 9], [-60, 8], [-35, -6], [-40, -22], [-58, -38], [-70, -54], [-75, -40], [-72, -18], [-81, -4]],
  [[-50, 60], [-20, 70], [-25, 82], [-60, 80]],
  [[-10, 36], [0, 44], [-5, 48], [5, 58], [20, 70], [40, 68], [42, 45], [28, 40], [15, 38]],
  [[-17, 15], [-6, 35], [10, 37], [32, 31], [43, 12], [51, 11], [40, -15], [30, -33], [18, -34], [12, -18], [9, 4], [-8, 5]],
  [[42, 45], [40, 68], [70, 73], [110, 77], [140, 72], [170, 66], [160, 58], [140, 50], [130, 35], [120, 22], [107, 10], [98, 16], [90, 22], [80, 8], [72, 20], [58, 25], [48, 30]],
  [[114, -22], [130, -12], [142, -11], [153, -27], [146, -38], [135, -34], [115, -34]],
  [[44, -14], [50, -16], [47, -25], [43, -22]],
  [[130, 32], [140, 36], [142, 44], [136, 36]],
];
const densify = (pts: [number, number][], closed = true) => {
  const out: [number, number][] = [];
  const n = pts.length;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    for (let s = 0; s < 4; s++) out.push([a[0] + ((b[0] - a[0]) * s) / 4, a[1] + ((b[1] - a[1]) * s) / 4]);
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
};
const LAND_D = LAND.map((p) => densify(p));
const rad = Math.PI / 180;
function project(lon: number, lat: number, rot: number, tilt: number, R: number) {
  const l = (lon - rot) * rad, p = lat * rad, t = tilt * rad;
  const x = R * Math.cos(p) * Math.sin(l);
  const y = -R * (Math.cos(t) * Math.sin(p) - Math.sin(t) * Math.cos(p) * Math.cos(l));
  const z = Math.sin(t) * Math.sin(p) + Math.cos(t) * Math.cos(p) * Math.cos(l);
  return {x, y, z};
}
const globe: Obj = {
  parts: 4,
  draw: (c) => {
    const R = 42;
    const rot = (c.it.lon ?? 20) - (c.it.spin ?? 18) * (c.t / c.fps);
    const tilt = c.it.tilt ?? 18;
    // a land outline: hidden points slide onto the rim, so a continent going round the back shrinks into the edge
    const landPath = (pts: [number, number][]) => {
      const pr = pts.map(([lo, la]) => project(lo, la, rot, tilt, R));
      if (pr.every((q) => q.z <= 0)) return null;
      return pr.map((q, i) => {
        let {x, y} = q;
        if (q.z < 0) { const m = Math.hypot(x, y) || 1; x = (x / m) * R; y = (y / m) * R; }
        return `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`;
      }).join(' ') + ' Z';
    };
    const grid: string[] = [];
    for (const la of [-40, 0, 40]) {
      const seg = densify(Array.from({length: 37}, (_, i) => [-180 + i * 10, la] as [number, number]), false).map(([lo, l2]) => project(lo, l2, rot, tilt, R));
      grid.push(seg.map((q, i) => `${i && seg[i - 1].z > 0 && q.z > 0 ? 'L' : 'M'}${q.x.toFixed(2)},${q.y.toFixed(2)}`).join(' '));
    }
    for (let lo = -180; lo < 180; lo += 40) {
      const seg = Array.from({length: 19}, (_, i) => project(lo, -90 + i * 10, rot, tilt, R));
      grid.push(seg.map((q, i) => `${i && seg[i - 1].z > 0 && q.z > 0 ? 'L' : 'M'}${q.x.toFixed(2)},${q.y.toFixed(2)}`).join(' '));
    }
    const {k: kg} = c.part(1);
    return (
      <g>
        <defs><clipPath id="gl"><circle r={R} /></clipPath></defs>
        <D c={c} o={0} d={circ(0, 0, R)} fill={c.it.color ?? c.P.blue} />
        <g clipPath="url(#gl)">
          {kg > 0 && grid.map((g, i) => <path key={i} d={g} fill="none" stroke="#ffffff" strokeWidth={0.7} opacity={0.35 * kg} />)}
          {LAND_D.map((p, i) => { const d = landPath(p); return d ? <D key={i} c={c} o={2} d={d} fill={c.it.accent ?? c.P.green} w={SW * 0.75} /> : null; })}
          {c.part(3).f > 0 && <path d={`M${-R},0 A${R},${R} 0 0,0 ${R},0 A${R * 1.1},${R * 0.95} 0 0,1 ${-R},0 Z`} transform="rotate(-30)" fill="#000" opacity={0.13 * c.part(3).f} />}
          {c.part(3).f > 0 && <ellipse cx={-R * 0.42} cy={-R * 0.48} rx={R * 0.16} ry={R * 0.08} transform={`rotate(-35,${-R * 0.42},${-R * 0.48})`} fill="#fff" opacity={0.5 * c.part(3).f} />}
        </g>
        <D c={c} o={0} d={circ(0, 0, R)} />
        {(c.it.pins ?? []).map((pin, i) => {
          const pt = c.t - pin.at;
          if (pt < 0) return null;
          const q = project(pin.lon, pin.lat, rot, tilt, R);
          const vis = interpolate(q.z, [-0.05, 0.15], [0, 1], clamp);
          if (vis <= 0) return null;
          const drop = interpolate(pt, [0, Math.round(0.35 * c.fps)], [-26, 0], {...clamp, easing: Easing.bounce});
          const lp = interpolate(pt, [Math.round(0.3 * c.fps), Math.round(0.5 * c.fps)], [0, 1], {...clamp, easing: back});
          const col = pin.color ?? c.P.red;
          return (
            <g key={i} transform={`translate(${q.x},${q.y + drop})`} opacity={vis * interpolate(pt, [0, 3], [0, 1], clamp)}>
              <ellipse cx={0} cy={0.6} rx={3} ry={1.1} fill="#000" opacity={0.25} />
              <path d="M0,0 C-2,-5 -6,-8 -6,-12.5 A6,6 0 1,1 6,-12.5 C6,-8 2,-5 0,0 Z" fill={col} stroke={c.P.ink} strokeWidth={1.4} strokeLinejoin="round" />
              <circle cx={0} cy={-12.5} r={2.2} fill="#fff" />
              {pin.label && lp > 0 && (
                <g transform={`translate(0,-24) scale(${lp})`}>
                  <rect x={-pin.label.length * 1.9 - 3} y={-4.5} width={pin.label.length * 3.8 + 6} height={9} rx={2.5} fill={c.P.ink} />
                  <T x={0} y={0.3} s={5} fill="#fff">{pin.label}</T>
                </g>
              )}
            </g>
          );
        })}
      </g>
    );
  },
};

// SATELLITE: body + two solar panels + dish; 'signal' sends waves out of the dish
const satellite: Obj = {
  parts: 5,
  draw: (c) => {
    const panel = (x: number) => (
      <>
        <D c={c} o={1} d={rr(x, -9, 30, 18, 2)} fill={c.it.color ?? c.P.blue} />
        {c.part(1).f > 0 && [1, 2].map((i) => <line key={i} x1={x + i * 10} x2={x + i * 10} y1={-9} y2={9} stroke={c.P.ink} strokeWidth={0.9} opacity={c.part(1).f} />)}
        {c.part(1).f > 0 && <line x1={x} x2={x + 30} y1={0} y2={0} stroke={c.P.ink} strokeWidth={0.9} opacity={c.part(1).f} />}
      </>
    );
    const sig = c.acts('signal');
    return (
      <g>
        <D c={c} o={0} d="M-16,0 H-10 M10,0 H16" />
        {panel(-46)}
        {panel(16)}
        <D c={c} o={2} d={rr(-10, -12, 20, 24, 3)} fill={c.it.accent ?? c.P.gold} />
        {c.part(2).f > 0 && <rect x={-6} y={-8} width={12} height={5} rx={1} fill={c.P.dark} opacity={c.part(2).f} />}
        <D c={c} o={3} d="M0,12 V18" />
        <D c={c} o={4} d="M-9,18 Q0,30 9,18 Z" fill={c.P.light} />
        {sig.map(({t: st}, j) => [0, 1, 2].map((i) => {
          const p = interpolate(st - i * 5, [0, Math.round(0.8 * c.fps)], [0, 1], clamp);
          if (p <= 0 || p >= 1) return null;
          const r = 8 + p * 30;
          return <path key={`${j}-${i}`} d={`M${-r * 0.7},${26 + r * 0.55} Q0,${26 + r * 1.05} ${r * 0.7},${26 + r * 0.55}`} fill="none" stroke={c.acc} strokeWidth={2.2} strokeLinecap="round" opacity={1 - p} />;
        }))}
      </g>
    );
  },
};

// PHONE: a notification card drops onto the screen on 'ping' (with a little buzz)
const phone: Obj = {
  parts: 4,
  auto: 'ping',
  draw: (c) => {
    const ping = c.act('ping');
    const pp = ping ? interpolate(ping.t, [0, Math.round(0.35 * c.fps)], [0, 1], {...clamp, easing: back}) : 0;
    const buzz = ping && ping.t < 0.4 * c.fps ? Math.sin(ping.t * 2.4) * 4 * (1 - ping.t / (0.4 * c.fps)) : 0;
    const lines = c.it.lines ?? [];
    return (
      <g transform={`rotate(${buzz})`}>
        <D c={c} o={0} d={rr(-27, -52, 54, 104, 10)} fill={c.P.dark} />
        <D c={c} o={1} d={rr(-23, -47, 46, 94, 7)} fill={c.it.color ?? '#ffffff'} />
        <D c={c} o={2} d={rr(-8, -45, 16, 4, 2)} fill={c.P.dark} />
        {c.part(3).f > 0 && lines.map((l, i) => <T key={i} x={-18} y={-26 + i * 8} s={4.6} anchor="start" weight={700} fill={c.P.ink} op={c.part(3).f}>{l}</T>)}
        {pp > 0 && c.it.text && (
          <g transform={`translate(0,${-30 + (1 - pp) * -14})`} opacity={Math.min(1, pp * 2)}>
            <rect x={-22} y={-9} width={44} height={20} rx={4} fill="#fff" stroke={c.P.ink} strokeWidth={1.4} />
            <rect x={-19} y={-6} width={8} height={8} rx={2} fill={c.acc} />
            <T x={-9} y={-2} s={4.4} anchor="start" weight={800}>{c.it.title ?? 'Now'}</T>
            <T x={-19} y={6} s={Math.min(5, 38 / (c.it.text.length * 0.55))} anchor="start" weight={700}>{c.it.text}</T>
          </g>
        )}
      </g>
    );
  },
};

// LAPTOP: a screen with a title and text lines that type in
const laptop: Obj = {
  parts: 4,
  draw: (c) => {
    const lines = c.it.lines ?? ['', '', ''];
    return (
      <g>
        <D c={c} o={0} d={rr(-44, -38, 88, 58, 5)} fill={c.P.dark} />
        <D c={c} o={1} d={rr(-40, -34, 80, 50, 2)} fill={c.it.color ?? '#ffffff'} />
        <D c={c} o={2} d="M-50,20 H50 L57,28 Q58,31 55,31 H-55 Q-58,31 -57,28 Z" fill={c.P.mid} />
        <D c={c} o={2} d={rr(-9, 20, 18, 3, 1.5)} fill={c.P.dark} />
        {c.it.text && <T x={-34} y={-25} s={6} anchor="start" op={c.part(3).f}>{c.it.text}</T>}
        {lines.map((l, i) => {
          const p = interpolate(c.t - c.built - i * 6, [0, 10], [0, 1], clamp);
          return l
            ? <T key={i} x={-34} y={-14 + i * 8} s={4.6} anchor="start" weight={500} op={p}>{l.slice(0, Math.ceil(l.length * p))}</T>
            : <rect key={i} x={-34} y={-16 + i * 8} width={(50 - i * 9) * p} height={3.4} rx={1.7} fill={c.P.mid} />;
        })}
      </g>
    );
  },
};

// BULB: an idea lights up on 'on' (glass floods yellow, glow, rays draw out)
const bulb: Obj = {
  parts: 4,
  auto: 'on',
  draw: (c) => {
    const on = c.act('on'), off = c.act('off');
    const p = on && !(off && off.t < on.t) ? interpolate(on.t, [0, 3, 5, 8], [0, 1, 0.4, 1], clamp) : 0;
    const glass = 'M-12,16 C-12,6 -26,0 -26,-14 A26,26 0 1,1 26,-14 C26,0 12,6 12,16 Z';
    return (
      <g>
        {p > 0 && <circle cx={0} cy={-14} r={48} fill={c.it.color ?? c.P.accent} opacity={0.22 * p} />}
        {p > 0 && Array.from({length: 8}, (_, i) => {
          const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
          const k = interpolate(on!.t, [2, 10], [0, 1], {...clamp, easing: easeOut});
          const r0 = 32, r1 = 32 + 12 * k;
          return <line key={i} x1={Math.cos(a) * r0} y1={-14 + Math.sin(a) * r0} x2={Math.cos(a) * r1} y2={-14 + Math.sin(a) * r1} stroke={c.P.ink} strokeWidth={SW} strokeLinecap="round" opacity={a > 0.3 && a < Math.PI - 0.3 ? 0 : 1} />;
        })}
        <D c={c} o={0} d={glass} fill={mix('#f7f4ec', c.it.color ?? c.P.accent, p)} />
        <D c={c} o={1} d="M-6,16 V2 L-3,-6 L0,0 L3,-6 L6,2 V16" w={SW * 0.7} cap />
        <D c={c} o={2} d={rr(-13, 16, 26, 6, 2)} fill={c.P.mid} />
        <D c={c} o={2} d={rr(-12, 22, 24, 6, 2)} fill={c.P.mid} />
        <D c={c} o={3} d={rr(-7, 28, 14, 5, 2.5)} fill={c.P.dark} />
        {c.part(0).f > 0 && <path d="M-16,-26 Q-14,-34 -6,-36" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.8 * c.part(0).f} />}
      </g>
    );
  },
};

// COINS: a stack that grows coin by coin (value = how many; 'add' {n} drops more)
const coins: Obj = {
  parts: 2,
  draw: (c) => {
    const base = c.it.value ?? 5;
    const adds = c.acts('add');
    const total = base + adds.reduce((s, a) => s + (a.a.n ?? 3), 0);
    const els: React.ReactNode[] = [];
    let idx = 0;
    const coin = (i: number, start: number) => {
      const pt = c.t - start;
      if (pt < 0) return null;
      const y = 34 - i * 6.5;
      const drop = interpolate(pt, [0, Math.round(0.25 * c.fps)], [-60, 0], {...clamp, easing: Easing.bounce});
      return (
        <g key={i} transform={`translate(${Math.sin(i * 7.3) * 2},${y + drop})`} opacity={interpolate(pt, [0, 2], [0, 1], clamp)}>
          <path d="M-24,0 V5 A24,7 0 0,0 24,5 V0" fill={mix(c.it.color ?? c.P.gold, '#000000', 0.18)} stroke={c.P.ink} strokeWidth={SW * 0.8} />
          <ellipse cx={0} cy={0} rx={24} ry={7} fill={c.it.color ?? c.P.gold} stroke={c.P.ink} strokeWidth={SW * 0.8} />
          <ellipse cx={0} cy={0} rx={17} ry={4.6} fill="none" stroke={c.P.ink} strokeWidth={0.8} opacity={0.4} />
        </g>
      );
    };
    // the first coin draws on; the others fall onto the stack
    els.push(<g key="first"><D c={c} o={0} d="M-24,34 V39 A24,7 0 0,0 24,39 V34" fill={mix(c.it.color ?? c.P.gold, '#000000', 0.18)} /><D c={c} o={1} d={ell(0, 34, 24, 7)} fill={c.it.color ?? c.P.gold} /></g>);
    for (idx = 1; idx < base; idx++) els.push(coin(idx, c.built + (idx - 1) * Math.round(0.09 * c.fps)));
    for (const a of adds) for (let j = 0; j < (a.a.n ?? 3); j++, idx++) els.push(coin(idx, c.t - a.t + j * Math.round(0.09 * c.fps)));
    const topY = 34 - (Math.min(total, idx) - 1) * 6.5;
    return <g>{els}{c.part(1).f > 0.6 && <T x={0} y={topY} s={7} fill={c.P.ink} family={fonts.anton} weight={400}>₹</T>}</g>;
  },
};

// CASH: a small stack of banknotes
const cash: Obj = {
  parts: 3,
  draw: (c) => {
    const col = c.it.color ?? '#8fd1a5';
    return (
      <g>
        {[2, 1, 0].map((i) => (
          <g key={i} transform={`translate(${i * 4},${i * -5}) rotate(${(i - 1) * -3})`}>
            <D c={c} o={i === 0 ? 0 : 0} d={rr(-46, -22, 92, 44, 4)} fill={mix(col, '#000000', i * 0.08)} />
            {i === 0 && <D c={c} o={1} d={rr(-40, -16, 80, 32, 2)} fill="none" w={1.2} />}
            {i === 0 && <D c={c} o={2} d={circ(0, 0, 11)} fill={mix(col, '#ffffff', 0.4)} />}
            {i === 0 && c.part(2).f > 0.5 && <T x={0} y={0.8} s={12} family={fonts.anton} weight={400} fill={c.P.ink}>{c.it.text ?? '₹'}</T>}
          </g>
        ))}
      </g>
    );
  },
};

// BEAKER: a glass that fills to value % (the % counts up beside it); 'fill' {to} changes the level
const beaker: Obj = {
  parts: 3,
  auto: 'fill',
  draw: (c) => {
    const fills = c.acts('fill');
    let level = 0, from = 0;
    for (const f of fills.slice().reverse()) {
      const to = f.a.to ?? c.it.value ?? 70;
      const p = interpolate(f.t, [0, Math.round((f.a.seconds ?? 1.2) * c.fps)], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
      level = from + (to - from) * p;
      from = to;
    }
    const top = -40, bot = 42, h = bot - top;
    const sy = bot - (h - 4) * (level / 100);
    const wave = Math.sin(c.t / 5) * 1.6;
    const glass = `M-28,${top} V${bot - 8} Q-28,${bot} -20,${bot} H20 Q28,${bot} 28,${bot - 8} V${top}`;
    return (
      <g>
        <defs><clipPath id="bk"><path d={`${glass} Z`} /></clipPath></defs>
        <D c={c} o={0} d={`${glass} Z`} fill="#ffffff" stroke={null} op={0.6} />
        {level > 0 && <path clipPath="url(#bk)" d={`M-30,${sy + wave} Q-15,${sy - wave * 1.6} 0,${sy} T30,${sy - wave} V${bot + 2} H-30 Z`} fill={c.it.color ?? c.P.blue} opacity={0.9} />}
        <D c={c} o={0} d={glass} />
        <D c={c} o={1} d={`M-32,${top} H32`} cap />
        {[0.25, 0.5, 0.75].map((g) => <D key={g} c={c} o={2} d={`M28,${bot - h * g} H20`} w={1.6} />)}
        {fills.length > 0 && (
          <T x={46} y={sy} s={11} anchor="start" family={fonts.anton} weight={400} fill={c.P.ink}>{`${Math.round(level)}%`}</T>
        )}
      </g>
    );
  },
};

// CLOCK: 'spin' {seconds} = time flies (hands race round); otherwise the minute hand ticks
const clock: Obj = {
  parts: 4,
  draw: (c) => {
    const sp = c.acts('spin');
    let turns = (c.t / c.fps) * 0.02;
    for (const s of sp) turns += interpolate(s.t, [0, Math.round((s.a.seconds ?? 1.2) * c.fps)], [0, s.a.n ?? 3], {...clamp, easing: Easing.inOut(Easing.cubic)});
    const m = turns * 360, h = 300 + turns * 30;
    const k = c.part(3).f;
    return (
      <g>
        <D c={c} o={0} d={circ(0, 0, 42)} fill={c.it.color ?? '#ffffff'} />
        <D c={c} o={0} d={circ(0, 0, 36)} w={1} />
        {Array.from({length: 12}, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const r0 = i % 3 ? 31 : 28;
          return <D key={i} c={c} o={1} d={`M${Math.sin(a) * r0},${-Math.cos(a) * r0} L${Math.sin(a) * 34},${-Math.cos(a) * 34}`} w={i % 3 ? 1.6 : 2.6} cap />;
        })}
        {k > 0 && (
          <g opacity={k}>
            <line x1={0} y1={0} x2={0} y2={-18} stroke={c.P.ink} strokeWidth={4} strokeLinecap="round" transform={`rotate(${h})`} />
            <line x1={0} y1={0} x2={0} y2={-28} stroke={c.it.accent ?? c.P.red} strokeWidth={2.6} strokeLinecap="round" transform={`rotate(${m})`} />
            <circle r={3.2} fill={c.P.ink} />
          </g>
        )}
        <D c={c} o={2} d={rr(-6, -52, 12, 8, 2)} fill={c.P.mid} />
      </g>
    );
  },
};

// BOX: a parcel whose flaps fold open on 'open'
const box: Obj = {
  parts: 3,
  draw: (c) => {
    const op = c.act('open');
    const p = op ? interpolate(op.t, [0, Math.round(0.45 * c.fps)], [0, 1], {...clamp, easing: back}) : 0;
    const col = c.it.color ?? '#d9a66b';
    return (
      <g>
        <g transform={`rotate(${-p * 125},-38,-12)`}><D c={c} o={2} d="M-38,-12 L0,-12 L-6,-24 L-42,-24 Z" fill={mix(col, '#ffffff', 0.15)} /></g>
        <g transform={`rotate(${p * 125},38,-12)`}><D c={c} o={2} d="M38,-12 L0,-12 L6,-24 L42,-24 Z" fill={mix(col, '#ffffff', 0.15)} /></g>
        <D c={c} o={0} d={rr(-38, -12, 76, 52, 3)} fill={col} />
        <D c={c} o={1} d={rr(-7, -12, 14, 22, 0)} fill={mix(col, '#000000', 0.15)} />
        {c.it.text && <T x={0} y={24} s={8} family={fonts.anton} weight={400} fill={c.P.ink} op={c.part(1).f}>{c.it.text}</T>}
      </g>
    );
  },
};

// DOCUMENT: a page (bill, contract, report) with lines; 'stamp' {text, color} slams a stamp onto it
const documentObj: Obj = {
  parts: 4,
  draw: (c) => {
    const lines = c.it.lines;
    const st = c.act('stamp');
    const sp = st ? interpolate(st.t, [0, Math.round(0.18 * c.fps)], [0, 1], {...clamp, easing: Easing.in(Easing.quad)}) : 0;
    const shake = st && st.t > 5 && st.t < 11 ? Math.sin(st.t * 3) * 1.5 : 0;
    const sc = st?.a.color ?? c.P.red;
    return (
      <g transform={`translate(${shake},0)`}>
        <D c={c} o={0} d="M-32,-44 H18 L32,-30 V44 H-32 Z" fill={c.it.color ?? '#ffffff'} />
        <D c={c} o={1} d="M18,-44 V-30 H32" fill={c.P.light} />
        {c.it.text && <T x={-25} y={-34} s={6.4} anchor="start" op={c.part(2).f}>{c.it.text}</T>}
        {(lines ?? Array(6).fill('')).map((l, i) => l
          ? <T key={i} x={-25} y={-22 + i * 8} s={4.4} anchor="start" weight={500} op={c.part(3).f}>{l}</T>
          : <D key={i} c={c} o={3} d={`M-25,${-22 + i * 9} H${i % 3 === 2 ? 0 : 22}`} w={2.4} stroke={c.P.mid} cap />)}
        {st && (
          <g transform={`translate(0,8) rotate(-14) scale(${2.4 - 1.4 * sp})`} opacity={sp}>
            <rect x={-(st.a.text ?? 'PAID').length * 3.6 - 6} y={-9} width={(st.a.text ?? 'PAID').length * 7.2 + 12} height={18} rx={2} fill="none" stroke={sc} strokeWidth={2.6} />
            <T x={0} y={0.8} s={12} family={fonts.anton} weight={400} fill={sc}>{st.a.text ?? 'PAID'}</T>
          </g>
        )}
      </g>
    );
  },
};

// SVG: any vector file, drawn on with the same rules (outline traces in, colours flood in)
const SvgObj: React.FC<{c: Ctx}> = ({c}) => {
  const [src, setSrc] = useState<{html: string; n: number} | null>(null);
  const [handle] = useState(() => (c.it.src ? delayRender(`illo svg ${c.it.src}`) : null));
  useEffect(() => {
    if (!c.it.src || handle == null) return;
    fetch(c.it.src.startsWith('http') ? c.it.src : staticFile(c.it.src))
      .then((r) => r.text())
      .then((txt) => {
        let n = 0;
        const html = txt
          .replace(/<\?xml[^>]*>|<!DOCTYPE[^>]*>/gi, '')
          .replace(/<svg\b([^>]*)>/i, (_m, a: string) => `<svg${a.replace(/\s(width|height)="[^"]*"/gi, '')} width="100%" height="100%" overflow="visible">`)
          .replace(/<(path|circle|rect|ellipse|polygon|polyline|line)\b([^>]*?)(\/?)>/gi, (_m, tag: string, a: string, sl: string) =>
            `<${tag}${a} pathLength="1" data-d="${n++}"${/stroke=|stroke:/.test(a) ? ' data-s="1"' : ''}${sl}>`);
        setSrc({html, n});
        continueRender(handle);
      })
      .catch(() => continueRender(handle));
  }, [c.it.src, handle]);
  if (!src) return null;
  // spread the draw over the build time: shapes in file order (designers usually draw back to front)
  const css: string[] = [];
  const keep = c.it.outline !== false;
  for (let i = 0; i < src.n; i++) {
    const {k, f} = c.part(Math.floor((i / Math.max(1, src.n)) * 8));
    css.push(`[data-d="${i}"]{stroke-dasharray:1 1;stroke-dashoffset:${(1 - k).toFixed(3)};fill-opacity:${f.toFixed(3)};opacity:${k > 0 ? 1 : 0}}`);
    css.push(`[data-d="${i}"]:not([data-s]){stroke:${c.P.ink};stroke-width:${SW * 1.1}px;vector-effect:non-scaling-stroke;stroke-linejoin:round;stroke-opacity:${keep ? 1 : 1 - f}}`);
  }
  const id = `svg${Math.abs(Math.round((c.it.x ?? 0.5) * 1000 + (c.it.y ?? 0.5) * 7))}`;
  return (
    <foreignObject x={-50} y={-50} width={100} height={100} style={{overflow: 'visible'}}>
      <div id={id} style={{width: '100%', height: '100%'}}>
        <style>{css.map((r) => `#${id} ${r}`).join('\n')}</style>
        <div style={{width: '100%', height: '100%'}} dangerouslySetInnerHTML={{__html: src.html}} />
      </div>
    </foreignObject>
  );
};

const OBJS: Record<string, Obj> = {
  printer, globe, satellite, phone, laptop, bulb, coins, cash, beaker, clock, box, document: documentObj,
  svg: {parts: 8, draw: (c) => <SvgObj c={c} />},
};
export const ILLO_OBJECTS = Object.keys(OBJS);

// ── one item: placement, build, idle life, generic acts, exit ────────────────────────────────────────────────────
const Item: React.FC<{it: IlloItem; t: number; frames: number; P: Required<IlloPalette>; pos: {x: number; y: number; rot: number}; U: number; z: number}> = ({it, t, frames, P, pos, U, z}) => {
  const {fps} = useVideoConfig();
  const obj = OBJS[it.obj] ?? OBJS.box;
  const lt = t - it.at;
  if (lt < 0) return null;
  const enter = it.enter ?? 'draw';
  const B = Math.round((it.build ?? 0.9) * fps);
  const N = obj.parts;
  const built = enter === 'draw' ? B + Math.round(0.25 * fps) : Math.round(0.35 * fps);
  const part = (o: number) => {
    if (enter !== 'draw') return {k: 1, f: 1};
    const s = (o / N) * B * 0.65, d = Math.max(4, B * 0.45);
    const k = interpolate(lt, [s, s + d], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
    const f = interpolate(lt, [s + d * 0.7, s + d * 0.7 + Math.round(0.22 * fps)], [0, 1], {...clamp, easing: easeOut});
    return {k, f};
  };
  // acts: explicit ones (frames from the insert start) + the object's own act right after the build
  const all: IlloAct[] = [...(it.acts ?? [])];
  if (obj.auto && !all.some((a) => a.do === obj.auto)) all.push({at: it.at + built, do: obj.auto});
  const acts = (name: string) => all.filter((a) => a.do === name && t >= a.at).map((a) => ({t: t - a.at, a})).sort((a, b) => a.t - b.t);
  const c: Ctx = {t: lt, fps, P, it, main: it.color ?? P.light, acc: it.accent ?? P.accent, built, part, act: (n) => acts(n)[0] ?? null, acts};
  // entrance (pop / drop) and the generic acts
  let sc = 1, dy = 0, rot = 0, op = 1, blur = 0;
  if (enter === 'pop') sc = interpolate(lt, [0, Math.round(0.35 * fps)], [0.3, 1], {...clamp, easing: back});
  if (enter === 'drop') dy = interpolate(lt, [0, Math.round(0.4 * fps)], [-140, 0], {...clamp, easing: Easing.bounce});
  if (it.idle !== 'none' && !it.orbit) dy += Math.sin((lt / fps) * 2.2 + it.at) * 1.2;
  const pop = c.act('pop');
  if (pop) sc *= 1 + 0.14 * Math.sin(Math.min(1, pop.t / (0.3 * fps)) * Math.PI);
  const shake = c.act('shake');
  if (shake && shake.t < 0.45 * fps) rot += Math.sin(shake.t * 2.2) * 7 * (1 - shake.t / (0.45 * fps));
  const fall = c.act('fall');
  if (fall) {
    const s = fall.t / fps;
    dy += Math.max(0, s - 0.12) ** 2 * 900; // a small hang, then gravity
    rot += interpolate(fall.t, [0, 4, 30], [0, -6, 70], clamp);
  }
  // exit: an 'out' act, the item's own out, or the end of the insert: drifts up, blurs, fades (~0.3 s)
  const outAt = Math.min(all.find((a) => a.do === 'out')?.at ?? Infinity, it.out ?? Infinity, frames);
  const xo = interpolate(t, [outAt - Math.round(0.3 * fps), outAt], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  if (xo >= 1) return null;
  dy -= xo * 60;
  op *= 1 - xo;
  blur += xo * 8;
  const S = (it.size ?? 0.5) * U; // px per 100 units
  const label = it.label;
  const lp = label ? interpolate(lt, [built, built + Math.round(0.3 * fps)], [0, 1], {...clamp, easing: back}) : 0;
  return (
    <div style={{position: 'absolute', left: pos.x - S * 0.6, top: pos.y - S * 0.6, width: S * 1.2, height: S * 1.2, zIndex: z, opacity: op,
      transform: `translateY(${(dy * S) / 100}px) rotate(${(it.rot ?? 0) + rot + pos.rot}deg) scale(${sc}) ${it.flip ? 'scaleX(-1)' : ''}`,
      filter: `${blur > 0.3 ? `blur(${blur}px) ` : ''}drop-shadow(0 ${S * 0.03}px ${S * 0.05}px rgba(0,0,0,0.18))`}}>
      <svg viewBox="-60 -60 120 120" width="100%" height="100%" style={{overflow: 'visible'}}>{obj.draw(c)}</svg>
      {label && lp > 0 && (
        <div style={{position: 'absolute', left: 0, width: '100%', top: S * 1.08, textAlign: 'center'}}>
          <span style={{display: 'inline-block', transform: `scale(${lp})`, fontFamily: fonts.anton, fontSize: Math.max(U * 0.04, S * 0.12), color: isLight(P.paper) ? P.ink : '#fff',
            letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap'}}>{label}</span>
        </div>
      )}
    </div>
  );
};

// ── the board ───────────────────────────────────────────────────────────────────────────────────────────────────
export const Illo: React.FC<{x: IlloSpec & {frames: number}; t: number}> = ({x: raw, t}) => {
  const {fps, width: W, height: H} = useVideoConfig();
  // times are frames from the insert start (plan.mjs converts word / s); vlog gfx may give seconds (s) directly
  const fr = <O extends {at?: number; s?: number}>(o: O) => ({...o, at: o.at ?? Math.round((o.s ?? 0) * fps)});
  const x = {...raw, items: (raw.items ?? []).map((it) => ({...fr(it as IlloItem & {s?: number}), acts: (it.acts ?? []).map((a) => fr(a as IlloAct & {s?: number})), pins: (it.pins ?? []).map((p) => fr(p as IlloPin & {s?: number}))}))};
  const U = Math.min(W, H * 0.5625);
  const bg = x.bg ?? PAL.paper;
  const P = {...PAL, paper: x.style === 'full' ? bg : PAL.paper, ...(x.palette ?? {})} as Required<IlloPalette>;
  const full = x.style === 'full';
  const items = x.items ?? [];
  // fixed positions first, then orbiters around them (front half above the centre object, back half behind it)
  const base = items.map((it) => ({x: (it.x ?? 0.5) * W, y: (it.y ?? 0.45) * H, rot: 0}));
  const zs = items.map((_, i) => 10 + i * 10);
  items.forEach((it, i) => {
    const o = it.orbit;
    if (!o) return;
    const ci = typeof o.around === 'number' ? o.around : -1;
    const cx = ci >= 0 ? base[ci].x : (Array.isArray(o.around) ? o.around[0] : 0.5) * W;
    const cy = ci >= 0 ? base[ci].y : (Array.isArray(o.around) ? o.around[1] : 0.45) * H;
    const a = (o.phase ?? 0) * rad + ((t - it.at) / fps / (o.period ?? 4)) * Math.PI * 2;
    const rx = (o.rx ?? 0.4) * U, ry = (o.ry ?? 0.12) * U, tl = (o.tilt ?? -12) * rad;
    const ex = Math.cos(a) * rx, ey = Math.sin(a) * ry;
    base[i] = {x: cx + ex * Math.cos(tl) - ey * Math.sin(tl), y: cy + ex * Math.sin(tl) + ey * Math.cos(tl), rot: (o.tilt ?? -12) + Math.cos(a) * 10};
    if (ci >= 0) zs[i] = zs[ci] + (Math.sin(a) > 0 ? 5 : -5);
  });
  const zoom = full ? interpolate(t, [0, x.frames], [1, x.zoom ?? 1.05], clamp) : 1;
  const bgIn = full ? interpolate(t, [0, Math.round(0.2 * fps)], [0, 1], clamp) : 1;
  return (
    <AbsoluteFill>
      {full && <AbsoluteFill style={{background: bg, opacity: bgIn}} />}
      <AbsoluteFill style={{transform: `scale(${zoom})`}}>
        {items.map((it, i) => <Item key={i} it={it} t={t} frames={x.frames} P={P} pos={base[i]} U={U} z={zs[i]} />)}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
export const IlloFull: React.FC<{x: IlloSpec & {frames: number}}> = ({x}) => <Illo x={x} t={useCurrentFrame()} />;
