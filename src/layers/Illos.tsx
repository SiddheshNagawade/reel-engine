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
//   bottle · person · drop · coin · jar · car   small icons: alone, as travellers, or as swarm copies
//   route     a path drawn across the board (road with a dashed centre line, dotted trajectory, thin line, or a
//             coloured trail that grows behind a traveller); points in frame fractions, 2 points + bend = an arc
//   swarm     MANY-INTO-ONE: n copies of an object pop into a grid (a counter counts them up), then on 'pour' they
//             fly one after another along arcs INTO another item (the container), which pops; a result label lands
// PATH-FOLLOW: any item can 'travel' (act) along a route, a list of points, or an arc to another item, landing with a
// pop exactly on the act's end (brain/animation-system.md: "travels, drives, journey" / "concentrated, X becomes Y").
// Every object is DRAWN ON, never popped in: its outlines trace in part by part (~0.9 s), then the flat colours flood
// in, then it lives (gentle float) and reacts on his words (acts). Generic acts for every object: pop, shake, fall
// (gravity, out of frame: "this idea died"), out. One insert = a small board of objects (items) that build in the
// order he says them; style 'full' = its own coloured canvas, 'over' = floating over the footage/canvas.
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Easing, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ease} from '../motion/springs';
import {fonts} from './fonts';
import {isLight} from './Captions';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const back = ease.playful; // pops = the playful spring preset (src/motion/springs.ts)

export type IlloPalette = {ink?: string; paper?: string; light?: string; mid?: string; dark?: string; accent?: string; blue?: string; green?: string; red?: string; gold?: string};
export type Pt = [number, number];
// travel: route (item index of a 'route'), path (points, frame fractions) or target (item index: an arc to it); bend =
// arc height (fraction of the frame's unit width, + = up); turn = the traveller rotates along the path
export type IlloAct = {at: number; do: string; to?: number; n?: number; text?: string; color?: string; seconds?: number;
  route?: number; path?: Pt[]; target?: number; bend?: number; turn?: boolean;
  into?: string; // morph: the object it turns into (analogy → the real thing, same place)
  index?: number; // focus (share/crowd): which person stays
};
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
  // route
  points?: Pt[]; bend?: number; line?: 'road' | 'dotted' | 'line' | 'trail'; follow?: number; // trail: grows behind item `follow`
  // swarm
  of?: string; n?: number; grid?: [number, number, number, number]; cols?: number; into?: number | Pt;
  counter?: {from?: number; to: number; prefix?: string; suffix?: string}; result?: string; stagger?: number;
  // crowd: spell = text the crowd writes in the accent colour (act 'spell'); mark = how many turn accent (act 'mark')
  spell?: string; mark?: number;
  // share: the block (x, y, size) splits on act 'split' into one piece per person (grid), each piece flies to its person
  each?: string; // label after the split ("25 Mbps each")
  // journey: stops (frame fractions) and legs; each leg draws, a dot travels it, and it adds a segment to the total bar
  stops?: {x: number; y: number; label?: string}[];
  legs?: {from: number; to: number; value: number; label?: string; color?: string; dashed?: boolean; at?: number}[];
  bar?: [number, number, number]; unit?: string;
  // stream: copies flow from sources (points, or a ring) into a target while the stream runs
  sources?: Pt[]; ring?: [number, number, number, number]; rate?: number; speed?: number;
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

// ── small icons: alone, as travellers or as swarm copies ─────────────────────────────────────────────────────────
const bottle: Obj = {parts: 3, draw: (c) => (
  <g>
    <D c={c} o={0} d="M-15,-18 Q-15,-27 -8,-31 V-42 H8 V-31 Q15,-27 15,-18 V40 Q15,46 9,46 H-9 Q-15,46 -15,40 Z" fill={c.it.color ?? '#ffffff'} />
    <D c={c} o={1} d={rr(-10, -50, 20, 9, 2)} fill={c.acc} />
    <D c={c} o={2} d={rr(-15, 2, 30, 20, 0)} fill={c.acc} op={0.9} />
  </g>
)};
const person: Obj = {parts: 2, draw: (c) => (
  <g><D c={c} o={0} d={circ(0, -24, 15)} fill={c.it.color ?? c.P.dark} /><D c={c} o={1} d="M-27,42 Q-27,-4 0,-4 Q27,-4 27,42 Z" fill={c.it.color ?? c.P.dark} /></g>
)};
const drop: Obj = {parts: 1, draw: (c) => <D c={c} o={0} d="M0,-42 C14,-18 28,-2 28,14 A28,28 0 0 1 -28,14 C-28,-2 -14,-18 0,-42 Z" fill={c.it.color ?? c.P.blue} />};
const coin: Obj = {parts: 2, draw: (c) => (
  <g>
    <D c={c} o={0} d={circ(0, 0, 32)} fill={c.it.color ?? c.P.gold} />
    <D c={c} o={1} d={circ(0, 0, 23)} w={1.6} />
    {c.part(1).f > 0 && <T x={0} y={2} s={28} family={fonts.anton} weight={400} fill={c.P.ink} op={c.part(1).f}>{c.it.text ?? '₹'}</T>}
  </g>
)};
const jar: Obj = {parts: 3, draw: (c) => (
  <g>
    <D c={c} o={0} d="M-30,-30 H30 V40 Q30,48 22,48 H-22 Q-30,48 -30,40 Z" fill={c.it.color ?? c.P.dark} />
    <D c={c} o={1} d={rr(-33, -44, 66, 15, 4)} fill={c.acc} />
    <D c={c} o={2} d={rr(-22, -12, 44, 34, 3)} fill="#ffffff" />
    {c.part(2).f > 0 && <T x={0} y={5} s={c.it.text && c.it.text.length > 6 ? 7 : 9} family={fonts.anton} weight={400} fill="#1b1b1f" op={c.part(2).f}>{c.it.text ?? 'PROTEIN'}</T>}
  </g>
)};
const car: Obj = {parts: 4, draw: (c) => (
  <g>
    <D c={c} o={0} d="M-44,10 V-2 Q-44,-8 -36,-9 L-24,-11 L-14,-26 Q-11,-30 -5,-30 H18 Q24,-30 27,-25 L35,-11 Q44,-9 44,-1 V10 Z" fill={c.it.color ?? c.P.red} />
    <D c={c} o={1} d="M-11,-24 H4 V-12 H-19 Z M9,-24 H22 L28,-12 H9 Z" fill="#ffffff" op={0.85} />
    <D c={c} o={2} d={circ(-24, 12, 10)} fill={c.P.dark} />
    <D c={c} o={3} d={circ(24, 12, 10)} fill={c.P.dark} />
  </g>
)};

