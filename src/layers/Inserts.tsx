// Graphics that land on a word (direction.json → edit.inserts): the techniques from brain/motion-design.md and
// brain/expensive.md that used to live only in the template gallery or a todo list.
//   counter   NumberRoll: a real number rolls up (full stage, or an overlay card over the footage)
//   reveal    CircleReveal: before → after spotlight
//   stage     CardStage: clips/pictures as cards that morph between row / grid / stack / focus
//   chat      a messages screen (whatsapp / imessage / instagram); bubbles arrive one by one, typing dots first
//   notify    phone notifications drop in and stack up (a cascade)
//   cursor    a button + cursor that clicks it (apps, websites, "I pressed publish")
//   connector an arrow drawn from one point to another (hero word → its visual)
//   burst     a light burst / glitch flash accent on a big moment
//   scatter   words land at different spots and sizes, then settle into a line
//   plane     a screen recording / picture on a 3D-tilted card that slowly turns and scrolls (apps, websites)
//   push      a word or picture flies INTO the lens and fills the frame: a transition between two ideas
//   scene     a full-screen motion-graphics board with a moving camera (templates/Scene.tsx)
//   chart     animated bar / line / pie from real numbers, built one element at a time (Charts.tsx)
//   iso       isometric 3D-look scenes on a floating board (Iso.tsx): buildings rise, turbines spin, cars travel
//   illo      illustrated objects (printer, globe, satellite…) drawn on and acting out his words (Illos.tsx)
//   words     designed mixed-font title tokens on the beat · stack: inverted (exclusion) stacked title (TitleText.tsx)
// Also here: RoomFrame (the footage shrinks/moves to make room, blurred copy behind) and captionShift (captions
// move aside while a visual owns their spot).
import React from 'react';
import {AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Edit, Insert, RoomLayout} from '../types';
import {fonts} from './fonts';
import {NumberRoll} from '../templates/NumberRoll';
import {CircleReveal} from '../templates/CircleReveal';
import {CardStage} from '../templates/CardStage';
import {Scene} from '../templates/Scene';
import {Words, Stack, Photo, FloatCard} from './TitleText';
import {Chart} from './Charts';
import {Board} from './Boards';
import {Illo, IlloFull} from './Illos';
import {Iso} from './Iso';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const rnd = (seed: number, i: number) => {
  const x = Math.sin(seed * 127.1 + i * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
// in/out envelope of an insert: soft entrance, soft exit
const life = (t: number, n: number, inF = 8, outF = 8) => Math.min(interpolate(t, [0, inF], [0, 1], clamp), interpolate(t, [n - outF, n], [1, 0], clamp));

export const FULL_KINDS = new Set(['reveal', 'stage', 'scene']);
// inserts that carry the words themselves: captions step aside while they show
export const TEXT_KINDS = new Set(['scatter', 'scene', 'words', 'stack']);
// One size unit that works in 9:16 (= width) and 16:9 (= a phone-width column of the height), so the same
// graphics serve reels and vlogs.
const unitOf = (W: number, H: number) => Math.min(W, H * 0.5625);
const isFull = (x: Insert) => FULL_KINDS.has(x.kind) || (x.kind === 'counter' && x.style !== 'overlay') || (x.kind === 'chart' && x.style !== 'card') || (x.kind === 'illo' && x.style === 'full') || (x.kind === 'board' && x.style !== 'over') || (x.kind === 'iso' && x.style !== 'over');

// ── chat ────────────────────────────────────────────────────────────────────────────────────────────────────────
const CHAT = {
  whatsapp: {bg: '#efe7dd', me: '#d9fdd3', meInk: '#111', them: '#ffffff', themInk: '#111', head: '#008069', headInk: '#fff'},
  imessage: {bg: '#ffffff', me: '#0b84ff', meInk: '#fff', them: '#e9e9eb', themInk: '#111', head: '#f6f6f6', headInk: '#111'},
  instagram: {bg: '#000000', me: '#7b4dff', meInk: '#fff', them: '#262626', themInk: '#fff', head: '#000', headInk: '#fff'},
};
const Chat: React.FC<{x: Extract<Insert, {kind: 'chat'}>; t: number}> = ({x, t}) => {
  const {fps, width: W, height: H} = useVideoConfig();
  const c = CHAT[x.app ?? 'whatsapp'];
  const k = life(t, x.frames, 10, 8);
  const U = unitOf(W, H), w = U * 0.78, fs = U * 0.036;
  const gap = x.gap ?? 22;
  const times = x.messages.map((m, i) => m.at ?? 8 + i * gap);
  const inS = spring({frame: t, fps, config: {damping: 15, stiffness: 140}});
  return (
    <div style={{position: 'absolute', left: W * (x.x ?? 0.5) - w / 2, top: H * (x.y ?? 0.2), width: w, borderRadius: fs, overflow: 'hidden', background: c.bg,
      boxShadow: '0 30px 80px rgba(0,0,0,0.45)', opacity: k, transform: `translateY(${(1 - inS) * 120}px) scale(${0.9 + 0.1 * inS})`}}>
      <div style={{background: c.head, color: c.headInk, padding: `${fs * 0.7}px ${fs}px`, display: 'flex', alignItems: 'center', gap: fs * 0.6, fontFamily: fonts.inter, fontWeight: 700, fontSize: fs}}>
        <div style={{width: fs * 1.8, height: fs * 1.8, borderRadius: '50%', background: '#c9c9c9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'}}>
          {(x.title ?? '?').slice(0, 1).toUpperCase()}
        </div>
        {x.title ?? 'Chat'}
      </div>
      <div style={{padding: fs * 0.8, display: 'flex', flexDirection: 'column', gap: fs * 0.45, minHeight: fs * 4}}>
        {x.messages.map((m, i) => {
          const at = times[i];
          const me = m.from === 'me';
          if (t < at - (me ? 0 : 14)) return null;
          const typing = !me && t < at;
          const pop = spring({frame: t - at, fps, config: {damping: 12, stiffness: 200, mass: 0.6}});
          return (
            <div key={i} style={{alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: '78%', background: me ? c.me : c.them, color: me ? c.meInk : c.themInk,
              borderRadius: fs * 0.9, padding: `${fs * 0.45}px ${fs * 0.75}px`, fontFamily: fonts.inter, fontWeight: 500, fontSize: fs, lineHeight: 1.3,
              transform: `scale(${typing ? 1 : 0.6 + 0.4 * pop})`, transformOrigin: me ? 'right bottom' : 'left bottom', boxShadow: '0 2px 4px rgba(0,0,0,0.08)'}}>
              {typing ? (
                <span style={{letterSpacing: 4}}>{[0, 1, 2].map((d) => <span key={d} style={{opacity: 0.35 + 0.65 * Math.max(0, Math.sin((t + d * 4) / 3))}}>●</span>)}</span>
              ) : m.text}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── notifications (cascade) ─────────────────────────────────────────────────────────────────────────────────────
const Notify: React.FC<{x: Extract<Insert, {kind: 'notify'}>; t: number}> = ({x, t}) => {
  const {fps, width: W, height: H} = useVideoConfig();
  const U = unitOf(W, H), w = U * 0.86, fs = U * 0.032, gap = x.gap ?? 14;
  const k = life(t, x.frames, 4, 8);
  const shown = x.items.map((it, i) => ({it, i, at: it.at ?? i * gap})).filter((n) => t >= n.at);
  return (
    <div style={{position: 'absolute', left: W * (x.x ?? 0.5) - w / 2, top: H * (x.y ?? 0.1), width: w, opacity: k}}>
      {shown.map(({it, i, at}) => {
        const depth = shown.length - 1 - shown.findIndex((s) => s.i === i); // 0 = newest
        const inS = spring({frame: t - at, fps, config: {damping: 14, stiffness: 170, mass: 0.7}});
        // list (default): every notification readable, newest on top · stack: iOS-style pile (older ones peek out)
        const y = depth * fs * (x.stack ? 0.9 : 3.3) - (1 - inS) * 260;
        const sc = x.stack ? 1 - Math.min(depth, 4) * 0.045 : 1;
        return (
          <div key={i} style={{position: 'absolute', left: 0, top: 0, width: w, transform: `translateY(${y}px) scale(${sc})`, zIndex: 100 - depth,
            opacity: x.stack ? 1 - Math.min(depth, 4) * 0.15 : 1, background: 'rgba(245,245,247,0.94)', borderRadius: fs * 1.1,
            padding: `${fs * 0.6}px ${fs * 0.75}px`, display: 'flex', gap: fs * 0.6, alignItems: 'center', boxShadow: '0 18px 40px rgba(0,0,0,0.35)', fontFamily: fonts.inter}}>
            <div style={{width: fs * 2, height: fs * 2, borderRadius: fs * 0.5, background: it.color ?? '#25d366', color: '#fff', fontWeight: 800, fontSize: fs, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              {(it.app ?? '•').slice(0, 1).toUpperCase()}
            </div>
            <div style={{minWidth: 0}}>
              <div style={{fontWeight: 800, fontSize: fs * 0.9, color: '#111'}}>{it.title}<span style={{fontWeight: 500, color: '#8a8a8e', marginLeft: 10, fontSize: fs * 0.7}}>{it.app} · now</span></div>
              <div style={{fontWeight: 500, fontSize: fs * 0.85, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{it.text}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── button + cursor click ───────────────────────────────────────────────────────────────────────────────────────
const Cursor: React.FC<{x: Extract<Insert, {kind: 'cursor'}>; t: number}> = ({x, t}) => {
  const {fps, width: W, height: H} = useVideoConfig();
  const U = unitOf(W, H), bx = W * (x.x ?? 0.5), by = H * (x.y ?? 0.62), fs = U * 0.045;
  const k = life(t, x.frames, 6, 8);
  const click = x.clickAt ?? 22;
  const inS = spring({frame: t, fps, config: {damping: 13, stiffness: 180}});
  const move = interpolate(t, [4, click - 2], [0, 1], {...clamp, easing: easeOut});
  const cx = bx + U * 0.32 * (1 - move), cy = by + U * 0.25 * (1 - move);
  const press = interpolate(t, [click - 2, click, click + 5], [1, 0.9, 1], clamp);
  const ripple = interpolate(t, [click, click + 14], [0, 1], clamp);
  const done = t >= click;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: k}}>
      <div style={{position: 'absolute', left: bx, top: by, transform: `translate(-50%,-50%) scale(${inS * press})`, background: done && x.doneColor ? x.doneColor : x.color ?? '#111',
        color: '#fff', fontFamily: fonts.inter, fontWeight: 800, fontSize: fs, padding: `${fs * 0.55}px ${fs * 1.4}px`, borderRadius: fs * 2, boxShadow: '0 16px 40px rgba(0,0,0,0.35)', whiteSpace: 'nowrap'}}>
        {done && x.doneLabel ? x.doneLabel : x.label}
      </div>
      {ripple > 0 && ripple < 1 && <div style={{position: 'absolute', left: bx - 90 * ripple * 2, top: by - 90 * ripple * 2, width: 180 * ripple * 2, height: 180 * ripple * 2, borderRadius: '50%', border: `6px solid rgba(255,255,255,${1 - ripple})`}} />}
      <svg width={70} height={90} style={{position: 'absolute', left: cx, top: cy, transform: `scale(${t >= click - 2 && t < click + 4 ? 0.85 : 1})`, overflow: 'visible'}}>
        <path d="M5,5 L5,70 L22,54 L34,82 L46,77 L34,49 L58,49 Z" fill="#fff" stroke="#111" strokeWidth={4} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

// ── connector arrow ─────────────────────────────────────────────────────────────────────────────────────────────
const Connector: React.FC<{x: Extract<Insert, {kind: 'connector'}>; t: number}> = ({x, t}) => {
  const {width: W, height: H} = useVideoConfig();
  const [x1, y1] = [x.from[0] * W, x.from[1] * H], [x2, y2] = [x.to[0] * W, x.to[1] * H];
  const bend = x.curve ?? 0.25;
  const mx = (x1 + x2) / 2 - (y2 - y1) * bend, my = (y1 + y2) / 2 + (x2 - x1) * bend;
  const d = `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
  const len = Math.hypot(mx - x1, my - y1) + Math.hypot(x2 - mx, y2 - my);
  const draw = interpolate(t, [0, 14], [0, 1], {...clamp, easing: easeOut});
  const k = life(t, x.frames, 2, 8);
  const ang = Math.atan2(y2 - my, x2 - mx);
  const head = draw > 0.92 ? 1 : 0;
  const color = x.color ?? '#ffd400';
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: k, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))'}}>
      <path d={d} fill="none" stroke={color} strokeWidth={11} strokeLinecap="round"
        strokeDasharray={x.dotted ? '2 26' : `${len}`} strokeDashoffset={x.dotted ? 0 : len * (1 - draw)}
        style={x.dotted ? {clipPath: `inset(0 ${100 - draw * 100}% 0 0)`} : undefined} />
      <g transform={`translate(${x2},${y2}) rotate(${(ang * 180) / Math.PI}) scale(${head})`}>
        <path d="M0,0 L-40,-22 L-40,22 Z" fill={color} />
      </g>
      {x.label && <text x={x1} y={y1 - 26} textAnchor="middle" fontFamily={fonts.poppins} fontWeight={800} fontSize={unitOf(W, H) * 0.04} fill={color} stroke="#000" strokeWidth={6} paintOrder="stroke">{x.label}</text>}
    </svg>
  );
};

// ── light burst ─────────────────────────────────────────────────────────────────────────────────────────────────
const Burst: React.FC<{x: Extract<Insert, {kind: 'burst'}>; t: number}> = ({x, t}) => {
  const {width: W, height: H} = useVideoConfig();
  const n = Math.min(x.frames, 14);
  const flash = interpolate(t, [0, 2, n], [0, 0.85, 0], clamp);
  const r = interpolate(t, [0, n], [0.1, 1.4], {...clamp, easing: easeOut});
  const cx = (x.x ?? 0.5) * W, cy = (x.y ?? 0.45) * H;
  const col = x.color ?? '255,236,190';
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: `radial-gradient(circle at ${cx}px ${cy}px, rgba(${col},${flash}) 0%, rgba(${col},${flash * 0.5}) ${r * 35}%, rgba(${col},0) ${r * 70}%)`}} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: flash}}>
        {Array.from({length: 14}, (_, i) => {
          const a = (i / 14) * Math.PI * 2 + rnd(3, i) * 0.3, l0 = H * 0.08 * r, l1 = H * (0.25 + rnd(5, i) * 0.3) * r;
          return <line key={i} x1={cx + Math.cos(a) * l0} y1={cy + Math.sin(a) * l0} x2={cx + Math.cos(a) * l1} y2={cy + Math.sin(a) * l1} stroke={`rgb(${col})`} strokeWidth={6 + rnd(7, i) * 8} strokeLinecap="round" />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

// ── scatter text ────────────────────────────────────────────────────────────────────────────────────────────────
// The words sit in their natural centred line (the browser lays it out, so spacing is exact); each one starts
// scattered (offset, tilted, bigger/smaller, blurred), lands, then settles into place.
const Scatter: React.FC<{x: Extract<Insert, {kind: 'scatter'}>; t: number}> = ({x, t}) => {
  const {fps, width: W, height: H} = useVideoConfig();
  const U = unitOf(W, H);
  const words = x.text.split(/\s+/).filter(Boolean);
  const fs = x.size ?? Math.min(U * 0.13, (Math.min(W, U * 1.6) * 1.9) / Math.max(6, x.text.length));
  const k = life(t, x.frames, 1, 8);
  return (
    <AbsoluteFill style={{opacity: k}}>
      <div style={{position: 'absolute', left: (W - Math.min(W * 0.84, U * 1.6)) / 2, width: Math.min(W * 0.84, U * 1.6), top: H * (x.y ?? 0.42), transform: 'translateY(-50%)',
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: fs * 0.22, rowGap: fs * 0.05}}>
        {words.map((w, i) => {
          const land = spring({frame: t - i * 3, fps, config: {damping: 12, stiffness: 150, mass: 0.7}});
          const settle = spring({frame: t - (x.settleAt ?? 18) - i, fps, config: {damping: 16, stiffness: 120}});
          const sx = (rnd(11, i) - 0.5) * U * 0.6, sy = (rnd(13, i) - 0.5) * U * 0.45, sr = (rnd(17, i) - 0.5) * 40, ss = 0.7 + rnd(19, i) * 0.9;
          const hot = x.accentWord && w.toLowerCase().replace(/[^\w]/g, '') === x.accentWord.toLowerCase();
          return (
            <div key={i} style={{fontFamily: fonts.anton, fontSize: fs, lineHeight: 1.05, color: hot ? x.accent ?? '#ffd400' : x.color ?? '#fff', whiteSpace: 'nowrap',
              transform: `translate(${sx * (1 - settle)}px, ${sy * (1 - settle)}px) rotate(${sr * (1 - settle)}deg) scale(${(ss + (1 - ss) * settle) * land})`,
              textShadow: '0 6px 18px rgba(0,0,0,0.6)', filter: `blur(${(1 - land) * 8}px)`}}>
              {w}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── counter over the footage: a dark card where the value rolls like a slot machine ──────────────────────────────
const CounterCard: React.FC<{x: Extract<Insert, {kind: 'counter'}>; t: number}> = ({x, t}) => {
  const {fps, width: W, height: H} = useVideoConfig();
  const k = life(t, x.frames, 8, 8);
  const inS = spring({frame: t, fps, config: {damping: 13, stiffness: 160}});
  const pos = interpolate(t, [6, x.frames * 0.7], [0, x.values.length - 1], {...clamp, easing: Easing.inOut(Easing.quad)});
  const idx = Math.round(pos);
  const U = unitOf(W, H), w = U * 0.72;
  const longest = Math.max(...x.values.map((v) => `${x.prefix ?? ''}${v}${x.suffix ?? ''}`.length));
  const size = Math.min(U * 0.13, (w * 0.88) / (longest * 0.47)); // Anton ≈ 0.47 × size per character: always fits
  const row = size * 1.3;
  const land = interpolate(t, [x.frames * 0.7, x.frames * 0.7 + 6], [1, 1.12], clamp) - interpolate(t, [x.frames * 0.7 + 6, x.frames * 0.7 + 14], [0, 0.12], clamp);
  return (
    <div style={{position: 'absolute', left: W * (x.x ?? 0.5) - w / 2, top: H * (x.y ?? 0.14), width: w, padding: `${size * 0.25}px 0 ${size * 0.3}px`, borderRadius: size * 0.35,
      background: x.bg ?? 'rgba(14,14,18,0.9)', boxShadow: '0 30px 70px rgba(0,0,0,0.5)', opacity: k, transform: `scale(${(0.85 + 0.15 * inS) * land})`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden'}}>
      <div style={{height: row, overflow: 'hidden', fontFamily: fonts.anton, fontSize: size, lineHeight: `${row}px`, color: x.ink ?? '#fff',
        WebkitMaskImage: 'linear-gradient(transparent, #000 18%, #000 82%, transparent)', maskImage: 'linear-gradient(transparent, #000 18%, #000 82%, transparent)'}}>
        <div style={{transform: `translateY(${-pos * row}px)`, filter: `blur(${Math.min(5, Math.abs(pos - idx) * 12)}px)`}}>
          {x.values.map((v, i) => <div key={i} style={{height: row, textAlign: 'center', whiteSpace: 'nowrap'}}>{x.prefix ?? ''}{v}{x.suffix ?? ''}</div>)}
        </div>
      </div>
      {x.label && <div style={{fontFamily: fonts.inter, fontWeight: 800, fontSize: size * 0.24, color: x.accent ?? '#ffd400', letterSpacing: 2, textTransform: 'uppercase'}}>{x.label}</div>}
    </div>
  );
};

// ── 3D tilted plane ─────────────────────────────────────────────────────────────────────────────────────────────
const Media: React.FC<{m: {src: string; video?: boolean; trimBefore?: number; filter?: string}; style: React.CSSProperties}> = ({m, style}) =>
  m.video ? <OffthreadVideo src={staticFile(m.src)} trimBefore={m.trimBefore ?? 0} muted style={{...style, filter: m.filter}} /> : <Img src={staticFile(m.src)} style={{...style, filter: m.filter}} />;
const Plane: React.FC<{x: Extract<Insert, {kind: 'plane'}>; t: number}> = ({x, t}) => {
  const {fps, width: W, height: H} = useVideoConfig();
  const U = unitOf(W, H), w = U * (x.w ?? 0.82), h = w * 1.7;
  const inS = spring({frame: t, fps, config: {damping: 16, stiffness: 110}});
  const k = life(t, x.frames, 6, 10);
  const p = t / x.frames;
  const tilt = x.tilt ?? 18;
  const ry = -tilt * (1 - 0.5 * p) - (1 - inS) * 30, rx = tilt * 0.55, scroll = (x.scroll ?? 0.25) * p;
  return (
    <div style={{position: 'absolute', left: W * (x.x ?? 0.5) - w / 2, top: H * (x.y ?? 0.45) - h / 2, width: w, height: h, perspective: U * 2.2, opacity: k}}>
      <div style={{width: '100%', height: '100%', transform: `rotateX(${rx}deg) rotateY(${ry}deg) scale(${0.8 + 0.2 * inS})`, borderRadius: U * 0.05, overflow: 'hidden',
        boxShadow: '40px 60px 120px rgba(0,0,0,0.55)', border: `${U * 0.012}px solid #111`, background: '#000'}}>
        <div style={{width: '100%', height: `${100 / (1 - Math.min(0.6, x.scroll ?? 0.25))}%`, transform: `translateY(${-scroll * 100}%)`}}>
          <Media m={x.media} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top'}} />
        </div>
      </div>
    </div>
  );
};

// ── push-through ────────────────────────────────────────────────────────────────────────────────────────────────
const Push: React.FC<{x: Extract<Insert, {kind: 'push'}>; t: number}> = ({x, t}) => {
  const {width: W, height: H} = useVideoConfig();
  const U = unitOf(W, H);
  const p = interpolate(t, [0, x.frames], [0, 1], clamp);
  const sc = 0.35 * Math.pow(30, Easing.in(Easing.cubic)(p)); // slow approach, then rushes through the lens
  const blur = interpolate(p, [0.55, 1], [0, 24], clamp);
  const op = interpolate(p, [0, 0.1, 0.85, 1], [0, 1, 1, 0], clamp);
  const flash = interpolate(p, [0.8, 0.95, 1], [0, 0.8, 0], clamp);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div style={{transform: `scale(${sc})`, filter: `blur(${blur}px)`, opacity: op}}>
        {x.media ? (
          <div style={{width: U * 0.6, height: U * 0.6, borderRadius: U * 0.04, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'}}>
            <Media m={x.media} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </div>
        ) : (
          <div style={{fontFamily: fonts.anton, fontSize: U * 0.16, color: x.color ?? '#fff', textShadow: '0 8px 30px rgba(0,0,0,0.6)', whiteSpace: 'nowrap'}}>{x.text}</div>
        )}
      </div>
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
    </AbsoluteFill>
  );
};

// ── blur over a private thing on a screen (scripts/secrets.py boxes, followed between samples) ─────────────────────
const Blur: React.FC<{x: Extract<Insert, {kind: 'blur'}>; t: number}> = ({x, t}) => {
  const {width: W, height: H} = useVideoConfig();
  const ks = x.keys;
  let i = ks.findIndex((k) => k[0] > t);
  if (i === -1) i = ks.length;
  const a = ks[Math.max(0, i - 1)], b = ks[Math.min(ks.length - 1, i)];
  const p = b[0] > a[0] ? Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0]))) : 0;
  const v = (j: number) => a[j] + (b[j] - a[j]) * p;
  return (
    <div style={{position: 'absolute', left: v(1) * W, top: v(2) * H, width: v(3) * W, height: v(4) * H, borderRadius: 12,
      backdropFilter: 'blur(22px) saturate(0.6)', WebkitBackdropFilter: 'blur(22px) saturate(0.6)', background: 'rgba(30,30,30,0.25)'}} />
  );
};

const Overlay: React.FC<{x: Insert; t: number}> = ({x, t}) => {
  const {width: W, height: H} = useVideoConfig();
  switch (x.kind) {
    case 'chat': return <Chat x={x} t={t} />;
    case 'notify': return <Notify x={x} t={t} />;
    case 'cursor': return <Cursor x={x} t={t} />;
    case 'connector': return <Connector x={x} t={t} />;
    case 'burst': return <Burst x={x} t={t} />;
    case 'scatter': return <Scatter x={x} t={t} />;
    case 'plane': return <Plane x={x} t={t} />;
    case 'blur': return <Blur x={x} t={t} />;
    case 'push': return <Push x={x} t={t} />;
    case 'counter': return <CounterCard x={x} t={t} />;
    case 'words': return <Words {...x} t={t} frames={x.frames} />;
    case 'stack': return <Stack {...x} t={t} frames={x.frames} />;
    case 'photo': return <Photo {...x} t={t} frames={x.frames} />;
    case 'card': return <FloatCard {...x} t={t} frames={x.frames} />;
    case 'chart': return <Chart x={x} t={t} />;
    case 'illo': return <Illo x={x} t={t} />;
    case 'board': return <Board x={x} t={t} />;
    case 'iso': return <Iso x={x} t={t} />;
    default: return null;
  }
};

const Full: React.FC<{x: Insert}> = ({x}) => {
  switch (x.kind) {
    case 'counter': return <NumberRoll values={x.values} label={x.label} prefix={x.prefix} suffix={x.suffix} frames={x.frames} bg={x.bg} ink={x.ink} accent={x.accent} />;
    case 'reveal': return <CircleReveal before={x.before} after={x.after} frames={x.frames} path={x.path} />;
    case 'stage': return <CardStage items={x.items} beats={x.beats} frames={x.frames} bg={x.bg} />;
    case 'scene': return <Scene {...x} frames={x.frames} />;
    case 'chart': return <ChartFull x={x} />;
    case 'illo': return <IlloFull x={x} />;
    case 'board': return <BoardFull x={x} />;
    case 'iso': return <IsoFull x={x} />;
    default: return null;
  }
};

const IsoFull: React.FC<{x: Extract<Insert, {kind: 'iso'}>}> = ({x}) => <Iso x={x} t={useCurrentFrame()} />;
const ChartFull: React.FC<{x: Extract<Insert, {kind: 'chart'}>}> = ({x}) => <Chart x={x} t={useCurrentFrame()} />;

const BoardFull: React.FC<{x: Extract<Insert, {kind: 'board'}>}> = ({x}) => <Board x={x} t={useCurrentFrame()} />;

// One insert drawn at its own local time t (used by the vlog pieces, which place it in their own Sequence).
export const InsertView: React.FC<{x: Insert; t: number}> = ({x, t}) => (x.kind === 'illo' ? <Illo x={x} t={t} /> : isFull(x) ? <Full x={x} /> : <Overlay x={x} t={t} />);

// Templates run inside a Sequence so they count from 0; overlays are drawn only while they're live.
export const InsertsLayer: React.FC<{edit: Edit; layer: 'full' | 'over'}> = ({edit, layer}) => {
  const frame = useCurrentFrame();
  const list = (edit.inserts ?? []).filter((x) => (layer === 'full') === isFull(x) && !(x as {behind?: boolean}).behind);
  if (!list.length) return null;
  return (
    <>
      {list.map((x, i) =>
        layer === 'full' ? (
          <Sequence key={i} from={x.f} durationInFrames={x.frames} layout="absolute-fill"><Full x={x} /></Sequence>
        ) : frame >= x.f && frame < x.f + x.frames ? (
          <AbsoluteFill key={i} style={{pointerEvents: 'none'}}><Overlay x={x} t={frame - x.f} /></AbsoluteFill>
        ) : null,
      )}
    </>
  );
};

// Inserts marked behind: drawn inside the footage layer, under the person cut-out (text/cards behind his head). Being
// inside the footage they also ride every zoom, like his text "parented" to the video.
export const BehindInserts: React.FC<{edit: Edit}> = ({edit}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {(edit.inserts ?? []).filter((x) => (x as {behind?: boolean}).behind && frame >= x.f && frame < x.f + x.frames).map((x, i) => (
        <AbsoluteFill key={i} style={{pointerEvents: 'none'}}><Overlay x={x} t={frame - x.f} /></AbsoluteFill>
      ))}
    </>
  );
};

// ── make room: the footage shrinks/moves so a visual has space; a blurred copy fills the frame behind it ────────
export function roomState(layouts: RoomLayout[] | undefined, frame: number) {
  for (const l of layouts ?? []) {
    const t = frame - l.f;
    if (t < 0 || t >= l.frames) continue;
    const e = Math.min(interpolate(t, [0, 12], [0, 1], {...clamp, easing: easeOut}), interpolate(t, [l.frames - 12, l.frames], [1, 0], {...clamp, easing: Easing.inOut(Easing.cubic)}));
    return {l, e};
  }
  return null;
}
export const RoomFrame: React.FC<{edit: Edit; children: React.ReactNode}> = ({edit, children}) => {
  const frame = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const st = roomState(edit.layouts, frame);
  if (!st) return <AbsoluteFill>{children}</AbsoluteFill>;
  const {l, e} = st;
  const sc = 1 + ((l.scale ?? 0.6) - 1) * e;
  const dx = (l.x ?? 0) * W * e, dy = (l.y ?? 0) * H * e;
  const r = (l.radius ?? 48) * e;
  return (
    <AbsoluteFill>
      {l.fill === 'color' ? (
        <AbsoluteFill style={{background: l.color ?? '#111214'}} />
      ) : (
        <AbsoluteFill style={{filter: `blur(${40 * e}px) brightness(${1 - 0.35 * e}) saturate(0.85)`, transform: 'scale(1.15)'}}>{children}</AbsoluteFill>
      )}
      <AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px) scale(${sc})`, borderRadius: r / Math.max(0.01, sc), overflow: 'hidden', boxShadow: e > 0.05 ? `0 40px 90px rgba(0,0,0,${0.5 * e})` : undefined}}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── captions move aside while a visual owns their spot ──────────────────────────────────────────────────────────
export function captionShift(edit: Edit, frame: number): {top: number | null; e: number; scale: number} {
  for (const m of edit.captionMoves ?? []) {
    const t = frame - m.f;
    if (t < 0 || t >= m.frames) continue;
    const e = Math.min(interpolate(t, [0, 8], [0, 1], {...clamp, easing: easeOut}), interpolate(t, [m.frames - 8, m.frames], [1, 0], clamp));
    return {top: m.top ?? null, e, scale: 1 + ((m.scale ?? 1) - 1) * e};
  }
  return {top: null, e: 0, scale: 1};
}
