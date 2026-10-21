import React from 'react';
import {AbsoluteFill, interpolate, Easing, OffthreadVideo, useVideoConfig} from 'remotion';
import {MapBoard} from '../layers/Map';
import {C, F, SH, CARD3D, PAPER3D, EASE, clamp, useLife, step, useSpring, Rise, RiseWords, Source, Kicker, MarkerCircle, Underline, PriceTag, Pic, fontOf, enterStyle, src as srcOf, type Box} from './kit';

// Every scene: {type, at, dur, ...}. `box` = where it lives (full frame when he is off screen, the free side otherwise).
type P<T> = T & {at: number; dur: number; box: Box};
const center: React.CSSProperties = {position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'};
const fit = (box: Box) => (box.w < 1400 ? 1.0 : 1.3); // full frame = big, side panel (≈1040 px) = 1

// ── Series sting: the Cd tile + Designomics ──
export const Sting: React.FC<P<{tagline?: string; cd?: string}>> = ({at, dur, tagline = 'Every design has a price', cd}) => {
  const {t, exit} = useLife(at, dur, 0.5, 0.4);
  const s = useSpring(t, 0, 10);
  return (
    <div style={{...center, opacity: exit, filter: `blur(${(1 - exit) * 10}px)`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 34}}>
        {cd ? <img src={srcOf(cd)} style={{width: 150 * 2.4, height: 150 * 2.4, margin: -150 * 0.7, objectFit: 'contain', transform: `scale(${s}) rotate(${(1 - s) * -30}deg)`, filter: 'drop-shadow(0 18px 30px rgba(0,0,0,0.45))'}} /> : (
        <div style={{width: 150, height: 150, borderRadius: 26, background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${s}) rotate(${(1 - s) * -30}deg)`, boxShadow: SH}}>
          <span style={{fontFamily: F.serif, fontWeight: 700, fontSize: 92, color: '#fff', letterSpacing: -2}}>Cd</span>
        </div>
        )}
        <Rise text="Designomics" t={t - 0.25} style={{fontFamily: F.serif, fontWeight: 600, fontSize: 132, color: C.ink, letterSpacing: -3}} />
      </div>
      <div style={{fontFamily: F.mono, fontSize: 26, letterSpacing: 6, color: C.mute, marginTop: 26, opacity: step(t, 0.8), textTransform: 'uppercase'}}>{tagline}</div>
    </div>
  );
};

// ── Chapter card, set in the font being talked about ──
export const Chapter: React.FC<P<{kicker?: string; title: string; font?: string; sub?: string; size?: number}>> = ({at, dur, box, kicker, title, font, sub, size = 150}) => {
  const {t, exit} = useLife(at, dur, 0.6, 0.45);
  const z = fit(box);
  const push = 1 + 0.04 * Math.min(1, t / Math.max(1, dur));
  return (
    <div style={{...center, transform: `scale(${push})`, opacity: exit, filter: `blur(${(1 - exit) * 10}px)`}}>
      {kicker && <Kicker text={kicker} k={step(t, 0)} style={{fontSize: 24 * z, marginBottom: 28 * z}} />}
      <Rise text={title} t={t - 0.1} style={{fontFamily: fontOf(font), fontWeight: 600, fontSize: size * z, color: C.ink, lineHeight: 1.02, textAlign: 'center', maxWidth: box.w * 0.9, letterSpacing: -1}} stagger={0.03} />
      <div style={{width: 140 * z * step(t, 0.5), height: 6, background: C.orange, marginTop: 34 * z, borderRadius: 3}} />
      {sub && <div style={{fontFamily: F.hand, fontWeight: 600, fontSize: 46 * z, color: C.mute, marginTop: 18 * z, opacity: step(t, 0.8)}}>{sub}</div>}
    </div>
  );
};

// ── Big statement / breather text (optionally with hot words in orange) ──
export const Statement: React.FC<P<{text: string; hot?: string[]; size?: number; font?: string; kicker?: string; dim?: boolean; align?: 'center' | 'left'}>> = ({at, dur, box, text, hot, size = 92, font, kicker, align = 'center'}) => {
  const {t, exit} = useLife(at, dur, 0.5, 0.4);
  const z = fit(box);
  return (
    <div style={{...center, alignItems: align === 'left' ? 'flex-start' : 'center', padding: `0 ${box.w * 0.08}px`}}>
      {kicker && <Kicker text={kicker} k={step(t, 0) * exit} style={{fontSize: 22 * z, marginBottom: 24 * z}} />}
      <RiseWords text={text} t={t} exit={exit} hot={hot} style={{fontFamily: fontOf(font ?? 'serif'), fontWeight: 600, fontSize: size * z, color: C.ink, lineHeight: 1.12, textAlign: align, maxWidth: box.w * 0.86, textShadow: '0 4px 30px rgba(0,0,0,0.5)'}} />
    </div>
  );
};

// ── Questions: one at a time, typed big in the middle; earlier ones float up and fade ──
export const TypeLines: React.FC<P<{lines: {t: number; text: string}[]; kicker?: string}>> = ({at, dur, box, lines, kicker}) => {
  const {t, exit} = useLife(at, dur, 0.4, 0.4);
  const z = fit(box);
  const cur = lines.filter((l) => t >= l.t).length - 1;
  return (
    <div style={{...center, opacity: exit}}>
      {kicker && <Kicker text={kicker} k={step(t, 0)} style={{position: 'absolute', top: box.h * 0.16, fontSize: 22 * z}} />}
      {lines.map((l, i) => {
        if (i > cur) return null;
        const lt = t - l.t;
        const n = Math.floor(Math.min(l.text.length, lt * 34));
        const up = i < cur ? step(t, lines[i + 1].t, 0.6) : 0;
        const age = cur - i;
        return (
          <div key={i} style={{position: 'absolute', top: '50%', width: '90%', textAlign: 'center', transform: `translateY(${-50 - up * 0 - age * 0}%) translateY(${-up * (150 + (age - 1) * 70) * z}px) scale(${1 - up * 0.5})`,
            opacity: i === cur ? 1 : 0.3 / age, fontFamily: F.serif, fontWeight: 700, fontSize: 92 * z, color: C.ink, letterSpacing: -1.5}}>
            <span style={{fontFamily: F.sans, fontWeight: 600, fontSize: 30 * z, color: C.orange, verticalAlign: 'middle', marginRight: 24 * z}}>0{i + 1}</span>
            {l.text.slice(0, n)}<span style={{color: C.orange, opacity: i === cur && Math.floor(t * 2.5) % 2 === 0 ? 1 : 0}}>|</span>
          </div>
        );
      })}
    </div>
  );
};

// ── Logos: each brand gets its own moment (big, on its word), then files into a row below ──
export const Logos: React.FC<P<{items: {t: number; src: string; h?: number; label?: string}[]; title?: string; cols?: number; invert?: boolean}>> = ({at, dur, box, items, title, invert = true}) => {
  const {t, exit} = useLife(at, dur, 0.4, 0.45);
  const z = fit(box);
  const cur = items.filter((it) => t >= it.t).length - 1;
  const n = items.length, slotW = 300 * z;
  return (
    <div style={{...center, opacity: exit}}>
      {title && <Kicker text={title} k={step(t, 0)} style={{position: 'absolute', top: box.h * 0.12, fontSize: 22 * z}} />}
      {items.map((it, i) => {
        const k = step(t, it.t, 0.5);
        const next = items[i + 1];
        const park = next ? step(t, next.t, 0.55) : 0; // 0 = hero, 1 = parked in the row
        if (t < it.t) return null;
        const hx = 0, hy = -40 * z, px = (i - (n - 1) / 2) * slotW, py = box.h * 0.32;
        const x = hx + (px - hx) * park, y = hy + (py - hy) * park;
        const sc = (1.9 - 1.38 * park) * (0.75 + 0.25 * k);
        return (
          <div key={i} style={{position: 'absolute', left: '50%', top: '50%', width: 280 * z, height: 156 * z, marginLeft: -140 * z, marginTop: -78 * z, borderRadius: 26, ...CARD3D, display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: k * (i === cur ? 1 : 0.8), transform: `perspective(1400px) translate3d(${x}px, ${y + (1 - k) * 80}px, ${(1 - k) * -300}px) rotateX(${(1 - k) * 35}deg) rotateY(${(1 - park) * Math.sin(t * 0.8) * 8}deg) scale(${sc})`}}>
            <Pic s={it.src} style={{height: (it.h ?? 64) * z * 0.9, maxWidth: 220 * z, filter: invert ? 'brightness(0) invert(0.95)' : undefined}} />
          </div>
        );
      })}
    </div>
  );
};

// ── Price Tag stamp on its own ──
export const Price: React.FC<P<{value: string; sub?: string; note?: string; kicker?: string; source?: string}>> = ({at, dur, box, value, sub, note, kicker, source}) => {
  const {t, exit} = useLife(at, dur, 0.3, 0.4);
  const z = fit(box);
  return (
    <div style={center}>
      {kicker && <Kicker text={kicker} k={step(t, 0) * exit} style={{fontSize: 22 * z, marginBottom: 40 * z}} />}
      <PriceTag t={t} exit={exit} value={value} sub={sub} note={note} scale={z * 1.05} />
      {source && <Source text={source} k={step(t, 0.8) * exit} style={{marginTop: 50 * z}} />}
    </div>
  );
};

// ── The rent meter (running gag): ticks up with events, can drop to zero ──
export const Meter: React.FC<P<{keys: [number, number][]; label?: string; prefix?: string; events?: {t: number; text: string}[]; caption?: string; big?: boolean}>> = ({at, dur, box, keys, label = 'FONT RENT', prefix = '$', events = [], caption, big}) => {
  const {t, exit, enter} = useLife(at, dur, 0.5, 0.4);
  const z = fit(box) * (big ? 1.25 : 1);
  const ts = keys.map((k) => k[0]), vs = keys.map((k) => k[1]);
  const v = keys.length > 1 ? interpolate(t, ts, vs, {...clamp, easing: Easing.inOut(Easing.quad)}) : vs[0];
  const zero = v < 0.5 && vs[0] > 0;
  const digits = Math.round(v).toLocaleString('en-US').padStart(9, ' ');
  const wobble = Math.sin(t * 40) * (interpolate(t, ts, vs.map((_, i) => (i > 0 && vs[i] > vs[i - 1] ? 1 : 0)), clamp) > 0.5 ? 1 : 0);
  return (
    <div style={{...center, ...enterStyle(enter, exit, 'up', 80)}}>
      <div style={{padding: `${34 * z}px ${48 * z}px`, borderRadius: 30, background: '#121110', border: `2px solid ${C.line}`, boxShadow: SH, minWidth: 720 * z}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <Kicker text={label} style={{fontSize: 22 * z}} />
          <div style={{display: 'flex', alignItems: 'center', gap: 10, fontFamily: F.mono, fontSize: 20 * z, color: zero ? C.green : C.red}}>
            {zero ? 'PAID OFF' : 'RUNNING'}
          </div>
        </div>
        <div style={{fontFamily: F.digits, fontWeight: 600, fontSize: 132 * z, color: zero ? C.green : C.ink, letterSpacing: 4, marginTop: 10 * z, whiteSpace: 'pre', transform: `translateY(${wobble}px)`}}>
          {prefix}{digits.trimStart()}
        </div>
        <div style={{height: 10 * z, borderRadius: 9, background: C.line, marginTop: 14 * z, overflow: 'hidden'}}>
          <div style={{height: '100%', width: `${Math.min(100, (v / Math.max(...vs, 1)) * 100)}%`, background: C.orange}} />
        </div>
      </div>
      <div style={{position: 'relative', height: 120 * z, width: 900 * z, marginTop: 20 * z}}>
        {events.map((e, i) => {
          const k = step(t, e.t, 0.4);
          const out = 1 - step(t, e.t + 1.6, 0.5);
          if (t < e.t || out <= 0) return null;
          return (
            <div key={i} style={{position: 'absolute', left: `${(i * 37) % 80}%`, top: 0, fontFamily: F.sans, fontWeight: 600, fontSize: 30 * z, color: C.ink, background: C.card, padding: `${10 * z}px ${20 * z}px`, borderRadius: 999, border: `1px solid ${C.line}`,
              opacity: k * out, transform: `translateY(${(1 - k) * 40 - (1 - out) * 30}px)`}}>
              <span style={{color: C.orange}}>+ </span>{e.text}
            </div>
          );
        })}
      </div>
      {caption && <div style={{fontFamily: F.hand, fontWeight: 600, fontSize: 48 * z, color: C.mute, opacity: step(t, 0.6) * exit}}>{caption}</div>}
    </div>
  );
};

// ── Quote card (credited paraphrase / quote) ──
export const Quote: React.FC<P<{text: string; who: string; role?: string; source?: string; hot?: string[]; paraphrase?: boolean}>> = ({at, dur, box, text, who, role, source, hot, paraphrase}) => {
  const {t, exit, enter} = useLife(at, dur, 0.6, 0.45);
  const z = fit(box);
  return (
    <div style={{...center, ...enterStyle(enter, exit, 'up', 70)}}>
      <div style={{width: box.w * 0.8, padding: `${56 * z}px ${70 * z}px`, borderRadius: 30, ...CARD3D, position: 'relative'}}>
        <div style={{position: 'absolute', top: -40 * z, left: 50 * z, fontFamily: F.serif, fontSize: 200 * z, color: C.orange, lineHeight: 1}}>“</div>
        <RiseWords text={text} t={t - 0.2} hot={hot} style={{fontFamily: F.serif, fontWeight: 500, fontSize: 54 * z, lineHeight: 1.25, color: C.ink}} stagger={0.045} />
        <div style={{marginTop: 34 * z, display: 'flex', alignItems: 'center', gap: 16, opacity: step(t, 0.9)}}>
          <div style={{width: 40 * z, height: 3, background: C.orange}} />
          <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 30 * z, color: C.ink}}>{who}</div>
          {role && <div style={{fontFamily: F.sans, fontSize: 26 * z, color: C.mute}}>· {role}</div>}
        </div>
        {(source || paraphrase) && <Source text={`${source ?? ''}${paraphrase ? ' · paraphrased' : ''}`} k={step(t, 1.1)} style={{marginTop: 18 * z, fontSize: 16 * z}} />}
      </div>
    </div>
  );
};

// ── Evidence card: a picture (photo / screenshot / logo) with a source label and a slow push ──
export const Evidence: React.FC<P<{src: string; source?: string; caption?: string; tilt?: number; w?: number; light?: boolean; label?: string}>> = ({at, dur, box, src: s, source, caption, tilt = -2, w = 0.62, light, label}) => {
  const {t, exit, enter} = useLife(at, dur, 0.6, 0.45);
  const push = 1 + 0.05 * (t / Math.max(1, dur));
  return (
    <div style={{...center, ...enterStyle(enter, exit, 'up', 90)}}>
      <div style={{transform: `rotate(${tilt}deg) scale(${push})`, background: light ? '#f4f0e8' : C.card, padding: 18, borderRadius: 18, boxShadow: SH, position: 'relative'}}>
        <Pic s={s} style={{display: 'block', maxWidth: box.w * w, maxHeight: box.h * 0.66, borderRadius: 8}} />
        {label && <div style={{position: 'absolute', top: -26, right: -20, fontFamily: F.mono, fontWeight: 600, fontSize: 22, color: '#fff', background: C.orange, padding: '8px 16px', borderRadius: 8, transform: 'rotate(4deg)', opacity: step(t, 0.7)}}>{label}</div>}
      </div>
      {caption && <div style={{fontFamily: F.hand, fontWeight: 700, fontSize: 46, color: C.ink, marginTop: 30, opacity: step(t, 0.6)}}>{caption}</div>}
      {source && <Source text={source} k={step(t, 0.9)} style={{marginTop: 16}} />}
    </div>
  );
};

// ── Licence conditions: each one gets the screen (big word + what it costs), done ones stack small at the side ──
export const Checklist: React.FC<P<{title: string; items: {t: number; text: string; icon?: string}[]; source?: string}>> = ({at, dur, box, title, items, source}) => {
  const {t, exit} = useLife(at, dur, 0.5, 0.45);
  const z = fit(box);
  const cur = items.filter((it) => t >= it.t).length - 1;
  return (
    <div style={{...center, opacity: exit}}>
      <Kicker text={title} k={step(t, 0)} style={{position: 'absolute', top: box.h * 0.14, fontSize: 24 * z}} />
      {items.map((it, i) => {
        if (i > cur) return null;
        const k = step(t, it.t, 0.5);
        const park = i < cur ? step(t, items[i + 1].t, 0.55) : 0;
        return (
          <div key={i} style={{position: 'absolute', left: '50%', top: '50%', transform: `perspective(1400px) translate3d(${-50 + park * -0}%, -50%, 0) translate3d(${park * -box.w * 0.3}px, ${park * (-box.h * 0.18 + i * 64 * z)}px, ${(1 - k) * -260}px) rotateX(${(1 - k) * 30}deg) scale(${1 - park * 0.62})`,
            opacity: k * (i === cur ? 1 : 0.65), display: 'flex', alignItems: 'center', gap: 34 * z, whiteSpace: 'nowrap'}}>
            <div style={{width: 96 * z, height: 96 * z, borderRadius: 24, ...PAPER3D, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 62 * z, color: C.orange, fontWeight: 700, transform: `scale(${0.6 + 0.4 * step(t, it.t + 0.15, 0.45)})`}}>✓</div>
            <div style={{fontFamily: F.serif, fontWeight: 700, fontSize: 104 * z, color: C.ink, letterSpacing: -2}}>{it.text}</div>
            <div style={{fontFamily: F.digits, fontWeight: 600, fontSize: 52 * z, color: C.orange, opacity: step(t, it.t + 0.4)}}>+ $</div>
          </div>
        );
      })}
      {source && <Source text={source} k={step(t, 1) * exit} style={{position: 'absolute', right: 40, bottom: 30}} />}
    </div>
  );
};

// ── Font file → licence (rented, not bought) ──
export const Licence: React.FC<P<{}>> = ({at, dur, box}) => {
  const {t, exit, enter} = useLife(at, dur, 0.5, 0.45);
  const z = fit(box);
  const flip = step(t, 1.4, 0.8);
  const stamp = useSpring(t, 2.4, 8);
  return (
    <div style={{...center, ...enterStyle(enter, exit, 'up', 80)}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 70 * z}}>
        <div style={{width: 300 * z, height: 380 * z, borderRadius: 22, ...CARD3D, border: `2px solid ${C.line}`, boxShadow: SH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `rotate(${-4 + flip * 4}deg)`}}>
          <div style={{fontFamily: F.serif, fontWeight: 600, fontSize: 170 * z, color: C.ink, lineHeight: 1}}>Aa</div>
          <div style={{fontFamily: F.mono, fontSize: 26 * z, color: C.mute, marginTop: 20 * z}}>font.otf</div>
        </div>
        <div style={{fontFamily: F.mono, fontSize: 70 * z, color: C.orange, opacity: flip}}>→</div>
        <div style={{width: 420 * z, height: 380 * z, borderRadius: 18, ...PAPER3D, color: '#1d1b19', padding: 36 * z, opacity: flip, transform: `translateX(${(1 - flip) * 60}px) rotate(2deg)`, position: 'relative'}}>
          <div style={{fontFamily: F.mono, fontWeight: 600, fontSize: 22 * z, letterSpacing: 3, color: C.orange}}>LICENCE</div>
          <div style={{fontFamily: F.serif, fontWeight: 600, fontSize: 44 * z, marginTop: 8 * z}}>Permission to use</div>
          {[0, 1, 2, 3].map((i) => <div key={i} style={{height: 10 * z, borderRadius: 5, background: '#d9d1c4', marginTop: 22 * z, width: `${92 - i * 14}%`}} />)}
          <div style={{position: 'absolute', right: 26 * z, bottom: 30 * z, fontFamily: F.sans, fontWeight: 700, fontSize: 58 * z, color: C.orange, border: `6px solid ${C.orange}`, borderRadius: 12, padding: `${4 * z}px ${20 * z}px`,
            transform: `rotate(-12deg) scale(${2 - stamp})`, opacity: Math.min(1, stamp * 2)}}>RENTED</div>
        </div>
      </div>
    </div>
  );
};

// ── Small shop vs a giant: same font, the bill grows with the screens ──
export const Scale: React.FC<P<{}>> = ({at, dur, box}) => {
  const {t, exit, enter} = useLife(at, dur, 0.5, 0.45);
  const z = fit(box);
  const grow = interpolate(t, [1.6, dur - 0.6], [1, 160], {...clamp, easing: Easing.in(Easing.quad)});
  const n = Math.floor(grow);
  return (
    <div style={{...center, ...enterStyle(enter, exit, 'up', 60), flexDirection: 'row', gap: 90 * z}}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{width: 140 * z, height: 96 * z, borderRadius: 10, border: `4px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.serif, fontSize: 48 * z, color: C.ink}}>Aa</div>
        <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 34 * z, color: C.ink, marginTop: 20 * z}}>10-person startup</div>
        <div style={{transform: 'scale(0.55)', marginTop: 10 * z}}><PriceTag t={t - 0.5} value="$" sub="small fee, done" tilt={-4} /></div>
      </div>
      <div style={{width: 2, height: 500 * z, background: C.line}} />
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: step(t, 1.1)}}>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: 6 * z, width: 640 * z, height: 380 * z, alignContent: 'start'}}>
          {Array.from({length: 160}).map((_, i) => (
            <div key={i} style={{height: 20 * z, borderRadius: 3, background: i < n ? (i === 0 ? C.orange : '#4a4540') : 'transparent', border: i < n ? 'none' : `1px solid ${C.line}`, transform: `scale(${i < n ? 1 : 0.6})`}} />
          ))}
        </div>
        <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 34 * z, color: C.ink, marginTop: 20 * z}}>Hundreds of millions of screens</div>
        <div style={{fontFamily: F.mono, fontSize: 64 * z, fontWeight: 600, color: C.orange, marginTop: 6 * z}}>$ × {n}</div>
      </div>
    </div>
  );
};