// FLASHLIGHT: a torch pointing down with its light cone and spot (the everyday analogy for coverage / reach)
const flashlight: Obj = {parts: 4, draw: (c) => {
  const w = c.it.value ?? 30; // spot half-width
  return (
    <g>
      {c.part(3).k > 0 && <path d={`M-9,-6 L${-w},52 L${w},52 L9,-6 Z`} fill={c.acc} opacity={0.28 * c.part(3).k} />}
      <D c={c} o={3} d={ell(0, 52, w, w * 0.18)} fill={c.acc} op={0.6} />
      <D c={c} o={0} d={rr(-7, -52, 14, 40, 4)} fill={c.it.color ?? c.P.dark} />
      <D c={c} o={1} d="M-7,-14 L-11,-6 H11 L7,-14 Z" fill={c.P.mid} />
      <D c={c} o={2} d={rr(-3, -40, 6, 6, 1)} fill={c.acc} />
    </g>
  );
}};

const OBJS: Record<string, Obj> = {
  printer, globe, satellite, phone, laptop, bulb, coins, cash, beaker, clock, box, document: documentObj,
  bottle, person, drop, coin, jar, car, flashlight,
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
      {(() => {
        // MORPH (analogy → the real thing): the object shrinks away while the new one pops in at the same spot (~0.3 s)
        const mo = c.act('morph');
        const svg = (node: React.ReactNode, st?: React.CSSProperties) => (
          <svg viewBox="-60 -60 120 120" width="100%" height="100%" style={{overflow: 'visible', position: 'absolute', inset: 0, ...st}}>{node}</svg>
        );
        if (!mo || !mo.a.into) return svg(obj.draw(c), {position: 'relative'});
        const k = interpolate(mo.t, [0, Math.round(0.3 * fps)], [0, 1], clamp);
        const nx = {...it, obj: mo.a.into, color: mo.a.color ?? it.color, text: mo.a.text ?? it.text};
        const c2: Ctx = {...c, it: nx, main: nx.color ?? P.light, part: () => ({k: 1, f: 1})};
        const o2 = OBJS[mo.a.into] ?? OBJS.box;
        return (
          <div style={{position: 'relative', width: '100%', height: '100%'}}>
            {k < 1 && svg(obj.draw(c), {opacity: 1 - k, transform: `scale(${1 - 0.5 * k})`, filter: `blur(${k * 4}px)`})}
            {svg(o2.draw(c2), {opacity: Math.min(1, k * 1.6), transform: `scale(${0.5 + 0.5 * back(k)})`})}
          </div>
        );
      })()}
      {label && lp > 0 && (
        <div style={{position: 'absolute', left: 0, width: '100%', top: S * 1.08, textAlign: 'center'}}>
          <span style={{display: 'inline-block', transform: `scale(${lp})`, fontFamily: fonts.anton, fontSize: Math.max(U * 0.04, S * 0.12), color: isLight(P.paper) ? P.ink : '#fff',
            letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap'}}>{label}</span>
        </div>
      )}
    </div>
  );
};

// ── paths: smooth curves through points, arcs, and a position at any fraction of the length ──────────────────────
function smooth(pts: Pt[], per = 24): Pt[] {
  if (pts.length < 3) {
    const [a, b] = [pts[0], pts[pts.length - 1]];
    return Array.from({length: per + 1}, (_, i) => [a[0] + ((b[0] - a[0]) * i) / per, a[1] + ((b[1] - a[1]) * i) / per] as Pt);
  }
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((d) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3)) as Pt);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
// an arc from a to b; bend in px (+ = bulges up)
function arc2(a: Pt, b: Pt, bend: number, per = 40): Pt[] {
  const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
  let nx = -dy / L, ny = dx / L;
  if (ny > 0) { nx = -nx; ny = -ny; } // the normal that points up
  const c: Pt = [m[0] + nx * bend * 2, m[1] + ny * bend * 2];
  return Array.from({length: per + 1}, (_, i) => {
    const t = i / per, u = 1 - t;
    return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]] as Pt;
  });
}
function along(poly: Pt[], p: number): {pt: Pt; ang: number} {
  const L: number[] = [0];
  for (let i = 1; i < poly.length; i++) L.push(L[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]));
  const want = Math.max(0, Math.min(1, p)) * L[L.length - 1];
  let i = 1;
  while (i < poly.length - 1 && L[i] < want) i++;
  const seg = L[i] - L[i - 1] || 1, k = (want - L[i - 1]) / seg;
  const a = poly[i - 1], b = poly[i];
  return {pt: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], ang: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI};
}
const polyD = (poly: Pt[]) => poly.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ');
const routePoly = (it: IlloItem, W: number, H: number, U: number) => {
  const pts = (it.points ?? [[0.2, 0.8], [0.8, 0.2]]).map(([x, y]) => [x * W, y * H] as Pt);
  return pts.length === 2 && it.bend ? arc2(pts[0], pts[1], it.bend * U) : smooth(pts);
};
const travelDur = (a: IlloAct, fps: number) => Math.round((a.seconds ?? 1.2) * fps);
const glide = Easing.bezier(0.45, 0, 0.25, 1); // slow start, travels, settles

