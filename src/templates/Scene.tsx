// Full-screen motion-graphics scene (learned from Pablo Quesada's 8-hour reel course, 2026-10-14; brain/pablo.md):
// the speaker is replaced by a designed board — coloured background with vignette + edge grain (+ grid / blinds),
// elements that arrive exactly on his words (script labels typed on, gradient text boxes, cut-out photos, dashed lines
// drawn on, numbered dots, a badge riding a path, a counting number), and a camera that is ALWAYS moving: it pans
// from element to element, pushes in on the payoff, pulls out to reveal. Nothing ever sits still like a picture.
// World coordinates: x and y are fractions of the frame (0..1 = the first screen; beyond = off-screen space the
// camera can travel to). Camera keys {at, x, y, zoom}: the frame centre looks at (x, y); `at` may be negative so the
// scene is already moving on its first frame.
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {fonts} from '../layers/fonts';

export type SceneCam = {at: number; x: number; y: number; zoom?: number; rot?: number};
type Base = {at: number; x: number; y: number; enter?: 'type' | 'rise' | 'blur' | 'cut' | 'pop' | 'drop' | 'slide' | 'fade'; out?: number; dur?: number};
export type SceneItem = Base & (
  | {type: 'text'; text: string; font?: 'script' | 'heavy' | 'grotesk' | 'sans'; size?: number; color?: string}
  | {type: 'box'; text: string; w?: number; font?: 'script' | 'sans'}
  | {type: 'image'; src: string; w: number; circle?: boolean; ring?: string; shadow?: boolean}
  | {type: 'line'; pts: [number, number][]; dashed?: boolean; width?: number; color?: string}
  | {type: 'num'; n: number; size?: number}
  | {type: 'badge'; text: string; size?: number}
  | {type: 'counter'; from: number; to: number; prefix?: string; suffix?: string; size?: number}
  | {type: 'follow'; along: number; what: {kind: 'badge'; text: string} | {kind: 'image'; src: string; circle?: boolean}; size?: number}
);
export type SceneSpec = {
  frames: number;
  bg?: {color?: string; style?: 'radial' | 'grid' | 'blinds' | 'plain'; grain?: boolean; vignette?: boolean};
  cam?: SceneCam[];
  items: SceneItem[];
  boil?: boolean; // subtle living wobble on all elements (his turbulent displace)
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const settle = Easing.bezier(0.16, 1, 0.3, 1); // fast in, long soft settle (his pulled speed graph)
const glide = Easing.bezier(0.6, 0, 0.25, 1); // slow-fast-slow (camera moves, objects travelling)
const FONT = {script: fonts.yellowtail, heavy: fonts.anton, grotesk: fonts.inter, sans: fonts.poppins};
const WEIGHT = {script: 400, heavy: 400, grotesk: 900, sans: 800};
const GLOW = '0 0 22px rgba(255,255,255,0.35), 0 6px 18px rgba(0,0,0,0.45)';

// a smooth curve through the points (Catmull-Rom → cubic Bézier), in pixels
function smoothPath(p: [number, number][]) {
  if (p.length < 2) return '';
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] ?? p2;
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }
  return d;
}
// point at fraction k along a polyline approximation of the smooth curve
function pointAlong(p: [number, number][], k: number): [number, number] {
  const pts: [number, number][] = [];
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] ?? p2;
    for (let s = 0; s < 24; s++) {
      const t = s / 24, t2 = t * t, t3 = t2 * t;
      pts.push([0, 1].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)) as [number, number]);
    }
  }
  pts.push(p[p.length - 1]);
  const seg = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  let target = seg.reduce((a, b) => a + b, 0) * Math.min(1, Math.max(0, k));
  for (let i = 0; i < seg.length; i++) {
    if (target <= seg[i]) { const r = seg[i] ? target / seg[i] : 0; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * r, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * r]; }
    target -= seg[i];
  }
  return pts[pts.length - 1];
}

