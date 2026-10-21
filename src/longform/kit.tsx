import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont as plexSans} from '@remotion/google-fonts/IBMPlexSans';
import {loadFont as plexSerif} from '@remotion/google-fonts/IBMPlexSerif';
import {loadFont as interTight} from '@remotion/google-fonts/InterTight';
import {loadFont as montserrat} from '@remotion/google-fonts/Montserrat';
import {loadFont as mplusRound} from '@remotion/google-fonts/MPLUSRounded1c';
import {loadFont as notoJP} from '@remotion/google-fonts/NotoSansJP';
import {loadFont as geist} from '@remotion/google-fonts/Geist';
import {loadFont as instrSerif} from '@remotion/google-fonts/InstrumentSerif';
import {loadFont as plexMono} from '@remotion/google-fonts/IBMPlexMono';
import {loadFont as caveat} from '@remotion/google-fonts/Caveat';
import {loadFont as carlito} from '@remotion/google-fonts/Carlito';
import {loadFont as notoDeva} from '@remotion/google-fonts/NotoSansDevanagari';
import {loadFont as notoTamil} from '@remotion/google-fonts/NotoSansTamil';
import {loadFont as notoBeng} from '@remotion/google-fonts/NotoSansBengali';

// Designomics series kit (long-form YouTube, 16:9): charcoal paper, cadmium orange only for what matters,
// paper-white ink. Every element enters with motion (rise + un-blur, ease-out, slight overshoot) and leaves with motion.
export const C = {
  paper: '#1a1918', paper2: '#242220', card: '#2c2a27', ink: '#f2ece2', mute: '#9a9287', line: '#3d3a36',
  orange: '#E2481B', orange2: '#ff6a3d', green: '#58b67c', red: '#e5484d',
};
const lat = ['latin'] as const;
export const F = {
  // modern type (his verdict 2026-10-21: the slab serif felt old): Inter Tight for display, Geist for text,
  // Instrument Serif italic for small human accents; IBM Plex only when IBM Plex itself is the subject
  sans: geist('normal', {weights: ['400', '500', '600', '700'], subsets: [...lat]}).fontFamily,
  serif: interTight('normal', {weights: ['600', '700', '800'], subsets: [...lat]}).fontFamily,
  serifIt: instrSerif('italic', {weights: ['400'], subsets: [...lat]}).fontFamily,
  mono: geist('normal', {weights: ['500', '600'], subsets: [...lat]}).fontFamily,
  digits: plexMono('normal', {weights: ['500', '600'], subsets: [...lat]}).fontFamily,
  hand: instrSerif('italic', {weights: ['400'], subsets: [...lat]}).fontFamily,
  plex: plexSans('normal', {weights: ['400', '600', '700'], subsets: [...lat]}).fontFamily,
  plexSerif: plexSerif('normal', {weights: ['600'], subsets: [...lat]}).fontFamily,
  // stand-ins to SHOW a font being talked about: Montserrat ≈ Gotham's shapes; rounded vs plain Japanese for the Taiko swap
  gothamLike: montserrat('normal', {weights: ['600', '700'], subsets: ['latin']}).fontFamily,
  jpRound: mplusRound('normal', {weights: ['800'], subsets: ['latin']}).fontFamily,
  jpPlain: notoJP('normal', {weights: ['700'], subsets: ['latin']}).fontFamily,
  calibriLike: carlito('normal', {weights: ['400', '700'], subsets: [...lat]}).fontFamily,
  deva: notoDeva('normal', {weights: ['500'], subsets: ['devanagari']}).fontFamily,
  tamil: notoTamil('normal', {weights: ['500'], subsets: ['tamil']}).fontFamily,
  beng: notoBeng('normal', {weights: ['500'], subsets: ['bengali']}).fontFamily,
  // system fonts of this Mac, only to SHOW letter shapes being compared (commentary), never as our own type
  helvetica: 'Helvetica, "Helvetica Neue"', arial: 'Arial', futura: 'Futura, "Futura Md BT"', verdana: 'Verdana',
  times: '"Times New Roman", Times', sf: '-apple-system, system-ui, "SF Pro Text"',
};
export const fontOf = (k?: string) => (k && (F as Record<string, string>)[k]) || k || F.sans;