// ── A Netflix-like streaming screen (mock: tiles + row titles) — "letters" mode zooms into the type, "covered" hides the logo ──
export const Stream: React.FC<P<{logo?: string; mode?: 'ui' | 'letters' | 'covered'; label?: string; meterZero?: boolean}>> = ({at, dur, box, logo, mode = 'ui', label}) => {
  const {t, exit, enter} = useLife(at, dur, 0.6, 0.45);
  const z = box.w / 1920;
  const zoom = mode === 'letters' ? interpolate(t, [0.8, 2.6], [1, 2.3], {...clamp, easing: EASE}) : 1 + 0.03 * t / dur;
  const cover = mode === 'covered' ? step(t, 0.6, 0.6) : 0;
  const rows = ['Trending Now', 'Because you watched', 'Top 10 in India today'];
  const tileCol = ['#7a2b1f', '#2d4a63', '#5b4a2a', '#39324f', '#244a3c', '#6b3046', '#3f3f3f'];
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', ...enterStyle(enter, exit, 'up', 70)}}>
      <div style={{width: 1500 * z, height: 860 * z, borderRadius: 26 * z, overflow: 'hidden', background: '#0b0b0b', boxShadow: SH, position: 'relative', border: '1px solid #222'}}>
        <div style={{position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: '4% 36%'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 36 * z, padding: `${28 * z}px ${44 * z}px`}}>
            <div style={{position: 'relative'}}>
              <Pic s={logo ?? ''} style={{height: 46 * z}} />
              {cover > 0 && <div style={{position: 'absolute', inset: -10 * z, background: C.paper, borderRadius: 8, transform: `scaleX(${cover})`, transformOrigin: 'left', border: `3px dashed ${C.orange}`}} />}
            </div>
            {['Home', 'TV Shows', 'Movies', 'New & Popular', 'My List'].map((m) => <div key={m} style={{fontFamily: F.sans, fontSize: 24 * z, color: '#e5e5e5'}}>{m}</div>)}
          </div>
          <div style={{margin: `${10 * z}px ${44 * z}px`, height: 300 * z, borderRadius: 12, background: 'linear-gradient(90deg, #000 0%, #000a 40%, #5a1d14 100%)', padding: 40 * z}}>
            <div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 70 * z, color: '#fff', letterSpacing: -1}}>The Letters</div>
            <div style={{fontFamily: F.sans, fontSize: 26 * z, color: '#ddd', marginTop: 12 * z, width: 600 * z}}>Every title, every button, every word you read here.</div>
            <div style={{display: 'flex', gap: 16 * z, marginTop: 26 * z}}>
              <div style={{background: '#fff', color: '#000', fontFamily: F.sans, fontWeight: 700, fontSize: 26 * z, padding: `${10 * z}px ${30 * z}px`, borderRadius: 6}}>▶ Play</div>
              <div style={{background: '#6d6d6eb3', color: '#fff', fontFamily: F.sans, fontWeight: 600, fontSize: 26 * z, padding: `${10 * z}px ${30 * z}px`, borderRadius: 6}}>ⓘ More Info</div>
            </div>
          </div>
          {rows.map((r, ri) => (
            <div key={r} style={{margin: `${18 * z}px ${44 * z}px 0`}}>
              <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 28 * z, color: '#e5e5e5', marginBottom: 10 * z}}>{r}</div>
              <div style={{display: 'flex', gap: 10 * z}}>
                {tileCol.map((c, i) => <div key={i} style={{width: 196 * z, height: 110 * z, borderRadius: 6, background: `linear-gradient(135deg, ${tileCol[(i + ri * 2) % 7]}, #111)`}} />)}
              </div>
            </div>
          ))}
        </div>
        {mode === 'letters' && <div style={{position: 'absolute', inset: 0, boxShadow: `inset 0 0 0 ${6 * z}px ${C.orange}`, borderRadius: 26 * z, opacity: step(t, 2.2) * 0.9}} />}
      </div>
      {label && <div style={{position: 'absolute', bottom: 50 * z, fontFamily: F.hand, fontWeight: 700, fontSize: 56 * z, color: C.ink, opacity: step(t, 1.4) * exit, transform: 'rotate(-2deg)'}}>{label}</div>}
    </div>
  );
};

