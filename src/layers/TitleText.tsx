// Designed text over the footage (Pablo Quesada's reel course, 2026-10-14; brain/pablo.md):
//   words  a line (or several) built from tokens in different fonts — heavy condensed caps + brush script + bold sans —
//          each token enters its own way exactly on the spoken word: rise (slide up), type (soft typewriter),
//          blur (characters cascade in from blur), cut (just appears on the beat). Optional brush HIGHLIGHT drawn
//          left→right behind one token (his red stroke under "is dying"), and a bottom SHADE that darkens the lower
//          part of the frame so white text reads (never over his face). Soft glow + a living wobble on the letters.
//   stack  2–4 stacked lines in a heavy grotesk, one justified width (sizes differ per line), blend mode EXCLUSION so
//          the letters invert whatever is behind them (the "inverted colour" title, e.g. THE / ONLINE / ECOSYSTEM);
//          lines rise in one after another.
// Both are parented to the footage zoom in spirit: they sit in the lower-middle, captions are hidden while they show.
import React from 'react';
import {AbsoluteFill, Easing, Img, OffthreadVideo, interpolate, staticFile, useVideoConfig} from 'remotion';
import {fonts} from './fonts';

const settle = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const FONT = {script: fonts.yellowtail, heavy: fonts.anton, grotesk: fonts.inter, sans: fonts.poppins};
const WEIGHT = {script: 400, heavy: 400, grotesk: 900, sans: 800};
const GLOW = '0 0 20px rgba(255,255,255,0.35), 0 5px 16px rgba(0,0,0,0.55)';

export type Token = {text: string; font?: 'script' | 'heavy' | 'grotesk' | 'sans'; at: number; enter?: 'rise' | 'type' | 'blur' | 'cut'; size?: number; color?: string; highlight?: string};
export type WordsSpec = {lines: Token[][]; y?: number; shade?: boolean; boil?: boolean; out?: number; behind?: boolean};
export type StackSpec = {lines: string[]; at?: number[]; y?: number; size?: number; blend?: 'exclusion' | 'difference' | 'normal'; shade?: boolean; out?: number; behind?: boolean};

// darker lower part of the frame (his feathered inverted-ellipse shadow), fades in with the text
export const Shade: React.FC<{o: number}> = ({o}) => (
  <AbsoluteFill style={{opacity: o, background: 'radial-gradient(ellipse 120% 55% at 50% 100%, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0) 80%)'}} />
);

const TokenView: React.FC<{tk: Token; t: number; U: number}> = ({tk, t, U}) => {
  const f = tk.font ?? 'heavy';
  const d = t - tk.at;
  const size = (tk.size ?? (f === 'script' ? 0.15 : f === 'heavy' ? 0.14 : 0.1)) * U;
  const style: React.CSSProperties = {fontFamily: FONT[f], fontWeight: WEIGHT[f], fontSize: size, color: tk.color ?? '#fff', textShadow: GLOW,
    textTransform: f === 'heavy' ? 'uppercase' : undefined, lineHeight: 1, display: 'inline-block', position: 'relative', margin: `0 ${U * 0.012}px`};
  const enter = tk.enter ?? 'rise';
  const chars = [...tk.text];
  let body: React.ReactNode = tk.text;
  let wrap: React.CSSProperties = {};
  if (d < 0) wrap = {opacity: 0};
  else if (enter === 'rise') { const k = settle(Math.min(1, d / 14)); wrap = {opacity: Math.min(1, d / 5), transform: `translateY(${(1 - k) * U * 0.09}px)`}; }
  else if (enter === 'type') { const p = Math.min(1, d / Math.max(6, chars.length * 1.6)); body = chars.map((c, i) => <span key={i} style={{opacity: Math.max(0, Math.min(1, p * (chars.length + 3) - i))}}>{c}</span>); }
  else if (enter === 'blur') body = chars.map((c, i) => { const k = settle(Math.max(0, Math.min(1, (d - i * 1.2) / 10))); return <span key={i} style={{opacity: k, filter: `blur(${(1 - k) * 16}px)`, display: 'inline-block', transform: `translateX(${(1 - k) * U * 0.03}px)`}}>{c}</span>; });
  // brush highlight drawn left → right behind the token (rough edges via clip + slight tilt)
  const hl = tk.highlight && d >= 0 ? settle(Math.min(1, d / 12)) : 0;
  return (
    <span style={{...style, ...wrap}}>
      {tk.highlight && (
        <span style={{position: 'absolute', left: '-6%', right: '-6%', top: '38%', height: '52%', background: tk.highlight, transform: 'rotate(-2deg)', zIndex: -1,
          clipPath: `polygon(0 12%, ${hl * 100}% 0, ${hl * 100}% 100%, 0 88%)`, borderRadius: size * 0.06, boxShadow: '0 6px 18px rgba(0,0,0,0.35)'}} />
      )}
      {body}
    </span>
  );
};

