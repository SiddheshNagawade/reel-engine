// The geometry lesson video: one white sheet, a floating camera, real instruments, and EVERYTHING on the paper in grey
// graphite pencil, hand-written (his verdict 2026-11-25: exam = pencil only, no colours, no clutter, one focus at a
// time). Steps are a short pop-up that comes and goes; no side panel, no subtitles (YouTube adds them), film grain.
import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {noise2D} from '@remotion/noise';
import {loadFont as bricolage} from '@remotion/google-fonts/BricolageGrotesque';
import {loadFont as geist} from '@remotion/google-fonts/Geist';
import {loadFont as geistMono} from '@remotion/google-fonts/GeistMono';
import {loadFont as kalam} from '@remotion/google-fonts/Kalam';
import {type Lesson, type Pt, type Shape, type Style, ease, polar, angOf, dist, lerpPt, add, mul} from './engine';
import {Compass, Eraser, Pencil, Protractor, Scale} from './Tools';
import {VOICE} from './voice';
import {LESSONS} from './lessons';

const F = {
  title: bricolage('normal', {weights: ['700', '800'], subsets: ['latin']}).fontFamily,
  body: geist('normal', {weights: ['400', '500', '600', '700'], subsets: ['latin']}).fontFamily,
  mono: geistMono('normal', {weights: ['500'], subsets: ['latin']}).fontFamily,
  hand: kalam('normal', {weights: ['400', '700'], subsets: ['latin']}).fontFamily,
};
// graphite greys only (a real HB/2B pencil on white), no colour anywhere on the paper
export const COL = {ink: '#3d3d42', build: '#97979d', teach: '#4a4a50', hi: '#4a4a50', wrong: '#7a7a80', soft: '#9a9aa0', pop: '#4a4a50', ui: '#26262b'};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const prog = (t: number, t0: number, t1: number) => clamp01((t - t0) / Math.max(0.001, t1 - t0));

// ---------------- drawn shapes ----------------
const strokeOf = (s: Style) =>
  ({
    build: {stroke: COL.build, w: 2.2, op: 0.95},
    main: {stroke: '#55555b', w: 3.3, op: 1},
    final: {stroke: '#3a3a3f', w: 4, op: 1},
    teach: {stroke: COL.teach, w: 3, op: 1},
    ghost: {stroke: '#b4b4ba', w: 2, op: 1},
    wrong: {stroke: COL.wrong, w: 2.4, op: 1},
  })[s];
const pencilStyle = (s: Style) => s === 'build' || s === 'main' || s === 'final';