// ── Two fonts' letters compared: overlay (Helvetica vs Arial) with the differences circled ──
export const Letters: React.FC<P<{a: string; b: string; aName: string; bName: string; text?: string; circle?: number[]; mode?: 'overlay' | 'side' | 'widths'; caption?: string; source?: string}>> = ({at, dur, box, a, b, aName, bName, text = 'RGta', circle = [], mode = 'overlay', caption, source}) => {
  const {t, exit, enter} = useLife(at, dur, 0.6, 0.45);
  const z = fit(box);
  const sz = (mode === 'widths' ? 120 : 280) * z;
  const slide = mode === 'overlay' ? step(t, 1.0, 1.0) : 0;
  const glyphW = sz * 0.68;
  if (mode === 'widths') {
    const line = 'The quick brown fox jumps';
    return (
      <div style={{...center, ...enterStyle(enter, exit, 'up', 60), gap: 30 * z}}>
        {[[a, aName], [b, bName]].map(([f, n], i) => (
          <div key={i} style={{opacity: step(t, i * 0.6), position: 'relative'}}>
            <div style={{fontFamily: F.mono, fontSize: 22 * z, color: i ? C.orange : C.mute, letterSpacing: 3, marginBottom: 6}}>{n}</div>
            <div style={{fontFamily: fontOf(f), fontSize: sz * 0.62, color: C.ink, whiteSpace: 'nowrap', borderRight: `4px solid ${C.orange}`, paddingRight: 8, display: 'inline-block'}}>{line}</div>
          </div>
        ))}
        <div style={{fontFamily: F.hand, fontWeight: 700, fontSize: 50 * z, color: C.orange, opacity: step(t, 1.6)}}>same width, letter for letter</div>
        {source && <Source text={source} k={step(t, 1.8)} />}
      </div>
    );
  }
  return (
    <div style={{...center, ...enterStyle(enter, exit, 'up', 60)}}>
      <div style={{display: 'flex', gap: 120 * z, marginBottom: 20 * z, opacity: step(t, 0.2)}}>
        <div style={{fontFamily: F.mono, fontSize: 26 * z, color: C.ink, letterSpacing: 3}}>■ {aName}</div>
        <div style={{fontFamily: F.mono, fontSize: 26 * z, color: C.orange, letterSpacing: 3}}>■ {bName}</div>
      </div>
      <div style={{position: 'relative', height: sz * 1.15, width: glyphW * text.length + 40}}>
        <div style={{position: 'absolute', left: 0, top: 0, display: 'flex', fontFamily: fontOf(a), fontSize: sz, color: C.ink, lineHeight: 1, transform: `translateX(${-(1 - slide) * glyphW * 0.6}px)`, opacity: 0.92}}>
          {[...text].map((c, i) => <span key={i} style={{width: glyphW, textAlign: 'center'}}>{c}</span>)}
        </div>
        <div style={{position: 'absolute', left: 0, top: 0, display: 'flex', fontFamily: fontOf(b), fontSize: sz, color: 'transparent', WebkitTextStroke: `${3 * z}px ${C.orange}`, lineHeight: 1, transform: `translateX(${(1 - slide) * glyphW * 0.6}px)`}}>
          {[...text].map((c, i) => <span key={i} style={{width: glyphW, textAlign: 'center'}}>{c}</span>)}
        </div>
        {circle.map((ci, j) => (
          <MarkerCircle key={j} w={glyphW * 1.1} h={sz * 1.12} t={t - 2.2 - j * 0.35} style={{left: ci * glyphW - glyphW * 0.05, top: -sz * 0.02}} />
        ))}
      </div>
      {caption && <div style={{fontFamily: F.hand, fontWeight: 700, fontSize: 52 * z, color: C.ink, marginTop: 24 * z, opacity: step(t, 2.8)}}>{caption}</div>}
      {source && <Source text={source} k={step(t, 3)} style={{marginTop: 14}} />}
    </div>
  );
};

// ── The big fish (Monotype) eats the small fish (font companies), each with its famous font ──
// ── The big fish: an underwater world, Monotype swims and swallows one font company after another (each prey fish
// carries its name in its own typeface); on "Japan" the sea becomes the real map of Japan and the fish swims to Tokyo
// for Fontworks. Readable on mute: who eats whom, and that it keeps getting bigger.
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const FishBody: React.FC<{mouth: number; tail: number; fin: number; color: string; belly: string; name?: string; nameFont?: string; w?: number; eyeR?: number}> = ({mouth, tail, fin, color, belly, name, nameFont, w = 520, eyeR = 16}) => {
  const id = `g${color.replace('#', '')}${belly.replace('#', '')}`;
  const m = mouth;
  return (
    <svg width={w} height={w * 0.6} viewBox="-150 -160 560 320" style={{overflow: 'visible'}}>
      <defs>
        <linearGradient id={id} x1="0" y1="-1" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor={color} /><stop offset="0.62" stopColor={color} /><stop offset="1" stopColor={belly} />
        </linearGradient>
        <radialGradient id={id + 'h'} cx="0.6" cy="0.3" r="0.6"><stop offset="0" stopColor="#fff" stopOpacity="0.35" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
      </defs>
      {/* tail wags from its root */}
      <g transform={`rotate(${tail * 14} 10 0)`}><path d="M 20 0 C -40 -30, -90 -110, -130 -120 C -110 -50, -110 50, -130 120 C -90 110, -40 30, 20 0 Z" fill={color} opacity={0.92} /></g>
      {/* dorsal + belly fins */}
      <path d="M 120 -88 C 160 -160, 240 -150, 270 -96 Z" fill={color} opacity={0.85} />
      <path d="M 150 92 C 180 140, 230 140, 250 96 Z" fill={color} opacity={0.75} />
      {/* body; the mouth opens on the right */}
      <path d={`M 10 0 C 40 -120, 270 -128, 390 ${-16 - 46 * m} L 320 0 L 390 ${16 + 46 * m} C 270 128, 40 120, 10 0 Z`} fill={`url(#${id})`} />
      <path d={`M 10 0 C 40 -120, 270 -128, 390 ${-16 - 46 * m} L 320 0 L 390 ${16 + 46 * m} C 270 128, 40 120, 10 0 Z`} fill={`url(#${id}h)`} />
      {/* scales: a few soft arcs */}
      {[110, 160, 210].map((x, i) => <path key={i} d={`M ${x} -60 Q ${x + 26} 0 ${x} 60`} stroke="#000" strokeOpacity={0.12} strokeWidth={6} fill="none" />)}
      <path d="M 268 -70 Q 300 0 268 70" stroke="#000" strokeOpacity={0.22} strokeWidth={7} fill="none" />
      {/* side fin flaps */}
      <g transform={`rotate(${fin * 18} 230 30)`}><path d="M 230 30 C 200 60, 170 80, 150 70 C 175 50, 200 34, 230 30 Z" fill={belly} opacity={0.9} /></g>
      <circle cx={318} cy={-46} r={eyeR} fill="#fff" /><circle cx={322} cy={-46} r={eyeR * 0.55} fill="#0d0d0d" /><circle cx={326} cy={-51} r={eyeR * 0.18} fill="#fff" />
      {name && <text x={170} y={18} textAnchor="middle" fontFamily={nameFont ?? F.sans} fontWeight={700} fontSize={50} fill="#fff" style={{letterSpacing: -0.5}}>{name}</text>}
    </svg>
  );
};

