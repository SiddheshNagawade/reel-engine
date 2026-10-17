// EVIDENCE inserts for explainers (brain/explainers.md Style B): the proof behind a claim, shown as a card that flies
// in from below the frame and leaves through the top, with a "Source: …" credit (and a name tag for people's clips).
//   page  a website / article capture (scripts/capture.mjs): browser bar with the site, the camera starts at the top of
//         the page, moves to ONE line on zoomAt and a yellow marker sweeps across it (line by line) on markAt; or a
//         TOUR (stops): fast scroll to each part he talks about, slow arrival, its line marked as he says it
//   clip  a few seconds of someone else's video (scripts/refs.mjs clip): video card + creator name tag + source
//   logo  a brand logo (scripts/logo.mjs, SVG) pops in on the brand's colour or white
// The footage behind steps back (blurred + darkened by default): the evidence is the ONE main element (rules.md).
import React from 'react';
import {AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {MediaRef} from '../types';
import {fonts} from './fonts';
import {Credit} from './Moves';

export type EvidenceSpec = {
  look: 'page' | 'clip' | 'logo';
  media: MediaRef;
  page?: {w: number; h: number}; // capture size in page px (the .json next to the capture)
  marks?: [number, number, number, number][]; // lines to highlight [x, y, w, h] in page px (capture.mjs --find)
  stops?: {at: number; marks: [number, number, number, number][]; markAt?: number}[]; // a page TOUR: the camera scrolls fast to each stop on its word, slows down, marks its lines
  zoomAt?: number; // frames from the start: the camera moves to the marked line (default ~0.5 s)
  markAt?: number; // frames from the start: the marker sweeps (default: when the camera arrives)
  site?: string; // text in the browser bar (default: none → no bar)
  source?: string; // "Source: …" credit
  name?: string; // creator name tag (clips)
  role?: string; // under the name ("YouTube", "Founder, Zomato")
  title?: string; // logo: the word under the logo
  volume?: number; // clip: its own sound (0 = muted, default)
  aspect?: number; // clip: width / height (default 16 / 9)
  backdrop?: 'blur' | 'dim' | 'color' | 'none';
  bg?: string; // backdrop colour (look logo, or backdrop 'color')
  marker?: string; // highlighter colour
  x?: number; y?: number; w?: number; h?: number; // card centre and size, fractions of the frame
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const easeIO = Easing.bezier(0.65, 0, 0.35, 1);

export const Evidence: React.FC<{x: EvidenceSpec & {frames: number}; t: number}> = ({x, t}) => {
  const frame = useCurrentFrame();
  const {fps, width: W, height: H} = useVideoConfig();
  const tall = H > W * 1.2;
  const U = Math.min(W, H * 0.5625);
  const n = x.frames;
  // arrive from below the frame (slight tilt, settles with overshoot), leave through the top
  const inS = spring({frame: t, fps, config: {damping: 15, stiffness: 120, mass: 0.9}});
  const out = interpolate(t, [n - Math.round(0.4 * fps), n], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  const dy = (1 - inS) * H * 0.9 - out * H * 1.05;
  const rot = (1 - inS) * 5 - out * 3;
  const back = Math.min(interpolate(t, [0, 10], [0, 1], clamp), interpolate(t, [n - 10, n], [1, 0], clamp));
  const backdrop = x.backdrop ?? (x.look === 'logo' ? 'color' : 'blur');

  let card: React.ReactNode = null;
  if (x.look === 'page') card = <PageCard x={x} t={t} W={W} H={H} U={U} tall={tall} fps={fps} />;
  else if (x.look === 'clip') card = <ClipCard x={x} t={t} frame={frame} W={W} H={H} U={U} tall={tall} />;
  else card = <LogoCard x={x} t={t} W={W} H={H} U={U} fps={fps} />;

  return (
    <AbsoluteFill>
      {backdrop === 'blur' && <AbsoluteFill style={{backdropFilter: `blur(${26 * back}px) brightness(${1 - 0.45 * back})`, WebkitBackdropFilter: `blur(${26 * back}px) brightness(${1 - 0.45 * back})`}} />}
      {backdrop === 'dim' && <AbsoluteFill style={{background: '#000', opacity: 0.6 * back}} />}
      {backdrop === 'color' && <AbsoluteFill style={{background: x.bg ?? '#ffffff', opacity: back}} />}
      <AbsoluteFill style={{transform: x.look === 'logo' ? undefined : `translateY(${dy}px) rotate(${rot}deg)`}}>{card}</AbsoluteFill>
      {(x.source || x.name) && <Credit x={{name: x.name, role: x.role, source: x.source, frames: n}} t={t} />}
    </AbsoluteFill>
  );
};

// ── page: browser card, camera to one line, marker sweep ────────────────────────────────────────────────────────
const PageCard: React.FC<{x: EvidenceSpec & {frames: number}; t: number; W: number; H: number; U: number; tall: boolean; fps: number}> = ({x, t, W, H, U, tall, fps}) => {
  const cw = W * (x.w ?? (tall ? 0.9 : 0.58)), ch = H * (x.h ?? (tall ? 0.6 : 0.84));
  const left = W * (x.x ?? 0.5) - cw / 2, top = H * (x.y ?? (tall ? 0.43 : 0.47)) - ch / 2;
  const bar = x.site ? U * 0.075 : 0;
  const vw = cw, vh = ch - bar;
  const pw = x.page?.w ?? 1280, ph = x.page?.h ?? 4000;
  // camera: A = top of the page (fit width), then a TOUR of stops: each stop = the lines he's talking about, at a
  // readable size. Between stops the page scrolls FAST (zooming out a little, motion blur) and slows right down on
  // arrival; the marker sweeps each stop's lines on his word. One stop = the single-line card.
  const s0 = vw / pw;
  const camAt = (s: number, cx: number, cy: number) => {
    const hx = vw / (2 * s), hy = vh / (2 * s);
    return {s, cx: pw * s <= vw ? pw / 2 : Math.min(Math.max(cx, hx), pw - hx), cy: ph * s <= vh ? ph / 2 : Math.min(Math.max(cy, hy), ph - hy)};
  };
  type Cam = ReturnType<typeof camAt>;
  const A = camAt(s0, pw / 2, 0);
  const readyStops = (x.stops?.length ? x.stops : x.marks?.length ? [{at: x.zoomAt ?? Math.round(0.5 * fps), marks: x.marks, markAt: x.markAt}] : [])
    .filter((st) => st.marks?.length).sort((p, q) => p.at - q.at);
  const plans = readyStops.map((st) => {
    const marks = st.marks;
    const total = marks.reduce((a, m) => a + m[2], 0) || 1;
    const sweepF = Math.round(Math.min(2.2, 0.5 + marks.length * 0.45) * fps);
    const lh = [...marks.map((m) => m[3])].sort((p, q) => p - q)[Math.floor(marks.length / 2)];
    const x0 = Math.min(...marks.map((m) => m[0])), x1 = Math.max(...marks.map((m) => m[0] + m[2]));
    const y0 = Math.min(...marks.map((m) => m[1])), y1 = Math.max(...marks.map((m) => m[1] + m[3]));
    // readable size (a desktop page shown whole is unreadable in a reel): the whole block if it fits, otherwise
    // zoomed in on the line and the camera glides along with the marker tip
    const fit = Math.min((vw * 0.88) / (x1 - x0), (vh * 0.45) / (y1 - y0));
    const readable = (U * (tall ? 0.036 : 0.03)) / lh;
    const sB = Math.min(Math.max(fit, readable, s0), s0 * 4);
    const follow = fit < readable * 0.95;
    const B = follow ? camAt(sB, marks[0][0] + (vw / (2 * sB)) * 0.85, marks[0][1] + marks[0][3] / 2) : camAt(sB, (x0 + x1) / 2, (y0 + y1) / 2);
    return {st, marks, total, sweepF, x0, x1, y0, y1, fit, readable, sB, follow, B, markAt: 0, moveF: 0};
  });
  const lineK = (pl: (typeof plans)[number], tt: number) => {
    let acc = 0;
    return pl.marks.map((m) => {
      const a = acc / pl.total, b = (acc + m[2]) / pl.total;
      acc += m[2];
      return interpolate(tt, [pl.markAt + a * pl.sweepF, pl.markAt + b * pl.sweepF], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});
    });
  };
  const tip = (pl: (typeof plans)[number], tt: number) => {
    const ks = lineK(pl, tt);
    let i = ks.findIndex((k) => k < 1);
    if (i < 0) i = pl.marks.length - 1;
    const m = pl.marks[i];
    return [m[0] + m[2] * ks[i], m[1] + m[3] / 2];
  };
  // where the camera is while it stays at stop i (after arriving): follow the marker, then settle on the sentence
  const atStop = (i: number, tt: number): Cam => {
    const pl = plans[i];
    let c: Cam = pl.B;
    if (pl.follow && tt > pl.markAt) {
      const w = Math.round(0.3 * fps), pts = Array.from({length: 2 * w + 1}, (_, j) => tip(pl, tt - w + j)); // smoothed tip
      const tx = pts.reduce((a, q) => a + q[0], 0) / pts.length, ty = pts.reduce((a, q) => a + q[1], 0) / pts.length;
      const k = interpolate(tt, [pl.markAt, pl.markAt + w], [0, 1], clamp);
      const f = camAt(pl.sB, tx + (vw / (2 * pl.sB)) * 0.25, ty); // tip a bit left of centre: the words ahead show
      c = {s: pl.sB, cx: pl.B.cx + (f.cx - pl.B.cx) * k, cy: pl.B.cy + (f.cy - pl.B.cy) * k};
    }
    const endAt = pl.markAt + pl.sweepF + Math.round(0.3 * fps);
    if (pl.follow && tt > endAt && pl.fit >= pl.readable * 0.6) {
      const e = interpolate(tt, [endAt, endAt + Math.round(0.8 * fps)], [0, 1], {...clamp, easing: easeIO});
      const C = camAt(Math.max(pl.fit, s0), (pl.x0 + pl.x1) / 2, (pl.y0 + pl.y1) / 2);
      c = {s: Math.exp(Math.log(c.s) + (Math.log(C.s) - Math.log(c.s)) * e), cx: c.cx + (C.cx - c.cx) * e, cy: c.cy + (C.cy - c.cy) * e};
    }
    return c;
  };
  // travel times: long jumps take longer but stay quick (fast scroll), then the marker waits for his word
  plans.forEach((pl, i) => {
    const from = i ? atStop(i - 1, pl.st.at) : A;
    const screens = Math.abs(pl.B.cy - from.cy) * Math.min(from.s, pl.B.s) / vh; // how many screens it scrolls
    pl.moveF = Math.round(Math.min(1.5, 0.55 + screens * 0.12) * fps);
    pl.markAt = pl.st.markAt ?? pl.st.at + pl.moveF;
  });
  const camAtTime = (tt: number): Cam => {
    let i = -1;
    plans.forEach((pl, j) => { if (tt >= pl.st.at) i = j; });
    if (i < 0) return A;
    const pl = plans[i];
    const from = i ? atStop(i - 1, pl.st.at) : A;
    const raw = interpolate(tt, [pl.st.at, pl.st.at + pl.moveF], [0, 1], clamp);
    if (raw >= 1) return atStop(i, tt);
    const e = Easing.bezier(0.55, 0, 0.12, 1)(raw); // speeds up fast, long gentle arrival
    const far = Math.abs(pl.B.cy - from.cy) * Math.min(from.s, pl.B.s) > vh * 1.2;
    const dip = far ? Math.sin(Math.PI * e) * 0.35 : 0; // zoom out a little mid-scroll, like a hand flicking the page
    return {s: Math.exp(Math.log(from.s) + (Math.log(pl.B.s) - Math.log(from.s)) * e - dip), cx: from.cx + (pl.B.cx - from.cx) * e, cy: from.cy + (pl.B.cy - from.cy) * e};
  };
  const cam = camAtTime(t), prev = camAtTime(t - 1);
  const {s, cx, cy} = cam;
  // motion blur only while the page really flies (screen px per frame of the scroll itself, not the zoom)
  const speed = Math.hypot(cy - prev.cy, cx - prev.cx) * Math.min(s, prev.s);
  const blur = Math.min(5, Math.max(0, speed - vh * 0.035) * 0.06);
  const color = x.marker ?? '#ffe14a';
  return (
    <div style={{position: 'absolute', left, top, width: cw, height: ch, borderRadius: U * 0.028, overflow: 'hidden', background: '#fff',
      boxShadow: '0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.08)'}}>
      {bar > 0 && (
        <div style={{height: bar, background: '#eceef1', display: 'flex', alignItems: 'center', gap: bar * 0.18, padding: `0 ${bar * 0.35}px`, borderBottom: '1px solid #d9dce1'}}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => <div key={c} style={{width: bar * 0.2, height: bar * 0.2, borderRadius: '50%', background: c, flexShrink: 0}} />)}
          <div style={{flex: 1, marginLeft: bar * 0.2, height: bar * 0.56, borderRadius: bar * 0.28, background: '#fff', display: 'flex', alignItems: 'center', gap: bar * 0.14, padding: `0 ${bar * 0.3}px`,
            fontFamily: fonts.inter, fontWeight: 500, fontSize: bar * 0.3, color: '#3c4043', whiteSpace: 'nowrap', overflow: 'hidden'}}>
            <svg width={bar * 0.24} height={bar * 0.28} viewBox="0 0 12 14"><rect x="1" y="6" width="10" height="7.5" rx="1.5" fill="#5f6368" /><path d="M3.5 6V4a2.5 2.5 0 015 0v2" stroke="#5f6368" strokeWidth="1.6" fill="none" /></svg>
            {x.site}
          </div>
        </div>
      )}
      <div style={{position: 'relative', width: vw, height: vh, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: pw, height: ph, transformOrigin: '0 0', transform: `translate(${vw / 2 - cx * s}px, ${vh / 2 - cy * s}px) scale(${s})`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined}}>
          <Img src={staticFile(x.media.src)} style={{position: 'absolute', left: 0, top: 0, width: pw, height: ph}} />
          {plans.flatMap((pl, si) => {
            const ks = lineK(pl, t);
            return pl.marks.map(([mx, my, mw, mh], i) => {
              const k = ks[i];
              if (k <= 0) return null;
              const pad = mh * 0.12;
              return <div key={`${si}-${i}`} style={{position: 'absolute', left: mx - pad, top: my - pad * 0.5, width: (mw + pad * 2) * k, height: mh + pad,
                background: color, mixBlendMode: 'multiply', borderRadius: `${mh * 0.12}px ${mh * 0.3}px ${mh * 0.18}px ${mh * 0.25}px`, transform: `skewX(-6deg)`, opacity: 0.92}} />;
            });
          })}
        </div>
      </div>
    </div>
  );
};