const arcPath = (c: Pt, r: number, a0: number, a1: number) => {
  const p0 = polar(c, r, a0), p1 = polar(c, r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const sweep = a1 > a0 ? 1 : 0;
  if (Math.abs(a1 - a0) >= 359.9) {
    const pm = polar(c, r, a0 + 180);
    return `M${p0.x} ${p0.y}A${r} ${r} 0 1 1 ${pm.x} ${pm.y}A${r} ${r} 0 1 1 ${p0.x} ${p0.y}`;
  }
  return `M${p0.x} ${p0.y}A${r} ${r} 0 ${large} ${sweep} ${p1.x} ${p1.y}`;
};

// how thick lines / how big marks are, against the camera zoom: zooming in makes the drawing big, not the pencil
// fat (his verdict: big drawing, small markings). Set once per frame in GeoVideo.
let Z = 1;
const ShapeView: React.FC<{s: Shape; t: number}> = ({s, t}) => {
  switch (s.k) {
    case 'seg': {
      if (t < s.t0) return null;
      const p = ease(s.e, prog(t, s.t0, s.t1));
      const st = strokeOf(s.style);
      const b = lerpPt(s.a, s.b, p);
      return <line x1={s.a.x} y1={s.a.y} x2={b.x} y2={b.y} stroke={st.stroke} strokeWidth={st.w * Z} strokeOpacity={st.op} strokeLinecap="round" strokeDasharray={s.dash ? '12 10' : undefined} />;
    }
    case 'arc': {
      if (t < s.t0) return null;
      const p = ease(s.e, prog(t, s.t0, s.t1));
      const st = strokeOf(s.style);
      if (p <= 0.001) return null;
      const dash = s.style === 'wrong' || s.style === 'ghost' ? '10 9' : undefined;
      const sgn = s.a1 > s.a0 ? 1 : -1;
      return (
        <g>
          <path d={arcPath(s.c, s.r, s.a0, s.a0 + (s.a1 - s.a0) * p)} fill="none" stroke={st.stroke} strokeWidth={st.w * Z} strokeOpacity={st.op} strokeLinecap="round" strokeDasharray={dash} />
          {s.style === 'build' && p > 0.15 && (
            <path d={arcPath(s.c, s.r + 1.3, s.a0 + sgn * 3, s.a0 + (s.a1 - s.a0) * p - sgn * 2)} fill="none" stroke={st.stroke} strokeWidth={1.3 * Z} strokeOpacity={0.45} strokeLinecap="round" />
          )}
        </g>
      );
    }
    case 'dot': {
      if (t < s.t0) return null;
      // points are PINNED: small, dark, exact (his ask 2026-11-25), not big blobs
      const p = ease('out', prog(t, s.t0 + 0.1, s.t0 + 0.3));
      return <circle cx={s.p.x} cy={s.p.y} r={3.4 * p * Z} fill="#2c2c31" />;
    }
    case 'glyph':
      return <Glyph s={s} t={t} />;
    default:
      return null;
  }
};

// monoline digits (box 100 × 140); each starts where a line arriving from the left can flow into it
const DIGITS: Record<string, string> = {
  '0': 'M50 10C0 10 0 130 50 130C100 130 100 10 50 10',
  '1': 'M26 34L56 10L56 130',
  '2': 'M14 42C14 8 86 2 86 42C86 74 42 92 12 130L90 130',
  '3': 'M14 28C30 0 86 6 80 40C77 62 56 68 40 68C66 68 90 80 88 106C85 140 26 140 12 116',
  '4': 'M70 130L70 10L10 96L94 96',
  '5': 'M86 10L26 10L18 66C40 50 90 56 88 96C86 136 30 140 12 116',
  '6': 'M80 18C55 0 15 15 13 80C12 130 85 135 85 92C85 55 30 55 15 90',
  '7': 'M10 10L90 10L40 130',
  '8': 'M50 68C10 60 15 10 50 10C85 10 90 60 50 68C6 76 10 130 50 130C90 130 94 76 50 68',
  '9': 'M85 50C85 5 15 5 15 45C15 85 85 85 85 45L80 130',
};
const START: Record<string, [number, number]> = {'0': [50, 10], '1': [26, 34], '2': [14, 42], '3': [14, 28], '4': [70, 130], '5': [86, 10], '6': [80, 18], '7': [10, 10], '8': [50, 68], '9': [85, 50]};
const Glyph: React.FC<{s: Extract<Shape, {k: 'glyph'}>; t: number}> = ({s, t}) => {
  if (t < s.t0) return null;
  const k = ease('io', prog(t, s.s0, s.s1));
  const sc = s.big + (s.small - s.big) * k;
  const st = START[s.text[0]];
  const chars = s.text.split('');
  const per = (s.t1 - s.t0) / chars.length;
  return (
    <g transform={`translate(${s.at.x} ${s.at.y}) scale(${sc}) translate(${-st[0]} ${-st[1]})`}>
      {chars.map((ch, i) => {
        const p = ease('io', prog(t, s.t0 + i * per, s.t0 + (i + 1) * per));
        if (p <= 0) return null;
        return <path key={i} d={DIGITS[ch]} transform={`translate(${i * 92} 0)`} fill="none" stroke={COL.ink} strokeWidth={6.5 / sc} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />;
      })}
    </g>
  );
};

// teacher marks + comic pops: clean vector on top of the graphite
const MarkView: React.FC<{s: Shape; t: number}> = ({s, t}) => {
  switch (s.k) {
    case 'label': {
      if (t < s.t0) return null;
      const fs = (s.size ?? 31) * Z;
      const p = ease('out', prog(t, s.t0, s.t0 + 0.25 + s.text.length * 0.06));
      const x = s.at?.x ?? s.p.x + s.dx * 0.85, y = s.at?.y ?? s.p.y + s.dy * 0.85;
      const w = fs * 0.62 * s.text.length + 10;
      const id = `lb-${Math.round(s.p.x)}-${Math.round(s.p.y)}-${Math.round(s.t0 * 30)}`;
      return (
        <g>
          <clipPath id={id}>
            <rect x={x - w / 2} y={y - fs} width={w * p} height={fs * 2} />
          </clipPath>
          <text x={x} y={y} clipPath={`url(#${id})`} textAnchor="middle" dominantBaseline="central" fontFamily={F.hand} fontWeight={s.soft ? 400 : 700} fontSize={fs} fill={s.soft ? '#5c5c62' : COL.ink}>
            {s.text}
          </text>
        </g>
      );
    }
    case 'ticks': {
      if (t < s.t0) return null;
      const p = ease('back', prog(t, s.t0, s.t0 + 0.35));
      const m = lerpPt(s.a, s.b, 0.5);
      const a = angOf(s.a, s.b);
      return (
        <g transform={`translate(${m.x} ${m.y}) rotate(${a}) scale(${p})`}>
          {Array.from({length: s.n}, (_, i) => {
            const x = (i - (s.n - 1) / 2) * 7;
            return <line key={i} x1={(x - 1) * Z} y1={-9 * Z} x2={(x + 1) * Z} y2={9 * Z} stroke={COL.ink} strokeWidth={2.6 * Z} strokeLinecap="round" />;
          })}
        </g>
      );
    }
    case 'right': {
      if (t < s.t0) return null;
      const p = ease('out', prog(t, s.t0, s.t0 + 0.5));
      const L = 18 * Z;
      const a = polar(s.p, L, s.d1), b = polar(s.p, L, s.d2);
      const c = add(a, {x: b.x - s.p.x, y: b.y - s.p.y});
      return <path d={`M${a.x} ${a.y}L${c.x} ${c.y}L${b.x} ${b.y}`} fill="none" stroke={COL.ink} strokeWidth={2.6 * Z} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />;
    }
    case 'cross': {
      if (t < s.t0) return null;
      const p = ease('back', prog(t, s.t0, s.t0 + 0.35));
      return (
        <g transform={`translate(${s.p.x} ${s.p.y}) scale(${p}) rotate(${(1 - p) * 40})`} stroke={COL.wrong} strokeWidth={6} strokeLinecap="round">
          <line x1={-18} y1={-18} x2={18} y2={18} />
          <line x1={18} y1={-18} x2={-18} y2={18} />
        </g>
      );
    }
    case 'probe': {
      if (t < s.t0 || t > s.t1 + 1.6) return null;
      const raw = prog(t, s.t0, s.t1);
      // travels up and down once: shows "every such point is on the middle line"
      const k = raw < 0.5 ? ease('io', raw * 2) : 1 - ease('io', (raw - 0.5) * 2) * 0.5;
      const p = lerpPt(s.from, s.to, k);
      const fade = 1 - prog(t, s.t1 + 0.9, s.t1 + 1.6);
      const appear = ease('out', prog(t, s.t0, s.t0 + 0.4));
      const top = lerpPt(s.from, s.to, Math.max(k, raw < 0.5 ? k : 1));
      const ma = lerpPt(p, s.a, 0.5), mb = lerpPt(p, s.b, 0.5);
      return (
        <g opacity={fade * appear}>
          <line x1={s.from.x} y1={s.from.y} x2={top.x} y2={top.y} stroke={COL.teach} strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" opacity={0.7} />
          <line x1={p.x} y1={p.y} x2={s.a.x} y2={s.a.y} stroke={COL.teach} strokeWidth={2.5} strokeDasharray="10 8" />
          <line x1={p.x} y1={p.y} x2={s.b.x} y2={s.b.y} stroke={COL.teach} strokeWidth={2.5} strokeDasharray="10 8" />
          {[{m: ma, a: angOf(p, s.a)}, {m: mb, a: angOf(p, s.b)}].map((q, i) => (
            <line key={i} x1={q.m.x} y1={q.m.y - 13} x2={q.m.x} y2={q.m.y + 13} transform={`rotate(${q.a} ${q.m.x} ${q.m.y})`} stroke={COL.teach} strokeWidth={4} strokeLinecap="round" />
          ))}
          <circle cx={p.x} cy={p.y} r={18} fill={COL.teach} opacity={0.15} />
          <circle cx={p.x} cy={p.y} r={8} fill={COL.teach} />
        </g>
      );
    }
    case 'split': {
      if (t < s.t0) return null;
      const out = 1 - prog(t, s.t1 + 2.2, s.t1 + 2.8);
      return (
        <g opacity={out}>
          {Array.from({length: s.parts}, (_, i) => {
            const a = lerpPt(s.a, s.b, i / s.parts), b = lerpPt(s.a, s.b, (i + 1) / s.parts);
            const st = s.t0 + ((s.t1 - s.t0) * i) / s.parts;
            const p = ease('out', prog(t, st, st + 0.45));
            if (p <= 0) return null;
            const len = dist(a, b);
            const m = lerpPt(a, b, 0.5);
            const h = Math.min(70, len * 0.35);
            return <path key={i} d={`M${a.x} ${a.y - 14}Q${m.x} ${m.y - 14 - h * 2} ${b.x} ${b.y - 14}`} fill="none" stroke={COL.teach} strokeWidth={3.2} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />;
          })}
        </g>
      );
    }
    case 'note': {
      if (t < s.t0 || t > s.t1 + 0.5) return null;
      const inP = ease('out', prog(t, s.t0, s.t0 + 0.45));
      const outP = prog(t, s.t1, s.t1 + 0.4);
      const size = s.size ?? 32;
      const col = s.color ?? COL.teach;
      return (
        <g opacity={inP * (1 - outP)} transform={`translate(0 ${(1 - inP) * 16 - outP * 10})`}>
          {s.arrowTo && (() => {
            const from = s.arrowTo!.y < s.p.y ? {x: s.p.x - size * 1.2, y: s.p.y - size * 1.05} : {x: s.p.x, y: s.p.y + size * 0.6};
            const to = s.arrowTo!;
            const m = lerpPt(from, to, 0.5);
            const c = add(m, mul({x: -(to.y - from.y), y: to.x - from.x}, 0.18));
            const a = angOf(c, to);
            const draw = ease('out', prog(t, s.t0 + 0.15, s.t0 + 0.6));
            return (
              <g>
                <path d={`M${from.x} ${from.y}Q${c.x} ${c.y} ${to.x} ${to.y}`} fill="none" stroke={col} strokeWidth={2.6} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
                {draw > 0.95 && <path d={`M${polar(to, 14, a + 150).x} ${polar(to, 14, a + 150).y}L${to.x} ${to.y}L${polar(to, 14, a - 150).x} ${polar(to, 14, a - 150).y}`} fill="none" stroke={col} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />}
              </g>
            );
          })()}
          <text x={s.p.x} y={s.p.y} textAnchor="middle" fontFamily={F.body} fontWeight={600} fontSize={size} fill={col} style={{filter: `blur(${(1 - inP) * 4}px)`}}>
            {s.text}
          </text>
        </g>
      );
    }
    case 'burst': {
      // "here we got the point": a pencil ring draws round the crossing, then fades
      if (t < s.t0 || t > s.t0 + 1.3) return null;
      const draw = ease('out', prog(t, s.t0 - 0.05, s.t0 + 0.35));
      const fade = 1 - prog(t, s.t0 + 0.8, s.t0 + 1.3);
      const r = Math.max(13, (s.r ?? 34) * 0.5) * Z;
      return <circle cx={s.p.x} cy={s.p.y} r={r} fill="none" stroke="#5a5a60" strokeWidth={2.2 * Z} transform={`rotate(-80 ${s.p.x} ${s.p.y})`} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} opacity={fade} />;
    }
    case 'sparkle':
      // no sparkles any more (pencil only); done() keeps its ding
      return null;
    default:
      return null;
  }
};