export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const SH = '0 18px 50px rgba(0,0,0,0.45), 0 3px 10px rgba(0,0,0,0.35)';

export function useT() {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return f / fps;
}
// life of a layer: t (s since start), enter 0→1, exit 1→0, k = min
export function useLife(at: number, dur: number, inS = 0.6, outS = 0.45) {
  const now = useT();
  const t = now - at;
  const enter = interpolate(t, [0, inS], [0, 1], {...clamp, easing: EASE});
  const exit = interpolate(t, [dur - outS, dur], [1, 0], {...clamp, easing: Easing.in(Easing.cubic)});
  return {t, enter, exit, k: Math.min(enter, exit), on: t >= -0.01 && t <= dur + 0.01};
}
export const step = (t: number, d: number, len = 0.6) => interpolate(t, [d, d + len], [0, 1], {...clamp, easing: EASE});
export function useSpring(t: number, d = 0, damping = 12) {
  const {fps} = useVideoConfig();
  return spring({frame: Math.max(0, (t - d) * fps), fps, config: {damping, stiffness: 140, mass: 0.7}});
}
export const src = (s?: string) => (!s ? '' : /^(https?:|data:)/.test(s) ? s : staticFile(s));

// Elements fly in from outside and leave out of the frame (never just appear) — his 2026-10-16 rule.
export const enterStyle = (k: number, exitK: number, from: 'up' | 'down' | 'left' | 'right' | 'pop' = 'up', dist = 60): React.CSSProperties => {
  const e = 1 - k, x = 1 - exitK;
  const dx = from === 'left' ? -dist * e : from === 'right' ? dist * e : 0;
  const dy = from === 'up' ? dist * e : from === 'down' ? -dist * e : 0;
  const s = from === 'pop' ? 0.7 + 0.3 * k : 1;
  const ry = (from === 'left' ? -28 : from === 'right' ? 28 : 0) * e;
  const rx = (from === 'up' ? 22 : from === 'down' ? -22 : 0) * e + 14 * x;
  return {opacity: Math.min(k, exitK), transform: `perspective(1600px) translate3d(${dx}px, ${dy - x * 40}px, ${-200 * (e + x)}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${s})`, filter: `blur(${(e + x) * 8}px)`, transformStyle: 'preserve-3d'};
};

// the "camera" over a held graphic: a slow orbit, and every ~3 s it eases to a new angle + a little closer,
// so nothing ever sits still for more than 2–4 s (his rule)
export const Drift: React.FC<{t: number; children: React.ReactNode; amp?: number}> = ({t, children, amp = 1}) => {
  const STEP = 3.1;
  const n = Math.floor(t / STEP), k = Easing.bezier(0.45, 0, 0.2, 1)(Math.min(1, (t - n * STEP) / 0.9));
  const ang = (i: number) => (i === 0 ? 0 : i % 2 ? 5 : -5);
  const ry = n === 0 ? 0 : ang(n - 1) + (ang(n) - ang(n - 1)) * k;          // eases to the next angle
  const zoom = 1 + 0.022 * Math.min(4, n === 0 ? 0 : n - 1 + k);              // and steps a little closer
  return (
    <div style={{position: 'absolute', inset: 0, transform: `perspective(1800px) rotateX(${Math.sin(t * 0.45) * 2.5 * amp}deg) rotateY(${(ry + Math.sin(t * 0.32 + 1) * 2.5) * amp}deg) scale(${zoom})`, transformStyle: 'preserve-3d'}}>
      {children}
    </div>
  );
};