// ── clip: someone else's video as a card ────────────────────────────────────────────────────────────────────────
const ClipCard: React.FC<{x: EvidenceSpec & {frames: number}; t: number; frame: number; W: number; H: number; U: number; tall: boolean}> = ({x, t, frame, W, H, U, tall}) => {
  const ar = x.aspect ?? 16 / 9;
  let cw = W * (x.w ?? (tall ? 0.92 : 0.7)), ch = cw / ar;
  const maxH = H * (tall ? 0.6 : 0.8);
  if (ch > maxH) { ch = maxH; cw = ch * ar; }
  const left = W * (x.x ?? 0.5) - cw / 2, top = H * (x.y ?? (tall ? 0.42 : 0.46)) - ch / 2;
  return (
    <div style={{position: 'absolute', left, top, width: cw, height: ch, borderRadius: U * 0.03, overflow: 'hidden', background: '#000', boxShadow: '0 40px 100px rgba(0,0,0,0.6)'}}>
      {/* overlays have no Sequence of their own: start the clip where the insert starts */}
      <Sequence from={frame - t} layout="none">
        <OffthreadVideo src={staticFile(x.media.src)} trimBefore={x.media.trimBefore ?? 0} volume={x.volume ?? 0} muted={!x.volume} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </Sequence>
    </div>
  );
};