export const Words: React.FC<WordsSpec & {t: number; frames: number}> = ({lines, y = 0.66, shade = true, boil = true, out, t, frames}) => {
  const {width: W, height: H} = useVideoConfig();
  const U = Math.min(W, H * 0.5625);
  const first = Math.min(...lines.flat().map((x) => x.at));
  const end = out ?? frames - 8;
  const o = Math.min(interpolate(t, [first - 4, first + 6], [0, 1], clamp), interpolate(t, [end, end + 8], [1, 0], clamp));
  const exitY = interpolate(t, [end, end + 8], [0, U * 0.08], {...clamp, easing: Easing.in(Easing.quad)});
  const id = `wob${frames}${first}`;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {shade && <Shade o={o} />}
      {boil && (
        <svg width={0} height={0} style={{position: 'absolute'}}>
          <filter id={id}><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed={Math.floor(t / 3) % 40} /><feDisplacementMap in="SourceGraphic" scale={U * 0.005} /></filter>
        </svg>
      )}
      <div style={{position: 'absolute', left: 0, right: 0, top: y * H, transform: `translate(0, -50%) translateY(${exitY}px)`, opacity: o, textAlign: 'center',
        filter: boil ? `url(#${id})` : undefined, isolation: 'isolate'}}>
        {lines.map((line, i) => (
          <div key={i} style={{whiteSpace: 'nowrap', marginTop: i ? -U * 0.01 : 0}}>{line.map((tk, j) => <TokenView key={j} tk={tk} t={t} U={U} />)}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const Stack: React.FC<StackSpec & {t: number; frames: number}> = ({lines, at, y = 0.68, size = 0.24, blend = 'exclusion', shade = true, out, t, frames}) => {
  const {width: W, height: H} = useVideoConfig();
  const U = Math.min(W, H * 0.5625);
  const starts = lines.map((_, i) => at?.[i] ?? i * 4);
  const end = out ?? frames - 8;
  const o = interpolate(t, [end, end + 8], [1, 0], clamp);
  // one justified block: every line is scaled to the same width (longer words get smaller), like his title
  const width = U * 0.82;
  const charW = 0.62; // heavy grotesk, rough advance per char in em
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {shade && <Shade o={Math.min(1, t / 8) * o} />}
      <div style={{position: 'absolute', left: (W - width) / 2, width, top: y * H, transform: 'translateY(-50%)', mixBlendMode: blend, opacity: o}}>
        {lines.map((line, i) => {
          const d = t - starts[i];
          const k = settle(Math.max(0, Math.min(1, d / 12)));
          const fs = Math.min(width / (line.length * charW), U * size);
          return (
            <div key={i} style={{fontFamily: fonts.inter, fontWeight: 900, fontSize: fs, lineHeight: 0.92, color: '#fff', textTransform: 'uppercase',
              textAlign: 'center', letterSpacing: '-0.02em', opacity: d < 0 ? 0 : Math.min(1, d / 5), transform: `translateY(${(1 - k) * U * 0.06}px)`, whiteSpace: 'nowrap'}}>{line}</div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── a picture joins him on screen (his "on-screen animation": the expert's cut-out rises from the bottom edge while
// he keeps talking; optional halftone dots texture; slides back down to leave) ───────────────────────────────────
export type PhotoSpec = {media: {src: string; video?: boolean; trimBefore?: number}; x?: number; w?: number; from?: 'bottom' | 'left' | 'right'; dots?: boolean; out?: number; behind?: boolean};
export const Photo: React.FC<PhotoSpec & {t: number; frames: number}> = ({media, x = 0.5, w = 0.5, from = 'bottom', dots, out, t, frames}) => {
  const {width: W, height: H} = useVideoConfig();
  const k = settle(Math.min(1, t / 16));
  const end = out ?? frames - 10;
  const leave = Easing.in(Easing.cubic)(interpolate(t, [end, end + 10], [0, 1], clamp));
  const off = 1 - k + leave;
  const dx = from === 'left' ? -off * W * 0.7 : from === 'right' ? off * W * 0.7 : 0;
  const dy = from === 'bottom' ? off * H * 0.5 : 0;
  const style: React.CSSProperties = {width: '100%', display: 'block', filter: 'drop-shadow(0 18px 30px rgba(0,0,0,0.55))'};
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: x * W - (w * W) / 2, width: w * W, bottom: 0, transform: `translate(${dx}px, ${dy}px)`}}>
        {media.video ? <OffthreadVideo src={staticFile(media.src)} trimBefore={media.trimBefore} muted transparent style={style} /> : <Img src={staticFile(media.src)} style={style} />}
        {dots && !media.video && (
          <div style={{position: 'absolute', inset: 0, opacity: 0.35, mixBlendMode: 'multiply',
            backgroundImage: 'radial-gradient(rgba(0,0,0,0.9) 28%, transparent 30%)', backgroundSize: `${W * 0.012}px ${W * 0.012}px`,
            WebkitMaskImage: `url(${staticFile(media.src)})`, maskImage: `url(${staticFile(media.src)})`, WebkitMaskSize: '100% 100%', maskSize: '100% 100%'}} />
        )}
      </div>
    </AbsoluteFill>
  );
};

// ── a screen recording / page floating in the background (his Loom card): only the useful middle, rounded corners,
// a soft glow halo, rises in; usually BEHIND him (behind: true) so his head overlaps it ─────────────────────────
export type CardSpec = {media: {src: string; video?: boolean; trimBefore?: number}; x?: number; y?: number; w?: number; crop?: [number, number, number, number]; tilt?: number; out?: number; behind?: boolean};
export const FloatCard: React.FC<CardSpec & {t: number; frames: number}> = ({media, x = 0.5, y = 0.2, w = 0.62, crop, tilt = -3, out, t, frames}) => {
  const {width: W, height: H} = useVideoConfig();
  const k = settle(Math.min(1, t / 16));
  const end = out ?? frames - 10;
  const o = Math.min(Math.min(1, t / 8), interpolate(t, [end, end + 10], [1, 0], clamp));
  const [ct, cr, cb, cl] = crop ?? [0, 0, 0, 0];
  const style: React.CSSProperties = {width: '100%', display: 'block', clipPath: `inset(${ct * 100}% ${cr * 100}% ${cb * 100}% ${cl * 100}% round ${W * 0.025}px)`};
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: x * W - (w * W) / 2, width: w * W, top: y * H, opacity: o,
        transform: `translateY(${(1 - k) * H * 0.06}px) perspective(1400px) rotateY(${tilt}deg) rotateX(${tilt * 0.5}deg)`,
        filter: 'drop-shadow(0 0 28px rgba(255,255,255,0.28)) drop-shadow(0 20px 30px rgba(0,0,0,0.5))'}}>
        {media.video ? <OffthreadVideo src={staticFile(media.src)} trimBefore={media.trimBefore} muted style={style} /> : <Img src={staticFile(media.src)} style={style} />}
      </div>
    </AbsoluteFill>
  );
};