function camAt(cam: SceneCam[], t: number) {
  const ks = [...cam].sort((a, b) => a.at - b.at);
  if (!ks.length) return {x: 0.5, y: 0.5, zoom: 1, rot: 0};
  const v = (k: SceneCam) => ({x: k.x, y: k.y, zoom: k.zoom ?? 1, rot: k.rot ?? 0});
  if (t <= ks[0].at) return v(ks[0]);
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i], b = ks[i + 1];
    if (t <= b.at) {
      const k = glide((t - a.at) / Math.max(1, b.at - a.at));
      const A = v(a), B = v(b);
      return {x: A.x + (B.x - A.x) * k, y: A.y + (B.y - A.y) * k, zoom: A.zoom * Math.pow(B.zoom / A.zoom, k), rot: A.rot + (B.rot - A.rot) * k};
    }
  }
  return v(ks[ks.length - 1]);
}

// entrance (and optional exit) of one element at local time t → style
function motion(it: Base, t: number, U: number): {o: number; dx: number; dy: number; s: number; blur: number} {
  const d = t - it.at;
  const e = it.enter ?? 'rise';
  let o = 1, dx = 0, dy = 0, s = 1, blur = 0;
  if (d < 0) o = 0;
  else if (e === 'rise') { const k = settle(Math.min(1, d / 14)); o = Math.min(1, d / 6); dy = (1 - k) * U * 0.06; }
  else if (e === 'drop') { const k = settle(Math.min(1, d / 14)); o = Math.min(1, d / 5); dy = -(1 - k) * U * 0.12; }
  else if (e === 'slide') { const k = settle(Math.min(1, d / 16)); dx = (1 - k) * U * 1.2; }
  else if (e === 'blur') { const k = settle(Math.min(1, d / 12)); o = k; blur = (1 - k) * 18; dy = (1 - k) * U * 0.03; }
  else if (e === 'pop') { const k = Math.min(1, d / 10); o = Math.min(1, d / 4); s = 0.6 + 0.4 * Easing.back(2.2)(k); }
  else if (e === 'fade') o = Math.min(1, d / 10);
  if (it.out != null && t > it.out) { const k = Math.min(1, (t - it.out) / 10); o *= 1 - k; dy += Easing.in(Easing.quad)(k) * U * 0.08; }
  return {o, dx, dy, s, blur};
}

// typewriter with a soft edge (his "smooth typewriter": ramp-up shape, not a hard cursor)
const Typed: React.FC<{text: string; p: number}> = ({text, p}) => {
  const n = text.length;
  return <>{[...text].map((c, i) => <span key={i} style={{opacity: Math.max(0, Math.min(1, p * (n + 3) - i))}}>{c}</span>)}</>;
};

const Background: React.FC<{bg: NonNullable<SceneSpec['bg']>; cam: {x: number; y: number; zoom: number}; seed: number}> = ({bg, cam, seed}) => {
  const {width: W, height: H} = useVideoConfig();
  const c = bg.color ?? '#7a0d12';
  const style = bg.style ?? 'radial';
  // texture layers sit "in the world" a little (parallax): they shift and scale with the camera at half strength
  const par = `translate(${(0.5 - cam.x) * W * 0.5}px, ${(0.5 - cam.y) * H * 0.5}px) scale(${1 + (cam.zoom - 1) * 0.5})`;
  return (
    <AbsoluteFill style={{background: c}}>
      <AbsoluteFill style={{background: `radial-gradient(70% 55% at 50% 45%, rgba(255,255,255,0.16), rgba(0,0,0,0) 60%), linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35))`}} />
      {style === 'grid' && (
        <AbsoluteFill style={{inset: '-60%', transform: par, opacity: 0.22,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.9) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.9) 2px, transparent 2px)',
          backgroundSize: `${W / 6}px ${W / 6}px`}} />
      )}
      {style === 'blinds' && (
        <AbsoluteFill style={{background: `linear-gradient(180deg, ${c}, #000 120%)`}}>
          <AbsoluteFill style={{transform: par, inset: '-30%', opacity: 0.35, backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.75) 0 3px, transparent 3px 18px)'}} />
        </AbsoluteFill>
      )}
      {bg.grain !== false && (
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity: 0.55,
          WebkitMaskImage: 'radial-gradient(ellipse 65% 55% at 50% 50%, transparent 35%, #000 100%)', maskImage: 'radial-gradient(ellipse 65% 55% at 50% 50%, transparent 35%, #000 100%)'}}>
          <filter id={`g${seed}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} /><feColorMatrix type="saturate" values="0" /></filter>
          <rect width={W} height={H} filter={`url(#g${seed})`} />
        </svg>
      )}
      {bg.vignette !== false && <AbsoluteFill style={{background: 'radial-gradient(ellipse 75% 65% at 50% 50%, transparent 45%, rgba(0,0,0,0.6) 100%)'}} />}
    </AbsoluteFill>
  );
};

