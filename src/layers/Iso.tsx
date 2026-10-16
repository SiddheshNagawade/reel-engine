// ISOMETRIC 3D-LOOK SCENES (brain/iso.md): direction.iso → edit.inserts kind 'iso'. A tiny flat-shaded 3D engine in
// SVG: every object is built from a few solids (prism = any outline pushed up, cylinder, cone, sphere, thin panel), each
// face is lit by one fixed light (top lightest, left mid, right darkest, from ONE base colour per object), drawn back
// to front. So any topic is just a short list of objects on a board, no drawing per video:
//   box (building, windows) · bar (3D bar chart, grows to value) · slab · cyl · tank · cone · sphere · dome · pyramid
//   tree · pine · house · factory (chimneys + smoke) · turbine (blades spin) · solar · car (travels a road) · truck
//   person · coins (a stack) · tower · poly (ANY outline extruded: an arrow, a map shape, a logo) · road (flat strip
//   with dashes, under everything) · water (flat pond/lake)
// Motion (brain/animation-system.md): the board lands first, objects rise/drop/pop on his words with a spring, a slow
// camera orbit makes the 3D read, acts change state on a word (grow, color, out, travel, pulse).
// Ideas borrowed from cth9191/animate's isometric style (MIT): 2:1-ish projection, painter's order, closed-form springs.
import React from 'react';
import {AbsoluteFill, Easing, interpolate, useVideoConfig} from 'remotion';
import {springAt} from '../motion/springs';
import {fonts} from './fonts';

type V3 = [number, number, number];
type Pt = [number, number];
type Face = {pts: V3[]; n: V3; color: string; two?: boolean; decals?: {pts: V3[]; color: string}[]; glow?: number};

