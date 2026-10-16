// EVIDENCE inserts for explainers (brain/explainers.md Style B): the proof behind a claim, shown as a card that flies
// in from below the frame and leaves through the top, with a "Source: …" credit (and a name tag for people's clips).
//   page  a website / article capture (scripts/capture.mjs): browser bar with the site, the camera starts at the top of
//         the page, moves to ONE line on zoomAt and a yellow marker sweeps across it (line by line) on markAt
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
  const marks = x.marks ?? [];
  // camera: A = top of the page (fit width) → B = the marked lines, as big as fits
  const s0 = vw / pw;
  const camAt = (s: number, cx: number, cy: number) => {
    const hx = vw / (2 * s), hy = vh / (2 * s);
    return {s, cx: pw * s <= vw ? pw / 2 : Math.min(Math.max(cx, hx), pw - hx), cy: ph * s <= vh ? ph / 2 : Math.min(Math.max(cy, hy), ph - hy)};
  };
  const A = camAt(s0, pw / 2, 0);
  // marker timing: lines swept one after another, each in proportion to its length
  const zoomAt = x.zoomAt ?? Math.round(0.5 * fps);
  const total = marks.reduce((a, m) => a + m[2], 0) || 1;
  const sweepF = Math.round(Math.min(2.2, 0.5 + marks.length * 0.45) * fps);
  const lineK = (tt: number, markAt: number) => {
    let acc = 0;
    return marks.map((m) => {
      const a = acc / total, b = (acc + m[2]) / total;
      acc += m[2];
      return interpolate(tt, [markAt + a * sweepF, markAt + b * sweepF], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});
    });
  };
  // B = the marked text at a READABLE size (a desktop page shown whole is unreadable in a reel): the whole marked
  // block if it fits, otherwise zoomed in on the line and the camera glides along with the marker tip
  let B = A, moveF = 0;
  const lh = marks.length ? [...marks.map((m) => m[3])].sort((p, q) => p - q)[Math.floor(marks.length / 2)] : 16;
  const x0 = Math.min(...marks.map((m) => m[0])), x1 = Math.max(...marks.map((m) => m[0] + m[2]));
  const y0 = Math.min(...marks.map((m) => m[1])), y1 = Math.max(...marks.map((m) => m[1] + m[3]));
  const fit = marks.length ? Math.min((vw * 0.88) / (x1 - x0), (vh * 0.45) / (y1 - y0)) : s0;
  const readable = (U * (tall ? 0.036 : 0.03)) / lh;
  const sB = Math.min(Math.max(fit, readable, s0), s0 * 4);
  const follow = marks.length > 0 && fit < readable * 0.95;
  const tip = (tt: number, markAt: number) => {
    const ks = lineK(tt, markAt);
    let i = ks.findIndex((k) => k < 1);
    if (i < 0) i = marks.length - 1;
    const m = marks[i];
    return [m[0] + m[2] * ks[i], m[1] + m[3] / 2];
  };
  if (marks.length) {
    const hx = vw / (2 * sB);
    B = follow ? camAt(sB, marks[0][0] + hx * 0.85, marks[0][1] + marks[0][3] / 2) : camAt(sB, (x0 + x1) / 2, (y0 + y1) / 2);
    moveF = Math.round(Math.min(1.6, 0.8 + Math.abs(B.cy - A.cy) / 4000) * fps);
  }
  const markAt = x.markAt ?? zoomAt + moveF;
  const p = marks.length ? interpolate(t, [zoomAt, zoomAt + moveF], [0, 1], {...clamp, easing: easeIO}) : 0;
  const sc = Math.exp(Math.log(A.s) + (Math.log(B.s) - Math.log(A.s)) * p);
  let cx = A.cx + (B.cx - A.cx) * p, cy = A.cy + (B.cy - A.cy) * p;
  if (follow && t > markAt) {
    // smoothed tip (average over ±0.3 s) keeps the glide calm when the marker jumps to the next line
    const w = Math.round(0.3 * fps), pts = Array.from({length: 2 * w + 1}, (_, j) => tip(t - w + j, markAt));
    const tx = pts.reduce((a, q) => a + q[0], 0) / pts.length, ty = pts.reduce((a, q) => a + q[1], 0) / pts.length;
    const k = interpolate(t, [markAt, markAt + w], [0, 1], clamp);
    const c = camAt(sB, tx + (vw / (2 * sB)) * 0.25, ty); // the tip sits a bit left of centre: the words ahead are visible
    cx = B.cx + (c.cx - B.cx) * k;
    cy = B.cy + (c.cy - B.cy) * k;
  }
  // after the sweep the camera eases back to the whole marked sentence, if it is still readable that way
  let s = sc;
  const endAt = markAt + sweepF + Math.round(0.3 * fps);
  if (follow && t > endAt && fit >= readable * 0.6) {
    const e = interpolate(t, [endAt, endAt + Math.round(0.8 * fps)], [0, 1], {...clamp, easing: easeIO});
    const C = camAt(Math.max(fit, s0), (x0 + x1) / 2, (y0 + y1) / 2);
    s = Math.exp(Math.log(sc) + (Math.log(C.s) - Math.log(sc)) * e);
    cx += (C.cx - cx) * e;
    cy += (C.cy - cy) * e;
  }
  const ks = lineK(t, markAt);
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
        <div style={{position: 'absolute', left: 0, top: 0, width: pw, height: ph, transformOrigin: '0 0', transform: `translate(${vw / 2 - cx * s}px, ${vh / 2 - cy * s}px) scale(${s})`}}>
          <Img src={staticFile(x.media.src)} style={{position: 'absolute', left: 0, top: 0, width: pw, height: ph}} />
          {marks.map(([mx, my, mw, mh], i) => {
            const k = ks[i];
            if (k <= 0) return null;
            const pad = mh * 0.12;
            return <div key={i} style={{position: 'absolute', left: mx - pad, top: my - pad * 0.5, width: (mw + pad * 2) * k, height: mh + pad,
              background: color, mixBlendMode: 'multiply', borderRadius: `${mh * 0.12}px ${mh * 0.3}px ${mh * 0.18}px ${mh * 0.25}px`, transform: `skewX(-6deg)`, opacity: 0.92}} />;
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