export const Fish: React.FC<P<{eats: {t: number; name: string; font?: string; year?: string; src?: string}[]; bigLabel?: string; japanAt?: number; logo?: string; map?: string}>> = ({at, dur, box, eats, japanAt, map}) => {
  const {t, exit, enter} = useLife(at, dur, 0.6, 0.45);
  const {fps} = useVideoConfig();
  const z = box.w / 1920;
  const eaten = eats.filter((e) => t >= e.t + 0.7).length;
  // grows with every meal (springy gulp)
  const size = 0.82 + eats.reduce((a, e) => a + 0.1 * interpolate(t, [e.t + 0.55, e.t + 1.1], [0, 1], {...clamp, easing: Easing.out(Easing.back(2.5))}), 0);
  const mouth = Math.max(0, ...eats.map((e) => interpolate(t, [e.t - 0.25, e.t + 0.2, e.t + 0.55], [0, 1, 0], clamp)));
  const jk = japanAt ? step(t, japanAt, 1.2) : 0;
  // the fish cruises; for Japan it moves over to Tokyo (right of centre on the map)
  const fx = interpolate(jk, [0, 1], [700 + Math.sin(t * 0.6) * 40, 760]);
  const fy = interpolate(jk, [0, 1], [560, 600]) + Math.sin(t * 2.1) * 14;
  const sc = size * (1 - 0.32 * jk);
  const mouthX = fx + 175 * sc * 1.15, mouthY = fy;
  const sea = '#062a40';
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', ...enterStyle(enter, exit, 'pop', 0)}}>
      {/* the sea: depth gradient, swaying light rays, rising bubbles, drifting specks */}
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(120% 90% at 50% -10%, #0f5a7a 0%, ${sea} 55%, #020d16 100%)`}} />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{position: 'absolute', top: -200 * z, left: (180 + i * 380 + Math.sin(t * 0.5 + i) * 40) * z, width: 160 * z, height: 1500 * z,
          background: 'linear-gradient(180deg, rgba(160,230,255,0.16), rgba(160,230,255,0))', transform: `rotate(${12 + Math.sin(t * 0.4 + i * 2) * 4}deg)`, filter: `blur(${18 * z}px)`}} />
      ))}
      {Array.from({length: 26}).map((_, i) => {
        const sp = 60 + rnd(i) * 90, y = 1150 - ((t * sp + rnd(i + 9) * 1200) % 1300), r = 4 + rnd(i + 3) * 10;
        return <div key={i} style={{position: 'absolute', left: (rnd(i + 5) * 1920 + Math.sin(t * 2 + i) * 12) * z, top: y * z, width: r * z, height: r * z, borderRadius: '50%', border: `${1.5 * z}px solid rgba(200,240,255,0.45)`, opacity: 1 - jk}} />;
      })}
      {/* Japan: the real map fills the background; Tokyo is pinned where Fontworks waits */}
      {japanAt && jk > 0 && map && (
        <div style={{position: 'absolute', inset: 0, opacity: jk}}>
          <MapBoard t={Math.max(0, (t - japanAt) * fps)} x={{src: map, frames: Math.round((dur - japanAt + 1) * fps), bg: sea, land: '#e9e2d4', accent: C.orange,
            view: [{at: 0, focus: ['JPN'], pad: 0.15}], fills: [{at: Math.round(0.6 * fps), codes: ['JPN'], color: '#f0b49c'}]}} />
          <div style={{position: 'absolute', left: 130 * z, top: 110 * z, fontFamily: F.sans, fontWeight: 700, fontSize: 64 * z, color: C.ink, letterSpacing: -1, opacity: step(t, japanAt + 0.4)}}>Japan</div>
        </div>
      )}
      {/* prey: each one swims in from the right and is swallowed on its word */}
      {eats.map((e, i) => {
        const tokyo = japanAt && e.t > japanAt;
        const arrive = interpolate(t, [e.t - 1.6, e.t - 0.15], [1, 0], {...clamp, easing: EASE});
        const suck = interpolate(t, [e.t - 0.15, e.t + 0.35], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
        if (t < e.t - 1.6 || suck >= 1) return null;
        const restX = mouthX + 190, restY = mouthY + ((i % 3) - 1) * 30;
        const x = interpolate(suck, [0, 1], [restX + arrive * 1000, mouthX - 30]);
        const y = interpolate(suck, [0, 1], [restY + Math.sin(t * 5 + i) * 10, mouthY]);
        return (
          <div key={i} style={{position: 'absolute', left: x * z, top: y * z, transform: `translate(-50%, -50%) scale(${(tokyo ? 0.8 : 1) * (1 - suck * 0.85)}) scaleX(-1)`, opacity: 1 - suck * 0.6}}>
            <FishBody w={340 * z} mouth={0} tail={Math.sin(t * 12 + i)} fin={Math.sin(t * 9 + i)} color={tokyo ? '#c94b4b' : '#6f8fa6'} belly={tokyo ? '#f3d3c3' : '#c9d8e2'} eyeR={20} />
            <div style={{position: 'absolute', left: 0, right: 0, top: '42%', textAlign: 'center', fontFamily: e.font ? fontOf(e.font) : F.sans, fontWeight: 700, fontSize: 40 * z, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.35)', whiteSpace: 'nowrap'}}>{e.name}</div>
          </div>
        );
      })}
      {/* gulp: a puff of bubbles at the mouth */}
      {eats.map((e, i) => {
        const k = interpolate(t, [e.t + 0.3, e.t + 1.3], [0, 1], clamp);
        if (k <= 0 || k >= 1) return null;
        return Array.from({length: 8}).map((_, j) => <div key={`${i}-${j}`} style={{position: 'absolute', left: (mouthX + 20 + Math.cos(j) * 60 * k) * z, top: (mouthY - 40 - k * 160 * (0.6 + rnd(j))) * z, width: (8 + rnd(j + i) * 14) * z, height: (8 + rnd(j + i) * 14) * z, borderRadius: '50%', border: `${2 * z}px solid rgba(220,245,255,${0.8 * (1 - k)})`}} />);
      })}
      {/* Monotype */}
      <div style={{position: 'absolute', left: fx * z, top: fy * z, transform: `translate(-50%, -50%) scale(${sc * 1.15})`, filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.45))'}}>
        <FishBody w={620 * z} mouth={mouth} tail={Math.sin(t * 6)} fin={Math.sin(t * 4)} color={C.orange} belly="#ffb08a" name="Monotype" />
      </div>
      {/* what it has eaten so far: small fish icons with names, lined up at the bottom */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 70 * z, display: 'flex', justifyContent: 'center', gap: 18 * z}}>
        {eats.filter((e) => t >= e.t + 0.7).map((e, i) => {
          const k = step(t, e.t + 0.7, 0.4);
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 8 * z, fontFamily: e.font ? fontOf(e.font) : F.sans, fontWeight: 600, fontSize: 26 * z, color: C.ink,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', padding: `${8 * z}px ${16 * z}px`, borderRadius: 999, opacity: k, transform: `translateY(${(1 - k) * 30}px)`}}>
              <svg width={30 * z} height={18 * z} viewBox="-10 -45 170 90"><path d="M 150 0 C 110 -40, 30 -40, 20 0 C 30 40, 110 40, 150 0 Z M 20 0 L -10 -26 L -10 26 Z" fill={C.orange} /></svg>
              {e.year ? `${e.year} ` : ''}{e.name}
            </div>
          );
        })}
      </div>
      {eaten > 0 && null}
    </div>
  );
};

// ── The Monotype board: cards snap onto one owner (the reveal: owns the original AND the copy) ──
export const Board: React.FC<P<{owner: string; logo?: string; cards: {t: number; title: string; sub?: string; font?: string; hot?: boolean}[]; caption?: {t: number; text: string}}>> = ({at, dur, box, owner, logo, cards, caption}) => {
  const {t, exit, enter} = useLife(at, dur, 0.6, 0.45);
  const z = fit(box);
  return (
    <div style={{...center, ...enterStyle(enter, exit, 'up', 60)}}>
      <div style={{padding: `${18 * z}px ${40 * z}px`, borderRadius: 18, background: C.orange, boxShadow: SH, marginBottom: 60 * z}}>
        {logo ? <Pic s={logo} style={{height: 54 * z, filter: 'brightness(0) invert(1)'}} /> : <span style={{fontFamily: F.sans, fontWeight: 700, fontSize: 54 * z, color: '#fff'}}>{owner}</span>}
      </div>
      <div style={{display: 'flex', gap: 50 * z, position: 'relative'}}>
        {cards.map((c, i) => {
          const s = useSpring(t, c.t, 11);
          return (
            <div key={i} style={{position: 'relative', opacity: Math.min(1, s * 2)}}>
              <svg style={{position: 'absolute', left: '50%', top: -60 * z, overflow: 'visible'}} width={2} height={60 * z}><line x1={0} y1={0} x2={0} y2={60 * z * s} stroke={C.orange} strokeWidth={3} strokeDasharray="6 6" /></svg>
              <div style={{width: 420 * z, padding: `${34 * z}px ${30 * z}px`, borderRadius: 22, ...CARD3D, border: `2px solid ${c.hot ? C.orange : C.line}`, boxShadow: SH, textAlign: 'center',
                transform: `translateY(${(1 - s) * 260}px) rotate(${(1 - s) * (i ? 10 : -10)}deg)`}}>
                <div style={{fontFamily: fontOf(c.font), fontSize: 110 * z, color: C.ink, lineHeight: 1}}>Aa</div>
                <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 40 * z, color: C.ink, marginTop: 14 * z}}>{c.title}</div>
                {c.sub && <div style={{fontFamily: F.mono, fontSize: 22 * z, color: C.mute, marginTop: 8 * z}}>{c.sub}</div>}
              </div>
            </div>
          );
        })}
      </div>
      {caption && <div style={{fontFamily: F.hand, fontWeight: 700, fontSize: 58 * z, color: C.orange, marginTop: 50 * z, opacity: step(t, caption.t), transform: `rotate(-2deg) scale(${0.9 + 0.1 * step(t, caption.t)})`}}>{caption.text}</div>}
    </div>
  );
};

// ── Two columns: protected vs not protected (US law) ──
export const Law: React.FC<P<{left: {title: string; items: string[]}; right: {title: string; items: string[]}; t2?: number; source?: string}>> = ({at, dur, box, left, right, t2 = 2.5, source}) => {
  const {t, exit, enter} = useLife(at, dur, 0.5, 0.45);
  const z = fit(box);
  const col = (c: {title: string; items: string[]}, d: number, ok: boolean) => (
    <div style={{width: 640 * z, padding: `${40 * z}px ${46 * z}px`, borderRadius: 24, ...CARD3D, border: `2px solid ${ok ? C.green : C.orange}`, boxShadow: SH, opacity: step(t, d), transform: `translateY(${(1 - step(t, d)) * 60}px)`}}>
      <div style={{fontFamily: F.mono, fontWeight: 600, fontSize: 24 * z, letterSpacing: 3, color: ok ? C.green : C.orange}}>{ok ? '✓ PROTECTED' : '✕ NOT PROTECTED'}</div>
      <div style={{fontFamily: F.serif, fontWeight: 600, fontSize: 48 * z, color: C.ink, margin: `${10 * z}px 0 ${20 * z}px`}}>{c.title}</div>
      {c.items.map((it, i) => <div key={i} style={{fontFamily: F.sans, fontWeight: 500, fontSize: 36 * z, color: C.ink, padding: `${10 * z}px 0`, borderTop: `1px solid ${C.line}`, opacity: step(t, d + 0.4 + i * 0.3)}}>{it}</div>)}
    </div>
  );
  return (
    <div style={{...center, ...enterStyle(enter, exit, 'up', 50)}}>
      <Kicker text="United States · copyright" k={step(t, 0)} style={{marginBottom: 34 * z, fontSize: 22 * z}} />
      <div style={{display: 'flex', gap: 50 * z, transform: `translateX(${(1 - step(t, t2, 0.7)) * 345 * z}px)`}}>{col(left, 0.3, true)}<div style={{opacity: step(t, t2), transform: `perspective(1400px) rotateY(${(1 - step(t, t2, 0.7)) * -40}deg)`}}>{col(right, t2, false)}</div></div>
      {source && <Source text={source} k={step(t, t2 + 1)} style={{marginTop: 30}} />}
    </div>
  );
};

// ── A deal: Price Tag + a revenue bar for scale ──
export const Deal: React.FC<P<{buyer: string; value: string; inr: string; year: string; revenue?: {t: number; value: string; label: string; ratio: number}; source?: string}>> = ({at, dur, box, buyer, value, inr, year, revenue, source}) => {
  const {t, exit, enter} = useLife(at, dur, 0.5, 0.45);
  const z = fit(box);
  const r = revenue ? step(t, revenue.t, 1.0) : 0;
  return (
    <div style={{...center, ...enterStyle(enter, exit, 'up', 50)}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 30 * z, marginBottom: 50 * z, opacity: step(t, 0)}}>
        <div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 52 * z, color: C.ink}}>{buyer}</div>
        <div style={{fontFamily: F.mono, fontSize: 34 * z, color: C.orange}}>buys →</div>
        <div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 52 * z, color: C.ink}}>Monotype</div>
        <div style={{fontFamily: F.mono, fontSize: 28 * z, color: C.mute}}>· {year}</div>
      </div>
      <PriceTag t={t - 0.7} value={value} sub={inr} scale={z * 1.1} />
      {revenue && (
        <div style={{marginTop: 70 * z, width: 1000 * z, opacity: r}}>
          <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: F.mono, fontSize: 24 * z, color: C.mute, marginBottom: 10}}><span>PRICE PAID</span><span>$825M</span></div>
          <div style={{height: 26 * z, borderRadius: 13, background: C.orange, width: '100%'}} />
          <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: F.mono, fontSize: 24 * z, color: C.mute, margin: `${24 * z}px 0 10px`}}><span>{revenue.label}</span><span style={{color: C.ink}}>{revenue.value}</span></div>
          <div style={{height: 26 * z, borderRadius: 13, background: C.line}}><div style={{height: '100%', borderRadius: 13, background: C.ink, width: `${revenue.ratio * 100 * r}%`}} /></div>
        </div>
      )}
      {source && <Source text={source} k={step(t, 1.4)} style={{marginTop: 34}} />}
    </div>
  );
};

// ── Price jump: old plan → new plan, bars grow, "54×" stamp ──
export const Jump: React.FC<P<{from: {v: string; inr: string}; to: {v: string; inr: string}; t2: number; times: string; t3: number; title?: string; source?: string}>> = ({at, dur, box, from, to, t2, times, t3, title, source}) => {
  const {t, exit, enter} = useLife(at, dur, 0.5, 0.45);
  const z = fit(box);
  const g = step(t, t2, 1.2);
  const st = useSpring(t, t3, 8);
  return (
    <div style={{...center, ...enterStyle(enter, exit, 'up', 50)}}>
      {title && <Kicker text={title} k={step(t, 0)} style={{fontSize: 22 * z, marginBottom: 40 * z}} />}
      <div style={{display: 'flex', alignItems: 'flex-end', gap: 120 * z, height: 560 * z, position: 'relative'}}>
        {[{d: from, h: 0.04, k: step(t, 0.2), lbl: 'BEFORE · per year'}, {d: to, h: g, k: step(t, t2 - 0.2), lbl: 'AFTER · per year'}].map((b, i) => (
          <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: b.k}}>
            <div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 70 * z, color: i ? C.orange : C.ink}}>{b.d.v}</div>
            <div style={{fontFamily: F.mono, fontSize: 26 * z, color: C.mute, marginBottom: 16 * z}}>{b.d.inr}</div>
            <div style={{width: 220 * z, height: Math.max(14, 380 * z * (i ? b.h : 1) * (i ? 1 : 0.04)), borderRadius: '12px 12px 0 0', background: i ? C.orange : C.ink}} />
            <div style={{fontFamily: F.mono, fontSize: 20 * z, color: C.mute, marginTop: 12 * z, letterSpacing: 2}}>{b.lbl}</div>
          </div>
        ))}
        <div style={{position: 'absolute', right: -330 * z, top: 200 * z, fontFamily: F.sans, fontWeight: 700, fontSize: 120 * z, color: '#fff', background: C.red, padding: `${6 * z}px ${30 * z}px`, borderRadius: 16,
          transform: `rotate(-10deg) scale(${2.2 - 1.2 * st})`, opacity: Math.min(1, st * 2), boxShadow: SH}}>{times}</div>
      </div>
      {source && <Source text={source} k={step(t, 1)} style={{marginTop: 30}} />}
    </div>
  );
};