export type IsoAct = {at: number; do: 'grow' | 'color' | 'out' | 'travel' | 'pulse' | 'spin'; value?: number; color?: string; seconds?: number; path?: Pt[]; speed?: number};
export type IsoItem = {
  obj: string;
  at?: number; out?: number; // frames from the insert start (plan.mjs: word / s)
  x?: number; y?: number; z?: number; // world units on the board (0,0 = board centre; x → right-down, y → left-down)
  rot?: number; s?: number; // degrees around the vertical; uniform scale
  w?: number; d?: number; h?: number; r?: number; // sizes in world units (defaults per object)
  color?: string; color2?: string; // main colour, second colour (roof, cone, blades, cabin…)
  enter?: 'rise' | 'drop' | 'pop' | 'none';
  windows?: boolean | [number, number]; // box/tower: rows × columns of windows on the walls
  points?: Pt[]; width?: number; // poly outline (world xy) / road + water path; road width
  value?: number; unit?: string; // bar: target height; the number shown on top counts up
  speed?: number; // turbine: turns per second (default 0.5)
  face?: number; // turbine/solar: degrees the front faces
  n?: number; // coins: how many
  tag?: string; tagAt?: number; // a floating label above the object
  repeat?: {n: number; area?: [number, number, number, number]; grid?: [number, number]; seed?: number; stagger?: number; scale?: [number, number]};
  acts?: IsoAct[];
};
export type IsoCam = {at: number; yaw?: number; elev?: number; zoom?: number; x?: number; y?: number};
export type IsoSpec = {
  style?: 'full' | 'over';
  bg?: string; // full: background colour (a soft radial glow is added)
  board?: {w: number; d: number; h?: number; r?: number; color?: string} | null; // the floating base (null = none)
  x?: number; y?: number; size?: number; // where the scene sits (frame fractions) and how wide (fraction of the frame)
  cam?: IsoCam[]; orbit?: number; // camera keys, or a slow orbit in degrees over the insert (default 10)
  rings?: boolean; // contour lines on the ground under the board (the reference look)
  hideCaptions?: boolean;
  items: IsoItem[];
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const D2R = Math.PI / 180;

// ── colour ──
const hex = (c: string): V3 => {
  let h = c.replace('#', '');
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
const rgb = (c: V3) => `rgb(${c.map((v) => Math.round(Math.max(0, Math.min(255, v)))).join(',')})`;
const mixC = (a: string, b: string, t: number) => {
  const A = hex(a), B = hex(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
};
// light fixed relative to the camera, so the look stays the same while it orbits: top ≈ +15 %, left = base, right ≈ −30 %
const LIGHT: V3 = (() => { const l: V3 = [-0.45, -0.35, 0.82]; const m = Math.hypot(...l); return l.map((v) => v / m) as V3; })();
const shade = (base: string, n: V3, glow = 0) => {
  const b = 0.55 + 0.45 * Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
  const f = b / 0.80;
  const c = hex(base);
  const out: V3 = f > 1 ? (c.map((v) => v + (255 - v) * Math.min(1, (f - 1) * 1.4)) as V3) : (c.map((v) => v * f) as V3);
  return rgb(glow ? (out.map((v) => v + (255 - v) * glow * 0.6) as V3) : out);
};

// ── vectors ──
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => { const m = Math.hypot(...a) || 1; return [a[0] / m, a[1] / m, a[2] / m]; };
const centroid = (P: V3[]): V3 => { const c: V3 = [0, 0, 0]; for (const p of P) { c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; } return [c[0] / P.length, c[1] / P.length, c[2] / P.length]; };

// ── solids (local coords, z up, base at z = z0); outlines are made counter-clockwise so side normals point out ──
const ccw = (poly: Pt[]) => { let a = 0; for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; a += p[0] * q[1] - q[0] * p[1]; } return a < 0 ? [...poly].reverse() : poly; };
const prism = (poly0: Pt[], z0: number, h: number, color: string, top?: string): Face[] => {
  const poly = ccw(poly0);
  const faces: Face[] = [{pts: poly.map(([x, y]) => [x, y, z0 + h] as V3), n: [0, 0, 1], color: top ?? color}];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    faces.push({pts: [[a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z0 + h], [a[0], a[1], z0 + h]], n: norm([b[1] - a[1], -(b[0] - a[0]), 0]), color});
  }
  return faces;
};
const rect = (w: number, d: number, cx = 0, cy = 0): Pt[] => [[cx - w / 2, cy - d / 2], [cx + w / 2, cy - d / 2], [cx + w / 2, cy + d / 2], [cx - w / 2, cy + d / 2]];
const ngon = (r: number, n = 18, cx = 0, cy = 0): Pt[] => Array.from({length: n}, (_, i) => [cx + r * Math.cos((i / n) * 2 * Math.PI), cy + r * Math.sin((i / n) * 2 * Math.PI)] as Pt);
const roundRect = (w: number, d: number, r: number): Pt[] => {
  r = Math.min(r, w / 2, d / 2);
  const pts: Pt[] = [];
  const corners: [number, number, number][] = [[w / 2 - r, d / 2 - r, 0], [-w / 2 + r, d / 2 - r, 90], [-w / 2 + r, -d / 2 + r, 180], [w / 2 - r, -d / 2 + r, 270]];
  for (const [cx, cy, a0] of corners) for (let k = 0; k <= 4; k++) { const a = (a0 + k * 22.5) * D2R; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return pts;
};
const cone = (r: number, h: number, z0: number, color: string, n = 16, cx = 0, cy = 0): Face[] => {
  const base = ngon(r, n, cx, cy), apex: V3 = [cx, cy, z0 + h];
  return base.map((a, i) => {
    const b = base[(i + 1) % n];
    const A: V3 = [a[0], a[1], z0], B: V3 = [b[0], b[1], z0];
    return {pts: [A, B, apex], n: norm(cross(sub(B, A), sub(apex, A))), color};
  });
};
const sphere = (r: number, cz: number, color: string, cx = 0, cy = 0, lat = 6, lon = 12, half = false): Face[] => {
  const faces: Face[] = [];
  const P = (i: number, j: number): V3 => { const th = (i / lat) * Math.PI, ph = (j / lon) * 2 * Math.PI; return [cx + r * Math.sin(th) * Math.cos(ph), cy + r * Math.sin(th) * Math.sin(ph), cz + r * Math.cos(th)]; };
  for (let i = 0; i < (half ? lat / 2 : lat); i++) for (let j = 0; j < lon; j++) {
    const pts = [P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)];
    faces.push({pts, n: norm(sub(centroid(pts), [cx, cy, cz])), color});
  }
  return faces;
};
const panel = (pts: V3[], color: string): Face => ({pts, n: norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0]))), color, two: true});
const windowsOn = (faces: Face[], rows: number, cols: number, color: string) => {
  for (const f of faces) {
    if (f.n[2] !== 0 || f.pts.length !== 4) continue;
    const [A, B, , Dp] = f.pts; // A→B along the wall bottom, A→D up
    const u = sub(B, A), v = sub(Dp, A), out = f.n.map((x) => x * 0.01) as V3;
    f.decals = [];
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
      const u0 = (j + 0.25) / cols, u1 = (j + 0.75) / cols, v0 = 0.12 + (i + 0.22) * (0.8 / rows), v1 = 0.12 + (i + 0.78) * (0.8 / rows);
      const at = (s: number, t: number): V3 => [A[0] + u[0] * s + v[0] * t + out[0], A[1] + u[1] * s + v[1] * t + out[1], A[2] + u[2] * s + v[2] * t + out[2]];
      f.decals.push({pts: [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)], color});
    }
  }
  return faces;
};

