import React from 'react';
import {AbsoluteFill, interpolate, Easing} from 'remotion';
import {C, F, SH, EASE, clamp, useLife, step, useSpring, Rise, RiseWords, Source, Kicker, MarkerCircle, Underline, PriceTag, Pic, fontOf, enterStyle, type Box} from './kit';

// Every scene: {type, at, dur, ...}. `box` = where it lives (full frame when he is off screen, the free side otherwise).
type P<T> = T & {at: number; dur: number; box: Box};
const center: React.CSSProperties = {position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'};
const fit = (box: Box) => (box.w < 1400 ? 1.0 : 1.3); // full frame = big, side panel (≈1040 px) = 1

// ── Series sting: the Cd tile + Designomics ──
export const Sting: React.FC<P<{tagline?: string}>> = ({at, dur, tagline = 'Every design has a price'}) => {
  const {t, exit} = useLife(at, dur, 0.5, 0.4);
  const s = useSpring(t, 0, 10);
  return (
    <div style={{...center, opacity: exit, filter: `blur(${(1 - exit) * 10}px)`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 34}}>
        <div style={{width: 150, height: 150, borderRadius: 26, background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${s}) rotate(${(1 - s) * -30}deg)`, boxShadow: SH}}>
          <span style={{fontFamily: F.serif, fontWeight: 700, fontSize: 92, color: '#fff', letterSpacing: -2}}>Cd</span>
        </div>
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

// ── Lines typed one after another (the three questions) ──
export const TypeLines: React.FC<P<{lines: {t: number; text: string}[]; kicker?: string}>> = ({at, dur, box, lines, kicker}) => {
  const {t, exit} = useLife(at, dur, 0.4, 0.4);
  const z = fit(box);
  return (
    <div style={{...center, alignItems: 'flex-start', padding: `0 ${box.w * 0.09}px`, opacity: exit}}>
      {kicker && <Kicker text={kicker} k={step(t, 0)} style={{fontSize: 22 * z, marginBottom: 30 * z}} />}
      {lines.map((l, i) => {
        const lt = t - l.t;
        if (lt < 0) return <div key={i} style={{height: 92 * z}} />;
        const n = Math.floor(Math.min(l.text.length, lt * 38));
        const done = n >= l.text.length;
        const active = i === lines.filter((x) => t >= x.t).length - 1;
        return (
          <div key={i} style={{display: 'flex', alignItems: 'baseline', gap: 22 * z, height: 92 * z, opacity: active ? 1 : 0.45}}>
            <span style={{fontFamily: F.mono, fontWeight: 600, fontSize: 30 * z, color: C.orange}}>0{i + 1}</span>
            <span style={{fontFamily: F.sans, fontWeight: 600, fontSize: 58 * z, color: C.ink}}>
              {l.text.slice(0, n)}
              <span style={{opacity: !done || (active && Math.floor(t * 2) % 2 === 0) ? 1 : 0, color: C.orange}}>▍</span>
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ── Logos fly in on the word that names them ──
export const Logos: React.FC<P<{items: {t: number; src: string; h?: number; label?: string}[]; title?: string; cols?: number; invert?: boolean}>> = ({at, dur, box, items, title, cols = 3, invert = true}) => {
  const {t, exit} = useLife(at, dur, 0.4, 0.45);
  const z = fit(box);
  return (
    <div style={{...center, opacity: exit}}>
      {title && <Kicker text={title} k={step(t, 0)} style={{fontSize: 22 * z, marginBottom: 40 * z}} />}
      <div style={{display: 'grid', gridTemplateColumns: `repeat(${cols}, ${360 * z}px)`, gap: `${44 * z}px ${40 * z}px`}}>
        {items.map((it, i) => {
          const k = step(t, it.t, 0.55);
          const s = useSpring(t, it.t, 11);
          return (
            <div key={i} style={{height: 170 * z, borderRadius: 22, background: C.card, border: `1px solid ${C.line}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: SH,
              opacity: k, transform: `translateY(${(1 - s) * 120}px) scale(${0.85 + 0.15 * s}) rotate(${(1 - s) * (i % 2 ? 6 : -6)}deg)`}}>
              <Pic s={it.src} style={{height: (it.h ?? 70) * z, maxWidth: 280 * z, filter: invert ? 'brightness(0) invert(0.93)' : undefined}} />
              {it.label && <div style={{fontFamily: F.mono, fontSize: 18 * z, color: C.mute, marginTop: 14 * z, letterSpacing: 2}}>{it.label}</div>}
            </div>
          );
        })}
      </div>
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
            <div style={{width: 14 * z, height: 14 * z, borderRadius: 99, background: zero ? C.green : C.red, opacity: zero ? 1 : 0.5 + 0.5 * Math.sin(t * 8)}} />
            {zero ? 'PAID OFF' : 'RUNNING'}
          </div>
        </div>
        <div style={{fontFamily: F.mono, fontWeight: 600, fontSize: 132 * z, color: zero ? C.green : C.ink, letterSpacing: 4, marginTop: 10 * z, whiteSpace: 'pre', transform: `translateY(${wobble}px)`}}>
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
      <div style={{width: box.w * 0.8, padding: `${56 * z}px ${70 * z}px`, borderRadius: 30, background: C.card, border: `1px solid ${C.line}`, boxShadow: SH, position: 'relative'}}>
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