// ── News / article card (headline as a card, with a source and an optional warning label) ──
export const Article: React.FC<P<{outlet: string; date?: string; headline: string; label?: string; hot?: string[]; src?: string}>> = ({at, dur, box, outlet, date, headline, label, hot, src: s}) => {
  const {t, exit, enter} = useLife(at, dur, 0.55, 0.45);
  const z = fit(box);
  return (
    <div style={{...center, ...enterStyle(enter, exit, 'up', 80)}}>
      <div style={{width: box.w * 0.72, ...PAPER3D, borderRadius: 18, padding: `${44 * z}px ${54 * z}px`, transform: `rotate(${-1.2 + 0.4 * Math.sin(t)}deg) scale(${1 + 0.03 * t / dur})`, position: 'relative'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: F.mono, fontSize: 22 * z, color: '#6b645a', letterSpacing: 2, borderBottom: '2px solid #d8d0c3', paddingBottom: 14 * z}}>
          <span style={{fontWeight: 600, color: '#1d1b19'}}>{outlet.toUpperCase()}</span><span>{date}</span>
        </div>
        {s && <Pic s={s} fit="cover" style={{width: '100%', height: 300 * z, borderRadius: 10, marginTop: 24 * z}} />}
        <RiseWords text={headline} t={t - 0.25} hot={hot} style={{fontFamily: F.serif, fontWeight: 600, fontSize: 54 * z, color: '#1d1b19', lineHeight: 1.18, marginTop: 24 * z}} stagger={0.04} />
        {label && <div style={{position: 'absolute', right: -24 * z, bottom: -30 * z, fontFamily: F.mono, fontWeight: 600, fontSize: 24 * z, color: '#fff', background: C.orange, padding: `${10 * z}px ${20 * z}px`, borderRadius: 10, transform: 'rotate(-3deg)', opacity: step(t, 1.2), boxShadow: SH}}>{label}</div>}
      </div>
    </div>
  );
};

// ── Font specimen (fonts we may render: IBM Plex, Noto…), with an optional stamp ──
export const Specimen: React.FC<P<{name: string; font: string; by?: string; year?: string; stamp?: string; stampAt?: number; logo?: string}>> = ({at, dur, box, name, font, by, year, stamp, stampAt = 1.8, logo}) => {
  const {t, exit, enter} = useLife(at, dur, 0.55, 0.45);
  const z = fit(box);
  const st = useSpring(t, stampAt, 8);
  return (
    <div style={{...center, ...enterStyle(enter, exit, 'up', 70)}}>
      <div style={{width: box.w * 0.74, borderRadius: 24, ...PAPER3D, color: '#151413', padding: `${50 * z}px ${64 * z}px`, position: 'relative'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={{fontFamily: F.mono, fontSize: 22 * z, letterSpacing: 3, color: C.orange}}>{(by ?? '').toUpperCase()} {year ? `· ${year}` : ''}</div>
          {logo && <Pic s={logo} style={{height: 44 * z}} />}
        </div>
        <Rise text={name} t={t - 0.2} style={{fontFamily: fontOf(font), fontWeight: 600, fontSize: 150 * z, lineHeight: 1.05, marginTop: 10 * z, letterSpacing: -2}} />
        <div style={{fontFamily: fontOf(font), fontSize: 46 * z, marginTop: 14 * z, opacity: step(t, 0.8), letterSpacing: 1}}>Aa Bb Cc Gg Rr 0123456789</div>
        <div style={{fontFamily: fontOf(font), fontSize: 30 * z, color: '#5b554d', marginTop: 10 * z, opacity: step(t, 1.0)}}>The quick brown fox jumps over the lazy dog.</div>
        {stamp && <div style={{position: 'absolute', right: 60 * z, top: 190 * z, fontFamily: F.sans, fontWeight: 700, fontSize: 96 * z, color: C.orange, border: `8px solid ${C.orange}`, borderRadius: 16, padding: `0 ${26 * z}px`,
          transform: `rotate(-12deg) scale(${2 - st})`, opacity: Math.min(1, st * 2)}}>{stamp}</div>}
      </div>
    </div>
  );
};

// ── Same brand on app, web and print (consistency) ──
export const Trio: React.FC<P<{logo: string; word: string; source?: string}>> = ({at, dur, box, logo, word, source}) => {
  const {t, exit, enter} = useLife(at, dur, 0.55, 0.45);
  const z = fit(box);
  const items = [{lbl: 'APP', w: 260, h: 480, r: 40}, {lbl: 'WEBSITE', w: 560, h: 360, r: 16}, {lbl: 'PRINT', w: 320, h: 430, r: 4}];
  return (
    <div style={{...center, ...enterStyle(enter, exit, 'up', 60)}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 46 * z}}>
        {items.map((it, i) => {
          const seg = dur / 3.4, d0 = 0.2 + i * seg;
          const k = step(t, d0), on = t < d0 + seg || i === 2;
          return (
            <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: k * (on ? 1 : 0.35), transform: `perspective(1400px) translateY(${(1 - k) * 80}px) rotateY(${(1 - k) * 30}deg) scale(${on && t >= d0 ? 1.12 : 0.9})`}}>
              <div style={{width: it.w * z, height: it.h * z, borderRadius: it.r * z, background: '#f6f2ea', boxShadow: SH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 * z, border: i === 0 ? `10px solid #111` : undefined}}>
                <Pic s={logo} style={{height: 60 * z}} />
                <div style={{width: '60%', height: 10 * z, borderRadius: 5, background: '#ddd5c8'}} /><div style={{width: '45%', height: 10 * z, borderRadius: 5, background: '#ddd5c8'}} />
              </div>
              <div style={{fontFamily: F.mono, fontSize: 22 * z, color: C.mute, letterSpacing: 3, marginTop: 18 * z}}>{it.lbl}</div>
            </div>
          );
        })}
      </div>
      <div style={{fontFamily: F.hand, fontWeight: 700, fontSize: 56 * z, color: C.orange, marginTop: 34 * z, opacity: step(t, 1.8)}}>{word}</div>
      {source && <Source text={source} k={step(t, 2)} style={{marginTop: 14}} />}
    </div>
  );
};

// ── A watch face: tiny text in a print font vs a screen font ──
export const Watch: React.FC<P<{a: string; b: string; aName: string; bName: string; source?: string}>> = ({at, dur, box, a, b, aName, bName, source}) => {
  const {t, exit, enter} = useLife(at, dur, 0.55, 0.45);
  const z = fit(box);
  const face = (f: string, n: string, i: number) => {
    const k = step(t, 0.3 + i * 0.6);
    return (
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: k, transform: `translateY(${(1 - k) * 60}px)`}}>
        <div style={{width: 300 * z, height: 360 * z, borderRadius: 80 * z, background: '#050505', border: `14px solid #3a3a3c`, boxShadow: SH, padding: 34 * z, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 * z}}>
          <div style={{fontFamily: fontOf(f), fontSize: 74 * z, color: '#fff', fontWeight: 500}}>10:09</div>
          <div style={{fontFamily: fontOf(f), fontSize: 19 * z, color: C.orange}}>Meeting · 3 min</div>
          <div style={{fontFamily: fontOf(f), fontSize: 15 * z, color: '#ccc', lineHeight: 1.25}}>Illegible 1Il rn m cl d — tiny text on a tiny screen</div>
        </div>
        <div style={{fontFamily: F.mono, fontSize: 24 * z, color: i ? C.orange : C.mute, marginTop: 22 * z, letterSpacing: 2}}>{n}</div>
      </div>
    );
  };
  return (
    <div style={{...center, ...enterStyle(enter, exit, 'up', 50)}}>
      <div style={{display: 'flex', gap: 110 * z}}>{face(a, aName, 0)}{face(b, bName, 1)}</div>
      <div style={{fontFamily: F.hand, fontWeight: 700, fontSize: 52 * z, color: C.ink, marginTop: 34 * z, opacity: step(t, 1.8)}}>drawn for print vs drawn for screens</div>
      {source && <Source text={source} k={step(t, 2)} style={{marginTop: 14}} />}
    </div>
  );
};