const PAL = {green: '#5a9e3c', dark: '#3d6f2a', trunk: '#8a5a36', white: '#f4f4f2', grey: '#a9adb3', road: '#4a4d52', blue: '#4f8fd9', gold: '#f2b632', red: '#e5533d', water: '#6cb7e6'};

// ── objects: one item → faces (local coords). t = seconds since the insert started (for idle motion) ──
type Built = {faces: Face[]; height: number; flat?: boolean};
function build(it: IsoItem, t: number, hNow: number): Built {
  const c = it.color, c2 = it.color2;
  switch (it.obj) {
    case 'box': case 'building': case 'tower': {
      const w = it.w ?? 1, d = it.d ?? w, h = hNow;
      const f = prism(rect(w, d), 0, h, c ?? '#7fb069');
      const win = it.windows === true ? [Math.max(1, Math.round(h / 0.7)), Math.max(1, Math.round(w / 0.5))] : it.windows;
      if (win) windowsOn(f, win[0], win[1], c2 ?? mixC(c ?? '#7fb069', '#ffffff', 0.55));
      return {faces: f, height: h};
    }
    case 'bar': return {faces: prism(rect(it.w ?? 1, it.d ?? it.w ?? 1), 0, Math.max(0.01, hNow), c ?? PAL.blue), height: hNow};
    case 'slab': return {faces: prism(roundRect(it.w ?? 3, it.d ?? 2, it.r ?? 0.3), 0, hNow, c ?? '#dddddd'), height: hNow};
    case 'poly': return {faces: prism(it.points ?? rect(1, 1), 0, hNow, c ?? PAL.blue), height: hNow};
    case 'cyl': return {faces: prism(ngon(it.r ?? 0.5), 0, hNow, c ?? PAL.grey), height: hNow};
    case 'tank': { const r = it.r ?? 0.6; return {faces: [...prism(ngon(r), 0, hNow, c ?? PAL.white), ...sphere(r, hNow, c2 ?? c ?? PAL.white, 0, 0, 6, 16, true)], height: hNow + r}; }
    case 'cone': return {faces: cone(it.r ?? 0.5, hNow, 0, c ?? PAL.green), height: hNow};
    case 'pyramid': return {faces: cone(it.r ?? 0.7, hNow, 0, c ?? '#e2c07a', 4), height: hNow};
    case 'sphere': { const r = it.r ?? 0.5; return {faces: sphere(r, r, c ?? PAL.blue), height: 2 * r}; }
    case 'dome': { const r = it.r ?? 0.8; return {faces: sphere(r, 0, c ?? PAL.white, 0, 0, 6, 16, true), height: r}; }
    case 'pine': case 'tree': {
      const h = hNow, trunk = prism(ngon(0.07 * h, 8), 0, 0.3 * h, PAL.trunk);
      if (it.obj === 'pine') return {faces: [...trunk, ...cone(0.28 * h, 0.85 * h, 0.2 * h, c ?? PAL.green, 12)], height: h};
      return {faces: [...trunk, ...sphere(0.3 * h, 0.62 * h, c ?? PAL.green, 0, 0, 5, 10)], height: h};
    }
    case 'house': {
      const w = it.w ?? 1.2, d = it.d ?? 1, h = hNow, rh = 0.5 * d;
      const walls = prism(rect(w, d), 0, h, c ?? '#f2e6d0');
      const roof: Face[] = [];
      const R = (x: number, y: number, z: number): V3 => [x, y, z];
      const e = 0.08;
      const l = [R(-w / 2 - e, -d / 2 - e, h), R(w / 2 + e, -d / 2 - e, h), R(w / 2 + e, 0, h + rh), R(-w / 2 - e, 0, h + rh)];
      const r2 = [R(w / 2 + e, d / 2 + e, h), R(-w / 2 - e, d / 2 + e, h), R(-w / 2 - e, 0, h + rh), R(w / 2 + e, 0, h + rh)];
      roof.push({pts: l, n: norm([0, -rh, d / 2]), color: c2 ?? '#c8553d'}, {pts: r2, n: norm([0, rh, d / 2]), color: c2 ?? '#c8553d'});
      roof.push({pts: [R(-w / 2, -d / 2, h), R(-w / 2, d / 2, h), R(-w / 2, 0, h + rh)], n: [-1, 0, 0], color: c ?? '#f2e6d0'});
      roof.push({pts: [R(w / 2, d / 2, h), R(w / 2, -d / 2, h), R(w / 2, 0, h + rh)], n: [1, 0, 0], color: c ?? '#f2e6d0'});
      return {faces: [...walls, ...roof], height: h + rh};
    }
    case 'factory': {
      const w = it.w ?? 2, d = it.d ?? 1.4, h = hNow;
      const body = prism(rect(w, d), 0, h, c ?? '#b8bcc4');
      const ch = [...prism(ngon(0.16, 12, w * 0.25, -d * 0.15), h, h * 1.1, c2 ?? PAL.red), ...prism(ngon(0.16, 12, -w * 0.05, -d * 0.15), h, h * 0.8, c2 ?? PAL.red)];
      const smoke: Face[] = [];
      if (hNow > 0.3) for (let k = 0; k < 3; k++) { // puffs drift up and fade (size cycles)
        const p = ((t * 0.5 + k / 3) % 1);
        smoke.push(...sphere(0.12 + 0.25 * p, h * 2.1 + p * 1.6, '#e9ecef', w * 0.25 + p * 0.3, -d * 0.15, 4, 8));
      }
      return {faces: [...body, ...ch, ...smoke], height: h * 2.1};
    }
    case 'turbine': {
      const h = hNow, ang = (it.face ?? 0) * D2R;
      const pole = prism(ngon(0.06, 10), 0, h, c ?? PAL.white);
      const hub: V3 = [0, 0, h];
      const fx = Math.cos(ang), fy = Math.sin(ang); // front direction
      const nac = prism([[-0.12 - 0.25 * fx, -0.1], [0.12, -0.1], [0.12, 0.1], [-0.12 - 0.25 * fx, 0.1]].map(([x, y]) => [x * Math.cos(ang) - y * Math.sin(ang), x * Math.sin(ang) + y * Math.cos(ang)] as Pt), h - 0.1, 0.2, c ?? PAL.white);
      const spin = t * 2 * Math.PI * (it.speed ?? 0.5);
      const ux: V3 = [-fy, fx, 0], uz: V3 = [0, 0, 1]; // blade plane
      const L = 0.42 * h, wd = 0.05 * h;
      const blades: Face[] = [0, 1, 2].map((k) => {
        const a = spin + (k * 2 * Math.PI) / 3, ca = Math.cos(a), sa = Math.sin(a);
        const dir: V3 = [ux[0] * ca + uz[0] * sa, ux[1] * ca + uz[1] * sa, ux[2] * ca + uz[2] * sa];
        const side: V3 = [ux[0] * -sa + uz[0] * ca, ux[1] * -sa + uz[1] * ca, ux[2] * -sa + uz[2] * ca];
        const off: V3 = [fx * 0.14, fy * 0.14, 0];
        const P = (s: number, q: number): V3 => [hub[0] + off[0] + dir[0] * s + side[0] * q, hub[1] + off[1] + dir[1] * s + side[1] * q, hub[2] + dir[2] * s + side[2] * q];
        return panel([P(0, -wd * 0.6), P(L, -wd * 0.15), P(L, wd * 0.1), P(0, wd * 0.6)], c2 ?? PAL.white);
      });
      return {faces: [...pole, ...nac, ...blades], height: h + L};
    }
    case 'solar': {
      const w = it.w ?? 1.4, d = it.d ?? 0.9, h = hNow, ang = (it.face ?? 0) * D2R, tilt = 30 * D2R;
      const rot = ([x, y]: Pt): Pt => [x * Math.cos(ang) - y * Math.sin(ang), x * Math.sin(ang) + y * Math.cos(ang)];
      const post = prism(ngon(0.05, 8), 0, h, PAL.grey);
      const P = (u: number, v: number): V3 => { const [x, y] = rot([u, v * Math.cos(tilt)]); return [x, y, h + v * Math.sin(tilt)]; };
      const f = panel([P(-w / 2, -d / 2), P(w / 2, -d / 2), P(w / 2, d / 2), P(-w / 2, d / 2)], c ?? '#2f5aa8');
      f.decals = [];
      for (let i = 1; i < 4; i++) { const u = -w / 2 + (w * i) / 4; f.decals.push({pts: [P(u - 0.01, -d / 2), P(u + 0.01, -d / 2), P(u + 0.01, d / 2), P(u - 0.01, d / 2)], color: '#9fc0f0'}); }
      return {faces: [...post, f], height: h + d / 2};
    }
    case 'car': case 'truck': {
      const truck = it.obj === 'truck', L = truck ? 1.3 : 0.8, W = 0.42, h = hNow;
      const body = prism(rect(L, W), 0.06, h * 0.45, c ?? PAL.red);
      const cab = truck ? prism(rect(0.35, W * 0.95, L / 2 - 0.2, 0), 0.06 + h * 0.45, h * 0.4, c2 ?? PAL.white) : prism(rect(L * 0.5, W * 0.9, -0.05, 0), 0.06 + h * 0.45, h * 0.35, c2 ?? '#dbe7f3');
      return {faces: [...body, ...cab], height: h};
    }
    case 'person': { const h = hNow; return {faces: [...prism(ngon(0.14 * h, 10), 0, 0.6 * h, c ?? PAL.blue), ...sphere(0.16 * h, 0.78 * h, c2 ?? '#f0c7a0', 0, 0, 4, 8)], height: h}; }
    case 'coins': {
      const n = Math.max(1, Math.round((it.n ?? 5) * Math.min(1, hNow / Math.max(0.001, it.h ?? 1)))), r = it.r ?? 0.35, th = 0.09;
      const f: Face[] = [];
      for (let k = 0; k < n; k++) f.push(...prism(ngon(r, 16, (k % 2) * 0.02, 0), k * th, th * 0.92, c ?? PAL.gold, mixC(c ?? PAL.gold, '#ffffff', 0.25)));
      return {faces: f, height: n * th};
    }
    case 'road': case 'water': {
      const pts = it.points ?? [[-3, 0], [3, 0]];
      const z = 0.012, f: Face[] = [];
      if (it.obj === 'water') return {faces: [{pts: ccw(pts).map(([x, y]) => [x, y, z] as V3), n: [0, 0, 1], color: c ?? PAL.water}], height: 0, flat: true};
      const wd = (it.width ?? 0.8) / 2;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1, nx = (-dy / m) * wd, ny = (dx / m) * wd;
        const q: Face = {pts: [[a[0] + nx, a[1] + ny, z], [a[0] - nx, a[1] - ny, z], [b[0] - nx, b[1] - ny, z], [b[0] + nx, b[1] + ny, z]], n: [0, 0, 1], color: c ?? PAL.road, decals: []};
        const dash = 0.35, gap = 0.3;
        for (let s = 0.15; s + dash < m; s += dash + gap) {
          const p0 = s / m, p1 = (s + dash) / m, tw = 0.035;
          const P = (p: number, side: number): V3 => [a[0] + dx * p + (nx / wd) * tw * side, a[1] + dy * p + (ny / wd) * tw * side, z + 0.002];
          q.decals!.push({pts: [P(p0, 1), P(p0, -1), P(p1, -1), P(p1, 1)], color: c2 ?? '#f1f1ea'});
        }
        f.push(q);
      }
      return {faces: f, height: 0, flat: true};
    }
    default: return {faces: prism(rect(1, 1), 0, hNow, c ?? PAL.grey), height: hNow};
  }
}
const DEF_H: Record<string, number> = {box: 1.5, building: 2, tower: 3.2, bar: 1, slab: 0.25, poly: 0.4, cyl: 1, tank: 1.2, cone: 1, pyramid: 1, pine: 1.2, tree: 1, house: 0.8, factory: 1, turbine: 3, solar: 0.5, car: 0.42, truck: 0.5, person: 0.9, coins: 1, sphere: 1, dome: 1};
const DEF_ENTER: Record<string, IsoItem['enter']> = {box: 'rise', building: 'rise', tower: 'rise', bar: 'rise', cyl: 'rise', tank: 'rise', factory: 'rise', turbine: 'rise', coins: 'rise', poly: 'rise', road: 'none', water: 'none'};

