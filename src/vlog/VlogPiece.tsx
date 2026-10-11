import React from 'react';
import {AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {fonts} from '../layers/fonts';

// Long-form vlog graphics (scripts/vlog.mjs → scripts/lib/vlog-gfx.mjs). One piece of the vlog = its base footage
// (already cut/coloured by ffmpeg, muted here) + calm, premium motion layers: one idea at a time, ease-out motion,
// soft shadows, nothing linear. Every layer has `at`/`dur` in seconds inside the piece.
export type Gfx =
  | {type: 'title'; at: number; dur: number; text: string; kicker?: string; accent?: string; dim?: boolean}
  | {type: 'chapter'; at: number; dur: number; label: string; title: string; sub?: string}
  | {type: 'stamp'; at: number; dur: number; text: string; sub?: string; corner?: 'bl' | 'tl' | 'tr' | 'br'}
  | {type: 'name'; at: number; dur: number; name: string; sub?: string; x: number; y: number; side?: 'left' | 'right'}
  | {type: 'map'; at: number; dur: number; from: string; to: string; km?: string; mode?: string; time?: string}
  | {type: 'photos'; at: number; dur: number; photos: string[]; caption?: string}
  | {type: 'text'; at: number; dur: number; text: string; accent?: string; dim?: boolean; y?: number; size?: number}
  | {type: 'cast'; at: number; dur: number; people: {name: string; sub?: string; photo: string; fx?: number; fy?: number}[]; title?: string}
  // MrBeast-style layers
  | {type: 'caps'; at: number; dur: number; words: {w: string; s: number; hot?: string}[]; pos?: 'bottom' | 'top' | 'left' | 'right' | [number, number]; size?: number}
  | {type: 'pop'; at: number; dur: number; text: string; x: number; y: number; tilt?: number; bg?: string; ink?: string; size?: number}
  | {type: 'arrow'; at: number; dur: number; x: number; y: number; fromX: number; fromY: number; color?: string; label?: string}
  | {type: 'circle'; at: number; dur: number; x: number; y: number; rx: number; ry?: number; color?: string}
  | {type: 'emoji'; at: number; dur: number; e: string; x: number; y: number; size?: number}
  | {type: 'zoom'; at: number; dur: number; x?: number; y?: number; to?: number; flash?: boolean}
  | {type: 'counter'; at: number; dur: number; from: number; to: number; x: number; y: number; label?: string; suffix?: string}
  | {type: 'tag'; at: number; dur: number; name: string; sub?: string; x: number; y: number; r?: number; side?: 'left' | 'right' | 'up' | 'down'}
  | {type: 'hang'; at: number; dur: number; photo: string; x: number; h?: number; tilt?: number; y?: number}
  | {type: 'sticker'; at: number; dur: number; src: string; x: number; y: number; h?: number; flip?: boolean}
  | {type: 'hero'; at: number; dur: number; name: string; kicker?: string; role?: string; cut: string; bg: string; side?: 'left' | 'right'; tint?: string};

export type VlogPieceProps = {base: string | null; frames: number; layers: Gfx[]; stage?: string};

const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const INK = '#fff';
const ACCENT = '#ffcf4a';
const SHADOW = '0 6px 30px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.35)';

// 0→1 in, hold, 1→0 out (seconds)
function useLife(at: number, dur: number, inS = 0.55, outS = 0.4) {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps - at;
  const enter = interpolate(t, [0, inS], [0, 1], {...clamp, easing: EASE});
  const exit = interpolate(t, [dur - outS, dur], [1, 0], {...clamp, easing: Easing.in(Easing.cubic)});
  return {t, enter, exit, on: t >= 0 && t <= dur, k: Math.min(enter, exit)};
}

// Letters rise + un-blur, staggered (blur-in entrance from the expensive-edits study)
const RiseText: React.FC<{text: string; t: number; style: React.CSSProperties; stagger?: number; exit?: number}> = ({text, t, style, stagger = 0.035, exit = 1}) => (
  <div style={{...style, whiteSpace: 'pre'}}>
    {[...text].map((ch, i) => {
      const k = interpolate(t - i * stagger, [0, 0.6], [0, 1], {...clamp, easing: EASE});
      return (
        <span key={i} style={{display: 'inline-block', opacity: k * exit, transform: `translateY(${(1 - k) * 0.45}em)`, filter: `blur(${(1 - k) * 8}px)`}}>
          {ch === ' ' ? ' ' : ch}
        </span>
      );
    })}
  </div>
);

const Title: React.FC<Extract<Gfx, {type: 'title'}>> = ({at, dur, text, kicker, accent, dim}) => {
  const {t, exit, k} = useLife(at, dur, 0.8, 0.5);
  const {height: H} = useVideoConfig();
  const line = interpolate(t, [0.5, 1.3], [0, 1], {...clamp, easing: EASE});
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', background: dim ? `rgba(0,0,0,${0.35 * k})` : undefined}}>
      {kicker && (
        <div style={{fontFamily: fonts.inter, fontWeight: 700, fontSize: H * 0.026, letterSpacing: H * 0.006, color: INK, opacity: interpolate(t, [0.2, 0.9], [0, 0.9], clamp) * exit, textShadow: SHADOW, marginBottom: H * 0.01, textTransform: 'uppercase'}}>
          {kicker}
        </div>
      )}
      <RiseText text={text} t={t} exit={exit} style={{fontFamily: fonts.montserrat, fontWeight: 900, fontSize: H * 0.15, letterSpacing: H * 0.012, color: INK, textShadow: SHADOW, lineHeight: 1}} />
      <div style={{height: 3, width: H * 0.5 * line, background: ACCENT, marginTop: H * 0.025, opacity: exit, boxShadow: SHADOW}} />
      {accent && (
        <div style={{fontFamily: fonts.yellowtail, fontSize: H * 0.075, color: ACCENT, marginTop: H * 0.005, opacity: interpolate(t, [0.9, 1.5], [0, 1], clamp) * exit, transform: `translateY(${(1 - interpolate(t, [0.9, 1.6], [0, 1], {...clamp, easing: EASE})) * 20}px) rotate(-3deg)`, textShadow: `0 0 24px rgba(255,207,74,0.45), ${SHADOW}`}}>
          {accent}
        </div>
      )}
    </AbsoluteFill>
  );
};