// ── Office font menu: the default changes (Calibri → Aptos) ──
export const Menu: React.FC<P<{from: string; to: string; fromFont?: string; years?: string; source?: string}>> = ({at, dur, box, from, to, fromFont, years, source}) => {
  const {t, exit, enter} = useLife(at, dur, 0.55, 0.45);
  const z = fit(box);
  const sw = step(t, 1.6, 0.6);
  return (
    <div style={{...center, ...enterStyle(enter, exit, 'up', 60)}}>
      <div style={{width: 760 * z, borderRadius: 18, background: '#f3f3f3', boxShadow: SH, overflow: 'hidden'}}>
        <div style={{background: '#2b579a', color: '#fff', fontFamily: F.sans, fontWeight: 600, fontSize: 26 * z, padding: `${16 * z}px ${26 * z}px`}}>Document1 — Word</div>
        <div style={{padding: 26 * z, display: 'flex', alignItems: 'center', gap: 16 * z, borderBottom: '1px solid #ddd'}}>
          <div style={{fontFamily: F.sans, fontSize: 22 * z, color: '#555'}}>Default font</div>
          <div style={{flex: 1, height: 64 * z, border: '2px solid #2b579a', borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', padding: `0 ${18 * z}px`, position: 'relative', overflow: 'hidden'}}>
            <div style={{position: 'absolute', fontFamily: fontOf(fromFont), fontSize: 36 * z, color: '#111', transform: `translateY(${-sw * 60}px)`, opacity: 1 - sw, textDecoration: sw > 0.3 ? 'line-through' : undefined}}>{from}</div>
            <div style={{position: 'absolute', fontFamily: F.sans, fontSize: 36 * z, color: '#111', transform: `translateY(${(1 - sw) * 60}px)`, opacity: sw}}>{to}</div>
            <div style={{marginLeft: 'auto', color: '#555'}}>▾</div>
          </div>
        </div>
        <div style={{padding: 30 * z, fontFamily: F.mono, fontSize: 24 * z, color: '#555'}}>{years}</div>
      </div>
      {source && <Source text={source} k={step(t, 1.4)} style={{marginTop: 26}} />}
    </div>
  );
};

// ── Text as an image vs real text a search bar can read ──
export const SearchRead: React.FC<P<{}>> = ({at, dur, box}) => {
  const {t, exit, enter} = useLife(at, dur, 0.55, 0.45);
  const z = fit(box);
  const scan = interpolate(t, [1.2, 3.2], [0, 1], clamp);
  const panel = (img: boolean, i: number) => (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: step(t, 0.2 + i * 0.5)}}>
      <div style={{width: 560 * z, height: 320 * z, borderRadius: 16, ...PAPER3D, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {img ? (
          <div style={{width: '82%', height: '52%', borderRadius: 10, background: 'linear-gradient(135deg,#b23a1e,#e2481b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.serif, fontWeight: 700, fontSize: 54 * z, color: '#fff', filter: 'blur(0.4px)'}}>
            BIG SALE
            <div style={{position: 'absolute', top: 18 * z, left: 18 * z, fontFamily: F.mono, fontSize: 18 * z, color: '#111', background: '#fff', padding: '2px 8px', borderRadius: 4}}>sale.jpg</div>
          </div>
        ) : (
          <div style={{fontFamily: F.serif, fontWeight: 700, fontSize: 64 * z, color: '#1d1b19', background: `linear-gradient(90deg, #ffd9a8 ${scan * 100}%, transparent ${scan * 100}%)`, padding: '0 12px'}}>BIG SALE</div>
        )}
        <div style={{position: 'absolute', top: 0, bottom: 0, left: `${scan * 100}%`, width: 4, background: img ? C.red : C.green, opacity: scan > 0 && scan < 1 ? 1 : 0}} />
      </div>
      <div style={{fontFamily: F.mono, fontSize: 24 * z, marginTop: 20 * z, color: img ? C.red : C.green, opacity: step(t, 3.2)}}>{img ? '✕ Google reads: nothing' : '✓ Google reads: "BIG SALE"'}</div>
      <div style={{fontFamily: F.mono, fontSize: 20 * z, color: C.mute, marginTop: 6}}>{img ? 'TEXT AS AN IMAGE' : 'REAL TEXT + WEB FONT'}</div>
    </div>
  );
  return <div style={{...center, ...enterStyle(enter, exit, 'up', 50), flexDirection: 'row', gap: 70 * z}}>{panel(true, 0)}{panel(false, 1)}</div>;
};

// ── Tofu boxes on a phone → the same text in Indian scripts (Noto) ──
export const Tofu: React.FC<P<{t2: number; source?: string}>> = ({at, dur, box, t2, source}) => {
  const {t, exit, enter} = useLife(at, dur, 0.55, 0.45);
  const z = fit(box);
  const fix = step(t, t2, 0.6);
  const lines = [{f: F.deva, s: 'नमस्ते, कैसे हो?', n: 'Hindi'}, {f: F.tamil, s: 'வணக்கம், எப்படி?', n: 'Tamil'}, {f: F.beng, s: 'নমস্কার, কেমন আছ?', n: 'Bengali'}];
  return (
    <div style={{...center, ...enterStyle(enter, exit, 'up', 60), flexDirection: 'row', gap: 80 * z}}>
      <div style={{width: 400 * z, height: 760 * z, borderRadius: 60 * z, background: '#0d0d0d', border: '12px solid #2a2a2a', boxShadow: SH, padding: `${70 * z}px ${30 * z}px`, display: 'flex', flexDirection: 'column', gap: 22 * z}}>
        {lines.map((l, i) => (
          <div key={i} style={{alignSelf: i % 2 ? 'flex-end' : 'flex-start', background: i % 2 ? C.orange : '#2a2a2a', color: '#fff', borderRadius: 22, padding: `${16 * z}px ${22 * z}px`, maxWidth: '88%', position: 'relative', minHeight: 50 * z}}>
            <div style={{fontFamily: F.mono, fontSize: 34 * z, letterSpacing: 4, opacity: 1 - fix, position: fix > 0.5 ? 'absolute' : 'relative'}}>□□□□ □□□</div>
            <div style={{fontFamily: l.f, fontSize: 34 * z, opacity: fix, display: fix > 0.5 ? 'block' : 'none'}}>{l.s}</div>
            <div style={{fontFamily: F.mono, fontSize: 16 * z, opacity: 0.7 * fix, marginTop: 4}}>{l.n}</div>
          </div>
        ))}
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 24 * z, maxWidth: 700 * z}}>
        <div style={{fontFamily: F.serif, fontWeight: 600, fontSize: 92 * z, color: C.ink, opacity: step(t, 0.4)}}>
          no <span style={{color: C.orange}}>to</span>fu → <span style={{color: C.orange}}>No</span>to
        </div>
        <div style={{fontFamily: F.sans, fontSize: 36 * z, color: C.mute, opacity: step(t, 1)}}>□ = “tofu”: the empty box your phone shows when it has no letters for a language</div>
        <div style={{fontFamily: F.mono, fontSize: 30 * z, color: C.ink, opacity: step(t, t2 + 0.6)}}><span style={{color: C.orange}}>800+</span> languages · Google × Monotype</div>
        {source && <Source text={source} k={step(t, t2 + 1)} />}
      </div>
    </div>
  );
};

// ── Catalogue covers in two fonts (IKEA Futura → Verdana) ──
export const Covers: React.FC<P<{logo?: string; a: {font: string; name: string; year: string}; b: {font: string; name: string; year: string}; label?: string; source?: string}>> = ({at, dur, box, logo, a, b, label, source}) => {
  const {t, exit, enter} = useLife(at, dur, 0.55, 0.45);
  const z = fit(box);
  const cover = (c: typeof a, i: number) => {
    const k = step(t, 0.3 + i * 0.9);
    return (
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: k, transform: `translateY(${(1 - k) * 70}px) rotate(${i ? 3 : -3}deg)`}}>
        <div style={{width: 420 * z, height: 560 * z, background: '#f7f3ea', borderRadius: 6, boxShadow: SH, padding: 34 * z, display: 'flex', flexDirection: 'column'}}>
          {logo && <Pic s={logo} style={{height: 40 * z, alignSelf: 'flex-start'}} />}
          <div style={{flex: 1, margin: `${20 * z}px 0`, borderRadius: 4, background: 'linear-gradient(160deg,#c9b99a,#8e7d62)'}} />
          <div style={{fontFamily: fontOf(c.font), fontWeight: 700, fontSize: 58 * z, color: '#1b1a18', lineHeight: 1}}>Home made</div>
          <div style={{fontFamily: fontOf(c.font), fontSize: 28 * z, color: '#333', marginTop: 8 * z}}>Catalogue {c.year}</div>
        </div>
        <div style={{fontFamily: F.mono, fontSize: 24 * z, color: i ? C.orange : C.mute, marginTop: 20 * z, letterSpacing: 2}}>{c.name} · {c.year}</div>
      </div>
    );
  };
  return (
    <div style={{...center, ...enterStyle(enter, exit, 'up', 50)}}>
      <div style={{display: 'flex', gap: 120 * z, alignItems: 'center'}}>{cover(a, 0)}<div style={{fontFamily: F.mono, fontSize: 60 * z, color: C.orange, opacity: step(t, 1)}}>→</div>{cover(b, 1)}</div>
      {label && <div style={{fontFamily: F.hand, fontWeight: 700, fontSize: 52 * z, color: C.ink, marginTop: 26 * z, opacity: step(t, 2)}}>{label}</div>}
      {source && <Source text={source} k={step(t, 2.2)} style={{marginTop: 10}} />}
    </div>
  );
};

// ── Two official documents side by side (font A → font B), with a claim label ──
export const Docs: React.FC<P<{a: {font: string; name: string; year: string}; b: {font: string; name: string; year: string}; t2: number; claim?: string; claimAt?: number; source?: string}>> = ({at, dur, box, a, b, t2, claim, claimAt = 3, source}) => {
  const {t, exit, enter} = useLife(at, dur, 0.55, 0.45);
  const z = fit(box);
  const doc = (c: typeof a, d: number, i: number) => {
    const k = step(t, d);
    return (
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: k, transform: `translateY(${(1 - k) * 80}px) rotate(${i ? 2 : -2}deg)`}}>
        <div style={{width: 470 * z, height: 600 * z, background: '#fbfaf6', borderRadius: 6, boxShadow: SH, padding: `${44 * z}px ${40 * z}px`, color: '#1b1a18'}}>
          <div style={{fontFamily: fontOf(c.font), fontWeight: 700, fontSize: 30 * z, textAlign: 'center', letterSpacing: 1}}>UNITED STATES DEPARTMENT OF STATE</div>
          <div style={{height: 2, background: '#333', margin: `${14 * z}px 0 ${22 * z}px`}} />
          <div style={{fontFamily: fontOf(c.font), fontSize: 26 * z, lineHeight: 1.45}}>MEMORANDUM<br />SUBJECT: Official correspondence<br /><br />This document is set in {c.name}. Every official page, letter and memo follows this style.</div>
        </div>
        <div style={{fontFamily: F.mono, fontSize: 24 * z, color: i ? C.orange : C.mute, marginTop: 20 * z, letterSpacing: 2}}>{c.name} · {c.year}</div>
      </div>
    );
  };
  return (
    <div style={{...center, ...enterStyle(enter, exit, 'up', 50)}}>
      <div style={{display: 'flex', gap: 90 * z}}>{doc(a, 0.3, 0)}{doc(b, t2, 1)}</div>
      {claim && <div style={{marginTop: 34 * z, fontFamily: F.mono, fontWeight: 600, fontSize: 30 * z, color: C.ink, background: C.card, border: `2px solid ${C.orange}`, borderRadius: 12, padding: `${12 * z}px ${24 * z}px`, opacity: step(t, claimAt)}}>{claim}</div>}
      {source && <Source text={source} k={step(t, claimAt + 0.5)} style={{marginTop: 16}} />}
    </div>
  );
};

// ── A blank document with a blinking cursor (setup for the Arial reveal) ──
export const BlankDoc: React.FC<P<{font?: string; typed?: string; typeAt?: number}>> = ({at, dur, box, font = 'arial', typed = 'Arial', typeAt = 1}) => {
  const {t, exit, enter} = useLife(at, dur, 0.55, 0.45);
  const z = fit(box);
  const n = Math.floor(Math.max(0, (t - typeAt) * 9));
  return (
    <div style={{...center, ...enterStyle(enter, exit, 'up', 60)}}>
      <div style={{width: 900 * z, height: 620 * z, borderRadius: 14, background: '#fff', boxShadow: SH, overflow: 'hidden'}}>
        <div style={{background: '#2b579a', height: 56 * z, display: 'flex', alignItems: 'center', padding: `0 ${22 * z}px`, fontFamily: F.sans, color: '#fff', fontSize: 22 * z}}>Document1 — Word</div>
        <div style={{height: 54 * z, background: '#f3f3f3', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: 14, padding: `0 ${22 * z}px`}}>
          <div style={{border: '1px solid #bbb', background: '#fff', fontFamily: fontOf(font), fontSize: 22 * z, padding: '4px 14px', borderRadius: 4, width: 220 * z}}>{typed.slice(0, n) || ' '}</div>
          <div style={{border: '1px solid #bbb', background: '#fff', fontFamily: F.sans, fontSize: 22 * z, padding: '4px 10px', borderRadius: 4}}>12</div>
        </div>
        <div style={{padding: 60 * z, fontFamily: fontOf(font), fontSize: 34 * z, color: '#111'}}>
          <span style={{borderLeft: `3px solid #111`, opacity: Math.floor(t * 2) % 2 ? 0 : 1}}>&nbsp;</span>
        </div>
      </div>
    </div>
  );
};

// ── 4-shot teaser grid (the journey promise) ──
export const Teaser: React.FC<P<{items: {t: number; title: string; sub?: string; src?: string; font?: string; art?: string; artFont?: string}[]}>> = ({at, dur, box, items}) => {
  const {t, exit} = useLife(at, dur, 0.3, 0.4);
  const z = box.w / 1920;
  const active = items.filter((i) => t >= i.t).length - 1;
  return (
    <div style={{position: 'absolute', inset: 60 * z, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 26 * z, opacity: exit}}>
      {items.map((it, i) => {
        const s = useSpring(t, it.t, 12);
        const on = i === active;
        return (
          <div key={i} style={{borderRadius: 24, background: on ? C.card : '#1f1d1b', border: `2px solid ${on ? C.orange : C.line}`, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 34 * z,
            opacity: Math.min(1, s * 2) * (on ? 1 : 0.55), transform: `scale(${(0.8 + 0.2 * s) * (on ? 1.02 : 0.98)})`, boxShadow: on ? SH : undefined}}>
            {it.src && <Pic s={it.src} fit="cover" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.55}} />}
            {it.art && <div style={{position: 'absolute', right: 40 * z, top: 10 * z, fontFamily: fontOf(it.artFont), fontWeight: 600, fontSize: 230 * z, color: on ? C.orange : C.line, lineHeight: 1, transform: `translateY(${(1 - s) * 40}px)`}}>{it.art}</div>}
            <div style={{position: 'relative', fontFamily: F.mono, fontSize: 22 * z, color: C.orange, letterSpacing: 3}}>0{i + 1}</div>
            <div style={{position: 'relative', fontFamily: fontOf(it.font ?? 'serif'), fontWeight: 600, fontSize: 56 * z, color: C.ink, lineHeight: 1.1}}>{it.title}</div>
            {it.sub && <div style={{position: 'relative', fontFamily: F.sans, fontSize: 28 * z, color: C.mute, marginTop: 6}}>{it.sub}</div>}
          </div>
        );
      })}
    </div>
  );
};