// ROUTE: drawn across the board (behind the other items); trail = grows behind the item it follows
const Route: React.FC<{it: IlloItem; t: number; frames: number; poly: Pt[]; P: Required<IlloPalette>; U: number; follow: number | null}> = ({it, t, frames, poly, P, U, follow}) => {
  const {fps} = useVideoConfig();
  const lt = t - it.at;
  if (lt < 0) return null;
  const k = follow ?? interpolate(lt, [0, Math.round((it.build ?? 0.9) * fps)], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
  const outAt = Math.min(it.out ?? Infinity, frames);
  const op = 1 - interpolate(t, [outAt - Math.round(0.3 * fps), outAt], [0, 1], clamp);
  const d = polyD(poly), line = it.line ?? 'road';
  const dash = {pathLength: 1, strokeDasharray: '1 1', strokeDashoffset: 1 - k};
  const col = it.color ?? (line === 'trail' ? P.accent : line === 'road' ? P.dark : P.ink);
  if (k <= 0 || op <= 0) return null;
  return (
    <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, overflow: 'visible', opacity: op}}>
      {line === 'road' && (
        <>
          <path d={d} {...dash} fill="none" stroke={col} strokeWidth={U * 0.075} strokeLinecap="round" strokeLinejoin="round" />
          {/* the dashed centre line appears only where the road already is */}
          <mask id={`rm${it.at}`}><path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} fill="none" stroke="#fff" strokeWidth={U * 0.08} /></mask>
          <path d={d} mask={`url(#rm${it.at})`} fill="none" stroke="#ffffff" strokeWidth={U * 0.007} strokeDasharray={`${U * 0.025} ${U * 0.022}`} strokeLinecap="round" />
        </>
      )}
      {line === 'dotted' && (
        <>
          <mask id={`dm${it.at}`}><path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} fill="none" stroke="#fff" strokeWidth={U * 0.03} /></mask>
          <path d={d} mask={`url(#dm${it.at})`} fill="none" stroke={col} strokeWidth={U * 0.008} strokeDasharray={`0 ${U * 0.022}`} strokeLinecap="round" opacity={0.7} />
        </>
      )}
      {(line === 'line' || line === 'trail') && (
        <path d={d} {...dash} fill="none" stroke={col} strokeWidth={U * (line === 'trail' ? 0.012 : 0.005)} strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
};

// a copy of an object drawn already finished (swarm copies)
const still = (of: string, P: Required<IlloPalette>, fps: number, it: IlloItem): Ctx => ({
  t: 999, fps, P, it: {...it, obj: of}, main: it.color ?? P.light, acc: it.accent ?? P.accent, built: 0,
  part: () => ({k: 1, f: 1}), act: () => null, acts: () => [],
});
// SWARM: copies pop into a grid (counter counts them), then on 'pour' fly along arcs into the container, one after another
const Swarm: React.FC<{it: IlloItem; t: number; frames: number; P: Required<IlloPalette>; U: number; W: number; H: number; target: Pt | null}> = ({it, t, frames, P, U, W, H, target}) => {
  const {fps} = useVideoConfig();
  const lt = t - it.at;
  if (lt < 0) return null;
  const n = Math.max(1, it.n ?? 24);
  const [gx, gy, gw, gh] = it.grid ?? [0.1, 0.55, 0.8, 0.3];
  const cols = it.cols ?? Math.ceil(Math.sqrt((n * gw * W) / (gh * H)));
  const rows = Math.ceil(n / cols);
  const cw = (gw * W) / cols, ch = (gh * H) / rows;
  const cell = Math.min(cw, ch) * (it.size ?? 1.15);
  const obj = OBJS[it.of ?? 'drop'] ?? OBJS.drop;
  const appear = Math.round(Math.min(1.6, 0.4 + n * 0.02) * fps);
  const pour = (it.acts ?? []).find((a) => a.do === 'pour' && t >= a.at);
  const fly = Math.round(0.6 * fps);
  const gap = it.stagger != null ? it.stagger * fps : Math.max(0.6, Math.min(2.5, (1.4 * fps) / n));
  const spots = Array.from({length: n}, (_, i) => [gx * W + cw * ((i % cols) + 0.5), gy * H + ch * (Math.floor(i / cols) + 0.5)] as Pt);
  // the ones nearest the container leave first
  const order = target ? spots.map((s, i) => ({i, d: Math.hypot(s[0] - target[0], s[1] - target[1])})).sort((a, b) => a.d - b.d).map((o) => o.i) : spots.map((_, i) => i);
  const rank = new Array(n);
  order.forEach((i, r) => (rank[i] = r));
  const c = still(it.of ?? 'drop', P, fps, it);
  const outAt = Math.min(it.out ?? Infinity, frames);
  const xo = interpolate(t, [outAt - Math.round(0.3 * fps), outAt], [0, 1], clamp);
  const cnt = it.counter;
  const cp = interpolate(lt, [0, appear], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});
  const pourT = pour ? t - pour.at : -1;
  const cntOp = (pour ? 1 - interpolate(pourT, [0, Math.round(0.3 * fps)], [0, 1], clamp) : 1) * interpolate(lt, [0, 6], [0, 1], clamp) * (1 - xo);
  return (
    <>
      {spots.map((s, i) => {
        const a0 = (i / n) * appear;
        const pin = interpolate(lt, [a0, a0 + Math.round(0.25 * fps)], [0, 1], {...clamp, easing: back});
        if (pin <= 0) return null;
        let pos = s, sc = pin, op = 1 - xo, rot = 0;
        if (pour && target) {
          const s0 = rank[i] * gap;
          const p = interpolate(pourT, [s0, s0 + fly], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
          if (p >= 1) return null;
          if (p > 0) {
            const path = arc2(s, target, Math.max(U * 0.12, Math.abs(s[0] - target[0]) * 0.35));
            const at = along(path, p);
            pos = at.pt;
            rot = p * 160;
            sc *= 1 - 0.55 * p;
            op *= interpolate(p, [0.8, 1], [1, 0], clamp);
          }
        }
        return (
          <div key={i} style={{position: 'absolute', left: pos[0] - cell / 2, top: pos[1] - cell / 2, width: cell, height: cell, opacity: op,
            transform: `scale(${sc}) rotate(${rot}deg)`, zIndex: 400}}>
            <svg viewBox="-60 -60 120 120" width="100%" height="100%" style={{overflow: 'visible'}}>{obj.draw(c)}</svg>
          </div>
        );
      })}
      {cnt && cntOp > 0 && (
        <div style={{position: 'absolute', left: gx * W, width: gw * W, top: (gy + gh) * H + U * 0.02, textAlign: 'center', fontFamily: fonts.anton, fontSize: U * 0.065,
          color: isLight(P.paper) ? P.ink : '#fff', opacity: cntOp, zIndex: 400}}>
          {`${cnt.prefix ?? ''}${Math.round((cnt.from ?? 0) + (cnt.to - (cnt.from ?? 0)) * cp).toLocaleString('en-IN')}${cnt.suffix ?? ''}`}
        </div>
      )}
    </>
  );
};
// when the last swarm copy lands (frames from the insert start), so the container can pop and the result can appear
const swarmDone = (it: IlloItem, fps: number) => {
  const pour = (it.acts ?? []).find((a) => a.do === 'pour');
  if (!pour) return null;
  const n = Math.max(1, it.n ?? 24);
  const gap = it.stagger != null ? it.stagger * fps : Math.max(0.6, Math.min(2.5, (1.4 * fps) / n));
  return {first: pour.at + Math.round(0.6 * fps), last: pour.at + Math.round((n - 1) * gap + 0.6 * fps)};
};

// ── tiny person glyph (crowds, shares): head + shoulders ──────────────────────────────────────────────────────────
const personD = (x: number, y: number, h: number) => {
  const r = h * 0.2, w = h * 0.42;
  return `M${x - r},${y - h * 0.3} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0 Z M${x - w},${y + h * 0.5} Q${x - w},${y - h * 0.02} ${x},${y - h * 0.02} Q${x + w},${y - h * 0.02} ${x + w},${y + h * 0.5} Z`;
};
const gridSpots = (n: number, g: [number, number, number, number], W: number, H: number, cols?: number) => {
  const [gx, gy, gw, gh] = g;
  const c = cols ?? Math.max(1, Math.round(Math.sqrt((n * gw * W) / (gh * H))));
  const r = Math.ceil(n / c);
  const cw = (gw * W) / c, ch = (gh * H) / r;
  return {cell: Math.min(cw, ch), cols: c, rows: r, pts: Array.from({length: n}, (_, i) => [gx * W + cw * ((i % c) + 0.5), gy * H + ch * (Math.floor(i / c) + 0.5)] as Pt)};
};
// which grid points fall inside the text (drawn once on a hidden canvas)
const spellMask = (text: string, spots: Pt[], g: [number, number, number, number], W: number, H: number) => {
  if (typeof document === 'undefined') return spots.map(() => false);
  const cv = document.createElement('canvas');
  const cw = Math.max(1, Math.round(g[2] * W)), ch = Math.max(1, Math.round(g[3] * H));
  cv.width = cw; cv.height = ch;
  const x = cv.getContext('2d');
  if (!x) return spots.map(() => false);
  let fs = ch * 0.9;
  x.font = `900 ${fs}px Anton, Impact, sans-serif`;
  const tw = x.measureText(text).width;
  if (tw > cw * 0.94) fs *= (cw * 0.94) / tw;
  x.font = `900 ${fs}px Anton, Impact, sans-serif`;
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#000';
  x.fillText(text, cw / 2, ch / 2);
  const data = x.getImageData(0, 0, cw, ch).data;
  return spots.map(([px, py]) => {
    const ix = Math.round(px - g[0] * W), iy = Math.round(py - g[1] * H);
    return ix >= 0 && iy >= 0 && ix < cw && iy < ch && data[(iy * cw + ix) * 4 + 3] > 100;
  });
};

// CROWD PICTOGRAM: tiny people rain in row by row; 'spell' = the crowd writes a number/word in the accent colour;
// 'mark' = the first `mark` people turn accent (a share of the crowd); 'focus' = everyone fades except one who grows
const Crowd: React.FC<{it: IlloItem; t: number; frames: number; P: Required<IlloPalette>; U: number; W: number; H: number}> = ({it, t, frames, P, U, W, H}) => {
  const {fps} = useVideoConfig();
  const lt = t - it.at;
  const n = Math.max(1, it.n ?? 300);
  const g = it.grid ?? [0.08, 0.4, 0.84, 0.4];
  const {cell, cols, pts} = React.useMemo(() => gridSpots(n, g, W, H, it.cols), [n, g.join(), W, H, it.cols]);
  const inText = React.useMemo(() => (it.spell ? spellMask(it.spell, pts, g, W, H) : null), [it.spell, pts]);
  if (lt < 0) return null;
  const rows = Math.ceil(n / cols);
  const rowGap = Math.max(1, (Math.min(1.4, 0.3 + rows * 0.05) * fps) / rows);
  const act = (name: string) => (it.acts ?? []).find((a) => a.do === name && t >= a.at);
  const sp = act('spell'), mk = act('mark'), fo = act('focus');
  const outAt = Math.min(it.out ?? Infinity, frames);
  const xo = interpolate(t, [outAt - Math.round(0.3 * fps), outAt], [0, 1], clamp);
  const ink = it.color ?? (isLight(P.paper) ? P.dark : P.light);
  const acc = it.accent ?? P.accent;
  const markN = it.mark ?? Math.round(n * 0.1);
  const fp = fo ? interpolate(t - fo.at, [0, Math.round(0.5 * fps)], [0, 1], {...clamp, easing: easeOut}) : 0;
  const keep = fo?.index ?? Math.floor(n / 2);
  return (
    <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, overflow: 'visible', opacity: 1 - xo, zIndex: 300}}>
      {pts.map((q, i) => {
        const row = Math.floor(i / cols);
        const a0 = row * rowGap + (i % cols) * 0.15;
        const k = interpolate(lt, [a0, a0 + Math.round(0.2 * fps)], [0, 1], {...clamp, easing: easeOut});
        if (k <= 0) return null;
        let col = ink, h = cell * 0.8, op = k;
        const ripple = (from: number) => interpolate(t - from - (i % cols) * 0.4, [0, 6], [0, 1], clamp); // the colour sweeps left → right
        if (sp && inText?.[i]) col = mix(ink, acc, ripple(sp.at));
        if (mk && i < markN) col = mix(ink, acc, ripple(mk.at));
        if (fo) {
          if (i === keep) { h *= 1 + fp * 5; col = mix(col, acc, fp); } else op *= 1 - fp * 0.92;
        }
        return <path key={i} d={personD(q[0], q[1] - (1 - k) * cell * 0.6, h)} fill={col} opacity={op} />;
      })}
    </svg>
  );
};