// "DAY 1" chapter: lower-left block, bar grows, label + title + sub slide in one after another
const Chapter: React.FC<Extract<Gfx, {type: 'chapter'}>> = ({at, dur, label, title, sub}) => {
  const {t, exit} = useLife(at, dur, 0.6, 0.45);
  const {height: H} = useVideoConfig();
  const step = (d: number) => interpolate(t, [d, d + 0.6], [0, 1], {...clamp, easing: EASE});
  const bar = step(0);
  return (
    <AbsoluteFill style={{background: `linear-gradient(90deg, rgba(0,0,0,${0.45 * Math.min(1, t * 2) * exit}) 0%, rgba(0,0,0,0) 55%)`}}>
      <div style={{position: 'absolute', left: H * 0.09, bottom: H * 0.12, opacity: exit}}>
        <div style={{position: 'absolute', left: -H * 0.03, top: 0, width: 5, height: `${100 * bar}%`, background: ACCENT, borderRadius: 3}} />
        <div style={{fontFamily: fonts.inter, fontWeight: 800, fontSize: H * 0.03, letterSpacing: H * 0.01, color: ACCENT, opacity: step(0.1), transform: `translateX(${(1 - step(0.1)) * -30}px)`, textShadow: SHADOW}}>{label}</div>
        <div style={{fontFamily: fonts.montserrat, fontWeight: 900, fontSize: H * 0.085, color: INK, lineHeight: 1.05, opacity: step(0.25), transform: `translateX(${(1 - step(0.25)) * -40}px)`, filter: `blur(${(1 - step(0.25)) * 6}px)`, textShadow: SHADOW}}>{title}</div>
        {sub && <div style={{fontFamily: fonts.inter, fontWeight: 500, fontSize: H * 0.03, color: INK, opacity: 0.9 * step(0.45), transform: `translateX(${(1 - step(0.45)) * -30}px)`, marginTop: H * 0.008, textShadow: SHADOW}}>{sub}</div>}
      </div>
    </AbsoluteFill>
  );
};

// small time/place label with a pulsing dot (where/when are we?)
const Stamp: React.FC<Extract<Gfx, {type: 'stamp'}>> = ({at, dur, text, sub, corner = 'tl'}) => {
  const {t, k} = useLife(at, dur, 0.5, 0.35);
  const {height: H} = useVideoConfig();
  const pos: React.CSSProperties = {
    tl: {left: H * 0.06, top: H * 0.06}, tr: {right: H * 0.06, top: H * 0.06, textAlign: 'right' as const},
    bl: {left: H * 0.06, bottom: H * 0.07}, br: {right: H * 0.06, bottom: H * 0.07, textAlign: 'right' as const},
  }[corner];
  const pulse = 0.6 + 0.4 * Math.sin(t * 5);
  return (
    <div style={{position: 'absolute', ...pos, opacity: k, transform: `translateY(${(1 - k) * 14}px)`}}>
      <div style={{display: 'inline-flex', alignItems: 'center', gap: H * 0.012, padding: `${H * 0.01}px ${H * 0.018}px`, borderRadius: 999, background: 'rgba(15,15,18,0.55)', backdropFilter: 'blur(8px)', boxShadow: SHADOW}}>
        <div style={{width: H * 0.011, height: H * 0.011, borderRadius: 99, background: '#ff4d4d', opacity: pulse, boxShadow: '0 0 10px #ff4d4d'}} />
        <div style={{fontFamily: fonts.inter, fontWeight: 700, fontSize: H * 0.024, color: INK, letterSpacing: 0.5}}>{text}</div>
      </div>
      {sub && <div style={{fontFamily: fonts.inter, fontWeight: 500, fontSize: H * 0.02, color: INK, opacity: 0.85, marginTop: H * 0.008, paddingLeft: H * 0.018, textShadow: SHADOW}}>{sub}</div>}
    </div>
  );
};