// ── Checklist: what a licence counts ──
export const Checklist: React.FC<P<{title: string; items: {t: number; text: string; icon?: string}[]; source?: string}>> = ({at, dur, box, title, items, source}) => {
  const {t, exit, enter} = useLife(at, dur, 0.5, 0.45);
  const z = fit(box);
  return (
    <div style={{...center, ...enterStyle(enter, exit, 'right', 80)}}>
      <div style={{width: 860 * z, padding: `${50 * z}px ${60 * z}px`, borderRadius: 26, background: '#f3eee5', color: '#1d1b19', boxShadow: SH, transform: 'rotate(-1.5deg)'}}>
        <div style={{fontFamily: F.mono, fontWeight: 600, fontSize: 22 * z, letterSpacing: 3, color: C.orange}}>FONT LICENCE · CONDITIONS</div>
        <div style={{fontFamily: F.serif, fontWeight: 600, fontSize: 52 * z, marginTop: 10 * z, marginBottom: 26 * z}}>{title}</div>
        {items.map((it, i) => {
          const k = step(t, it.t, 0.45);
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 24 * z, padding: `${16 * z}px 0`, borderTop: '2px dashed #cfc6b8', opacity: 0.25 + 0.75 * k}}>
              <div style={{width: 46 * z, height: 46 * z, borderRadius: 10, border: `3px solid ${k > 0.5 ? C.orange : '#b9b0a2'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34 * z, color: C.orange, fontWeight: 700, transform: `scale(${0.8 + 0.2 * k})`}}>{k > 0.5 ? '✓' : ''}</div>
              <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 40 * z, transform: `translateX(${(1 - k) * 30}px)`}}>{it.text}</div>
              <div style={{marginLeft: 'auto', fontFamily: F.mono, fontSize: 26 * z, color: C.orange, opacity: k}}>{it.icon ?? '× $'}</div>
            </div>
          );
        })}
      </div>
      {source && <Source text={source} k={step(t, 1) * exit} style={{marginTop: 26}} />}
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
        <div style={{width: 300 * z, height: 380 * z, borderRadius: 22, background: C.card, border: `2px solid ${C.line}`, boxShadow: SH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `rotate(${-4 + flip * 4}deg)`}}>
          <div style={{fontFamily: F.serif, fontWeight: 600, fontSize: 170 * z, color: C.ink, lineHeight: 1}}>Aa</div>
          <div style={{fontFamily: F.mono, fontSize: 26 * z, color: C.mute, marginTop: 20 * z}}>font.otf</div>
        </div>
        <div style={{fontFamily: F.mono, fontSize: 70 * z, color: C.orange, opacity: flip}}>→</div>
        <div style={{width: 420 * z, height: 380 * z, borderRadius: 18, background: '#f3eee5', color: '#1d1b19', boxShadow: SH, padding: 36 * z, opacity: flip, transform: `translateX(${(1 - flip) * 60}px) rotate(2deg)`, position: 'relative'}}>
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
export const Fish: React.FC<P<{eats: {t: number; name: string; font?: string; year?: string; src?: string}[]; bigLabel?: string; japanAt?: number; logo?: string}>> = ({at, dur, box, eats, japanAt, logo}) => {
  const {t, exit, enter} = useLife(at, dur, 0.6, 0.45);
  const z = box.w / 1920;
  const eaten = eats.filter((e) => t >= e.t + 0.9).length;
  const size = 1 + eaten * 0.08;
  const mouth = Math.max(0, ...eats.map((e) => interpolate(t, [e.t + 0.3, e.t + 0.7, e.t + 1.0], [0, 1, 0], clamp)));
  const bigX = japanAt && t > japanAt ? interpolate(t, [japanAt, japanAt + 1.6], [560, 1180], {...clamp, easing: EASE}) : 560;
  const bob = Math.sin(t * 2.2) * 10;
  // body with a mouth that opens on the right (m = 0 closed … 1 open)
  const bodyPath = (m: number) => `M 0 0 C 50 -120, 250 -130, 380 ${-14 - 40 * m} L 300 0 L 380 ${14 + 40 * m} C 250 130, 50 120, 0 0 Z`;
  return (
    <div style={{position: 'absolute', inset: 0, ...enterStyle(enter, exit, 'up', 60)}}>
      {japanAt && (
        <div style={{position: 'absolute', right: 120 * z, top: 160 * z, opacity: step(t, japanAt - 0.4), fontFamily: F.mono, fontSize: 28 * z, color: C.mute, textAlign: 'right'}}>
          <div style={{fontSize: 90 * z, lineHeight: 1}}>🗾</div>JAPAN
        </div>
      )}
      {eats.map((e, i) => {
        const swim = interpolate(t, [e.t - 0.3, e.t + 0.6], [1, 0], {...clamp, easing: EASE});
        const gone = step(t, e.t + 0.55, 0.4);
        if (t < e.t - 0.3 || gone >= 1) return null;
        const y = 540 + ((i % 3) - 1) * 40;
        const x = bigX + 350 * size + 90 + swim * 800;
        return (
          <div key={i} style={{position: 'absolute', left: x * z, top: y * z, transform: `translate(-50%, -50%) scale(${1 - gone * 0.8})`, opacity: 1 - gone, display: 'flex', alignItems: 'center', gap: 10}}>
            <svg width={150 * z} height={80 * z} viewBox="-10 -45 170 90"><path d="M 150 0 C 110 -40, 30 -40, 20 0 C 30 40, 110 40, 150 0 Z M 20 0 L -10 -26 L -10 26 Z" fill={C.ink} /></svg>
            <div style={{fontFamily: F.sans, fontWeight: 600, fontSize: 30 * z, color: C.ink, background: C.card, padding: '6px 16px', borderRadius: 10, whiteSpace: 'nowrap'}}>
              {e.name}{e.font ? <span style={{color: C.orange}}> · {e.font}</span> : null}
            </div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: bigX * z, top: (540 + bob) * z, transform: `translate(-50%, -50%) scale(${size * z * 1.7})`, transformOrigin: 'center'}}>
        <svg width={520} height={300} viewBox="-120 -150 560 300" style={{overflow: 'visible'}}>
          <path d="M -110 -90 L 10 0 L -110 90 Z" fill={C.orange} opacity={0.85} />
          <path d={bodyPath(mouth)} fill={C.orange} />
          <circle cx={270} cy={-40} r={14} fill="#fff" /><circle cx={274} cy={-40} r={7} fill="#111" />
        </svg>
        <div style={{position: 'absolute', left: 150, top: 128, width: 200, textAlign: 'center'}}>
          <span style={{fontFamily: F.sans, fontWeight: 700, color: '#fff', fontSize: 34}}>Monotype</span>
        </div>
      </div>
      <div style={{position: 'absolute', left: 120 * z, bottom: 90 * z, display: 'flex', gap: 14 * z, flexWrap: 'wrap', width: 1680 * z}}>
        {eats.filter((e) => t >= e.t + 0.9).map((e, i) => {
          const k = step(t, e.t + 0.9, 0.4);
          const glow = e.name === 'Fontworks' ? 0.5 + 0.5 * Math.sin(t * 4) : 0;
          return (
            <div key={i} style={{fontFamily: F.mono, fontSize: 24 * z, color: e.name === 'Fontworks' ? '#fff' : C.ink, background: e.name === 'Fontworks' ? C.orange : C.card, border: `1px solid ${C.line}`, padding: `${8 * z}px ${16 * z}px`, borderRadius: 999,
              opacity: k, transform: `translateY(${(1 - k) * 30}px)`, boxShadow: glow ? `0 0 ${30 * glow}px ${C.orange}` : undefined}}>
              {e.year ? `${e.year} · ` : ''}{e.name}
            </div>
          );
        })}
      </div>
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
              <div style={{width: 420 * z, padding: `${34 * z}px ${30 * z}px`, borderRadius: 22, background: C.card, border: `2px solid ${c.hot ? C.orange : C.line}`, boxShadow: SH, textAlign: 'center',
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
    <div style={{width: 640 * z, padding: `${40 * z}px ${46 * z}px`, borderRadius: 24, background: C.card, border: `2px solid ${ok ? C.green : C.orange}`, boxShadow: SH, opacity: step(t, d), transform: `translateY(${(1 - step(t, d)) * 60}px)`}}>
      <div style={{fontFamily: F.mono, fontWeight: 600, fontSize: 24 * z, letterSpacing: 3, color: ok ? C.green : C.orange}}>{ok ? '✓ PROTECTED' : '✕ NOT PROTECTED'}</div>
      <div style={{fontFamily: F.serif, fontWeight: 600, fontSize: 48 * z, color: C.ink, margin: `${10 * z}px 0 ${20 * z}px`}}>{c.title}</div>
      {c.items.map((it, i) => <div key={i} style={{fontFamily: F.sans, fontWeight: 500, fontSize: 36 * z, color: C.ink, padding: `${10 * z}px 0`, borderTop: `1px solid ${C.line}`, opacity: step(t, d + 0.4 + i * 0.3)}}>{it}</div>)}
    </div>
  );
  return (
    <div style={{...center, ...enterStyle(enter, exit, 'up', 50)}}>
      <Kicker text="United States · copyright" k={step(t, 0)} style={{marginBottom: 34 * z, fontSize: 22 * z}} />
      <div style={{display: 'flex', gap: 50 * z}}>{col(left, 0.3, true)}{col(right, t2, false)}</div>
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
      <div style={{width: box.w * 0.72, background: '#f4f0e8', borderRadius: 18, padding: `${44 * z}px ${54 * z}px`, boxShadow: SH, transform: `rotate(${-1.2 + 0.4 * Math.sin(t)}deg) scale(${1 + 0.03 * t / dur})`, position: 'relative'}}>
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
      <div style={{width: box.w * 0.74, borderRadius: 24, background: '#f3eee5', color: '#151413', padding: `${50 * z}px ${64 * z}px`, boxShadow: SH, position: 'relative'}}>
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
          const k = step(t, 0.3 + i * 0.45);
          return (
            <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: k, transform: `translateY(${(1 - k) * 80}px)`}}>
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
      <div style={{width: 560 * z, height: 320 * z, borderRadius: 16, background: '#f4f0e8', boxShadow: SH, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
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

// ── End card ──
export const End: React.FC<P<{line?: string}>> = ({at, dur, line = 'Every design has a price.'}) => {
  const {t} = useLife(at, dur + 10, 0.5, 0.1);
  const s = useSpring(t, 0, 11);
  return (
    <div style={center}>
      <div style={{width: 130, height: 130, borderRadius: 24, background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${s})`, boxShadow: SH}}>
        <span style={{fontFamily: F.serif, fontWeight: 700, fontSize: 80, color: '#fff'}}>Cd</span>
      </div>
      <Rise text={line} t={t - 0.3} style={{fontFamily: F.serif, fontWeight: 600, fontSize: 64, color: C.ink, marginTop: 30}} />
      <div style={{fontFamily: F.mono, fontSize: 24, color: C.mute, letterSpacing: 5, marginTop: 18, opacity: step(t, 0.9)}}>DESIGNOMICS · SUBSCRIBE FOR THE NEXT ONE</div>
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

export const SCENES: Record<string, React.FC<any>> = {
  sting: Sting, chapter: Chapter, statement: Statement, type: TypeLines, logos: Logos, price: Price, meter: Meter, quote: Quote,
  evidence: Evidence, checklist: Checklist, licence: Licence, scale: Scale, stream: Stream, letters: Letters, fish: Fish, board: Board,
  law: Law, deal: Deal, jump: Jump, article: Article, specimen: Specimen, trio: Trio, watch: Watch, menu: Menu, search: SearchRead,
  tofu: Tofu, covers: Covers, docs: Docs, blankdoc: BlankDoc, teaser: Teaser, apps: Apps, end: End, note: Note,
};
