// GEOMETRY ENGINE (2026-11-25): builds the whole timeline of an animated geometry lesson from a short script per
// question. One endless white sheet in WORLD pixels (1 cm = CM px), a camera that glides over it, real instruments
// (compass, scale, pencil) that do every step, the drawing in graphite, the teacher marks in colour, and a typographic
// step guide in the corner (no boxes, his verdict). Reused for the Elementary and Intermediate videos and for reels.
// A lesson = `new Lesson()` + calls like `L.say('...', () => { L.line(A, B) })`; everything is in seconds.

export const CM = 50; // world px per centimetre
export type Pt = {x: number; y: number};
export const P = (x: number, y: number): Pt => ({x, y});
export const add = (a: Pt, b: Pt): Pt => ({x: a.x + b.x, y: a.y + b.y});
export const sub = (a: Pt, b: Pt): Pt => ({x: a.x - b.x, y: a.y - b.y});
export const mul = (a: Pt, k: number): Pt => ({x: a.x * k, y: a.y * k});
export const lerpPt = (a: Pt, b: Pt, k: number): Pt => ({x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k});
export const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
export const angOf = (a: Pt, b: Pt) => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI; // degrees, y down
export const polar = (c: Pt, r: number, deg: number): Pt => ({x: c.x + r * Math.cos((deg * Math.PI) / 180), y: c.y + r * Math.sin((deg * Math.PI) / 180)});
export const mid = (a: Pt, b: Pt) => lerpPt(a, b, 0.5);
/** the two crossing points of circles (c1, r1) and (c2, r2): [left of c1→c2, right of c1→c2] */
export function circleX(c1: Pt, r1: number, c2: Pt, r2: number): [Pt, Pt] {
  const d = dist(c1, c2);
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
  const m = add(c1, mul(sub(c2, c1), a / d));
  const n = {x: -(c2.y - c1.y) / d, y: (c2.x - c1.x) / d};
  return [add(m, mul(n, -h)), add(m, mul(n, h))];
}

// ---------- easing + keyframe tracks ----------
export type Ease = 'io' | 'out' | 'lin' | 'in' | 'back';
const EASES: Record<Ease, (p: number) => number> = {
  lin: (p) => p,
  io: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  out: (p) => 1 - Math.pow(1 - p, 3),
  in: (p) => p * p * p,
  back: (p) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
  },
};
export const ease = (e: Ease, p: number) => EASES[e](Math.max(0, Math.min(1, p)));

type Num = Record<string, number>;
export class Track<T extends Num> {
  keys: {t: number; v: T; e: Ease}[] = [];
  constructor(public init: T) {}
  last(): T {
    return this.keys.length ? this.keys[this.keys.length - 1].v : this.init;
  }
  /** glide from the current value (held until t0) to v, arriving at t0 + dur */
  to(t0: number, dur: number, v: Partial<T>, e: Ease = 'io') {
    const cur = this.valueAt(t0);
    this.keys.push({t: t0, v: cur, e: 'lin'});
    this.keys.push({t: t0 + Math.max(0.001, dur), v: {...cur, ...v} as T, e});
    this.keys.sort((a, b) => a.t - b.t);
  }
  valueAt(t: number): T {
    const k = this.keys;
    if (!k.length) return this.init;
    if (t <= k[0].t) return k[0].v;
    for (let i = k.length - 1; i >= 0; i--) {
      if (k[i].t <= t) {
        const n = k[i + 1];
        if (!n) return k[i].v;
        const p = ease(n.e, (t - k[i].t) / (n.t - k[i].t));
        const o = {} as Num;
        for (const key of Object.keys(n.v)) o[key] = (k[i].v[key] ?? n.v[key]) + (n.v[key] - (k[i].v[key] ?? n.v[key])) * p;
        return o as T;
      }
    }
    return k[0].v;
  }
}