// name tag: a line draws from the person (x,y in 0..1) to a label beside them
const Name: React.FC<Extract<Gfx, {type: 'name'}>> = ({at, dur, name, sub, x, y, side = 'right'}) => {
  const {t, exit} = useLife(at, dur, 0.5, 0.4);
  const {width: Wd, height: H} = useVideoConfig();
  const draw = interpolate(t, [0, 0.45], [0, 1], {...clamp, easing: EASE});
  const txt = interpolate(t, [0.3, 0.9], [0, 1], {...clamp, easing: EASE});
  const px = x * Wd, py = y * H, dir = side === 'right' ? 1 : -1;
  const ex = px + dir * H * 0.11, ey = py - H * 0.09, len = H * 0.12;
  const hx = ex + dir * len * draw;
  return (
    <AbsoluteFill style={{opacity: exit}}>
      <svg width={Wd} height={H} style={{position: 'absolute', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'}}>
        <circle cx={px} cy={py} r={H * 0.008 * Math.min(1, draw * 3)} fill={ACCENT} />
        <polyline points={`${px},${py} ${px + (ex - px) * Math.min(1, draw * 2)},${py + (ey - py) * Math.min(1, draw * 2)} ${draw > 0.5 ? `${hx},${ey}` : ''}`} fill="none" stroke={ACCENT} strokeWidth={3} strokeLinecap="round" />
      </svg>
      <div style={{position: 'absolute', top: ey - H * 0.062, ...(side === 'right' ? {left: ex + H * 0.01} : {right: Wd - ex + H * 0.01, textAlign: 'right' as const}), opacity: txt, transform: `translateX(${(1 - txt) * dir * 24}px)`, filter: `blur(${(1 - txt) * 5}px)`}}>
        <div style={{fontFamily: fonts.montserrat, fontWeight: 900, fontSize: H * 0.05, color: INK, textShadow: SHADOW, whiteSpace: 'nowrap'}}>{name}</div>
        {sub && <div style={{fontFamily: fonts.inter, fontWeight: 600, fontSize: H * 0.024, color: INK, opacity: 0.92, textShadow: SHADOW, whiteSpace: 'nowrap', marginTop: H * 0.002}}>{sub}</div>}
      </div>
    </AbsoluteFill>
  );
};

// Route map: two pins, a dashed path that draws itself, a train riding along it, distance label. Minimal, no real geography.
const RouteMap: React.FC<Extract<Gfx, {type: 'map'}>> = ({at, dur, from, to, km, mode = '🚆', time}) => {
  const {t, k} = useLife(at, dur, 0.6, 0.4);
  const {width: Wd, height: H} = useVideoConfig();
  const a = {x: Wd * 0.68, y: H * 0.7}, b = {x: Wd * 0.3, y: H * 0.3};
  const c = {x: Wd * 0.62, y: H * 0.26}; // control point → gentle arc
  const p = interpolate(t, [0.6, dur - 0.9], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const q = (u: number) => ({x: (1 - u) ** 2 * a.x + 2 * (1 - u) * u * c.x + u * u * b.x, y: (1 - u) ** 2 * a.y + 2 * (1 - u) * u * c.y + u * u * b.y});
  const pts = Array.from({length: 61}, (_, i) => q((i / 60) * p));
  const head = q(p);
  const pin = (pt: {x: number; y: number}, label: string, d: number, below: boolean) => {
    const s = interpolate(t, [d, d + 0.5], [0, 1], {...clamp, easing: Easing.out(Easing.back(2))});
    return (
      <div style={{position: 'absolute', left: pt.x, top: pt.y, transform: `translate(-50%,-50%) scale(${s})`}}>
        <div style={{width: H * 0.03, height: H * 0.03, borderRadius: 99, background: ACCENT, border: '4px solid #fff', boxShadow: SHADOW}} />
        <div style={{position: 'absolute', left: '50%', transform: 'translateX(-50%)', [below ? 'top' : 'bottom']: H * 0.045, fontFamily: fonts.montserrat, fontWeight: 900, fontSize: H * 0.05, color: INK, whiteSpace: 'nowrap', textShadow: SHADOW}}>{label}</div>
      </div>
    );
  };
  return (
    <AbsoluteFill style={{opacity: k}}>
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 50%, rgba(10,12,16,0.35), rgba(10,12,16,0.8))'}} />
      <svg width={Wd} height={H} style={{position: 'absolute'}}>
        <defs>
          <pattern id="grid" width={H * 0.06} height={H * 0.06} patternUnits="userSpaceOnUse">
            <path d={`M ${H * 0.06} 0 L 0 0 0 ${H * 0.06}`} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
          </pattern>
        </defs>
        <rect width={Wd} height={H} fill="url(#grid)" />
        <polyline points={pts.map((v) => `${v.x},${v.y}`).join(' ')} fill="none" stroke="#fff" strokeWidth={5} strokeDasharray="14 12" strokeLinecap="round" style={{filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))'}} />
      </svg>
      {pin(a, from, 0.1, true)}
      {pin(b, to, dur - 1.1, false)}
      <div style={{position: 'absolute', left: head.x, top: head.y, transform: 'translate(-50%,-50%)', fontSize: H * 0.07, opacity: p > 0 && p < 1 ? 1 : 0, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'}}>{mode}</div>
      {(km || time) && (
        <div style={{position: 'absolute', right: H * 0.08, bottom: H * 0.08, textAlign: 'right', opacity: interpolate(t, [0.8, 1.4], [0, 1], clamp)}}>
          {km && <div style={{fontFamily: fonts.montserrat, fontWeight: 900, fontSize: H * 0.06, color: ACCENT, textShadow: SHADOW}}>{km}</div>}
          {time && <div style={{fontFamily: fonts.inter, fontWeight: 600, fontSize: H * 0.026, color: INK, textShadow: SHADOW}}>{time}</div>}
        </div>
      )}
    </AbsoluteFill>
  );
};

// Photo wall: stills drop in as white-bordered prints with slight tilts and a slow drift (several photos of one moment at once)
const Photos: React.FC<Extract<Gfx, {type: 'photos'}>> = ({at, dur, photos, caption}) => {
  const {t, exit} = useLife(at, dur, 0.5, 0.4);
  const {width: Wd, height: H} = useVideoConfig();
  const n = photos.length;
  const each = Math.min(0.7, (dur - 1.4) / Math.max(1, n));
  const drift = interpolate(t, [0, dur], [1, 1.05], clamp);
  return (
    <AbsoluteFill style={{opacity: exit, transform: `scale(${drift})`}}>
      {photos.map((p, i) => {
        const s = interpolate(t - i * each, [0, 0.55], [0, 1], {...clamp, easing: EASE});
        const tilt = ((i * 37) % 13) - 6;
        const cx = Wd * (0.5 + (n === 1 ? 0 : ((i % 3) - 1) * 0.24 + (i >= 3 ? 0.12 : 0) * (i % 2 ? 1 : -1)));
        const cy = H * (n <= 3 ? 0.5 : i < 3 ? 0.4 : 0.6) + ((i * 53) % 40) - 20;
        const w = H * (n <= 2 ? 0.62 : 0.5);
        return (
          <div key={i} style={{position: 'absolute', left: cx, top: cy, width: w, transform: `translate(-50%,-50%) rotate(${tilt * s}deg) scale(${1.25 - 0.25 * s})`, opacity: s, filter: `blur(${(1 - s) * 10}px)`, background: '#fafafa', padding: H * 0.012, paddingBottom: H * 0.04, borderRadius: 6, boxShadow: '0 18px 50px rgba(0,0,0,0.5)'}}>
            <Img src={staticFile(p)} style={{width: '100%', display: 'block', borderRadius: 2}} />
          </div>
        );
      })}
      {caption && (
        <div style={{position: 'absolute', bottom: H * 0.06, width: '100%', textAlign: 'center', fontFamily: fonts.yellowtail, fontSize: H * 0.06, color: '#fff', textShadow: SHADOW, opacity: interpolate(t, [0.6, 1.2], [0, 1], clamp)}}>{caption}</div>
      )}
    </AbsoluteFill>
  );
};

// One centred line over footage (or stage): narration beat, "meanwhile…", a joke. Script accent word optional.
const TextLine: React.FC<Extract<Gfx, {type: 'text'}>> = ({at, dur, text, accent, dim, y = 0.5, size = 0.075}) => {
  const {t, exit, k} = useLife(at, dur, 0.6, 0.4);
  const {height: H} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: dim ? `rgba(0,0,0,${0.4 * k})` : undefined}}>
      <div style={{position: 'absolute', top: H * y, width: '100%', transform: 'translateY(-50%)', textAlign: 'center'}}>
        <RiseText text={text} t={t} exit={exit} stagger={0.025} style={{fontFamily: fonts.montserrat, fontWeight: 900, fontSize: H * size, color: INK, textShadow: SHADOW}} />
        {accent && (
          <div style={{fontFamily: fonts.yellowtail, fontSize: H * size * 0.95, color: ACCENT, marginTop: -H * 0.01, opacity: interpolate(t, [0.5, 1.1], [0, 1], clamp) * exit, transform: 'rotate(-3deg)', textShadow: `0 0 22px rgba(255,207,74,0.4), ${SHADOW}`}}>{accent}</div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// Cast intro: one face card per person, in a row, each with name + one-liner (the "meet the gang" moment)
const Cast: React.FC<Extract<Gfx, {type: 'cast'}>> = ({at, dur, people, title}) => {
  const {t, exit} = useLife(at, dur, 0.5, 0.4);
  const {width: Wd, height: H} = useVideoConfig();
  const n = people.length, gap = H * 0.025;
  const cw = Math.min(H * 0.3, (Wd * 0.92 - gap * (n - 1)) / n), ch = cw * 1.35;
  const each = Math.min(0.5, (dur - 1.5) / n);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: exit}}>
      {title && <div style={{fontFamily: fonts.inter, fontWeight: 800, letterSpacing: H * 0.01, fontSize: H * 0.03, color: ACCENT, marginBottom: H * 0.04, opacity: interpolate(t, [0, 0.5], [0, 1], clamp), textShadow: SHADOW}}>{title}</div>}
      <div style={{display: 'flex', gap}}>
        {people.map((p, i) => {
          const s = interpolate(t - 0.2 - i * each, [0, 0.55], [0, 1], {...clamp, easing: EASE});
          return (
            <div key={i} style={{width: cw, opacity: s, transform: `translateY(${(1 - s) * 50}px)`, filter: `blur(${(1 - s) * 8}px)`}}>
              <div style={{width: cw, height: ch, borderRadius: H * 0.02, overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.55)', border: '3px solid rgba(255,255,255,0.9)'}}>
                <Img src={staticFile(p.photo)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${(p.fx ?? 0.5) * 100}% ${(p.fy ?? 0.4) * 100}%`}} />
              </div>
              <div style={{fontFamily: fonts.montserrat, fontWeight: 900, fontSize: H * 0.04, color: INK, marginTop: H * 0.018, textAlign: 'center', textShadow: SHADOW}}>{p.name}</div>
              {p.sub && <div style={{fontFamily: fonts.inter, fontWeight: 600, fontSize: H * 0.02, color: INK, opacity: 0.85, textAlign: 'center', marginTop: H * 0.004, textShadow: SHADOW}}>{p.sub}</div>}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};


// ───────────── MrBeast-style layers ─────────────
const BEAST = {font: fonts.montserrat, yellow: '#ffe135', green: '#5cff4d', red: '#ff3b3b'};
const stroke = (px: number): React.CSSProperties => ({WebkitTextStroke: `${px}px #000`, paintOrder: 'stroke fill', textShadow: `0 ${px * 0.6}px 0 #000, 0 ${px}px ${px * 2}px rgba(0,0,0,0.5)`});
const pop = (t: number, d = 0.28) => {
  // overshoot scale-in: 0 → 1.18 → 1
  const k = Math.min(1, Math.max(0, t / d));
  return t <= 0 ? 0 : k < 1 ? Easing.out(Easing.back(3))(k) : 1;
};

// Captions: 2–3 words, each word pops when spoken, hot words in colour. Placed off faces by scripts/vlog.mjs.
const Caps: React.FC<Extract<Gfx, {type: 'caps'}>> = ({at, dur, words, pos = 'bottom', size = 0.078}) => {
  const f = useCurrentFrame();
  const {fps, width: Wd, height: H} = useVideoConfig();
  const t = f / fps - at;
  if (t < 0 || t > dur) return null;
  const out = interpolate(t, [dur - 0.12, dur], [1, 0], clamp);
  const fs = H * size;
  const box: React.CSSProperties =
    Array.isArray(pos) ? {left: pos[0] * Wd, top: pos[1] * H, transform: 'translate(-50%,-50%)', width: Wd * 0.4}
    : pos === 'top' ? {left: 0, right: 0, top: H * 0.1}
    : pos === 'left' ? {left: Wd * 0.02, width: Wd * 0.3, top: H * 0.5, transform: 'translateY(-50%)'}
    : pos === 'right' ? {right: Wd * 0.02, width: Wd * 0.3, top: H * 0.5, transform: 'translateY(-50%)'}
    : {left: 0, right: 0, bottom: H * 0.1};
  return (
    <div style={{position: 'absolute', ...box, textAlign: 'center', opacity: out, lineHeight: 1.12}}>
      {words.map((w, i) => {
        const k = pop(t - (w.s - at) + 0.02);
        const color = w.hot === 'green' ? BEAST.green : w.hot === 'red' ? BEAST.red : w.hot ? BEAST.yellow : '#fff';
        return (
          <span key={i} style={{display: 'inline-block', margin: `0 ${fs * 0.13}px`, fontFamily: BEAST.font, fontWeight: 900, fontSize: fs * (w.hot ? 1.12 : 1),
            color, textTransform: 'uppercase', transform: `scale(${k}) rotate(${w.hot ? -2 : 0}deg)`, opacity: k > 0 ? 1 : 0, ...stroke(fs * 0.12)}}>{w.w}</span>
        );
      })}
    </div>
  );
};

// Sticker text: bold word in a tilted box that slams in ("KIDS ONLY?!", "10/10")
const Pop: React.FC<Extract<Gfx, {type: 'pop'}>> = ({at, dur, text, x, y, tilt = -6, bg = BEAST.yellow, ink = '#000', size = 0.06}) => {
  const f = useCurrentFrame();
  const {fps, width: Wd, height: H} = useVideoConfig();
  const t = f / fps - at;
  if (t < 0 || t > dur) return null;
  const k = pop(t, 0.3), out = interpolate(t, [dur - 0.15, dur], [1, 0], clamp);
  const wob = Math.sin(t * 6) * 1.2;
  return (
    <div style={{position: 'absolute', left: x * Wd, top: y * H, transform: `translate(-50%,-50%) scale(${k * out}) rotate(${tilt + wob}deg)`,
      background: bg, color: ink, fontFamily: BEAST.font, fontWeight: 900, fontSize: H * size, padding: `${H * 0.008}px ${H * 0.022}px`,
      border: `${H * 0.006}px solid #000`, borderRadius: H * 0.012, boxShadow: `${H * 0.008}px ${H * 0.01}px 0 #000`, whiteSpace: 'nowrap', textTransform: 'uppercase'}}>{text}</div>
  );
};

// Hand-drawn arrow: wobbly curve draws itself from (fromX,fromY) to the target, then the head, optional label at the tail
const Arrow: React.FC<Extract<Gfx, {type: 'arrow'}>> = ({at, dur, x, y, fromX, fromY, color = BEAST.red, label}) => {
  const f = useCurrentFrame();
  const {fps, width: Wd, height: H} = useVideoConfig();
  const t = f / fps - at;
  if (t < 0 || t > dur) return null;
  const draw = interpolate(t, [0, 0.35], [0, 1], {...clamp, easing: EASE});
  const out = interpolate(t, [dur - 0.15, dur], [1, 0], clamp);
  const a = {x: fromX * Wd, y: fromY * H}, b = {x: x * Wd, y: y * H};
  const mx = (a.x + b.x) / 2 - (b.y - a.y) * 0.25, my = (a.y + b.y) / 2 + (b.x - a.x) * 0.25;
  const d = `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
  const len = Math.hypot(b.x - a.x, b.y - a.y) * 1.25;
  const ang = Math.atan2(b.y - my, b.x - mx);
  const hl = H * 0.045, w = H * 0.012;
  const head = `M ${b.x - hl * Math.cos(ang - 0.5)} ${b.y - hl * Math.sin(ang - 0.5)} L ${b.x} ${b.y} L ${b.x - hl * Math.cos(ang + 0.5)} ${b.y - hl * Math.sin(ang + 0.5)}`;
  return (
    <AbsoluteFill style={{opacity: out}}>
      <svg width={Wd} height={H} style={{position: 'absolute', filter: 'drop-shadow(0 3px 0 #000)'}}>
        <path d={d} fill="none" stroke="#000" strokeWidth={w + 8} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
        <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
        {draw > 0.95 && <path d={head} fill="none" stroke="#000" strokeWidth={w + 8} strokeLinecap="round" strokeLinejoin="round" />}
        {draw > 0.95 && <path d={head} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />}
      </svg>
      {label && <div style={{position: 'absolute', left: a.x, top: a.y, transform: `translate(-50%, ${fromY > y ? '10%' : '-110%'}) scale(${pop(t - 0.2)})`, fontFamily: BEAST.font, fontWeight: 900, fontSize: H * 0.055, color: '#fff', whiteSpace: 'nowrap', textTransform: 'uppercase', ...stroke(H * 0.007)}}>{label}</div>}
    </AbsoluteFill>
  );
};

// Hand-drawn circle (slightly wobbly, overshoots its start like a marker stroke)
const Circle: React.FC<Extract<Gfx, {type: 'circle'}>> = ({at, dur, x, y, rx, ry, color = BEAST.red}) => {
  const f = useCurrentFrame();
  const {fps, width: Wd, height: H} = useVideoConfig();
  const t = f / fps - at;
  if (t < 0 || t > dur) return null;
  const draw = interpolate(t, [0, 0.4], [0, 1], {...clamp, easing: EASE});
  const out = interpolate(t, [dur - 0.15, dur], [1, 0], clamp);
  const cx = x * Wd, cy = y * H, RX = rx * Wd, RY = (ry ?? rx * Wd / H) * H;
  const pts = Array.from({length: 73}, (_, i) => {
    const a = -Math.PI / 2 + (i / 72) * Math.PI * 2.15;
    const wob = 1 + 0.04 * Math.sin(i * 0.7) + 0.06 * (i / 72);
    return `${cx + RX * wob * Math.cos(a)},${cy + RY * wob * Math.sin(a)}`;
  });
  const len = Math.PI * 2.2 * Math.max(RX, RY) * 1.1;
  return (
    <svg width={Wd} height={H} style={{position: 'absolute', opacity: out, filter: 'drop-shadow(0 3px 0 #000)'}}>
      <polyline points={pts.join(' ')} fill="none" stroke="#000" strokeWidth={H * 0.012 + 8} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={H * 0.012} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
    </svg>
  );
};

const Emoji: React.FC<Extract<Gfx, {type: 'emoji'}>> = ({at, dur, e, x, y, size = 0.14}) => {
  const f = useCurrentFrame();
  const {fps, width: Wd, height: H} = useVideoConfig();
  const t = f / fps - at;
  if (t < 0 || t > dur) return null;
  const k = pop(t, 0.3), out = interpolate(t, [dur - 0.15, dur], [1, 0], clamp);
  return <div style={{position: 'absolute', left: x * Wd, top: y * H, fontSize: H * size, transform: `translate(-50%,-50%) scale(${k * out}) rotate(${Math.sin(t * 5) * 8}deg)`, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.5))'}}>{e}</div>;
};

const Counter: React.FC<Extract<Gfx, {type: 'counter'}>> = ({at, dur, from, to, x, y, label, suffix = ''}) => {
  const f = useCurrentFrame();
  const {fps, width: Wd, height: H} = useVideoConfig();
  const t = f / fps - at;
  if (t < 0 || t > dur) return null;
  const v = Math.round(interpolate(t, [0.1, Math.min(1.4, dur * 0.6)], [from, to], {...clamp, easing: Easing.out(Easing.cubic)}));
  const k = pop(t, 0.3), out = interpolate(t, [dur - 0.15, dur], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: x * Wd, top: y * H, transform: `translate(-50%,-50%) scale(${k * out})`, textAlign: 'center'}}>
      <div style={{fontFamily: BEAST.font, fontWeight: 900, fontSize: H * 0.13, color: BEAST.yellow, ...stroke(H * 0.012)}}>{v}{suffix}</div>
      {label && <div style={{fontFamily: BEAST.font, fontWeight: 900, fontSize: H * 0.04, color: '#fff', textTransform: 'uppercase', ...stroke(H * 0.006)}}>{label}</div>}
    </div>
  );
};

// Name intro: red marker circle on the face + yellow name sticker beside it
const Tag: React.FC<Extract<Gfx, {type: 'tag'}>> = ({at, dur, name, sub, x, y, r = 0.06, side = 'up'}) => {
  const f = useCurrentFrame();
  const {fps, width: Wd, height: H} = useVideoConfig();
  const t = f / fps - at;
  if (t < 0 || t > dur) return null;
  const off = {up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0]}[side];
  const lx = x + off[0] * (r * 1.9), ly = y + off[1] * (r * 1.9 * Wd / H);
  return (
    <AbsoluteFill>
      <Circle type="circle" at={at} dur={dur} x={x} y={y} rx={r} ry={r * Wd / H * 1.15} />
      <Pop type="pop" at={at + 0.15} dur={dur - 0.15} text={name} x={lx} y={ly} size={0.055} tilt={side === 'left' ? -5 : 4} />
      {sub && <Pop type="pop" at={at + 0.35} dur={dur - 0.35} text={sub} x={lx} y={ly + 0.075 * (off[1] < 0 ? -1 : 1)} size={0.03} bg="#fff" tilt={side === 'left' ? -3 : 3} />}
    </AbsoluteFill>
  );
};


// Photo that drops in on a string over the running footage, swings, hangs, and is yanked back up. Whole photo, no crop.
const Hang: React.FC<Extract<Gfx, {type: 'hang'}>> = ({at, dur, photo, x, h = 0.56, tilt = 0, y = 0.47}) => {
  const f = useCurrentFrame();
  const {fps, width: Wd, height: H} = useVideoConfig();
  const t = f / fps - at;
  if (t < 0 || t > dur) return null;
  const drop = spring({frame: t * fps, fps, config: {damping: 9, stiffness: 120, mass: 0.8}});
  const up = interpolate(t, [dur - 0.35, dur], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const swing = tilt + 9 * Math.exp(-t * 2.2) * Math.sin(t * 7) + 1.2 * Math.sin(t * 1.6);
  const cy = (y * H) * drop - up * H * 1.1 - (1 - drop) * H * 0.9;
  const ph = H * h;
  return (
    <div style={{position: 'absolute', left: x * Wd, top: 0, transformOrigin: '50% 0', transform: `translateX(-50%) rotate(${swing}deg)`}}>
      <div style={{width: 3, height: Math.max(0, cy - ph / 2), margin: '0 auto', background: 'linear-gradient(#ddd,#999)', boxShadow: '0 0 4px rgba(0,0,0,0.6)'}} />
      <div style={{width: 18, height: 18, borderRadius: 99, background: '#e33', margin: '-6px auto 0', boxShadow: '0 2px 4px rgba(0,0,0,0.6)', position: 'relative', zIndex: 2}} />
      <div style={{marginTop: -10, background: '#fafafa', padding: H * 0.011, paddingBottom: H * 0.035, borderRadius: 6, boxShadow: '0 22px 50px rgba(0,0,0,0.55)'}}>
        <Img src={staticFile(photo)} style={{height: ph, display: 'block', borderRadius: 3}} />
      </div>
    </div>
  );
};

// Transparent meme sticker (Library/stickers) popping in beside the action
const Sticker: React.FC<Extract<Gfx, {type: 'sticker'}>> = ({at, dur, src, x, y, h = 0.42, flip}) => {
  const f = useCurrentFrame();
  const {fps, width: Wd, height: H} = useVideoConfig();
  const t = f / fps - at;
  if (t < 0 || t > dur) return null;
  const k = pop(t, 0.3), out = interpolate(t, [dur - 0.2, dur], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: x * Wd, top: y * H, height: H * h, transform: `translate(-50%,-50%) scale(${k * out}) ${flip ? 'scaleX(-1)' : ''}`, filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.45))'}}>
      <OffthreadVideo src={staticFile(src)} transparent muted style={{height: '100%'}} />
    </div>
  );
};

// South-film hero intro: freeze, speed-blur world, the person slams in with a rim light, giant gold name, flash + shake
const Hero: React.FC<Extract<Gfx, {type: 'hero'}>> = ({at, dur, name, kicker = 'INTRODUCING', role, cut, bg, side = 'left', tint = '#0b3b4a'}) => {
  const f = useCurrentFrame();
  const {fps, width: Wd, height: H} = useVideoConfig();
  const t = f / fps - at;
  if (t < 0 || t > dur) return null;
  const inK = spring({frame: t * fps, fps, config: {damping: 14, stiffness: 160}});
  const slam = interpolate(t, [0.25, 0.42], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const shake = t > 0.42 && t < 0.75 ? Math.sin(t * 90) * 10 * (0.75 - t) / 0.33 : 0;
  const flash = interpolate(t, [0.4, 0.45, 0.65], [0, 0.75, 0], clamp);
  const out = interpolate(t, [dur - 0.18, dur], [1, 0], clamp);
  const push = interpolate(t, [0, dur], [1.0, 1.06]);
  const dir = side === 'left' ? 1 : -1;
  const lines = Array.from({length: 26}, (_, i) => {
    const a = (i * 137.5 * Math.PI) / 180, sp = ((t * 2.2 + i * 0.13) % 1);
    const r0 = H * (0.15 + sp * 0.9), r1 = r0 + H * (0.12 + 0.2 * sp);
    return <line key={i} x1={Wd / 2 + r0 * Math.cos(a)} y1={H / 2 + r0 * Math.sin(a)} x2={Wd / 2 + r1 * Math.cos(a)} y2={H / 2 + r1 * Math.sin(a)} stroke="rgba(255,255,255,0.55)" strokeWidth={2 + 3 * sp} strokeLinecap="round" />;
  });
  return (
    <AbsoluteFill style={{opacity: out, transform: `translateX(${shake}px)`, overflow: 'hidden', background: '#000'}}>
      {/* speed-blur world: zoomed, blurred, tinted copies */}
      {[1.0, 1.08, 1.16].map((z, i) => (
        <AbsoluteFill key={i} style={{opacity: i === 0 ? 1 : 0.35}}>
          <Img src={staticFile(bg)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${(z + t * 0.12) * 1.15})`, filter: `blur(${14 + i * 8}px) saturate(0.5) brightness(0.55)`}} />
        </AbsoluteFill>
      ))}
      <AbsoluteFill style={{background: `radial-gradient(circle at ${side === 'left' ? 30 : 70}% 55%, rgba(255,170,60,0.35), ${tint}cc 70%)`, mixBlendMode: 'hard-light'}} />
      <svg width={Wd} height={H} style={{position: 'absolute'}}>{lines}</svg>
      {/* the hero */}
      <div style={{position: 'absolute', bottom: 0, [side]: Wd * 0.05, height: H * 0.98, transform: `translateX(${(1 - inK) * -dir * Wd * 0.3}px) scale(${push})`, transformOrigin: '50% 100%',
        filter: 'drop-shadow(0 0 2px #fff) drop-shadow(0 0 18px rgba(255,200,120,0.85)) drop-shadow(0 20px 30px rgba(0,0,0,0.7))'}}>
        <Img src={staticFile(cut)} style={{height: '100%'}} />
      </div>
      {/* name */}
      <div style={{position: 'absolute', top: '50%', [side === 'left' ? 'right' : 'left']: Wd * 0.06, width: Wd * 0.52, transform: 'translateY(-50%)', textAlign: side === 'left' ? 'right' : 'left'}}>
        <div style={{fontFamily: fonts.inter, fontWeight: 800, fontSize: H * 0.034, letterSpacing: H * 0.014, color: '#ffd77a', opacity: interpolate(t, [0.1, 0.35], [0, 1], clamp), textShadow: '0 2px 10px #000'}}>{kicker}</div>
        <div style={{fontFamily: fonts.anton, fontSize: H * 0.2, lineHeight: 1, letterSpacing: H * 0.004, transform: `scale(${3 - 2 * slam})`, opacity: slam, filter: `blur(${(1 - slam) * 12}px)`, transformOrigin: side === 'left' ? '100% 50%' : '0% 50%',
          background: 'linear-gradient(180deg, #fff6d5 0%, #ffd24a 45%, #c47a12 55%, #ffe9a3 100%)', WebkitBackgroundClip: 'text', color: 'transparent', WebkitTextStroke: `${H * 0.003}px #3a1f00`,
          textShadow: '0 0 30px rgba(255,180,40,0.55)'}}>{name}</div>
        {role && <div style={{display: 'inline-block', marginTop: H * 0.015, fontFamily: BEAST.font, fontWeight: 900, fontSize: H * 0.04, color: '#000', background: '#fff', padding: `${H * 0.004}px ${H * 0.016}px`, transform: `rotate(-2deg) scale(${pop(t - 0.6)})`, textTransform: 'uppercase'}}>{role}</div>}
      </div>
      <AbsoluteFill style={{background: '#fff', opacity: flash}} />
      <AbsoluteFill style={{boxShadow: 'inset 0 0 220px rgba(0,0,0,0.85)'}} />
    </AbsoluteFill>
  );
};

// punch-in zoom on the footage (+ white flash): the base video reads these
function baseTransform(layers: Gfx[], t: number): {scale: number; ox: number; oy: number; flash: number} {
  let scale = 1, ox = 50, oy = 50, flash = 0;
  for (const l of layers) {
    if (l.type !== 'zoom') continue;
    const u = t - l.at;
    if (u < 0 || u > l.dur) continue;
    const inK = interpolate(u, [0, 0.12], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
    const outK = interpolate(u, [l.dur - 0.2, l.dur], [1, 0], clamp);
    scale = 1 + ((l.to ?? 1.35) - 1) * Math.min(inK, outK);
    ox = (l.x ?? 0.5) * 100; oy = (l.y ?? 0.5) * 100;
    if (l.flash) flash = Math.max(flash, interpolate(u, [0, 0.03, 0.18], [0, 0.8, 0], clamp));
  }
  return {scale, ox, oy, flash};
}

const Nothing: React.FC = () => null;
const LAYERS: Record<Gfx['type'], React.FC<any>> = {title: Title, chapter: Chapter, stamp: Stamp, name: Name, map: RouteMap, photos: Photos, text: TextLine, cast: Cast,
  caps: Caps, pop: Pop, arrow: Arrow, circle: Circle, emoji: Emoji, zoom: Nothing, counter: Counter, tag: Tag, hang: Hang, sticker: Sticker, hero: Hero};

export const VlogPiece: React.FC<VlogPieceProps> = ({base, layers, stage = '#111214'}) => {
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const z = baseTransform(layers, frame / fps);
  return (
    <AbsoluteFill style={{background: stage}}>
      {base && (
        <AbsoluteFill style={{transform: `scale(${z.scale})`, transformOrigin: `${z.ox}% ${z.oy}%`}}>
          <OffthreadVideo src={staticFile(base)} muted />
        </AbsoluteFill>
      )}
      {z.flash > 0 && <AbsoluteFill style={{background: '#fff', opacity: z.flash}} />}
      {layers.map((l, i) => {
        const C = LAYERS[l.type];
        // each layer lives in its own Sequence so it costs nothing outside its time
        return (
          <Sequence key={i} from={Math.max(0, Math.floor(l.at * fps) - 1)} durationInFrames={Math.ceil(l.dur * fps) + 2} layout="none">
            <SeqShift at={l.at}><C {...l} at={l.at - (Math.max(0, Math.floor(l.at * fps) - 1)) / fps} /></SeqShift>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
const SeqShift: React.FC<{at: number; children: React.ReactNode}> = ({children}) => <AbsoluteFill>{children}</AbsoluteFill>;