// SHARE: one block (x, y, size, label) splits into a piece per person on 'split'; pieces fly to their people (who turn
// accent as theirs lands); the more people, the smaller the crumbs. `each` lands after the split.
const Share: React.FC<{it: IlloItem; t: number; frames: number; P: Required<IlloPalette>; U: number; W: number; H: number}> = ({it, t, frames, P, U, W, H}) => {
  const {fps} = useVideoConfig();
  const lt = t - it.at;
  const n = Math.max(1, it.n ?? 4);
  const g = it.grid ?? [0.6, 0.35, 0.32, 0.3];
  const {cell, pts} = React.useMemo(() => gridSpots(n, g, W, H, it.cols), [n, g.join(), W, H, it.cols]);
  if (lt < 0) return null;
  const bx = (it.x ?? 0.3) * W, by = (it.y ?? 0.5) * H, bs = (it.size ?? 0.22) * U;
  const acc = it.accent ?? P.accent, ink = it.color ?? (isLight(P.paper) ? P.dark : P.light);
  const appear = interpolate(lt, [0, Math.round(0.35 * fps)], [0, 1], {...clamp, easing: back});
  const split = (it.acts ?? []).find((a) => a.do === 'split' && t >= a.at);
  const st = split ? t - split.at : -1;
  const sc = Math.ceil(Math.sqrt(n)), piece = bs / sc;
  const crack = split ? interpolate(st, [0, Math.round(0.35 * fps)], [0, 1], {...clamp, easing: easeOut}) : 0; // pieces drift apart
  const fly = Math.round(0.6 * fps);
  const gap = Math.max(0.3, Math.min(3, (1.2 * fps) / n));
  const outAt = Math.min(it.out ?? Infinity, frames);
  const xo = interpolate(t, [outAt - Math.round(0.3 * fps), outAt], [0, 1], clamp);
  const fo = (it.acts ?? []).find((a) => a.do === 'focus' && t >= a.at);
  const fp = fo ? interpolate(t - fo.at, [0, Math.round(0.5 * fps)], [0, 1], {...clamp, easing: easeOut}) : 0;
  const keep = fo?.index ?? 0;
  const lastLand = Math.round(0.4 * fps) + (n - 1) * gap + fly;
  const eachK = split && it.each ? interpolate(st, [lastLand, lastLand + Math.round(0.3 * fps)], [0, 1], {...clamp, easing: back}) : 0;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: 1 - xo, zIndex: 300}}>
      <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        {pts.map((q, i) => {
          const land = split ? interpolate(st, [Math.round(0.4 * fps) + i * gap + fly - 2, Math.round(0.4 * fps) + i * gap + fly + 3], [0, 1], clamp) : 0;
          let h = Math.min(cell * 0.8, U * 0.12), op = appear;
          if (fo) { if (i === keep) h *= 1 + fp * 1.5; else op *= 1 - fp * 0.9; }
          return <path key={i} d={personD(q[0], q[1], h)} fill={mix(ink, acc, land)} opacity={op} />;
        })}
        {Array.from({length: n}, (_, i) => {
          const hx = bx - bs / 2 + piece * ((i % sc) + 0.5), hy = by - bs / 2 + piece * (Math.floor(i / sc) + 0.5);
          if (!split) return i === 0 ? <rect key="b" x={bx - (bs * appear) / 2} y={by - (bs * appear) / 2} width={bs * appear} height={bs * appear} rx={bs * 0.06} fill={acc} /> : null;
          const s0 = Math.round(0.4 * fps) + i * gap;
          const p = interpolate(st, [s0, s0 + fly], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
          if (p >= 1) return null;
          const home: Pt = [bx + (hx - bx) * (1 + crack * 0.25), by + (hy - by) * (1 + crack * 0.25)];
          const tgt = pts[i];
          const at = p > 0 ? along(arc2(home, [tgt[0], tgt[1] - cell * 0.1], U * 0.06), p).pt : home;
          const w = piece * (1 - 0.6 * p) * (1 - crack * 0.12);
          return <rect key={i} x={at[0] - w / 2} y={at[1] - w / 2} width={w} height={w} rx={w * 0.12} fill={acc} />;
        })}
      </svg>
      {it.label && !split && (
        <div style={{position: 'absolute', left: bx - bs, width: bs * 2, top: by + bs * 0.62, textAlign: 'center', fontFamily: fonts.anton, fontSize: U * 0.055,
          color: isLight(P.paper) ? P.ink : '#fff', opacity: appear}}>{it.label}</div>
      )}
      {eachK > 0 && (
        <div style={{position: 'absolute', left: g[0] * W, width: g[2] * W, top: (g[1] + g[3]) * H + U * 0.02, textAlign: 'center', fontFamily: fonts.anton, fontSize: U * 0.06,
          color: acc, transform: `scale(${eachK})`}}>{it.each}</div>
      )}
    </div>
  );
};