// ── Home screen of app wordmarks (comment question) ──
export const Apps: React.FC<P<{items: {src: string; name: string}[]; question: string}>> = ({at, dur, box, items, question}) => {
  const {t, exit, enter} = useLife(at, dur, 0.55, 0.45);
  const z = fit(box);
  const hl = Math.floor(Math.max(0, t - 1) / 0.7) % items.length;
  return (
    <div style={{...center, ...enterStyle(enter, exit, 'up', 60)}}>
      <div style={{width: 470 * z, height: 820 * z, borderRadius: 64 * z, background: 'linear-gradient(180deg,#2b2622,#141210)', border: '12px solid #2a2a2a', boxShadow: SH, padding: `${80 * z}px ${36 * z}px`, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 26 * z, alignContent: 'start'}}>
        {items.map((it, i) => (
          <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: step(t, 0.2 + i * 0.08)}}>
            <div style={{width: 104 * z, height: 104 * z, borderRadius: 24 * z, background: '#f4f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: i === hl && t > 1 ? `0 0 0 5px ${C.orange}` : undefined, transform: `scale(${i === hl && t > 1 ? 1.08 : 1})`}}>
              <Pic s={it.src} style={{maxWidth: 80 * z, maxHeight: 50 * z}} />
            </div>
            <div style={{fontFamily: F.sans, fontSize: 18 * z, color: '#ddd'}}>{it.name}</div>
          </div>
        ))}
      </div>
      <div style={{fontFamily: F.hand, fontWeight: 700, fontSize: 54 * z, color: C.ink, marginTop: 26 * z, opacity: step(t, 0.8)}}>{question}</div>
    </div>
  );
};

// ── Subscribe moment (reusable, every video): the button flies in, a cursor glides over, clicks, it turns into
// SUBSCRIBED, the bell rings. Timed to his "subscribe". ──
export const Subscribe: React.FC<P<{channel?: string; logo?: string; cd?: string}>> = ({at, dur, box, channel = 'Cdesh', cd}) => {
  const {t, exit, enter} = useLife(at, dur, 0.5, 0.35);
  const z = fit(box) * 1.22;
  const click = 1.3, bell = 1.9;
  const press = interpolate(t, [click - 0.08, click, click + 0.15], [1, 0.9, 1], clamp);
  const done = t >= click;
  const cx = interpolate(t, [0.3, click - 0.05], [360, 150], {...clamp, easing: EASE}), cy = interpolate(t, [0.3, click - 0.05], [260, 30], {...clamp, easing: EASE});
  const ring = t > bell ? Math.sin((t - bell) * 26) * 22 * Math.exp(-(t - bell) * 3) : 0;
  return (
    <div style={{...center, ...enterStyle(enter, exit, 'up', 90)}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 28 * z, padding: `${28 * z}px ${36 * z}px`, borderRadius: 30 * z, ...CARD3D, position: 'relative'}}>
        {cd ? <img src={srcOf(cd)} style={{width: 110 * z * 2.4, height: 110 * z * 2.4, margin: -110 * z * 0.7, objectFit: 'contain'}} /> : <div style={{width: 110 * z, height: 110 * z, borderRadius: 99, background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.serif, fontWeight: 800, fontSize: 52 * z, color: '#fff'}}>Cd</div>}
        <div>
          <div style={{fontFamily: F.serif, fontWeight: 700, fontSize: 46 * z, color: C.ink}}>{channel}</div>
          <div style={{fontFamily: F.sans, fontSize: 24 * z, color: C.mute}}>Designomics · every design has a price</div>
        </div>
        <div style={{marginLeft: 20 * z, padding: `${18 * z}px ${36 * z}px`, borderRadius: 999, background: done ? '#3a3835' : '#f1f1f1', color: done ? '#cfcac2' : '#0f0f0f', fontFamily: F.sans, fontWeight: 700, fontSize: 30 * z, transform: `scale(${press})`, transition: 'none'}}>
          {done ? 'Subscribed' : 'Subscribe'}
        </div>
        <div style={{fontSize: 46 * z, transform: `rotate(${ring}deg)`, transformOrigin: '50% 10%', opacity: step(t, click + 0.1), color: C.ink}}>🔔</div>
        <svg width={44 * z} height={44 * z} viewBox="0 0 24 24" style={{position: 'absolute', right: cx * z, top: cy * z + 60 * z, opacity: step(t, 0.3) * (1 - step(t, bell + 0.4)), filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'}}>
          <path d="M3 2 L3 20 L8 15 L11.5 22 L14.5 20.5 L11 14 L18 14 Z" fill="#fff" stroke="#111" strokeWidth={1.2} />
        </svg>
      </div>
    </div>
  );
};

// ── Thanks for watching (reusable last screen): the Cd tile lands, the line writes on, a hard cut ends it ──
export const End: React.FC<P<{line?: string; cd?: string}>> = ({at, dur, line = 'Thanks for watching.', cd}) => {
  const {t} = useLife(at, dur + 10, 0.5, 0.1);
  const s = useSpring(t, 0, 11);
  return (
    <div style={center}>
      {cd ? <img src={srcOf(cd)} style={{width: 200 * 2.4, height: 200 * 2.4, margin: -200 * 0.7, objectFit: 'contain', transform: `perspective(1200px) rotateY(${(1 - s) * 90}deg) scale(${s})`, filter: 'drop-shadow(0 18px 30px rgba(0,0,0,0.45))'}} /> : (
      <div style={{width: 200, height: 200, borderRadius: 44, background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `perspective(1200px) rotateY(${(1 - s) * 90}deg) scale(${s})`, boxShadow: SH}}>
        <span style={{fontFamily: F.serif, fontWeight: 800, fontSize: 108, color: '#fff'}}>Cd</span>
      </div>
      )}
      <Rise text={line} t={t - 0.3} style={{fontFamily: F.serif, fontWeight: 700, fontSize: 132, color: C.ink, marginTop: 40, letterSpacing: -3}} />
      <div style={{fontFamily: F.sans, fontWeight: 500, fontSize: 40, color: C.mute, marginTop: 20, opacity: step(t, 0.9)}}>See you in the next one.</div>
    </div>
  );
};

// ── Words on screen next to him while he talks (hero line, notes) ──
export const Note: React.FC<P<{text: string; sub?: string; hot?: string[]; side?: 'left' | 'right'; y?: number; size?: number; font?: string; underline?: boolean}>> = ({at, dur, box, text, sub, hot, side = 'right', y = 0.5, size = 76, font, underline}) => {
  const {t, exit, enter} = useLife(at, dur, 0.5, 0.4);
  const z = Math.max(0.8, fit(box));
  return (
    <>
    {/* soft charcoal scrim on the note's side so text reads on a bright wall */}
    <div style={{position: 'absolute', top: 0, bottom: 0, [side]: 0, width: box.w * 0.55, opacity: Math.min(enter, exit),
      background: `linear-gradient(${side === 'left' ? 90 : 270}deg, rgba(16,13,14,0.82) 0%, rgba(16,13,14,0.55) 55%, rgba(16,13,14,0) 100%)`}} />
    <div style={{position: 'absolute', [side]: box.w * 0.06, top: box.h * y, transform: 'translateY(-50%)', maxWidth: box.w * 0.4, textAlign: side === 'right' ? 'right' : 'left', ...enterStyle(enter, exit, side, 60)}}>
      <div style={{position: 'relative', display: 'inline-block'}}>
        <RiseWords text={text} t={t} hot={hot} style={{fontFamily: fontOf(font ?? 'serif'), fontWeight: 600, fontSize: size * z, color: C.ink, lineHeight: 1.08, textShadow: '0 4px 30px rgba(0,0,0,0.6)'}} />
        {underline && <Underline w={box.w * 0.36} t={t - 0.6} />}
      </div>
      {sub && <div style={{fontFamily: F.hand, fontWeight: 700, fontSize: 40 * z, color: C.orange2, marginTop: 12, opacity: step(t, 0.5)}}>{sub}</div>}
    </div>
    </>
  );
};


// ── Real footage (news / archive / stock clip): full bleed, a slow push, a light shared treatment so clips from
// different sources sit together; only a small credit bottom-right (his voice already tells what it is) ──
// vol = the clip's own sound, kept low under his voice (his ask 2026-10-21: the clips felt empty without it)
export const Clip: React.FC<P<{src: string; from?: number; full?: boolean; source?: string; zoom?: number; drift?: 'in' | 'out' | 'left' | 'right'; vol?: number}>> = ({at, dur, box, src: s, from = 0, full = true, source, zoom = 1.1, drift = 'in', vol = 0.12}) => {
  const {t, exit, enter} = useLife(at, dur, full ? 0.04 : 0.5, full ? 0.04 : 0.3); // full-frame clips = hard cuts
  const p = Math.min(1, Math.max(0, t) / Math.max(1, dur));
  const sc = drift === 'out' ? zoom - (zoom - 1.03) * p : 1.03 + (zoom - 1.03) * p;
  const dx = drift === 'left' ? -40 * p : drift === 'right' ? 40 * p : 0;
  const vid = <OffthreadVideo src={srcOf(s)} muted={vol === 0} volume={(f) => vol * Math.min(1, f / 6) * exit} startFrom={Math.round(from * 30)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `translateX(${dx}px) scale(${drift === 'left' || drift === 'right' ? 1.08 : sc})`, filter: 'contrast(1.06) saturate(0.9)'}} />;
  const credit = source && <div style={{position: 'absolute', right: 34, bottom: 26, fontFamily: F.sans, fontWeight: 500, fontSize: 16, color: 'rgba(255,255,255,0.72)', textShadow: '0 1px 6px rgba(0,0,0,0.6)', opacity: step(t, 0.3) * exit}}>{source}</div>;
  if (full) return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
      {vid}
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(130% 100% at 50% 45%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.32) 100%)'}} />
      {credit}
    </div>
  );
  return (
    <div style={{...center, ...enterStyle(enter, exit, 'up', 80)}}>
      <div style={{position: 'relative', width: box.w * 0.8, height: box.w * 0.8 * 9 / 16, borderRadius: 18, overflow: 'hidden', boxShadow: SH}}>{vid}{credit}</div>
    </div>
  );
};

// ══════ Visual-first scenes (his v3 verdict: the story must read on MUTE, through pictures, not sentences) ══════