// springs by weight (src/motion/springs.ts): board/camera = container, buildings/bars = heavy, tags = snappy, pops = playful
const rand = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// repeat → many copies (scatter in an area or a grid), each a little later (stagger, seconds)
const expand = (items: IsoItem[], fps: number): IsoItem[] => items.flatMap((it) => {
  if (!it.repeat) return [it];
  const {n, area = [-3, -2, 3, 2], grid, seed = 7, stagger = 0.06, scale = [0.8, 1.2]} = it.repeat;
  const R = rand(seed * 9973 + 1);
  // scattered copies keep clear of the placed objects and the roads (so trees never grow through a building)
  const solids = items.filter((o) => !o.repeat && o.obj !== 'road' && o.obj !== 'water' && !o.acts?.some((a) => a.do === 'travel'));
  const roads = items.filter((o) => o.obj === 'road');
  const segDist = (px: number, py: number, a: Pt, b: Pt) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy || 1, q = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / l)); return Math.hypot(px - a[0] - q * dx, py - a[1] - q * dy); };
  const placed: Pt[] = [];
  const clear = (px: number, py: number) => solids.every((o) => Math.hypot(px - (o.x ?? 0), py - (o.y ?? 0)) > 0.35 + Math.max(o.w ?? 0, o.d ?? 0, (o.r ?? 0) * 2, 0.6) * 0.75)
    && roads.every((o) => (o.points ?? []).slice(1).every((b, k) => segDist(px, py, o.points![k], b) > (o.width ?? 0.8) / 2 + 0.3))
    && placed.every(([qx, qy]) => Math.hypot(px - qx, py - qy) > 0.45);
  return Array.from({length: n}, (_, i) => {
    const [x0, y0, x1, y1] = area;
    let x = 0, y = 0;
    if (grid) { x = x0 + ((i % grid[0]) + 0.5) * ((x1 - x0) / grid[0]); y = y0 + (Math.floor(i / grid[0]) + 0.5) * ((y1 - y0) / grid[1]); }
    else for (let k = 0; k < 25; k++) { x = x0 + R() * (x1 - x0); y = y0 + R() * (y1 - y0); if (clear((it.x ?? 0) + x, (it.y ?? 0) + y)) break; }
    placed.push([(it.x ?? 0) + x, (it.y ?? 0) + y]);
    return {...it, repeat: undefined, x: (it.x ?? 0) + x, y: (it.y ?? 0) + y, s: (it.s ?? 1) * (scale[0] + R() * (scale[1] - scale[0])), at: (it.at ?? 0) + Math.round(i * stagger * fps)};
  });
});