// JOURNEY: stops + legs. Each leg: its line draws, a dot travels it leaving a trail, and a segment joins the total bar
// at the bottom with the leg's value; the total lands at the end ("1,44,000 km")
const Journey: React.FC<{it: IlloItem; t: number; frames: number; P: Required<IlloPalette>; U: number; W: number; H: number}> = ({it, t, frames, P, U, W, H}) => {
  const {fps} = useVideoConfig();
  const lt = t - it.at;
  if (lt < 0) return null;
  const stops = (it.stops ?? []).map((s) => ({...s, p: [s.x * W, s.y * H] as Pt}));
  const legs = it.legs ?? [];
  const dur = Math.round((it.speed ?? 0.9) * fps);
  const starts = legs.map((l, i) => l.at ?? it.at + Math.round(0.5 * fps) + i * (dur + Math.round(0.35 * fps)));
  const total = legs.reduce((a, l) => a + l.value, 0) || 1;
  const [bx, by, bw] = it.bar ?? [0.1, 0.86, 0.8];
  const acc = it.accent ?? P.accent, ink = isLight(P.paper) ? P.ink : '#f2efe8';
  const outAt = Math.min(it.out ?? Infinity, frames);
  const xo = interpolate(t, [outAt - Math.round(0.3 * fps), outAt], [0, 1], clamp);
  const appear = interpolate(lt, [0, Math.round(0.3 * fps)], [0, 1], clamp);
  let acc0 = 0;
  const done = legs.length ? starts[legs.length - 1] + dur : 0;
  const totK = interpolate(t, [done + 4, done + 4 + Math.round(0.3 * fps)], [0, 1], {...clamp, easing: back});
  const fs = U * 0.032;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: 1 - xo, zIndex: 250}}>
      <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        {legs.map((l, i) => {
          const a = stops[l.from]?.p, b = stops[l.to]?.p;
          if (!a || !b) return null;
          const p = interpolate(t, [starts[i], starts[i] + dur], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
          const col = l.color ?? acc;
          const off = U * 0.012 * (l.dashed ? 1 : -1); // there and back sit side by side
          const nx = -(b[1] - a[1]), ny = b[0] - a[0], L = Math.hypot(nx, ny) || 1;
          const A: Pt = [a[0] + (nx / L) * off, a[1] + (ny / L) * off], B: Pt = [b[0] + (nx / L) * off, b[1] + (ny / L) * off];
          const tip: Pt = [A[0] + (B[0] - A[0]) * p, A[1] + (B[1] - A[1]) * p];
          const segX = bx * W + (acc0 / total) * bw * W, segW = (l.value / total) * bw * W * p;
          acc0 += l.value;
          return (
            <g key={i}>
              <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={ink} strokeOpacity={0.15 * appear} strokeWidth={U * 0.003} strokeDasharray={`${U * 0.01} ${U * 0.01}`} />
              {p > 0 && <line x1={A[0]} y1={A[1]} x2={tip[0]} y2={tip[1]} stroke={col} strokeWidth={U * 0.008} strokeLinecap="round" strokeDasharray={l.dashed ? `${U * 0.018} ${U * 0.012}` : undefined} />}
              {p > 0 && p < 1 && <circle cx={tip[0]} cy={tip[1]} r={U * 0.014} fill={col} />}
              {p > 0 && <rect x={segX + 1} y={by * H} width={Math.max(0, segW - 2)} height={U * 0.022} rx={U * 0.004} fill={col} />}
              {p >= 1 && (l.label ?? '') !== '' && (
                <text x={segX + ((l.value / total) * bw * W) / 2} y={by * H + U * 0.055} fontFamily={fonts.inter} fontWeight={700} fontSize={fs * 0.7} fill={ink} textAnchor="middle">{l.label}</text>
              )}
              {p > 0.5 && l.label && (
                <text x={(a[0] + b[0]) / 2 + (nx / L) * U * 0.05} y={(a[1] + b[1]) / 2 + (ny / L) * U * 0.05} fontFamily={fonts.inter} fontWeight={800} fontSize={fs * 0.75} fill={ink}
                  textAnchor="middle" opacity={interpolate(p, [0.5, 0.8], [0, 1], clamp)}>{l.label}</text>
              )}
            </g>
          );
        })}
        <line x1={bx * W} x2={(bx + bw) * W} y1={by * H + U * 0.032} y2={by * H + U * 0.032} stroke={ink} strokeOpacity={0.25 * appear} strokeWidth={1.5} />
      </svg>
      {stops.map((s, i) => s.label ? (
        <div key={i} style={{position: 'absolute', left: s.p[0] - U * 0.2, width: U * 0.4, top: s.p[1] + U * 0.05, textAlign: 'center', fontFamily: fonts.inter, fontWeight: 700,
          fontSize: fs * 0.75, color: ink, opacity: appear}}>{s.label}</div>
      ) : null)}
      {totK > 0 && it.result && (
        <div style={{position: 'absolute', left: bx * W, width: bw * W, top: by * H + U * 0.075, textAlign: 'center', fontFamily: fonts.anton, fontSize: U * 0.07, color: ink,
          transform: `scale(${totK})`}}>{it.result}</div>
      )}
    </div>
  );
};