// One screen showing the letters → it multiplies into a wall of screens, then a sea of them (Arial "on billions")
const Laptop: React.FC<{w: number; font: string; text: string; glow?: number}> = ({w, font, text, glow = 0}) => (
  <div style={{width: w, position: 'relative'}}>
    <div style={{width: w, height: w * 0.62, borderRadius: w * 0.04, background: '#0e0e10', border: `${Math.max(1, w * 0.018)}px solid #3a3a3e`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: glow ? `0 0 ${w * 0.3 * glow}px rgba(226,72,27,${0.5 * glow})` : undefined}}>
      <div style={{width: '88%', height: '84%', borderRadius: w * 0.015, background: '#f4f1ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font, fontSize: w * 0.24, color: '#111'}}>{text}</div>
    </div>
    <div style={{width: w * 1.16, marginLeft: -w * 0.08, height: w * 0.05, borderRadius: `0 0 ${w * 0.04}px ${w * 0.04}px`, background: 'linear-gradient(#55555a, #2b2b2e)'}} />
  </div>
);
export const Multiply: React.FC<P<{font?: string; text?: string; t2?: number; t3?: number}>> = ({at, dur, box, font = 'arial', text = 'Aa', t2 = 1.0, t3 = 2.2}) => {
  const {t, exit, enter} = useLife(at, dur, 0.5, 0.4);
  const z = box.w / 1920;
  const ff = fontOf(font);
  const k2 = step(t, t2, 0.9), k3 = step(t, t3, 1.2);
  const hero = 620 * (1 - k2 * 0.82);
  const cols = 13, rows = 7, cw = 1920 / cols;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', ...enterStyle(enter, exit, 'pop', 0)}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${1 - k3 * 0.62})`, transformOrigin: '50% 50%'}}>
        {Array.from({length: rows * 3}).map((_, r) => Array.from({length: cols * 3}).map((__, c) => {
          const cc = c - cols, rr = r - rows; // a 3×3 block of walls: the centre wall first, the rest on k3
          const inner = cc >= 0 && cc < cols && rr >= 0 && rr < rows;
          const d = Math.hypot(cc + 0.5 - cols / 2, (rr + 0.5 - rows / 2) * 1.6);
          const k = inner ? step(t, t2 + 0.15 + d * 0.035, 0.4) : step(t, t3 + 0.1 + d * 0.012, 0.35);
          if (k <= 0 || (cc === Math.floor(cols / 2) && rr === Math.floor(rows / 2))) return null;
          return (
            <div key={`${r}-${c}`} style={{position: 'absolute', left: (960 + (cc - cols / 2) * cw + cw * 0.12) * z, top: (540 + (rr - rows / 2) * 152 + 20) * z, opacity: k, transform: `scale(${0.6 + 0.4 * k})`}}>
              <Laptop w={cw * 0.76 * z} font={ff} text={text} />
            </div>
          );
        }))}
      </div>
      <div style={{position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%, -50%) scale(${1 - k3 * 0.62})`}}>
        <Laptop w={Math.max(cw * 0.76, hero) * z} font={ff} text={text} glow={1 - k2} />
      </div>
    </div>
  );
};

// Many brands, the SAME letters: wordmarks set in one font, flipping in, then pulsing together (a rented font = everyone's font)
export const Same: React.FC<P<{names: string[]; font?: string; hot?: string}>> = ({at, dur, box, names, font = 'gothamLike', hot}) => {
  const {t, exit, enter} = useLife(at, dur, 0.5, 0.4);
  const z = box.w / 1920;
  const cols = 4;
  const pulse = t > 0.25 * names.length + 0.6 ? 1 + 0.04 * Math.max(0, Math.sin((t - 0.25 * names.length) * 6)) : 1;
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: 1600, ...enterStyle(enter, exit, 'up', 50)}}>
      <div style={{display: 'grid', gridTemplateColumns: `repeat(${cols}, ${380 * z}px)`, gap: 26 * z}}>
        {names.map((n, i) => {
          const k = step(t, 0.15 + i * 0.22, 0.45);
          const isHot = n === hot;
          return (
            <div key={n} style={{height: 170 * z, borderRadius: 18 * z, background: isHot ? C.orange : '#f2ece2', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: fontOf(font), fontWeight: 700, fontSize: 52 * z, color: isHot ? '#fff' : '#161514', letterSpacing: 1, textTransform: 'uppercase',
              transform: `rotateX(${(1 - k) * 80}deg) scale(${isHot ? pulse * 1.04 : pulse})`, opacity: k, boxShadow: SH}}>{n}</div>
          );
        })}
      </div>
    </div>
  );
};

// A break-up: brand and font tied by a line; the line snaps, the brand slides away, the font is left behind
export const Breakup: React.FC<P<{logo: string; font?: string; fontName: string; t2?: number}>> = ({at, dur, box, logo, font = 'gothamLike', fontName, t2 = 0.9}) => {
  const {t, exit, enter} = useLife(at, dur, 0.5, 0.4);
  const z = box.w / 1920;
  const snap = step(t, t2, 0.25), away = step(t, t2 + 0.15, 1.1);
  const card = (x: number, children: React.ReactNode, o = 1, rot = 0, drop = 0) => (
    <div style={{position: 'absolute', left: x * z, top: (540 + drop) * z, width: 520 * z, height: 360 * z, transform: `translate(-50%, -50%) rotate(${rot}deg)`, opacity: o,
      borderRadius: 26 * z, background: '#f2ece2', boxShadow: SH, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>{children}</div>
  );
  const lx1 = 960 - 330 + 120, lx2 = 960 + 330 - 120;
  return (
    <div style={{position: 'absolute', inset: 0, ...enterStyle(enter, exit, 'up', 50)}}>
      <svg width={box.w} height={box.h} style={{position: 'absolute', inset: 0}} viewBox="0 0 1920 1080">
        {/* the tie: whole, then two halves falling away */}
        <path d={`M ${lx1} 540 L ${960 - snap * 20} ${540 + snap * 60}`} stroke={C.orange} strokeWidth={10} strokeLinecap="round" opacity={1 - away} />
        <path d={`M ${960 + snap * 20} ${540 + snap * 60} L ${lx2} 540`} stroke={C.orange} strokeWidth={10} strokeLinecap="round" opacity={1 - away} />
        {snap > 0 && snap < 1 && <circle cx={960} cy={540} r={20 + snap * 90} fill="none" stroke="#fff" strokeOpacity={1 - snap} strokeWidth={6} />}
      </svg>
      {card(630 - away * 900, <Pic s={logo} style={{width: 360 * z}} />, 1, -away * 8)}
      {card(1290, <><div style={{fontFamily: fontOf(font), fontWeight: 700, fontSize: 170 * z, color: '#161514', lineHeight: 1}}>Aa</div>
        <div style={{fontFamily: fontOf(font), fontWeight: 600, fontSize: 40 * z, color: '#161514', marginTop: 10 * z}}>{fontName}</div></>, 1 - away * 0.55, away * 4, away * 40)}
    </div>
  );
};

// Two fonts collide: huge letters slam in from both sides, meet in a shockwave, names settle under them
export const Versus: React.FC<P<{a: {font: string; name: string}; b: {font: string; name: string}; logo?: string}>> = ({at, dur, box, a, b, logo}) => {
  const {t, exit, enter} = useLife(at, dur, 0.3, 0.4);
  const z = box.w / 1920;
  const hit = 0.45;
  const k = interpolate(t, [0, hit], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const shake = t > hit && t < hit + 0.35 ? Math.sin(t * 90) * 14 * (1 - (t - hit) / 0.35) : 0;
  const ring = step(t, hit, 0.6);
  const lab = step(t, hit + 0.3);
  const L1 = (x: number, f: string, col: string) => <div style={{position: 'absolute', left: x * z, top: 470 * z, transform: 'translate(-50%, -50%)', fontFamily: fontOf(f), fontSize: 420 * z, color: col, lineHeight: 1}}>Aa</div>;
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translateX(${shake * z}px)`, ...enterStyle(enter, exit, 'pop', 0)}}>
      {L1(-300 + k * 960, a.font, C.ink)}
      {L1(2220 - k * 960, b.font, C.orange)}
      <div style={{position: 'absolute', left: 960 * z, top: 470 * z, width: 40 * z, height: 40 * z, transform: `translate(-50%, -50%) scale(${1 + ring * 30})`, borderRadius: '50%', border: `${3 * z}px solid #fff`, opacity: ring > 0 ? 1 - ring : 0}} />
      <div style={{position: 'absolute', left: 960 * z, top: 470 * z, width: 8 * z, height: 520 * z, transform: 'translate(-50%, -50%)', background: '#fff', opacity: t > hit ? 0.9 * (1 - step(t, hit, 0.3)) : 0, filter: `blur(${6 * z}px)`}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 760 * z, display: 'flex', justifyContent: 'space-around', opacity: lab, transform: `translateY(${(1 - lab) * 20}px)`, fontFamily: F.sans, fontWeight: 600, fontSize: 40 * z, color: C.mute}}>
        <span>{a.name}</span>{logo ? <Pic s={logo} style={{height: 90 * z}} /> : null}<span>{b.name}</span>
      </div>
    </div>
  );
};

// A road that splits in two: one line draws up from the bottom, forks, and each branch ends in an icon (two ways out)
const Icon: React.FC<{kind: string; s: number}> = ({kind, s}) => kind === 'pen' ? (
  <svg width={s} height={s} viewBox="0 0 100 100"><path d="M 50 8 L 78 46 L 62 92 L 38 92 L 22 46 Z" fill="#161514" /><circle cx={50} cy={52} r={7} fill="#f2ece2" /><path d="M 50 8 L 50 45" stroke="#f2ece2" strokeWidth={4} /></svg>
) : (
  <svg width={s} height={s} viewBox="0 0 100 100"><rect x={18} y={44} width={64} height={48} rx={8} fill="#161514" /><path d="M 34 44 L 34 30 C 34 8, 66 8, 66 26" stroke="#161514" strokeWidth={9} fill="none" strokeLinecap="round" /><circle cx={50} cy={66} r={7} fill="#f2ece2" /></svg>
);
export const Fork: React.FC<P<{a: {icon: string; t: number}; b: {icon: string; t: number}}>> = ({at, dur, box, a, b}) => {
  const {t, exit, enter} = useLife(at, dur, 0.3, 0.4);
  const z = box.w / 1920;
  const k0 = step(t, 0, 0.6), ka = step(t, a.t, 0.7), kb = step(t, b.t, 0.7);
  const L0 = 300, LB = 900;
  return (
    <div style={{position: 'absolute', inset: 0, ...enterStyle(enter, exit, 'up', 40)}}>
      <svg width={box.w} height={box.h} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
        <path d="M 960 1080 L 960 700" stroke={C.ink} strokeWidth={14} strokeLinecap="round" strokeDasharray={L0} strokeDashoffset={L0 * (1 - k0)} fill="none" />
        <path d="M 960 700 C 960 520, 560 520, 520 330" stroke={C.orange} strokeWidth={14} strokeLinecap="round" strokeDasharray={LB} strokeDashoffset={LB * (1 - ka)} fill="none" />
        <path d="M 960 700 C 960 520, 1360 520, 1400 330" stroke={C.orange} strokeWidth={14} strokeLinecap="round" strokeDasharray={LB} strokeDashoffset={LB * (1 - kb)} fill="none" />
      </svg>
      {[[520, ka, a.icon, '1'], [1400, kb, b.icon, '2']].map(([x, k, ic, n]) => (
        <div key={String(n)} style={{position: 'absolute', left: (x as number) * z, top: 250 * z, transform: `translate(-50%, -50%) scale(${0.4 + 0.6 * Math.min(1, (k as number) * 1.4)})`, opacity: k as number,
          width: 220 * z, height: 220 * z, borderRadius: '50%', background: '#f2ece2', boxShadow: SH, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <Icon kind={ic as string} s={110 * z} />
          <div style={{position: 'absolute', top: -14 * z, right: -14 * z, width: 70 * z, height: 70 * z, borderRadius: '50%', background: C.orange, color: '#fff', fontFamily: F.serif, fontWeight: 800, fontSize: 40 * z, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{n as string}</div>
        </div>
      ))}
    </div>
  );
};

// A flip clock rolls to the year (cold open "back in 2018"), with the brand above it
export const Year: React.FC<P<{from: number; to: number; logo?: string}>> = ({at, dur, box, from, to, logo}) => {
  const {t, exit, enter} = useLife(at, dur, 0.4, 0.4);
  const z = box.w / 1920;
  const n = Math.round(interpolate(t, [0.2, 1.1], [from, to], {...clamp, easing: EASE}));
  const flip = (t * 8) % 1;
  const rolling = t > 0.2 && t < 1.1;
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40 * z, perspective: 1400, ...enterStyle(enter, exit, 'pop', 0)}}>
      {logo && <Pic s={logo} style={{height: 110 * z, opacity: step(t, 0.9)}} />}
      <div style={{display: 'flex', gap: 18 * z}}>
        {String(n).split('').map((d, i) => (
          <div key={i} style={{width: 210 * z, height: 290 * z, borderRadius: 22 * z, background: 'linear-gradient(#2e2c29 50%, #262422 50%)', boxShadow: SH, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
            fontFamily: F.serif, fontWeight: 800, fontSize: 230 * z, color: i >= 2 ? C.orange : C.ink, transform: rolling && i >= 2 ? `rotateX(${flip * 25}deg)` : undefined}}>
            {d}<div style={{position: 'absolute', left: 0, right: 0, top: '50%', height: 3 * z, background: '#111'}} />
          </div>
        ))}
      </div>
    </div>
  );
};

export const SCENES: Record<string, React.FC<any>> = {
  multiply: Multiply, same: Same, breakup: Breakup, versus: Versus, fork: Fork, year: Year,
  sting: Sting, chapter: Chapter, statement: Statement, type: TypeLines, logos: Logos, price: Price, meter: Meter, quote: Quote,
  evidence: Evidence, checklist: Checklist, licence: Licence, scale: Scale, stream: Stream, letters: Letters, fish: Fish, board: Board,
  law: Law, deal: Deal, jump: Jump, article: Article, specimen: Specimen, trio: Trio, watch: Watch, menu: Menu, search: SearchRead,
  tofu: Tofu, covers: Covers, docs: Docs, blankdoc: BlankDoc, teaser: Teaser, apps: Apps, end: End, note: Note, clip: Clip, subscribe: Subscribe,
};