// 3D card surface: light from the top-left, a lit edge and a deep soft shadow (reads as a physical object)
export const CARD3D: React.CSSProperties = {
  background: 'linear-gradient(155deg, #3a3733 0%, #2a2825 45%, #1f1d1b 100%)',
  boxShadow: '0 1px 0 rgba(255,255,255,0.10) inset, 0 -2px 0 rgba(0,0,0,0.35) inset, 0 40px 80px -20px rgba(0,0,0,0.75), 0 12px 24px rgba(0,0,0,0.35)',
  border: '1px solid rgba(255,255,255,0.06)',
};
export const PAPER3D: React.CSSProperties = {
  background: 'linear-gradient(160deg, #fbf8f2 0%, #f1ebe0 60%, #e6ddcf 100%)',
  boxShadow: '0 1px 0 #fff inset, 0 40px 80px -20px rgba(0,0,0,0.75), 0 12px 24px rgba(0,0,0,0.35)',
};

// letters rise + un-blur, staggered
export const Rise: React.FC<{text: string; t: number; exit?: number; style?: React.CSSProperties; stagger?: number; delay?: number}> = ({text, t, exit = 1, style, stagger = 0.028, delay = 0}) => {
  let i = 0;
  return (
    <div style={{whiteSpace: 'pre-wrap', ...style}}>
      {text.split(' ').map((word, wi) => (
        <span key={wi} style={{display: 'inline-block', whiteSpace: 'nowrap'}}>
          {[...word].map((ch) => {
            const k = interpolate(t - delay - i++ * stagger, [0, 0.55], [0, 1], {...clamp, easing: EASE});
            return <span key={i} style={{display: 'inline-block', opacity: k * exit, transform: `translateY(${(1 - k) * 0.4}em)`, filter: `blur(${(1 - k) * 7}px)`}}>{ch}</span>;
          })}
          {wi < text.split(' ').length - 1 ? <span style={{display: 'inline-block', width: '0.28em'}} /> : null}
        </span>
      ))}
    </div>
  );
};

// word-by-word rise (for long lines)
export const RiseWords: React.FC<{text: string; t: number; exit?: number; style?: React.CSSProperties; stagger?: number; hot?: string[]}> = ({text, t, exit = 1, style, stagger = 0.07, hot = []}) => (
  <div style={style}>
    {text.split(' ').map((w, i) => {
      const k = interpolate(t - i * stagger, [0, 0.5], [0, 1], {...clamp, easing: EASE});
      const isHot = hot.some((h) => w.toLowerCase().replace(/[^\w₹$]/g, '').includes(h.toLowerCase()));
      return <span key={i} style={{display: 'inline-block', marginRight: '0.26em', opacity: k * exit, transform: `translateY(${(1 - k) * 0.35}em)`, filter: `blur(${(1 - k) * 6}px)`, color: isHot ? C.orange : undefined}}>{w}</span>;
    })}
  </div>
);

// charcoal paper with grain + soft light falloff
export const Paper: React.FC<{tint?: string}> = ({tint}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: `radial-gradient(120% 90% at 50% 40%, ${tint ?? C.paper2} 0%, ${C.paper} 60%, #121110 100%)`}}>
      <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: 0.16, mixBlendMode: 'overlay'}}>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 6} /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

// small source credit (evidence): quiet, no ornaments
export const Source: React.FC<{text: string; k?: number; style?: React.CSSProperties}> = ({text, k = 1, style}) => (
  <div style={{fontFamily: F.sans, fontWeight: 500, fontSize: 17, letterSpacing: 0.3, color: C.mute, opacity: k * 0.85, ...style}}>
    Source: {text}
  </div>
);

export const Kicker: React.FC<{text: string; k?: number; style?: React.CSSProperties; color?: string}> = ({text, k = 1, style, color = C.orange}) => (
  <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 22, letterSpacing: 2.5, color, textTransform: 'uppercase', opacity: k, ...style}}>{text}</div>
);