// STREAM: copies keep flowing from sources (points, or a ring of n spots around a centre) into the target while the
// stream runs (from `at` to `out`): "opportunities coming your way", money pouring in, users signing up
const Stream: React.FC<{it: IlloItem; t: number; frames: number; P: Required<IlloPalette>; U: number; W: number; H: number; target: Pt | null}> = ({it, t, frames, P, U, W, H, target}) => {
  const {fps} = useVideoConfig();
  const lt = t - it.at;
  if (lt < 0 || !target) return null;
  const srcs: Pt[] = it.ring
    ? Array.from({length: Math.max(1, it.ring[3])}, (_, i) => { const a = (i / it.ring![3]) * Math.PI * 2; return [it.ring![0] * W + Math.cos(a) * it.ring![2] * U, it.ring![1] * H + Math.sin(a) * it.ring![2] * U] as Pt; })
    : (it.sources ?? [[0.1, 0.1], [0.9, 0.1], [0.1, 0.9], [0.9, 0.9]]).map(([x, y]) => [x * W, y * H] as Pt);
  const rate = it.rate ?? 6, dur = Math.round((it.speed ?? 1.1) * fps);
  const endAt = Math.min(it.out ?? Infinity, frames) - it.at;
  const obj = OBJS[it.of ?? 'coin'] ?? OBJS.coin;
  const c = still(it.of ?? 'coin', P, fps, it);
  const sz = (it.size ?? 0.06) * U;
  const every = fps / rate;
  const out: React.ReactNode[] = [];
  const first = Math.max(0, Math.floor((lt - dur) / every)), last = Math.floor(Math.min(lt, endAt - dur) / every);
  for (let j = first; j <= last; j++) {
    const born = j * every, p = (lt - born) / dur;
    if (p < 0 || p > 1) continue;
    const s = srcs[(j * 7) % srcs.length];
    const jitter = ((j * 37) % 11) / 11 - 0.5;
    const pt = along(arc2(s, target, U * (0.05 + 0.12 * jitter)), Easing.in(Easing.quad)(p)).pt;
    const op = interpolate(p, [0, 0.15, 0.85, 1], [0, 1, 1, 0], clamp);
    out.push(
      <div key={j} style={{position: 'absolute', left: pt[0] - sz / 2, top: pt[1] - sz / 2, width: sz, height: sz, opacity: op, transform: `scale(${1 - 0.4 * p})`, zIndex: 350}}>
        <svg viewBox="-60 -60 120 120" width="100%" height="100%" style={{overflow: 'visible'}}>{obj.draw(c)}</svg>
      </div>,
    );
  }
  return <>{out}</>;
};