// ---------- what gets drawn ----------
export type Style = 'build' | 'main' | 'final' | 'teach' | 'ghost' | 'wrong';
export type Shape =
  | {k: 'seg'; a: Pt; b: Pt; style: Style; t0: number; t1: number; e: Ease; dash?: boolean}
  | {k: 'arc'; c: Pt; r: number; a0: number; a1: number; style: Style; t0: number; t1: number; e: Ease}
  | {k: 'dot'; p: Pt; t0: number; style: Style}
  | {k: 'label'; p: Pt; text: string; dx: number; dy: number; t0: number; style: Style}
  | {k: 'ticks'; a: Pt; b: Pt; n: number; t0: number}
  | {k: 'right'; p: Pt; d1: number; d2: number; t0: number}
  | {k: 'cross'; p: Pt; t0: number}
  | {k: 'probe'; a: Pt; b: Pt; from: Pt; to: Pt; t0: number; t1: number}
  | {k: 'note'; p: Pt; text: string; t0: number; t1: number; size?: number; color?: string; arrowTo?: Pt}
  | {k: 'split'; a: Pt; b: Pt; parts: number; t0: number; t1: number}
  | {k: 'burst'; p: Pt; t0: number; r?: number}
  | {k: 'glyph'; text: string; at: Pt; t0: number; t1: number; s0: number; s1: number; big: number; small: number}
  | {k: 'sparkle'; p: Pt; t0: number; size?: number};
type Timed = {t0: number; t1?: number};

/** the exam steps written next to the finished figure (for students to copy / screenshot) */
export type StepSheet = {x: number; y: number; t0: number; t1: number; lines: string[]; result?: string};
export type QText = {glyph?: boolean; n: number; x: number; y: number; t0: number; cps: number; segs: {s: string; mark?: 'concept' | 'num'; tMark?: number}[]; title: string; chip: string};
export type Guide = {q: number; title: string; question: string; steps: string[]; t0: number; t1: number; cur: {t: number; i: number}[]; recap: {t0: number; t1: number; text: string}[]};
export type Sub = {t0: number; t1: number; text: string};

export const speechSec = (s: string) => Math.max(1.1, s.trim().split(/\s+/).length / 2.45 + 0.25);

type ToolName = 'compass' | 'scale' | 'pencil';

export class Lesson {
  t = 0.6;
  speed = 1;
  shapes: Shape[] = [];
  qtexts: QText[] = [];
  sheets: StepSheet[] = [];
  guides: Guide[] = [];
  subs: Sub[] = [];
  sfx: {t: number; name: string; vol: number; dur?: number}[] = [];
  cam = new Track({x: 0, y: 0, zoom: 1, tilt: 0, rot: 0});
  compass = new Track({x: 0, y: 0, r: 120, ang: -30, lift: 1});
  scale = new Track({x: 0, y: 0, ang: 0, side: 1, hl: 0}); // hl = cm of the ruler marked as the reading
  pencil = new Track({x: 0, y: 0, lift: 1});
  uses: Record<ToolName, [number, number][]> = {compass: [], scale: [], pencil: []};
  vis: Record<ToolName, Track<{v: number}>> = {compass: new Track({v: 0}), scale: new Track({v: 0}), pencil: new Track({v: 0})};
  private g?: Guide;