// a marker circle drawn around something (Enrico-style), w/h in px, draws on in 0.5 s
export const MarkerCircle: React.FC<{w: number; h: number; t: number; color?: string; stroke?: number; style?: React.CSSProperties}> = ({w, h, t, color = C.orange, stroke = 5, style}) => {
  const p = interpolate(t, [0, 0.5], [0, 1], {...clamp, easing: EASE});
  const d = `M ${w * 0.55} ${h * 0.04} C ${w * 1.02} ${h * 0.02}, ${w * 1.04} ${h * 0.96}, ${w * 0.5} ${h * 0.97} C ${-w * 0.04} ${h * 0.98}, ${-w * 0.02} ${h * 0.06}, ${w * 0.62} ${h * 0.1}`;
  return (
    <svg width={w} height={h} style={{position: 'absolute', overflow: 'visible', ...style}}>
      <path d={d} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
    </svg>
  );
};

// hand-drawn underline / marker sweep
export const Underline: React.FC<{w: number; t: number; color?: string; y?: number; stroke?: number}> = ({w, t, color = C.orange, y = 0, stroke = 6}) => {
  const p = interpolate(t, [0, 0.45], [0, 1], {...clamp, easing: EASE});
  return (
    <svg width={w} height={24} style={{position: 'absolute', left: 0, bottom: y - 14, overflow: 'visible'}}>
      <path d={`M 4 14 Q ${w * 0.5} 4 ${w - 4} 12`} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
    </svg>
  );
};

// The Price Tag stamp (series signature for money): a tag on a string that swings in, slams, settles
export const PriceTag: React.FC<{t: number; exit?: number; value: string; sub?: string; note?: string; scale?: number; tilt?: number}> = ({t, exit = 1, value, sub, note, scale = 1, tilt = -6}) => {
  const s = useSpring(t, 0, 9);
  const swing = Math.sin(t * 5) * 6 * Math.exp(-t * 2.2);
  return (
    <div style={{transform: `scale(${(0.4 + 0.6 * s) * scale}) rotate(${tilt + swing}deg)`, opacity: Math.min(1, s * 3) * exit, transformOrigin: '20% 50%', filter: `blur(${(1 - exit) * 8}px)`}}>
      <div style={{position: 'relative', display: 'flex', alignItems: 'center', background: C.orange, color: '#fff', padding: '26px 54px 26px 86px',
        clipPath: 'polygon(48px 0, 100% 0, 100% 100%, 48px 100%, 0 50%)', boxShadow: SH, borderRadius: 10}}>
        <div style={{position: 'absolute', left: 38, top: '50%', width: 22, height: 22, marginTop: -11, borderRadius: 99, background: C.paper}} />
        <div>
          <div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 92, lineHeight: 1, letterSpacing: -1}}>{value}</div>
          {sub && <div style={{fontFamily: F.mono, fontWeight: 600, fontSize: 26, marginTop: 8, opacity: 0.95}}>{sub}</div>}
        </div>
      </div>
      {note && <div style={{fontFamily: F.hand, fontWeight: 700, fontSize: 40, color: C.ink, marginTop: 14, marginLeft: 70, transform: 'rotate(2deg)'}}>{note}</div>}
    </div>
  );
};

// one picture / logo (from public stage), contained
export const Pic: React.FC<{s: string; style?: React.CSSProperties; fit?: 'contain' | 'cover'}> = ({s, style, fit = 'contain'}) =>
  s ? <Img src={src(s)} style={{objectFit: fit, ...style}} /> : null;

// region the graphic should live in (the part of the frame not used by his footage)
export type Box = {x: number; y: number; w: number; h: number};
export const Region: React.FC<{box: Box; children: React.ReactNode; style?: React.CSSProperties}> = ({box, children, style}) => (
  <div style={{position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style}}>{children}</div>
);