// ---------------- the question, hand-written on the sheet ----------------
// a highlighter pulled over the concept word (his ask 2026-11-25: a highlighter, not bold + underline)
const Highlight: React.FC<{p: number}> = ({p}) => (
  <svg viewBox="0 0 200 40" preserveAspectRatio="none" style={{position: 'absolute', left: -8, top: '18%', width: 'calc(100% + 16px)', height: '72%', overflow: 'visible', zIndex: -1}}>
    <clipPath id="hl-clip">
      <rect x={0} y={-10} width={200 * p} height={60} />
    </clipPath>
    <path clipPath="url(#hl-clip)" d="M3 9C40 5 90 7 140 5S190 6 197 8L198 31C160 34 110 33 70 35S20 33 2 32Z" fill="#ffe76b" opacity={0.6} style={{mixBlendMode: 'multiply'}} />
  </svg>
);
const QuestionText: React.FC<{q: Lesson['qtexts'][number]; t: number}> = ({q, t}) => {
  if (t < q.t0 - 0.2) return null;
  const typeStart = q.t0 + 0.35;
  const shown = Math.max(0, t - typeStart) * q.cps;
  let used = 0;
  return (
    <div style={{position: 'absolute', left: q.x, top: q.y, width: 1500, display: 'flex', gap: 40, alignItems: 'flex-start'}}>
      <div style={{width: 110 * String(q.n).length, height: 154, flex: 'none'}} />
      <div style={{paddingTop: 2, width: 1240, fontFamily: F.hand, fontWeight: 400, fontSize: 64, lineHeight: 1.3, color: COL.ink, position: 'relative', isolation: 'isolate'}}>
        {q.segs.map((s, i) => {
          const from = used;
          used += s.s.length;
          const mp = s.mark === 'concept' && s.tMark != null ? ease('io', prog(t, s.tMark, s.tMark + 0.55)) : 0;
          return (
            <span key={i} style={s.mark === 'concept' ? {position: 'relative', whiteSpace: 'nowrap'} : undefined}>
              {mp > 0 && <Highlight p={mp} />}
              {s.s.split('').map((ch, j) => (
                // every letter holds its place from the start, so nothing jumps to a new line while writing
                <span key={j} style={{opacity: clamp01(shown - from - j), filter: 'url(#graphite)'}}>{ch}</span>
              ))}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ---------------- the exam steps, written next to the finished figure ----------------
const StepSheetView: React.FC<{s: Lesson['sheets'][number]; t: number}> = ({s, t}) => {
  if (t < s.t0 - 0.1) return null;
  const rows = [...s.lines.map((l, i) => ({txt: `${i + 1}.  ${l}`, res: false})), ...(s.result ? [{txt: s.result, res: true}] : [])];
  return (
    <div style={{position: 'absolute', left: s.x, top: s.y, width: 820, fontFamily: F.hand, color: COL.ink, filter: 'url(#graphite)'}}>
      <div style={{fontSize: 30, fontWeight: 700, opacity: ease('out', prog(t, s.t0, s.t0 + 0.4)), marginBottom: 10}}>Steps</div>
      {rows.map((r, i) => {
        const t0 = s.t0 + 0.3 + i * 0.45;
        const p = ease('out', prog(t, t0, t0 + 0.4));
        return (
          <div key={i} style={{fontSize: 27, lineHeight: 1.45, fontWeight: r.res ? 700 : 400, marginTop: r.res ? 14 : 0, opacity: p, transform: `translateX(${(1 - p) * -12}px)`, clipPath: `inset(-10px ${100 - p * 100}% -10px -10px)`}}>
            {r.txt}
          </div>
        );
      })}
    </div>
  );
};

// ---------------- the step pop-up: comes for a moment, says what we do now, goes ----------------
const TOAST = 3.2;
const StepToast: React.FC<{g: Lesson['guides'][number]; t: number}> = ({g, t}) => {
  if (t < g.t0 || t > g.t1 + 0.6) return null;
  const qIn = ease('out', prog(t, g.t0, g.t0 + 0.6)) * (1 - prog(t, g.t1, g.t1 + 0.5));
  const qLabel = (
    <div style={{position: 'absolute', left: 80, top: 26, opacity: qIn, fontFamily: F.hand, fontWeight: 700, fontSize: 50, color: '#8e8e94', filter: 'url(#graphite)'}}>Q{g.q}</div>
  );
  const cur = [...g.cur].filter((c) => c.t <= t && c.i < g.steps.length).pop();
  if (!cur) return qLabel;
  const next = g.cur.find((c) => c.t > cur.t);
  const end = Math.min(cur.t + TOAST, next ? next.t : 1e9, g.t1);
  if (t > end + 0.45) return qLabel;
  const inP = ease('out', prog(t, cur.t, cur.t + 0.45));
  const outP = ease('in', prog(t, end, end + 0.4));
  const extra = g.recap.find((r) => Math.abs(r.t0 - cur.t) < 0.6);
  return (
    <>
    {qLabel}
    <div style={{position: 'absolute', left: 84, top: 104, opacity: inP * (1 - outP), transform: `translateY(${(1 - inP) * -18 - outP * 10}px)`, filter: `blur(${(1 - inP) * 6 + outP * 4}px)`, textShadow: '0 0 18px #fff, 0 0 8px #fff'}}>
      <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 21, letterSpacing: '0.2em', color: COL.soft}}>
        STEP {cur.i + 1} / {g.steps.length}
      </div>
      <div style={{marginTop: 8, fontFamily: F.body, fontWeight: 500, fontSize: 38, letterSpacing: -0.4, color: COL.ui, maxWidth: 900}}>{g.steps[cur.i]}</div>
      {extra && <div style={{marginTop: 8, fontFamily: F.body, fontWeight: 500, fontSize: 25, color: COL.soft}}>{extra.text}</div>}
    </div>
    </>
  );
};

// ---------------- the video ----------------
export type GeoProps = {lesson: string; subs?: boolean}; // subs: kept for old props, never drawn (transcript is a separate file)

export const GeoVideo: React.FC<GeoProps> = ({lesson}) => {
  const frame = useCurrentFrame();
  const {fps, width: W, height: H} = useVideoConfig();
  const L = LESSONS[lesson]();
  const t = frame / fps;
  const c = L.cam.valueAt(t);
  Z = Math.max(0.62, Math.min(1.25, Math.pow(2 / c.zoom, 0.7)));
  // eraser passes: what was drawn before, inside the rubbed box, turns light as the eraser goes over its row
  const repOf = (s: Shape): Pt | null =>
    s.k === 'seg' ? lerpPt(s.a, s.b, 0.5) : s.k === 'arc' ? polar(s.c, s.r, (s.a0 + s.a1) / 2) : s.k === 'dot' || s.k === 'label' || s.k === 'right' ? s.p : s.k === 'ticks' ? lerpPt(s.a, s.b, 0.5) : null;
  const fadeOf = (s: Shape) => {
    let m = 1;
    for (const f of L.fades) {
      if (t < f.t0 || s.t0 >= f.t0) continue;
      if ((s.k === 'seg' || s.k === 'arc') && s.style === 'final') continue;
      const p = repOf(s);
      if (!p || p.x < f.x0 || p.x > f.x1 || p.y < f.y0 || p.y > f.y1) continue;
      const tf = f.t0 + (f.t1 - f.t0) * clamp01((p.y - f.y0) / (f.y1 - f.y0));
      const k = s.k === 'label' || s.k === 'dot' ? f.k * 0.45 : f.k;
      m *= 1 - k * ease('io', prog(t, tf - 0.2, tf + 0.35));
    }
    return m;
  };
  // hovering camera: a slow float, like a camera on a gimbal
  const fx = noise2D('cx', t * 0.12, 0) * 9, fy = noise2D('cy', t * 0.12, 3) * 7, fr = noise2D('cr', t * 0.08, 7) * 0.25;
  const world = `translate(${W / 2}px, ${H / 2}px) scale(${c.zoom}) rotate(${c.rot + fr}deg) translate(${-c.x + fx}px, ${-c.y + fy}px)`;
  const pencilShapes = L.shapes.filter((s) => ((s.k === 'seg' || s.k === 'arc') && pencilStyle(s.style)) || s.k === 'glyph');
  const dots = L.shapes.filter((s) => s.k === 'dot');
  const teachShapes = L.shapes.filter((s) => (s.k === 'seg' || s.k === 'arc') && !pencilStyle(s.style));
  const marks = L.shapes.filter((s) => s.k !== 'seg' && s.k !== 'arc' && s.k !== 'dot' && s.k !== 'glyph');
  const cp = L.compass.valueAt(t), sc = L.scale.valueAt(t), pc = L.pencil.valueAt(t);
  const grain = Math.floor(frame / 2) % 8;
  return (
    <AbsoluteFill style={{background: '#ffffff', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `perspective(2600px) rotateX(${c.tilt}deg)`, transformOrigin: '50% 60%'}}>
        <div style={{position: 'absolute', left: 0, top: 0, transform: world, transformOrigin: '0 0'}}>
          {L.qtexts.map((q, i) => (
            <QuestionText key={i} q={q} t={t} />
          ))}
          {L.sheets.map((sh, i) => (
            <StepSheetView key={i} s={sh} t={t} />
          ))}
          <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            <defs>
              {/* graphite: the stroke keeps a fine paper-tooth grain */}
              {/* graphite: paper tooth breaks the stroke up (fine grain) + uneven pressure (slow noise) */}
              <filter id="graphite" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
                <feTurbulence type="fractalNoise" baseFrequency="1.15" numOctaves={2} seed={4} result="n" />
                <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3.4 2.25" result="m" />
                <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={1} seed={9} result="n2" />
                <feColorMatrix in="n2" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 1.45" result="m2" />
                <feComposite in="m" in2="m2" operator="in" result="mm" />
                <feComposite in="SourceGraphic" in2="mm" operator="in" result="g" />
                <feMerge>
                  <feMergeNode in="g" />
                  <feMergeNode in="g" />
                </feMerge>
              </filter>
              {/* softer graphite for writing (letters must stay readable) */}
              <filter id="graphite-soft" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
                <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves={2} seed={7} result="n" />
                <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.7 1.7" result="m" />
                <feComposite in="SourceGraphic" in2="m" operator="in" result="g" />
                <feMerge>
                  <feMergeNode in="g" />
                  <feMergeNode in="g" />
                </feMerge>
              </filter>
            </defs>
            <g filter="url(#graphite)">
              {pencilShapes.map((s, i) => (
                <g key={i} opacity={fadeOf(s)}>
                  <ShapeView s={s} t={t} />
                </g>
              ))}
            </g>
            <g filter="url(#graphite)">
              {teachShapes.map((s, i) => (
                <ShapeView key={i} s={s} t={t} />
              ))}
              {marks.map((s, i) => (
                <g key={i} opacity={fadeOf(s)}>
                  <MarkView s={s} t={t} />
                </g>
              ))}
              {/* points: same pencil texture, smaller, a little darker than the lines (his verdict 2026-11-25) */}
              {dots.map((s, i) => (
                <g key={i} opacity={fadeOf(s)}>
                  <ShapeView s={s} t={t} />
                </g>
              ))}
            </g>
            <Scale {...sc} hl={sc.hl} vis={L.vis.scale.valueAt(t).v} />
            <Compass {...cp} vis={L.vis.compass.valueAt(t).v} />
            <Protractor {...L.protractor.valueAt(t)} vis={L.vis.protractor.valueAt(t).v} />
            <Eraser {...L.eraser.valueAt(t)} vis={L.vis.eraser.valueAt(t).v} />
            <Pencil {...pc} vis={L.vis.pencil.valueAt(t).v} />
          </svg>
        </div>
      </AbsoluteFill>
      {L.guides.map((g, i) => (
        <StepToast key={i} g={g} t={t} />
      ))}
      {/* film grain: multiplied very lightly so the white stays white but feels printed */}
      <Img src={staticFile(`assets/film/grain-${grain + 1}.jpg`)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'multiply', opacity: 0.045, filter: 'contrast(1.6) brightness(1.25)', pointerEvents: 'none'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 60%, rgba(20,20,30,0.035) 100%)', pointerEvents: 'none'}} />
      {/* his recorded voice, line by line (voice.ts); effects duck under it */}
      {VOICE[lesson] &&
        L.voice.map((v, i) => (
          <Sequence key={'v' + i} from={Math.round(v.t * fps)} durationInFrames={Math.max(1, Math.round((v.to - v.from) * fps))}>
            <Audio src={staticFile(VOICE[lesson]!.src)} startFrom={Math.round(v.from * fps)} endAt={Math.round(v.to * fps)} />
          </Sequence>
        ))}
      {L.sfx.map((s, i) => {
        const from = Math.round(s.t * fps);
        const len = Math.max(6, Math.round((s.dur ?? 1.6) * fps));
        return (
          <Sequence key={i} from={from} durationInFrames={len}>
            <Audio
              src={staticFile(`geo-stage/sfx/${s.name}.mp3`)}
              volume={(f) => {
                // effects stay under the voice (his ask): ~45 % lower while he speaks; trimmed sounds fade out
                const tt = (from + f) / fps;
                const speaking = L.subs.some((u) => tt >= u.t0 && tt <= u.t1);
                const tail = s.dur ? Math.min(1, (len - f) / 5) : 1;
                return s.vol * 0.8 * (speaking ? 0.55 : 1) * tail;
              }}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const lessonFrames = (lesson: string, fps = 30) => Math.ceil(LESSONS[lesson]().t * fps);