  d(s: number) {
    return s / this.speed;
  }
  wait(s: number) {
    this.t += this.d(s);
  }
  /** a spoken line: the actions inside start with it; the next line waits for both the words and the actions */
  say(text: string, fn?: () => void, gap = 0.35) {
    const t0 = this.t;
    const words = speechSec(text);
    this.subs.push({t0, t1: t0 + words, text});
    fn?.();
    this.t = Math.max(this.t, t0 + words) + gap;
  }
  /** run actions faster (recap of a technique already explained) */
  fast(k: number, fn: () => void) {
    const s = this.speed;
    this.speed = s * k;
    fn();
    this.speed = s;
  }
  /** start the corner guide for a question */
  guide(q: number, title: string, question: string, steps: string[]) {
    if (this.g) this.g.t1 = this.t;
    this.g = {q, title, question, steps, t0: this.t, t1: 1e9, cur: [], recap: []};
    this.guides.push(this.g);
  }
  step(i: number) {
    this.g?.cur.push({t: this.t, i});
    this.sfx.push({t: this.t, name: 'click-rm-click-2', vol: 0.1});
    this.t += 0.5; // the step pop-up is read before anything moves
  }
  recapBadge(text: string, dur: number) {
    this.g?.recap.push({t0: this.t, t1: this.t + dur, text});
  }
  /** end of a question: the figure moves aside (smaller) and the exam steps are written next to it, held long
   *  enough to read / screenshot (his ask 2026-11-25) */
  stepSheet(fig: Pt[], at: Pt, lines: string[], result?: string, hold = 4) {
    const w = 820, h = 64 + (lines.length + (result ? 1.4 : 0)) * 52;
    this.frame([...fig, at, add(at, {x: w, y: h})], {pad: 70, dur: 1.4, tilt: 3});
    this.t += 0.9;
    const t0 = this.t;
    const write = 0.45 * lines.length + (result ? 0.5 : 0);
    this.t += write + hold;
    this.sheets.push({x: at.x, y: at.y, t0, t1: this.t, lines, result});
  }
  endGuide() {
    if (this.g) this.g.t1 = this.t;
    this.g = undefined;
  }

  // ---------- camera ----------
  camTo(v: {x?: number; y?: number; zoom?: number; tilt?: number; rot?: number}, dur = 1.4, e: Ease = 'io') {
    this.cam.to(this.t, this.d(dur), v, e);
  }
  /** frame a set of points: the figure sits in the area right of the corner guide */
  frame(pts: Pt[], opts: {pad?: number; dur?: number; zoom?: number; tilt?: number; rot?: number; full?: boolean; wait?: boolean} = {}) {
    const pad = opts.pad ?? 110;
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
    const x0 = Math.min(...xs) - pad, x1 = Math.max(...xs) + pad, y0 = Math.min(...ys) - pad, y1 = Math.max(...ys) + pad;
    // no side panel any more (his verdict 2026-11-25: steps are short pop-ups), the figure gets the whole frame;
    // a little room at the top for the step pop-up
    const availW = 1920 - 160, availH = 1080 - 170;
    const zoom = opts.zoom ?? Math.min(2.6, availW / (x1 - x0), availH / (y1 - y0));
    const cx = (x0 + x1) / 2 - 90 / zoom;
    this.camTo({x: cx, y: (y0 + y1) / 2 - 30 / zoom, zoom, tilt: opts.tilt ?? 4, rot: opts.rot ?? 0}, opts.dur ?? 1.4);
    if (opts.wait) this.t += this.d(opts.dur ?? 1.4);
  }