// ── the board ───────────────────────────────────────────────────────────────────────────────────────────────────
export const Illo: React.FC<{x: IlloSpec & {frames: number}; t: number}> = ({x: raw, t}) => {
  const {fps, width: W, height: H} = useVideoConfig();
  // times are frames from the insert start (plan.mjs converts word / s); vlog gfx may give seconds (s) directly
  const fr = <O extends {at?: number; s?: number}>(o: O) => ({...o, at: o.at ?? Math.round((o.s ?? 0) * fps)});
  const x0 = {...raw, items: (raw.items ?? []).map((it) => ({...fr(it as IlloItem & {s?: number}), acts: (it.acts ?? []).map((a) => fr(a as IlloAct & {s?: number})), pins: (it.pins ?? []).map((p) => fr(p as IlloPin & {s?: number}))}))};
  // automatic reactions: a traveller pops when it lands; a swarm's container pops as the first and last copies land
  const extra: IlloAct[][] = x0.items.map(() => []);
  x0.items.forEach((it, i) => {
    for (const a of it.acts ?? []) if (a.do === 'travel') extra[i].push({at: a.at + travelDur(a, fps), do: 'pop'});
    const sd = it.obj === 'swarm' ? swarmDone(it, fps) : null;
    if (sd && typeof it.into === 'number' && x0.items[it.into]) extra[it.into].push({at: sd.first, do: 'pop'}, {at: sd.last, do: 'pop'});
  });
  const x = {...x0, items: x0.items.map((it, i) => (extra[i].length ? {...it, acts: [...(it.acts ?? []), ...extra[i]]} : it))};
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
  // PATH-FOLLOW: items move along routes / point lists / arcs to another item; each travel starts where the last ended
  const routes = items.map((it) => (it.obj === 'route' ? routePoly(it, W, H, U) : null));
  const progress: (number | null)[] = items.map(() => null);
  items.forEach((it, i) => {
    const trips = (it.acts ?? []).filter((a) => a.do === 'travel').sort((a, b) => a.at - b.at);
    let cur: Pt = [base[i].x, base[i].y];
    for (const a of trips) {
      if (t < a.at) break;
      const poly = a.route != null && routes[a.route] ? routes[a.route]!
        : a.path ? smooth([cur, ...a.path.map(([px, py]) => [px * W, py * H] as Pt)])
        : a.target != null && base[a.target] ? arc2(cur, [base[a.target].x, base[a.target].y], (a.bend ?? 0.15) * U)
        : [cur, cur];
      const p = glide(Math.min(1, (t - a.at) / travelDur(a, fps)));
      const {pt, ang} = along(poly, p);
      base[i] = {x: pt[0], y: pt[1], rot: a.turn ? ang : base[i].rot};
      cur = pt;
      progress[i] = p;
    }
  });
  const zoom = full ? interpolate(t, [0, x.frames], [1, x.zoom ?? 1.05], clamp) : 1;
  const bgIn = full ? interpolate(t, [0, Math.round(0.2 * fps)], [0, 1], clamp) : 1;
  return (
    <AbsoluteFill>
      {full && <AbsoluteFill style={{background: bg, opacity: bgIn}} />}
      <AbsoluteFill style={{transform: `scale(${zoom})`}}>
        {items.map((it, i) => it.obj === 'route' ? (
          <div key={i} style={{position: 'absolute', inset: 0, zIndex: 1}}>
            <Route it={it} t={t} frames={x.frames} poly={routes[i]!} P={P} U={U} follow={it.follow != null ? progress[it.follow] ?? 0 : null} />
          </div>
        ) : it.obj === 'swarm' ? (
          <Swarm key={i} it={it} t={t} frames={x.frames} P={P} U={U} W={W} H={H}
            target={typeof it.into === 'number' ? (base[it.into] ? [base[it.into].x, base[it.into].y] : null) : it.into ? [it.into[0] * W, it.into[1] * H] : null} />
        ) : it.obj === 'crowd' ? <Crowd key={i} it={it} t={t} frames={x.frames} P={P} U={U} W={W} H={H} />
          : it.obj === 'share' ? <Share key={i} it={it} t={t} frames={x.frames} P={P} U={U} W={W} H={H} />
          : it.obj === 'journey' ? <Journey key={i} it={it} t={t} frames={x.frames} P={P} U={U} W={W} H={H} />
          : it.obj === 'stream' ? (
            <Stream key={i} it={it} t={t} frames={x.frames} P={P} U={U} W={W} H={H}
              target={typeof it.into === 'number' ? (base[it.into] ? [base[it.into].x, base[it.into].y] : null) : it.into ? [it.into[0] * W, it.into[1] * H] : null} />
          ) : <Item key={i} it={it} t={t} frames={x.frames} P={P} pos={base[i]} U={U} z={zs[i]} />)}
        {/* a swarm's result ("1 KG") lands under its container after the last copy */}
        {items.map((it, i) => {
          const sd = it.obj === 'swarm' && it.result ? swarmDone(it, fps) : null;
          if (!sd || t < sd.last) return null;
          const tg = typeof it.into === 'number' ? base[it.into] : it.into ? {x: it.into[0] * W, y: it.into[1] * H} : null;
          if (!tg) return null;
          const k = interpolate(t - sd.last, [0, Math.round(0.3 * fps)], [0, 1], {...clamp, easing: back});
          const tsz = typeof it.into === 'number' ? (items[it.into].size ?? 0.5) * U : U * 0.3;
          return (
            <div key={`r${i}`} style={{position: 'absolute', left: tg.x - U * 0.4, width: U * 0.8, top: tg.y + tsz * 0.62, textAlign: 'center', zIndex: 500,
              fontFamily: fonts.anton, fontSize: U * 0.08, color: isLight(P.paper) ? P.ink : '#fff', transform: `scale(${k})`, opacity: Math.min(1, k * 2)}}>{it.result}</div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
export const IlloFull: React.FC<{x: IlloSpec & {frames: number}}> = ({x}) => <Illo x={x} t={useCurrentFrame()} />;
