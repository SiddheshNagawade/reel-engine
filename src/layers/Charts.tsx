// ANIMATED CHARTS from real numbers (brand explainers, brain/explainers.md "Chart build order"): direction.charts →
// edit.inserts kind 'chart'. One element at a time, so the viewer reads each before the next appears:
//   a thin line draws across → it opens into the chart card → axes + labels → the data builds → the tag pops last.
//   bar   bars rise one by one while their value counts up (ease-out, slows at the end); optional range text that
//         resolves after the count ("₹2,500–3,000"), optional multiplier tag ("3–4×") with a bracket between two bars
//   line  the line draws itself left → right, the end dot lands and an end label pops ("+70 %")
//   pie   the base disc sets, the slice sweeps open, then cuts out of the pie; a big percentage counts up beside it
// Colour per chart (the brand's colour world): bg (card/board), color (the data), accent (highlight / tag / end label),
// ink (text). style 'full' (default) = the chart OWNS the screen: its bg wipes up over the footage, nothing else competes;
// 'card' = a small supporting graphic next to the footage/canvas (x, y, w), only when the footage stays the main thing.
import React from 'react';
import {Easing, interpolate, useVideoConfig} from 'remotion';
import {ease} from '../motion/springs';
import {fonts} from './fonts';
import {isLight} from './Captions';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const countEase = Easing.out(Easing.cubic);

// at = frames from the chart start when this bar moves (plan.mjs fills it from `word`, so it rises on his word);
// from = the value it starts at (equal bars, then one grows/shrinks: counts up or DOWN); to = top of a range: after the
// count a hatched band grows value -> to while the label's upper number counts ("₹700–800").
export type ChartBar = {label: string; value: number; display?: string; color?: string; hi?: boolean; at?: number; from?: number; to?: number};
export type ChartSlice = {label?: string; value: number; color?: string};
export type ChartSpec = {
  type: 'bar' | 'line' | 'pie';
  title?: string; // small header on the card ("RAW WHEY PRICE / KG")
  source?: string; // small credit in the corner ("Source: NZ Herald")
  style?: 'full' | 'card';
  // box: the chart sits on its own card (opens from a line). none (default): no box at all, the bars/line/pie live
  // straight on the canvas or footage like stickers, flying in from below the frame and out through the top.
  frame?: 'box' | 'none';
  x?: number; y?: number; w?: number; // card placement (fractions; centre x, top y, width)
  bg?: string; color?: string; accent?: string; ink?: string;
  prefix?: string; suffix?: string; decimals?: number;
  // bar
  bars?: ChartBar[];
  multiplier?: {text: string; from?: number; to?: number; at?: number}; // tag between bar `from` and bar `to` (default first → last); at = frames (from `word`)
  // line
  points?: number[]; xLabels?: string[]; endLabel?: string; area?: boolean;
  // pie
  slices?: ChartSlice[]; cut?: number; big?: string; bigLabel?: string; // big = text beside the pie ("24%"), counts up if numeric
};

const fmt = (v: number, d = 0) => v.toLocaleString('en-IN', {minimumFractionDigits: d, maximumFractionDigits: d});
// a numeric string ("24%", "₹1,145") counts up: split into prefix / number / suffix
const splitNum = (s: string) => {
  const m = s.match(/^([^\d-]*)(-?[\d,]*\.?\d+)(.*)$/);
  return m ? {pre: m[1], n: Number(m[2].replace(/,/g, '')), dec: (m[2].split('.')[1] ?? '').length, post: m[3]} : null;
};

// the build schedule (frames) shared by all three types
function schedule(frames: number, fps: number, steps: number) {
  const line = Math.round(0.3 * fps), open = Math.round(0.3 * fps), axes = Math.round(0.5 * fps);
  const head = line + open + axes;
  const tail = Math.round(0.9 * fps); // the finished chart holds to be read
  const step = Math.max(Math.round(0.5 * fps), Math.min(Math.round(1.5 * fps), Math.floor((frames - head - tail) / Math.max(1, steps))));
  return {line, open, axes, head, step};
}