  // ---------- tools ----------
  private use(tool: ToolName, t0: number, t1: number) {
    this.uses[tool].push([t0, t1]);
  }
  private cuts: Record<ToolName, number[]> = {compass: [], scale: [], pencil: []};
  /** ONE tool at a time (his verdict 2026-11-25): every other tool leaves the page first, then these come in */
  private need(tools: ToolName[]) {
    let ready = this.t;
    for (const tool of ['compass', 'scale', 'pencil'] as ToolName[]) {
      if (tools.includes(tool)) continue;
      const u = this.uses[tool];
      if (!u.length) continue;
      const last = Math.max(...u.map((x) => x[1]));
      if (this.cuts[tool].includes(last)) continue;
      this.cuts[tool].push(last);
      if (this.t - last < 1.6) ready = Math.max(ready, last + 0.05 + 0.5 + 0.6);
    }
    this.t = ready;
  }
  /** drawing a straight line, one thing at a time: the ruler comes and settles (0 on `a` when measuring, the
   *  reading marks up to the length as the pencil goes), the pencil comes, draws, leaves; then the end points and
   *  letters appear one by one; then the ruler leaves. */
  line(a: Pt, b: Pt, o: {style?: Style; measure?: boolean; side?: 1 | -1; dash?: boolean; label?: [string, string]} = {}) {
    this.need(['scale', 'pencil']);
    const ang = angOf(a, b);
    const len = dist(a, b);
    const side = o.side ?? 1;
    const dir = {x: Math.cos((ang * Math.PI) / 180), y: Math.sin((ang * Math.PI) / 180)};
    const lenCm = len / CM;
    const zero = o.measure ? a : add(a, mul(dir, -((15 - lenCm) / 2) * CM));
    const s0 = this.t;
    const sc = this.scale.valueAt(s0);
    const same = Math.abs(sc.x - zero.x) < 2 && Math.abs(sc.y - zero.y) < 2 && Math.abs(sc.ang - ang) < 0.5;
    const tMove = same ? 0 : this.d(0.8);
    this.scale.to(s0, tMove, {x: zero.x, y: zero.y, ang, side, hl: 0});
    let t = s0 + tMove + this.d(0.15);
    // pencil enters only once the ruler has settled (its slide-in is the 0.55 s before its first use)
    t += this.d(0.55);
    const pStart = t;
    this.pencil.to(t, this.d(0.3), {x: a.x, y: a.y, lift: 1});
    t += this.d(0.3);
    this.pencil.to(t, this.d(0.15), {lift: 0});
    t += this.d(0.15);
    const dd = this.d(0.45 + len / 260);
    this.pencil.to(t, dd, {x: b.x, y: b.y}, 'io');
    if (o.measure) this.scale.to(t, dd, {hl: lenCm}, 'io');
    this.shapes.push({k: 'seg', a, b, style: o.style ?? 'main', t0: t, t1: t + dd, e: 'io', dash: o.dash});
    this.sfx.push({t, name: 'pencil-line', vol: 0.3, dur: dd});
    t += dd;
    this.pencil.to(t, this.d(0.2), {lift: 1});
    t += this.d(0.2);
    this.use('pencil', pStart, t);
    this.t = t;
    if (o.measure) this.wait(0.6); // the reading stays a moment
    this.use('scale', s0, this.t);
    if (o.measure) this.scale.to(this.t + 0.6, 0.01, {hl: 0});
    if (o.label) {
      // the ruler leaves first (it would cover the letters), then the points + letters one by one
      this.cuts.scale.push(this.t);
      this.cuts.pencil.push(t);
      this.t += 0.75;
      this.label(o.label[0], a, -34, 10);
      this.label(o.label[1], b, 30, 10);
    }
  }
  /** an EXACT compass opening: the ruler comes, the needle sits on 0, the compass opens to `cm` (reading marked),
   *  the ruler leaves. For a free opening ("more than half") just use compassTo and say it is any size. */
  private measuring = false;
  compassMeasure(cm: number, spot: Pt) {
    this.need(['compass', 'scale']);
    this.measuring = true;
    const r = cm * CM;
    const s0 = this.t;
    this.scale.to(s0, this.d(0.01), {x: spot.x, y: spot.y, ang: 0, side: 1, hl: 0});
    this.t += this.d(0.6);
    const needle = add(spot, {x: 0, y: 3});
    this.compassTo(needle, Math.min(r, 60), 0, 0.9);
    this.wait(0.2);
    this.scale.to(this.t, this.d(0.9), {hl: cm}, 'io');
    this.compassTo(needle, r, 0, 0.9);
    this.wait(0.8);
    this.use('scale', s0, this.t);
    this.scale.to(this.t + 0.6, 0.01, {hl: 0});
    this.cuts.scale.push(this.t);
    this.measuring = false;
    this.wait(0.6);
  }
  /** open / move the compass (lifted) without drawing */
  compassTo(c: Pt, r: number, ang?: number, dur = 0.8) {
    if (!this.measuring) this.need(['compass']);
    const cur = this.compass.valueAt(this.t);
    let a = ang ?? cur.ang;
    while (a - cur.ang > 180) a -= 360;
    while (a - cur.ang < -180) a += 360;
    const same = Math.abs(cur.x - c.x) < 1 && Math.abs(cur.y - c.y) < 1 && Math.abs(cur.r - r) < 1 && Math.abs(cur.ang - a) < 1;
    const d = same ? 0 : this.d(dur);
    this.compass.to(this.t, d, {x: c.x, y: c.y, r, ang: a, lift: 1});
    this.use('compass', this.t, this.t + d);
    this.t += d;
    return a;
  }
  /** swing an arc from a0 to a1 degrees around c */
  arc(c: Pt, r: number, a0: number, a1: number, o: {style?: Style} = {}) {
    const start = this.compassTo(c, r, a0);
    const shift = start - a0;
    const t0 = this.t;
    this.compass.to(this.t, this.d(0.22), {lift: 0}, 'out');
    this.t += this.d(0.22);
    const dur = this.d(0.45 + (Math.abs(a1 - a0) / 360) * 4.2);
    this.compass.to(this.t, dur, {ang: a1 + shift}, 'io');
    this.shapes.push({k: 'arc', c, r, a0, a1, style: o.style ?? 'build', t0: this.t, t1: this.t + dur, e: 'io'});
    this.sfx.push({t: this.t, name: 'pencil-line', vol: 0.26, dur});
    this.t += dur;
    this.compass.to(this.t, this.d(0.2), {lift: 1});
    this.t += this.d(0.2);
    this.use('compass', t0, this.t);
  }
  /** two short arcs on both sides of a line, centred at angle `at` (pointing to one side) ± span */
  arcPair(c: Pt, r: number, up: number, down: number, span = 26) {
    // long enough that the two arcs make a full, clear X past the crossing (his ask 2026-11-25), not a precise touch
    this.arc(c, r, up - span, up + span);
    this.arc(c, r, down - span, down + span);
  }