// ── logo: pops on its colour ────────────────────────────────────────────────────────────────────────────────────
const LogoCard: React.FC<{x: EvidenceSpec & {frames: number}; t: number; W: number; H: number; U: number; fps: number}> = ({x, t, W, H, U, fps}) => {
  const n = x.frames;
  const pop = spring({frame: t - 4, fps, config: {damping: 11, stiffness: 150, mass: 0.8}});
  const out = interpolate(t, [n - Math.round(0.35 * fps), n], [1, 0], {...clamp, easing: Easing.in(Easing.cubic)});
  const word = spring({frame: t - 12, fps, config: {damping: 16, stiffness: 130}});
  const size = U * (x.w ?? 0.42);
  const cy = H * (x.y ?? 0.42);
  return (
    <AbsoluteFill>
      <Img src={staticFile(x.media.src)} style={{position: 'absolute', left: W * (x.x ?? 0.5) - size / 2, top: cy - size / 2, width: size, height: size, objectFit: 'contain',
        transform: `scale(${pop * out})`, filter: `blur(${(1 - Math.min(1, pop)) * 6}px)`}} />
      {x.title && (
        <div style={{position: 'absolute', left: 0, width: W, top: cy + size * 0.62, textAlign: 'center', fontFamily: fonts.inter, fontWeight: 800, fontSize: U * 0.06,
          letterSpacing: '-0.02em', color: x.bg && /^#(0|1|2|3)/.test(x.bg) ? '#fff' : '#111', opacity: word * out, transform: `translateY(${(1 - word) * U * 0.05}px)`}}>{x.title}</div>
      )}
    </AbsoluteFill>
  );
};