export const Scene: React.FC<SceneSpec> = (spec) => {
  const t = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const U = Math.min(W, H * 0.5625); // one size unit for 9:16 and 16:9
  const cam = camAt(spec.cam ?? [{at: 0, x: 0.5, y: 0.5, zoom: 1}], t);
  const id = `boil${Math.round((spec.items[0]?.x ?? 0) * 1000)}${spec.frames}`;
  const boil = spec.boil !== false;
  const P = (x: number, y: number): [number, number] => [x * W, y * H];
  const lines = spec.items.map((it) => (it.type === 'line' ? it.pts.map(([x, y]) => P(x, y)) : null));

  const draw = (it: SceneItem, i: number) => {
    if (t < it.at) return null;
    const m = motion(it, t, U);
    if (m.o <= 0) return null;
    const [px, py] = P(it.x, it.y);
    const wrap = (child: React.ReactNode, w?: number) => (
      <div key={i} style={{position: 'absolute', left: px, top: py, width: w, transform: `translate(-50%, -50%) translate(${m.dx}px, ${m.dy}px) scale(${m.s})`,
        opacity: m.o, filter: m.blur ? `blur(${m.blur}px)` : undefined, textAlign: 'center', whiteSpace: 'nowrap'}}>{child}</div>
    );
    const d = t - it.at;
    switch (it.type) {
      case 'text': {
        const f = it.font ?? 'script';
        const size = (it.size ?? (f === 'script' ? 0.115 : 0.12)) * U;
        const p = it.enter === 'type' ? Math.min(1, d / (it.dur ?? Math.max(8, it.text.length * 1.3))) : 1;
        return wrap(<span style={{fontFamily: FONT[f], fontWeight: WEIGHT[f], fontSize: size, color: it.color ?? '#fff', textShadow: GLOW,
          textTransform: f === 'heavy' ? 'uppercase' : undefined, letterSpacing: f === 'heavy' ? '0.01em' : undefined}}>{it.enter === 'type' ? <Typed text={it.text} p={p} /> : it.text}</span>);
      }
      case 'box': {
        const w = (it.w ?? 0.42) * W;
        return wrap(
          <div style={{width: w, padding: `${U * 0.022}px ${U * 0.03}px`, borderRadius: U * 0.018, border: `${Math.max(2, U * 0.004)}px solid #1a1a1a`,
            background: 'linear-gradient(160deg, #ffffff 30%, #c9c9c9 100%)', boxShadow: '0 14px 30px rgba(0,0,0,0.45)', boxSizing: 'border-box'}}>
            <span style={{fontFamily: it.font === 'sans' ? fonts.poppins : fonts.yellowtail, fontWeight: it.font === 'sans' ? 800 : 400, fontSize: U * 0.085, color: '#111'}}>
              {it.enter === 'type' ? <Typed text={it.text} p={Math.min(1, d / (it.dur ?? 14))} /> : it.text}</span>
          </div>, w);
      }
      case 'image': {
        const w = it.w * W;
        return wrap(
          <Img src={staticFile(it.src)} style={{width: w, height: it.circle ? w : 'auto', objectFit: 'cover', borderRadius: it.circle ? '50%' : 0,
            border: it.circle ? `${U * 0.008}px solid ${it.ring ?? '#c9c6ff'}` : undefined,
            filter: it.shadow !== false ? 'drop-shadow(0 18px 24px rgba(0,0,0,0.5))' : undefined}} />, w);
      }
      case 'num': {
        const s = (it.size ?? 0.09) * U;
        return wrap(<div style={{width: s, height: s, borderRadius: '50%', background: '#fff', border: `${s * 0.08}px solid #111`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: fonts.inter, fontWeight: 900, fontSize: s * 0.6, color: '#111', boxShadow: '0 6px 14px rgba(0,0,0,0.45)'}}>{it.n}</div>);
      }
      case 'badge': return wrap(<Badge text={it.text} size={(it.size ?? 0.13) * U} />);
      case 'counter': {
        const k = settle(Math.min(1, d / (it.dur ?? 40)));
        const v = Math.round(it.from + (it.to - it.from) * k);
        return wrap(<span style={{fontFamily: fonts.inter, fontWeight: 600, fontSize: (it.size ?? 0.12) * U, color: '#fff', textShadow: GLOW, fontVariantNumeric: 'tabular-nums'}}>
          {it.prefix ?? ''}{v.toLocaleString('en-US')}{it.suffix ?? ''}</span>);
      }
      default: return null;
    }
  };

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Background bg={spec.bg ?? {}} cam={cam} seed={(spec.frames % 97) + 1} />
      {boil && (
        <svg width={0} height={0} style={{position: 'absolute'}}>
          <filter id={id}><feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" seed={Math.floor(t / 3) % 50} /><feDisplacementMap in="SourceGraphic" scale={U * 0.006} /></filter>
        </svg>
      )}
      <AbsoluteFill style={{transformOrigin: '0 0', filter: boil ? `url(#${id})` : undefined,
        transform: `translate(${W / 2}px, ${H / 2}px) rotate(${cam.rot}deg) scale(${cam.zoom}) translate(${-cam.x * W}px, ${-cam.y * H}px)`}}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          {spec.items.map((it, i) => {
            if (it.type !== 'line' || t < it.at) return null;
            const pts = lines[i]!;
            const k = settle(Math.min(1, (t - it.at) / (it.dur ?? 18)));
            const out = it.out != null && t > it.out ? 1 - Math.min(1, (t - it.out) / 10) : 1;
            const w = (it.width ?? 0.012) * U;
            return (
              <g key={i} opacity={out} style={{filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.35))'}}>
                <mask id={`m${id}${i}`}><path d={smoothPath(pts)} fill="none" stroke="#fff" strokeWidth={w * 3} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} /></mask>
                <path d={smoothPath(pts)} fill="none" stroke={it.color ?? '#fff'} strokeWidth={w} strokeLinecap="round"
                  strokeDasharray={it.dashed === false ? undefined : `${w * 2.2} ${w * 2.4}`} mask={`url(#m${id}${i})`} />
              </g>
            );
          })}
        </svg>
        {spec.items.map((it, i) => {
          if (it.type === 'line') return null;
          if (it.type === 'follow') {
            const path = lines[it.along];
            if (!path || t < it.at - 1) return null;
            const k = glide(Math.min(1, Math.max(0, (t - it.at) / (it.dur ?? 40))));
            const [x, y] = pointAlong(path, k);
            const s = (it.size ?? 0.13) * U;
            return (
              <div key={i} style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', opacity: Math.min(1, (t - it.at + 1) / 4)}}>
                {it.what.kind === 'badge' ? <Badge text={it.what.text} size={s} /> :
                  <Img src={staticFile(it.what.src)} style={{width: s, height: s, borderRadius: it.what.circle ? '50%' : 0, objectFit: 'cover', filter: 'drop-shadow(0 12px 18px rgba(0,0,0,0.5))'}} />}
              </div>
            );
          }
          return draw(it, i);
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// black hexagon badge with a white rim (his "XP" icon)
export const Badge: React.FC<{text: string; size: number}> = ({text, size}) => (
  <svg width={size} height={size} viewBox="-55 -55 110 110" style={{filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.55))', overflow: 'visible'}}>
    <polygon points="0,-50 43.3,-25 43.3,25 0,50 -43.3,25 -43.3,-25" fill="#0d0d0d" stroke="#fff" strokeWidth={5} strokeLinejoin="round" />
    <polygon points="0,-41 35.5,-20.5 35.5,20.5 0,41 -35.5,20.5 -35.5,-20.5" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} />
    <text x={0} y={2} textAnchor="middle" dominantBaseline="middle" fontFamily={fonts.inter} fontWeight={700} fontSize={34} fill="#fff">{text}</text>
  </svg>
);