  // ---------- marks ----------
  label(text: string, p: Pt, dx = 18, dy = -18, t?: number, style: Style = 'main') {
    const t0 = t ?? this.t;
    this.shapes.push({k: 'dot', p, t0, style}, {k: 'label', p, text, dx, dy, t0: t0 + 0.2, style});
    this.sfx.push({t: t0 + 0.2, name: ['pop9-01', 'pop9-03'][this.shapes.length % 2], vol: 0.1});
    if (t == null) this.t += this.d(0.55); // the next thing waits: one at a time
  }
  /** "here we got the point": a quick pencil ring is drawn round a found crossing and fades (then the dark dot pins it) */
  burst(p: Pt, r = 34, t?: number) {
    this.shapes.push({k: 'burst', p, t0: t ?? this.t, r});
    this.sfx.push({t: t ?? this.t, name: 'pop-pop-bubble', vol: 0.09});
    if (t == null) this.t += this.d(0.45);
  }
  /** the answer is complete: sparkles + a soft ding */
  done(pts: Pt[]) {
    pts.forEach((p, i) => this.shapes.push({k: 'sparkle', p, t0: this.t + i * 0.12, size: i === 0 ? 30 : 20}));
    this.sfx.push({t: this.t, name: 'success-ding-2', vol: 0.22});
  }
  ticks(a: Pt, b: Pt, n = 1) {
    this.shapes.push({k: 'ticks', a, b, n, t0: this.t});
  }
  right(p: Pt, d1: number, d2: number) {
    this.shapes.push({k: 'right', p, d1, d2, t0: this.t});
  }
  note(text: string, p: Pt, dur: number, o: {size?: number; color?: string; arrowTo?: Pt} = {}) {
    this.shapes.push({k: 'note', p, text, t0: this.t, t1: this.t + this.d(dur), ...o});
  }
  teachLine(a: Pt, b: Pt, dur = 0.6, style: Style = 'teach') {
    this.shapes.push({k: 'seg', a, b, style, t0: this.t, t1: this.t + this.d(dur), e: 'out', dash: true});
  }
  ghostArc(c: Pt, r: number, a0: number, a1: number, dur = 0.7) {
    this.shapes.push({k: 'arc', c, r, a0, a1, style: 'wrong', t0: this.t, t1: this.t + this.d(dur), e: 'out'});
  }
  cross(p: Pt) {
    this.shapes.push({k: 'cross', p, t0: this.t});
    this.sfx.push({t: this.t, name: 'click-game-menu-select', vol: 0.2});
  }
  probe(a: Pt, b: Pt, from: Pt, to: Pt, dur: number) {
    this.shapes.push({k: 'probe', a, b, from, to, t0: this.t, t1: this.t + this.d(dur)});
  }
  split(a: Pt, b: Pt, parts: number, dur = 0.8) {
    this.shapes.push({k: 'split', a, b, parts, t0: this.t, t1: this.t + this.d(dur)});
  }
  /** TRANSITION (his idea): a line keeps extending across the blank sheet (camera rides along), then curls into the
   *  next question's number as line art, which shrinks into the title spot so the question can type in beside it.
   *  `at` = where the number's pen-start sits (the question's title corner). */
  connect(from: Pt, at: Pt, n: number, o: {big?: number; small?: number; via?: Pt} = {}) {
    const legs: [Pt, Pt][] = o.via ? [[from, o.via], [o.via, at]] : [[from, at]];
    const total = legs.reduce((n2, [p, q]) => n2 + dist(p, q), 0);
    const dLine = Math.max(1.4, total / 700);
    let tt = this.t + 0.3;
    legs.forEach(([p, q], i) => {
      const d = (dLine * dist(p, q)) / total;
      this.shapes.push({k: 'seg', a: p, b: q, style: 'main', t0: tt, t1: tt + d, e: legs.length > 1 ? 'lin' : 'io'});
      // the camera rides along with the pencil line (first leg also eases out of the previous framing)
      const c0 = i === 0 ? this.t : tt;
      this.cam.to(c0, tt + d - c0, {x: q.x + (q === at ? 120 : 0), y: q.y + 60, zoom: 0.85, tilt: 2}, i === 0 ? 'in' : i === legs.length - 1 ? 'out' : 'lin');
      tt += d;
    });
    this.sfx.push({t: this.t + 0.3, name: 'pencil-line', vol: 0.2, dur: dLine});
    this.t += 0.3 + dLine;
    const big = o.big ?? 3.2, small = o.small ?? 1.1;
    const dDraw = 1.3 * String(n).length;
    const g: Shape = {k: 'glyph', text: String(n), at, t0: this.t, t1: this.t + dDraw, s0: this.t + dDraw + 0.35, s1: this.t + dDraw + 1.15, big, small};
    this.shapes.push(g);
    this.sfx.push({t: this.t, name: 'pencil-line', vol: 0.2, dur: dDraw});
    this.t += dDraw + 0.35;
    return this;
  }
  /** hide every teaching mark that is still on screen (notes have their own end) */
  question(q: QText) {
    this.qtexts.push(q);
  }

  /** after building: each tool slides in before it is first needed and leaves when idle > 1.6 s */
  finish() {
    for (const tool of Object.keys(this.uses) as ToolName[]) {
      const iv = this.uses[tool].filter((u) => u[1] > u[0] - 0.01).sort((a, b) => a[0] - b[0]);
      const merged: [number, number][] = [];
      for (const u of iv) {
        const l = merged[merged.length - 1];
        const cut = this.cuts[tool].some((c) => c >= l?.[1] - 0.001 && c < u[0]);
        if (l && u[0] - l[1] < 1.6 && !cut) l[1] = Math.max(l[1], u[1]);
        else merged.push([u[0], u[1]]);
      }
      for (const [a, b] of merged) {
        this.vis[tool].to(a - 0.55, 0.55, {v: 1}, 'out');
        this.vis[tool].to(b + 0.05, 0.5, {v: 0}, 'in');
      }
    }
    this.t += 1;
    return this;
  }
}