const pathAt = (P: Pt[], p: number): [number, number, number] => {
  const seg: number[] = []; let tot = 0;
  for (let i = 0; i < P.length - 1; i++) { const l = Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]); seg.push(l); tot += l; }
  let d = Math.max(0, Math.min(1, p)) * tot;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i] || i === seg.length - 1) { const q = seg[i] ? d / seg[i] : 0, a = P[i], b = P[i + 1]; return [a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q, Math.atan2(b[1] - a[1], b[0] - a[0]) / D2R]; }
    d -= seg[i];
  }
  return [P[0][0], P[0][1], 0];
};

export const Iso: React.FC<{x: IsoSpec & {frames: number}; t: number}> = ({x, t}) => {
  const {width: W, height: H, fps} = useVideoConfig();
  const sec = t / fps;
  const full = x.style !== 'over';
  const board = x.board === undefined ? {w: 8, d: 6} : x.board;
  const bh = board ? board.h ?? 0.35 : 0;

  // camera: keys (eased) or a slow orbit
  const keys = x.cam?.length ? x.cam : [{at: 0, yaw: 45 - (x.orbit ?? 10) / 2, zoom: 1}, {at: x.frames, yaw: 45 + (x.orbit ?? 10) / 2, zoom: 1.06}];
  const camVal = (k: keyof IsoCam, def: number) => {
    const ks = keys.filter((c) => c[k] != null);
    if (!ks.length) return def;
    if (ks.length === 1) return ks[0][k] as number;
    return interpolate(t, ks.map((c) => c.at), ks.map((c) => c[k] as number), {...clamp, easing: Easing.inOut(Easing.cubic)});
  };
  const yaw = camVal('yaw', 45) * D2R, elev = camVal('elev', 33) * D2R, zoom = camVal('zoom', 1), tx = camVal('x', 0), ty = camVal('y', 0);
  const cy = Math.cos(yaw), sy = Math.sin(yaw), ce = Math.cos(elev), se = Math.sin(elev);
  const view = (p: V3): V3 => { const X = p[0] - tx, Y = p[1] - ty; return [X * cy - Y * sy, X * sy + Y * cy, p[2]]; }; // yawed
  const sceneW = board ? Math.hypot(board.w, board.d) * 1.05 : 9;
  const unit = ((x.size ?? 0.86) * W * zoom) / sceneW;
  const ox = (x.x ?? 0.5) * W, oy = (x.y ?? 0.5) * H + unit * 0.4;
  const proj = (p: V3): Pt => { const v = view(p); return [ox + v[0] * unit, oy - (v[2] * ce + v[1] * se) * unit]; };
  const depth = (p: V3) => { const v = view(p); return -v[1] * ce + v[2] * se; };
  const toView = (n: V3): V3 => [n[0] * cy - n[1] * sy, n[0] * sy + n[1] * cy, n[2]];
  const VD: V3 = [0, -ce, se];
  const facing = (n: V3) => { const v = toView(n); return v[0] * VD[0] + v[1] * VD[1] + v[2] * VD[2]; };

  // board: lands first (scale + fade), everything else waits for it
  const bIn = board ? springAt(sec, 'container') : 1;
  const boardFaces = board ? prism(roundRect(board.w * (0.7 + 0.3 * bIn), board.d * (0.7 + 0.3 * bIn), board.r ?? 0.45), -bh, bh, board.color ?? '#5d9b43') : [];

  type Obj = {faces: Face[]; key: number; flat?: boolean; tag?: {p: V3; text: string; a: number}; label?: {p: V3; text: string; a: number}};
  const objs: Obj[] = [];
  for (const it of expand(x.items, fps)) {
    const at = it.at ?? 0;
    if (t < at) continue;
    const ls = (t - at) / fps;
    const enter = it.enter ?? DEF_ENTER[it.obj] ?? 'drop';
    let H0 = it.h ?? (it.obj === 'bar' ? 0.01 : DEF_H[it.obj] ?? 1);
    let color = it.color, glow = 0, outK = 1, px = it.x ?? 0, py = it.y ?? 0, rot = it.rot ?? 0;
    for (const a of it.acts ?? []) {
      const as = (t - a.at) / fps;
      if (as < 0) continue;
      if (a.do === 'grow') { const prev = H0; H0 = prev + ((a.value ?? prev * 1.5) - prev) * springAt(as, 'heavy'); }
      if (a.do === 'color' && a.color) color = mixC(color ?? '#888888', a.color, Math.min(1, as / 0.35));
      if (a.do === 'pulse') glow = Math.max(glow, Math.max(0, 1 - Math.abs(as - 0.25) / 0.25));
      if (a.do === 'out') outK = Math.max(0, 1 - springAt(as, 'snappy'));
      if (a.do === 'travel' && a.path) { const p = Easing.inOut(Easing.cubic)(Math.min(1, as / (a.seconds ?? 2))); const [qx, qy, dir] = pathAt(a.path, p); px = qx; py = qy; rot = dir; }
    }
    if (it.out != null && t >= it.out) outK = Math.min(outK, Math.max(0, 1 - springAt((t - it.out) / fps, 'snappy')));
    if (outK <= 0.01) continue;
    const k = enter === 'none' ? 1 : springAt(ls, enter === 'rise' ? 'heavy' : 'playful');
    const hNow = it.obj === 'bar' && it.value != null ? Math.max(0.01, it.value * springAt(ls, 'heavy')) * outK : enter === 'rise' ? Math.max(0.01, H0 * k) * outK : H0;
    const sc = (it.s ?? 1) * (enter === 'pop' ? k : 1) * (enter === 'rise' ? 1 : outK);
    const dz = enter === 'drop' ? (1 - k) * 5 : 0;
    const op = enter === 'drop' ? Math.min(1, ls / 0.12) : 1;
    if (op <= 0 || sc <= 0.001) continue;
    const b = build({...it, color}, sec, hNow);
    const cr = Math.cos(rot * D2R), sr = Math.sin(rot * D2R), z0 = (it.z ?? 0) + dz;
    const T = (p: V3): V3 => [px + (p[0] * cr - p[1] * sr) * sc, py + (p[0] * sr + p[1] * cr) * sc, z0 + p[2] * sc];
    const Tn = (n: V3): V3 => [n[0] * cr - n[1] * sr, n[0] * sr + n[1] * cr, n[2]];
    const faces = b.faces.map((f) => ({...f, pts: f.pts.map(T), n: Tn(f.n), glow, decals: f.decals?.map((d) => ({...d, pts: d.pts.map(T)}))}));
    const top: V3 = [px, py, z0 + b.height * sc];
    const o: Obj = {faces, key: depth([px, py, z0]), flat: b.flat};
    if (it.tag && t >= (it.tagAt ?? at + 10)) o.tag = {p: top, text: it.tag, a: springAt((t - (it.tagAt ?? at + 10)) / fps, 'snappy')};
    if (it.obj === 'bar' && it.value != null) o.label = {p: top, text: `${Math.round(it.value * Math.min(1, springAt(ls, 'heavy')) * 10) / 10}${it.unit ?? ''}`, a: Math.min(1, ls / 0.3) * outK};
    objs.push(o);
  }
  // painter's order: flat things (roads, water) right after the board, then objects far → near
  objs.sort((a, b) => (a.flat === b.flat ? a.key - b.key : a.flat ? -1 : 1));

  const poly = (P: V3[]) => P.map((p) => proj(p).map((v) => v.toFixed(1)).join(',')).join(' ');
  const drawFaces = (faces: Face[], kp: string) => {
    const vis = faces.map((f) => ({f, s: facing(f.n)})).filter(({f, s}) => s > 0.0001 || f.two);
    vis.sort((a, b) => depth(centroid(a.f.pts)) - depth(centroid(b.f.pts)));
    return vis.flatMap(({f, s}, i) => {
      const n: V3 = s < 0 ? [-f.n[0], -f.n[1], -f.n[2]] : f.n;
      const fill = shade(f.color, toView(n), f.glow);
      const out = [<polygon key={`${kp}-${i}`} points={poly(f.pts)} fill={fill} stroke={fill} strokeWidth={0.8} strokeLinejoin="round" />];
      f.decals?.forEach((d, j) => { const df = shade(d.color, toView(n), f.glow); out.push(<polygon key={`${kp}-${i}-d${j}`} points={poly(d.pts)} fill={df} stroke={df} strokeWidth={0.5} />); });
      return out;
    });
  };

  // soft shadow under the board + optional contour rings on the ground (the reference look)
  const ground = board ? roundRect(board.w * (0.7 + 0.3 * bIn), board.d * (0.7 + 0.3 * bIn), board.r ?? 0.45) : [];
  const gz = -bh - 0.9;
  const rings = board && x.rings !== false ? [1, 2, 3, 4, 5].map((k) => roundRect(board.w + k * 0.28, board.d + k * 0.28, (board.r ?? 0.45) + k * 0.14)) : [];
  const bg = x.bg ?? '#9cc77a';
  const fadeOut = interpolate(t, [x.frames - 6, x.frames], [1, 0], clamp);

  return (
    <AbsoluteFill style={{opacity: full ? 1 : fadeOut}}>
      {full && <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 42%, ${mixC(bg, '#ffffff', 0.22)} 0%, ${bg} 55%, ${mixC(bg, '#000000', 0.12)} 100%)`}} />}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
        <defs><filter id="isoShadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={unit * 0.35} /></filter></defs>
        {rings.map((r, i) => <polygon key={`ring${i}`} points={poly(r.map(([a, b]) => [a, b, gz] as V3))} fill="none" stroke="#ffffff" strokeOpacity={0.35 * bIn * (1 - i / 6)} strokeWidth={1.4} />)}
        {board && <polygon points={poly(ground.map(([a, b]) => [a + 0.5, b + 0.5, gz] as V3))} fill="#000" opacity={0.22 * bIn} filter="url(#isoShadow)" />}
        <g opacity={board ? Math.min(1, sec / 0.15) : 1}>{drawFaces(boardFaces, 'board')}</g>
        {objs.map((o, i) => <g key={`o${i}`}>{drawFaces(o.faces, `o${i}`)}</g>)}
        {objs.map((o, i) => o.label && (() => { const [lx, ly] = proj(o.label.p); return <text key={`l${i}`} x={lx} y={ly - unit * 0.18} textAnchor="middle" fontFamily={fonts.montserrat} fontWeight={800} fontSize={unit * 0.42} fill="#1b1b1f" opacity={o.label.a}>{o.label.text}</text>; })())}
        {objs.map((o, i) => o.tag && (() => {
          const [lx, ly] = proj(o.tag.p); const fs = unit * 0.34, tw = o.tag.text.length * fs * 0.6 + fs * 1.2, y = ly - unit * 0.9;
          return <g key={`t${i}`} transform={`translate(${lx},${y}) scale(${o.tag.a})`}>
            <line x1={0} y1={fs * 0.7} x2={0} y2={unit * 0.85} stroke="#ffffff" strokeWidth={2} />
            <rect x={-tw / 2} y={-fs * 0.8} width={tw} height={fs * 1.6} rx={fs * 0.8} fill="#ffffff" />
            <text x={0} y={fs * 0.35} textAnchor="middle" fontFamily={fonts.montserrat} fontWeight={700} fontSize={fs} fill="#1b1b1f">{o.tag.text}</text>
          </g>;
        })())}
      </svg>
    </AbsoluteFill>
  );
};