export const Chart: React.FC<{x: ChartSpec & {frames: number}; t: number}> = ({x, t}) => {
  const {fps, width: W, height: H} = useVideoConfig();
  const U = Math.min(W, H * 0.5625);
  const full = x.style !== 'card';
  const bg = x.bg ?? '#0f5132';
  const ink = x.ink ?? (isLight(bg) ? '#141414' : '#f4efe4');
  const color = x.color ?? (isLight(bg) ? '#1d1d1f' : '#f4efe4');
  const accent = x.accent ?? '#f5b82e';
  const steps = x.type === 'bar' ? (x.bars?.length ?? 1) + (x.multiplier ? 0.4 : 0) : x.type === 'pie' ? 2 : 1.4;
  const S = schedule(x.frames, fps, steps);
  // card geometry: full = most of the frame (a 16:9 board in a vlog, a tall board in a reel); card = x/y/w
  const cw = full ? W * (W > H ? 0.84 : 0.88) : U * (x.w ?? 0.82);
  const ch = full ? H * (W > H ? 0.78 : 0.5) : cw * 0.82;
  const cx = full ? W / 2 : W * (x.x ?? 0.5), cy = full ? H / 2 : H * (x.y ?? 0.2) + ch / 2;
  // 1) a thin line draws across  2) it opens into the card
  const lineP = interpolate(t, [0, S.line], [0, 1], {...clamp, easing: easeOut});
  const openP = interpolate(t, [S.line, S.line + S.open], [0, 1], {...clamp, easing: easeOut});
  const axesP = interpolate(t, [S.line + S.open, S.head], [0, 1], {...clamp, easing: easeOut});
  const boxed = x.frame === 'box';
  const out = boxed ? interpolate(t, [x.frames - 6, x.frames], [1, 0], clamp) : 1;
  // no box: the whole chart travels in from below the frame (ease-out, motion blur) and leaves through the top
  const flyIn = boxed ? 1 : interpolate(t, [0, Math.round(0.45 * fps)], [0, 1], {...clamp, easing: ease.container});
  const flyOut = boxed ? 0 : interpolate(t, [x.frames - Math.round(0.35 * fps), x.frames], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const dy = (1 - flyIn) * H * 0.7 - flyOut * H * 0.8;
  const mblur = Math.abs((1 - flyIn) * 14) + flyOut * 18;
  const fs = U * 0.034; // label size
  const pad = Math.min(cw, ch) * 0.08;
  const plot = {l: pad * 1.2, r: cw - pad * 1.2, t: pad * 2.6, b: ch - pad * 1.9};
  const c = {bg, ink, color, accent, fs, plot, cw, ch, S, t, fps};
  // ONE main element: a full chart owns the screen. Unboxed, its colour world wipes up from the bottom edge over the
  // footage (the video is gone), the chart flies in on it, and on the way out both leave through the top edge.
  const stageIn = interpolate(t, [0, Math.round(0.3 * fps)], [0, 1], {...clamp, easing: ease.container});
  const stageOut = interpolate(t, [x.frames - Math.round(0.3 * fps), x.frames], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const chartEl = (
    <div style={{position: 'absolute', inset: 0, opacity: out, background: full && boxed ? (isLight(bg) ? '#efe9dc' : '#0b0b0d') : undefined,
      transform: `translateY(${dy}px)`, filter: mblur > 0.5 ? `blur(${mblur}px)` : undefined}}>
      <div style={boxed ? {position: 'absolute', left: cx - cw / 2, top: cy - (ch * openP) / 2 - 2, width: cw * lineP, height: Math.max(4, ch * openP),
        background: bg, borderRadius: U * 0.025 * openP, overflow: 'hidden', boxShadow: openP > 0.1 ? '0 30px 80px rgba(0,0,0,0.35)' : undefined}
        : {position: 'absolute', left: cx - cw / 2, top: cy - ch / 2, width: cw, height: ch}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: cw, height: ch, opacity: axesP}}>
          {x.title && <div style={{position: 'absolute', left: pad, top: pad * 0.8, fontFamily: fonts.inter, fontWeight: 800, fontSize: fs * 0.8, letterSpacing: 2, textTransform: 'uppercase', color: ink, opacity: 0.75}}>{x.title}</div>}
          {x.source && <div style={{position: 'absolute', right: pad, bottom: pad * 0.45, fontFamily: fonts.inter, fontWeight: 500, fontSize: fs * 0.55, color: ink, opacity: 0.55}}>Source: {x.source}</div>}
          {x.type === 'bar' && <Bars x={x} c={c} />}
          {x.type === 'line' && <Line x={x} c={c} />}
          {x.type === 'pie' && <Pie x={x} c={c} />}
        </div>
      </div>
    </div>
  );
  if (!full || boxed) return chartEl;
  return (
    <div style={{position: 'absolute', inset: 0, background: bg, clipPath: `inset(${stageOut * 100}% 0 ${(1 - stageIn) * 100}% 0)`}}>
      {chartEl}
    </div>
  );
};

type C = {bg: string; ink: string; color: string; accent: string; fs: number; plot: {l: number; r: number; t: number; b: number}; cw: number; ch: number; S: ReturnType<typeof schedule>; t: number; fps: number};

// ── bar ──────────────────────────────────────────────────────────────────────────────────────────────────────────
const Bars: React.FC<{x: ChartSpec; c: C}> = ({x, c}) => {
  const bars = x.bars ?? [];
  const max = Math.max(...bars.map((b) => Math.max(b.value, b.to ?? 0, b.from ?? 0)), 1) * 1.08;
  const {l, r, t: top, b: base} = c.plot;
  const n = bars.length, slot = (r - l) / n, bw = Math.min(slot * 0.5, c.cw * 0.2);
  const hiIdx = bars.findIndex((b) => b.hi) >= 0 ? bars.findIndex((b) => b.hi) : n - 1;
  const H = base - top;
  const geo = bars.map((b, i) => {
    // timed to his words when `at` is known (the references hold a finished bar until the next sentence), else spread out
    const s0 = Math.max(c.S.head, b.at ?? c.S.head + i * c.S.step);
    const dur = b.at != null ? Math.round(1.4 * c.fps) : Math.round(c.S.step * 0.9);
    const p = interpolate(c.t, [s0, s0 + dur], [0, 1], {...clamp, easing: ease.heavy}); // bars rise with weight
    const v0 = b.from ?? 0;
    const val = v0 + (b.value - v0) * p; // the value right now (counts up, or down when from > value)
    const h = (H * val) / max;
    const rangeP = b.to != null ? interpolate(c.t, [s0 + dur, s0 + dur + Math.round(0.7 * c.fps)], [0, 1], {...clamp, easing: countEase}) : 0;
    const hTo = b.to != null ? h + (H * (b.to - b.value) * rangeP) / max : h; // the band only grows after the bar has landed
    return {b, i, p, h, hTo, val, rangeP, dur, cx: l + slot * (i + 0.5), s0, hEnd: (H * Math.max(b.value, b.to ?? 0)) / max};
  });
  const m = x.multiplier;
  const mFrom = geo[m?.from ?? 0], mTo = geo[m?.to ?? n - 1];
  const lastDone = Math.max(...geo.map((g) => g.s0 + g.dur + (g.b.to != null ? Math.round(0.7 * c.fps) : 0)));
  const mAt = m?.at ?? lastDone + 4;
  const mP = interpolate(c.t, [mAt - 2, mAt + Math.round(0.25 * c.fps)], [0, 1], {...clamp, easing: ease.snappy});
  return (
    <>
      {/* gridlines + baseline */}
      {[0.25, 0.5, 0.75].map((g) => <div key={g} style={{position: 'absolute', left: l, width: r - l, top: base - (base - top) * g, height: 1, background: c.ink, opacity: 0.12}} />)}
      <div style={{position: 'absolute', left: l, width: r - l, top: base, height: 3, background: c.ink, opacity: 0.6}} />
      {geo.map(({b, i, h, hTo, val, rangeP, cx, s0, dur}) => {
        const hi = i === hiIdx;
        const fill = b.color ?? (hi ? c.accent : c.color);
        const shown = c.t >= s0 || b.from != null; // a bar with a start value is there from the beginning (equal bars)
        const dec = x.decimals ?? 0;
        const num = (v: number) => `${x.prefix ?? ''}${fmt(v, dec)}`;
        const label = c.t >= s0 + dur && b.display ? b.display
          : b.to != null && rangeP > 0 ? `${num(b.value)}–${fmt(b.value + (b.to - b.value) * rangeP, dec)}${x.suffix ?? ''}`
          : `${num(val)}${x.suffix ?? ''}`;
        return (
          <React.Fragment key={i}>
            {/* the range: a hatched band on top of the bar, same colour (uncertainty drawn, not just written) */}
            {hTo > h + 0.5 && (
              <div style={{position: 'absolute', left: cx - bw / 2, width: bw, top: base - hTo, height: hTo - h, borderRadius: '4px 4px 0 0', opacity: 0.85,
                backgroundImage: `repeating-linear-gradient(135deg, ${fill} 0 ${c.fs * 0.18}px, transparent ${c.fs * 0.18}px ${c.fs * 0.36}px)`, boxShadow: `inset 0 0 0 2px ${fill}`}} />
            )}
            <div style={{position: 'absolute', left: cx - bw / 2, width: bw, top: base - h, height: h, background: fill, borderRadius: hTo > h + 0.5 ? 0 : '4px 4px 0 0',
              opacity: hi || b.color ? 1 : 0.92}} />
            {shown && (
              <div style={{position: 'absolute', left: cx - slot / 2, width: slot, top: base - Math.max(h, hTo) - c.fs * 1.7, textAlign: 'center', fontFamily: fonts.anton,
                fontSize: c.fs * 1.25, color: hi ? c.accent : c.ink, whiteSpace: 'nowrap', opacity: b.from != null ? 1 : interpolate(c.t, [s0, s0 + 4], [0, 1], clamp)}}>{label}</div>
            )}
            <div style={{position: 'absolute', left: cx - slot / 2, width: slot, top: base + c.fs * 0.5, textAlign: 'center', fontFamily: fonts.inter, fontWeight: 800,
              fontSize: c.fs * 0.75, letterSpacing: 1.5, textTransform: 'uppercase', color: c.ink, opacity: 0.85}}>{b.label}</div>
          </React.Fragment>
        );
      })}
      {m && mFrom && mTo && mP > 0 && (() => {
        // bracket at the right of the taller bar: from the lower bar's top to the higher bar's top, tag beside it
        const x0 = mTo.cx + bw / 2 + c.fs * 0.6;
        const yA = base - mFrom.hEnd, yB = base - mTo.hEnd;
        const y1 = Math.min(yA, yB), y2 = Math.max(yA, yB);
        return (
          <>
            <div style={{position: 'absolute', left: x0, top: y1, width: c.fs * 0.5, height: (y2 - y1) * Math.min(1, mP), borderTop: `3px solid ${c.ink}`, borderRight: `3px solid ${c.ink}`, borderBottom: mP >= 1 ? `3px solid ${c.ink}` : undefined, opacity: 0.8}} />
            <div style={{position: 'absolute', left: x0 + c.fs * 0.9, top: (y1 + y2) / 2 - c.fs * 0.9, padding: `${c.fs * 0.15}px ${c.fs * 0.45}px`, background: c.accent,
              color: isLight(c.accent) ? '#111' : '#fff', fontFamily: fonts.inter, fontWeight: 800, fontSize: c.fs * 1.1, borderRadius: c.fs * 0.25, transform: `scale(${mP})`, transformOrigin: 'left center', whiteSpace: 'nowrap',
              boxShadow: '0 8px 20px rgba(0,0,0,0.3)'}}>{m.text}</div>
          </>
        );
      })()}
    </>
  );
};

// ── line ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const Line: React.FC<{x: ChartSpec; c: C}> = ({x, c}) => {
  const pts = x.points ?? [];
  if (pts.length < 2) return null;
  const lo = Math.min(...pts), hi = Math.max(...pts), span = hi - lo || 1;
  const {l, r, t: top, b: base} = c.plot;
  const rr = r - (x.endLabel ? c.fs * 3.2 : 0); // room for the end label
  const xy = pts.map((v, i) => [l + ((rr - l) * i) / (pts.length - 1), base - ((base - top) * 0.9 * (v - lo)) / span - (base - top) * 0.05] as const);
  const lens = xy.slice(1).map((p, i) => Math.hypot(p[0] - xy[i][0], p[1] - xy[i][1]));
  const total = lens.reduce((a, b) => a + b, 0);
  const s0 = c.S.head, dur = c.S.step * 1.4;
  const p = interpolate(c.t, [s0, s0 + dur], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  // the drawn tip: walk the segments
  let left = total * p, tip = xy[0] as readonly [number, number];
  for (let i = 0; i < lens.length; i++) {
    if (left <= lens[i]) { const k = lens[i] ? left / lens[i] : 0; tip = [xy[i][0] + (xy[i + 1][0] - xy[i][0]) * k, xy[i][1] + (xy[i + 1][1] - xy[i][1]) * k]; break; }
    left -= lens[i]; tip = xy[i + 1];
  }
  const d = xy.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ');
  const endP = interpolate(c.t, [s0 + dur, s0 + dur + Math.round(0.25 * c.fps)], [0, 1], {...clamp, easing: ease.snappy});
  const last = xy[xy.length - 1];
  const clipW = tip[0];
  return (
    <>
      {[0.25, 0.5, 0.75].map((g) => <div key={g} style={{position: 'absolute', left: l, width: r - l, top: base - (base - top) * g, height: 1, background: c.ink, opacity: 0.12}} />)}
      <div style={{position: 'absolute', left: l, width: r - l, top: base, height: 3, background: c.ink, opacity: 0.6}} />
      <svg width={c.cw} height={c.ch} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs><clipPath id="draw"><rect x={0} y={0} width={clipW} height={c.ch} /></clipPath></defs>
        {x.area && <path d={`${d} L${last[0]},${base} L${xy[0][0]},${base} Z`} fill={c.color} opacity={0.15} clipPath="url(#draw)" />}
        <path d={d} fill="none" stroke={c.color} strokeWidth={c.fs * 0.22} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={total} strokeDashoffset={total * (1 - p)} />
        {p > 0 && <circle cx={tip[0]} cy={tip[1]} r={c.fs * 0.32 * (1 + endP * 0.3)} fill={endP > 0 ? c.accent : c.color} />}
      </svg>
      {(x.xLabels ?? []).map((lb, i, a) => (
        <div key={i} style={{position: 'absolute', left: l + ((rr - l) * i) / Math.max(1, a.length - 1) - 100, width: 200, top: base + c.fs * 0.5, textAlign: 'center',
          fontFamily: fonts.inter, fontWeight: 700, fontSize: c.fs * 0.7, color: c.ink, opacity: 0.75}}>{lb}</div>
      ))}
      {x.endLabel && endP > 0 && (
        <div style={{position: 'absolute', left: last[0] + c.fs * 0.6, top: last[1] - c.fs * 0.85, padding: `${c.fs * 0.12}px ${c.fs * 0.4}px`, background: c.accent,
          color: isLight(c.accent) ? '#111' : '#fff', fontFamily: fonts.anton, fontSize: c.fs * 1.1, borderRadius: c.fs * 0.2, transform: `scale(${endP})`, transformOrigin: 'left center', whiteSpace: 'nowrap'}}>
          {x.endLabel}
        </div>
      )}
    </>
  );
};

// ── pie ──────────────────────────────────────────────────────────────────────────────────────────────────────────
const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  if (a1 - a0 >= Math.PI * 2 - 1e-4) return `M${cx - r},${cy} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0`;
  const p = (a: number) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M${cx},${cy} L${x0},${y0} A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0},1 ${x1},${y1} Z`;
};
const Pie: React.FC<{x: ChartSpec; c: C}> = ({x, c}) => {
  const slices = x.slices ?? [];
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const wide = c.cw > c.ch * 1.2;
  const R = Math.min(c.ch * 0.34, c.cw * (wide ? 0.22 : 0.3));
  const pcx = wide ? c.cw * 0.32 : c.cw / 2, pcy = wide ? c.ch * 0.55 : c.ch * 0.5;
  const cut = x.cut ?? 0;
  const s0 = c.S.head;
  const sweep = interpolate(c.t, [s0, s0 + c.S.step], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)}); // slices sweep open
  const pull = interpolate(c.t, [s0 + c.S.step, s0 + c.S.step + Math.round(0.4 * c.fps)], [0, 1], {...clamp, easing: ease.container}); // the cut slice slides out
  let a = 0;
  const parts = slices.map((s, i) => {
    const a0 = a, a1 = a + (Math.PI * 2 * s.value) / total;
    a = a1;
    return {s, i, a0, a1};
  });
  const big = x.big ? splitNum(x.big) : null;
  const bigText = big ? `${big.pre}${fmt(big.n * sweep, big.dec)}${big.post}` : x.big;
  return (
    <>
      <svg width={c.cw} height={c.ch} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {/* the whole pie (base), then each slice sweeps in on top of it */}
        <circle cx={pcx} cy={pcy} r={R} fill={c.ink} opacity={0.06} />
        <circle cx={pcx} cy={pcy} r={R} fill="none" stroke={c.ink} strokeWidth={3} opacity={0.6} />
        {parts.map(({s, i, a0, a1}) => {
          const isCut = i === cut;
          const mid = (a0 + a1) / 2;
          const off = isCut ? pull * R * 0.12 : 0;
          const end = a0 + (a1 - a0) * sweep;
          if (end <= a0) return null;
          const fill = s.color ?? (isCut ? c.accent : c.color);
          return <path key={i} d={arc(pcx + Math.sin(mid) * off, pcy - Math.cos(mid) * off, R, a0, end)} fill={fill} opacity={isCut ? 1 : 0.12} stroke={c.bg} strokeWidth={isCut ? 4 : 2} />;
        })}
      </svg>
      {x.big && (
        <div style={{position: 'absolute', ...(wide ? {left: c.cw * 0.58, top: c.ch * 0.3, width: c.cw * 0.38, textAlign: 'left'} : {left: 0, width: c.cw, top: pcy + R + c.fs * 0.6, textAlign: 'center'}),
          opacity: interpolate(c.t, [s0, s0 + 4], [0, 1], clamp)}}>
          <div style={{fontFamily: fonts.anton, fontSize: c.fs * (wide ? 3.6 : 2.6), lineHeight: 1, color: c.accent}}>{bigText}</div>
          {x.bigLabel && <div style={{fontFamily: fonts.inter, fontWeight: 800, fontSize: c.fs * 0.8, letterSpacing: 1.5, textTransform: 'uppercase', color: c.ink, marginTop: c.fs * 0.3, opacity: pull}}>{x.bigLabel}</div>}
        </div>
      )}
      {!x.big && slices[cut]?.label && (
        <div style={{position: 'absolute', left: 0, width: c.cw, top: pcy + R + c.fs * 0.6, textAlign: 'center', fontFamily: fonts.inter, fontWeight: 800, fontSize: c.fs, color: c.ink, opacity: pull}}>{slices[cut].label}</div>
      )}
    </>
  );
};
