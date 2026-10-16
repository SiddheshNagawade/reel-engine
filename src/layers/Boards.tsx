// STRUCTURE BOARDS for explainers (brain/animation-system.md §3, studied frame by frame on the references, 2026-10-17):
// direction.boards → edit.inserts kind 'board', one `type` each. Every step lands on his word (items[].at = frames from
// the board start; plan.mjs converts {word} / {s}).
//   list      everything stays visible; a highlight SLIDES to the current item. layout 'split' (pills left, the
//             current item's picture right, swapping) or 'cards' (cards in a row, the current one LIFTS)   [WHOOP]
//   chain     a process on sticky notes: a hand-drawn arrow draws itself (with its small label), the next note
//             slides in at its end, its picture after (shape first, content second)                      [protein]
//   wheel     a cycle / flywheel: a big ring of nodes, the camera sees the top one; each step the WHOLE wheel
//             rotates to bring the next node up (motion blur)                                             [WHOOP]
//   chapters  01/02/03 cards. mode 'strip': the current card darkens and its title types in; 'flip': cards fade
//             in and flip like playing cards to show their picture + title; 'tumble': they fall in rotating,
//             pile up, then straighten into a row                                                          [WHOOP, protein]
//   pile      real posts/tweets as white cards flying in from different sides, landing on top of each other;
//             the camera drifts with the pile ("everyone was talking about it")                          [WHOOP]
// Colours per board: bg, color (panels/cards), accent (highlight), ink. style 'full' (own canvas, captions hide) or 'over'.
import React from 'react';
import {Easing, Img, interpolate, staticFile, useVideoConfig} from 'remotion';
import {fonts} from './fonts';
import {isLight} from './Captions';
import {IlloIcon} from './Illos';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const back = Easing.out(Easing.back(1.6));

export type BoardItem = {at: number; text?: string; sub?: string; via?: string; img?: string; obj?: string; num?: string; name?: string; handle?: string};
export type BoardSpec = {
  type: 'list' | 'chain' | 'wheel' | 'chapters' | 'pile';
  style?: 'full' | 'over';
  bg?: string; color?: string; accent?: string; ink?: string;
  title?: string; // a small header (chain: "WHERE DOES WHEY COME FROM?")
  layout?: 'split' | 'cards'; // list
  mode?: 'strip' | 'flip' | 'tumble'; // chapters
  current?: number; // chapters (strip): the chapter that's on now (cards before it stay dark)
  items: BoardItem[];
};
type X = BoardSpec & {frames: number};

const Pic: React.FC<{it: BoardItem; size: number; round?: boolean}> = ({it, size, round}) =>
  it.img ? <Img src={it.img.startsWith('http') ? it.img : staticFile(it.img)} style={{width: size, height: size, objectFit: 'cover', borderRadius: round ? '50%' : size * 0.06}} />
  : it.obj ? <div style={{width: size, height: size}}><IlloIcon obj={it.obj} /></div>
  : null;
const cur = (items: BoardItem[], t: number) => { let c = -1; items.forEach((it, i) => t >= it.at && (c = i)); return c; };

// ── list ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const List: React.FC<{x: X; t: number; U: number; W: number; H: number}> = ({x, t, U, W, H}) => {
  const {fps} = useVideoConfig();
  const items = x.items;
  const ci = cur(items, t);
  const acc = x.accent ?? '#f6d77a', panel = x.color ?? '#0f7a4f';
  const appear = interpolate(t, [0, Math.round(0.35 * fps)], [0, 1], {...clamp, easing: easeOut});
  // the highlight glides between items (0.3 s)
  const prev = items.findIndex((_, i) => i === ci - 1);
  const glide = ci >= 0 ? interpolate(t, [items[ci].at, items[ci].at + Math.round(0.3 * fps)], [0, 1], {...clamp, easing: easeOut}) : 0;
  const hiPos = ci < 0 ? -1 : prev >= 0 ? prev + (ci - prev) * glide : ci;
  if ((x.layout ?? 'split') === 'cards') {
    const n = items.length, cw = Math.min(W * 0.8 / n, U * 0.3), ch = cw * 1.45, gap = cw * 0.12;
    const x0 = W / 2 - (n * cw + (n - 1) * gap) / 2;
    return (
      <>
        {items.map((it, i) => {
          const on = i === ci ? glide : 0;
          const inK = interpolate(t, [i * 3, i * 3 + Math.round(0.35 * fps)], [0, 1], {...clamp, easing: back});
          return (
            <div key={i} style={{position: 'absolute', left: x0 + i * (cw + gap), top: H * 0.5 - ch / 2, width: cw, height: ch, borderRadius: cw * 0.08,
              background: mixHex(x.color ?? '#dfeee6', '#ffffff', on * 0.5), border: `${U * 0.004}px solid rgba(0,0,0,0.12)`,
              boxShadow: `0 ${U * (0.01 + on * 0.04)}px ${U * (0.02 + on * 0.06)}px rgba(0,0,0,${0.15 + on * 0.2})`,
              transform: `translateY(${(1 - inK) * U * 0.2 - on * U * 0.04}px) scale(${0.9 + 0.1 * inK + on * 0.08})`, opacity: inK, zIndex: i === ci ? 5 : 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: U * 0.02, padding: cw * 0.08, boxSizing: 'border-box'}}>
              <div style={{opacity: on}}><Pic it={it} size={cw * 0.55} /></div>
              <div style={{fontFamily: fonts.inter, fontWeight: 800, fontSize: U * 0.036, textAlign: 'center', color: '#14332a', opacity: 0.15 + on * 0.85, lineHeight: 1.15}}>{it.text}</div>
              <div style={{position: 'absolute', right: cw * 0.08, bottom: cw * 0.04, fontFamily: fonts.anton, fontSize: U * 0.06, color: '#14332a', opacity: 0.55}}>{it.num ?? String(i + 1).padStart(2, '0')}</div>
            </div>
          );
        })}
      </>
    );
  }
  // split: side by side on a wide frame; on a tall reel the list sits on top and the picture below
  const tall = H > W * 1.2;
  const fs = U * (tall ? 0.042 : 0.036), rowH = fs * 2.3, pillW = tall ? W * 0.84 : W * 0.4;
  const top = tall ? H * 0.27 - (items.length * rowH) / 2 : H * 0.5 - (items.length * rowH) / 2;
  const PX = tall ? W * 0.08 : W * 0.05;
  const picC: [number, number] = tall ? [W / 2, H * 0.72] : [W * 0.75, H * 0.5];
  const picS = tall ? U * 0.5 : U * 0.44;
  const show = ci >= 0 ? items[ci] : null;
  const swap = ci >= 0 ? interpolate(t, [items[ci].at, items[ci].at + Math.round(0.35 * fps)], [0, 1], {...clamp, easing: easeOut}) : 0;
  return (
    <>
      <div style={{position: 'absolute', left: 0, top: 0, width: tall ? W : W / 2, height: tall ? H / 2 : H, background: panel, opacity: appear}} />
      <div style={{position: 'absolute', left: tall ? 0 : W / 2, top: tall ? H / 2 : 0, width: tall ? W : W / 2, height: tall ? H / 2 : H, background: acc, opacity: appear}} />
      {hiPos >= 0 && <div style={{position: 'absolute', left: PX, top: top + hiPos * rowH - fs * 0.15, width: pillW, height: fs * 1.9, borderRadius: fs, background: acc}} />}
      {items.map((it, i) => (
        <div key={i} style={{position: 'absolute', left: PX, top: top + i * rowH - fs * 0.15, width: pillW, height: fs * 1.9, borderRadius: fs, display: 'flex', alignItems: 'center',
          paddingLeft: fs * 0.8, boxSizing: 'border-box', background: i === Math.round(hiPos) ? 'transparent' : 'rgba(255,255,255,0.14)', opacity: appear,
          fontFamily: fonts.inter, fontWeight: 700, fontSize: fs, color: Math.abs(i - hiPos) < 0.5 ? '#1b1b1f' : '#ffffff'}}>{it.text}</div>
      ))}
      {show && (
        <div style={{position: 'absolute', left: picC[0] - picS / 2, top: picC[1] - picS / 2, width: picS, height: picS, opacity: swap,
          transform: `scale(${0.85 + 0.15 * swap})`, filter: `drop-shadow(0 ${U * 0.02}px ${U * 0.03}px rgba(0,0,0,0.25))`}}>
          <Pic it={show} size={picS} />
        </div>
      )}
    </>
  );
};
const mixHex = (a: string, b: string, p: number) => {
  const h = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) return a;
  const A = h(a), B = h(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * p)).join(',')})`;
};

// ── chain (sticky notes) ────────────────────────────────────────────────────────────────────────────────────────
const Chain: React.FC<{x: X; t: number; U: number; W: number; H: number}> = ({x, t, U, W, H}) => {
  const {fps} = useVideoConfig();
  const items = x.items, n = items.length;
  // a row on a wide frame, a column on a tall reel (arrows go down)
  const tall = H > W * 1.2;
  const note = tall ? Math.min((H * 0.7) / (n + (n - 1) * 0.45), U * 0.36) : Math.min((W * 0.86) / (n + (n - 1) * 0.55), U * 0.34);
  const gap = note * (tall ? 0.45 : 0.55);
  const x0 = W / 2 - (n * note + (n - 1) * gap) / 2, y0 = H * 0.46 - note / 2;
  const at = (i: number): [number, number] => tall ? [W / 2 - note / 2 + (i % 2 ? note * 0.35 : -note * 0.35), H * 0.52 - (n * note + (n - 1) * gap) / 2 + i * (note + gap)] : [x0 + i * (note + gap), y0];
  const ink = x.ink ?? '#1b1b1f', paper = x.color ?? '#f7d64a';
  const arrowT = Math.round(0.35 * fps);
  return (
    <>
      {x.title && <div style={{position: 'absolute', left: W * 0.05, top: H * 0.08, fontFamily: fonts.anton, fontSize: U * 0.035, letterSpacing: 1.5, color: ink,
        opacity: interpolate(t, [0, 8], [0, 1], clamp)}}>{x.title}</div>}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        {items.map((it, i) => {
          if (i === 0) return null;
          // the arrow draws in the 0.35 s BEFORE the next note arrives
          const p = interpolate(t, [it.at - arrowT, it.at], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
          if (p <= 0) return null;
          const [pxA, pyA] = at(i - 1), [pxB, pyB] = at(i);
          const A: [number, number] = tall ? [pxA + note / 2, pyA + note + gap * 0.1] : [pxA + note + gap * 0.12, pyA + note * 0.42];
          const B: [number, number] = tall ? [pxB + note / 2, pyB - gap * 0.1] : [pxB - gap * 0.12, pyB + note * 0.42];
          const C: [number, number] = tall ? [(A[0] + B[0]) / 2 + note * 0.45, (A[1] + B[1]) / 2] : [(A[0] + B[0]) / 2, A[1] - note * 0.28];
          const d = `M${A[0]},${A[1]} Q${C[0]},${C[1]} ${B[0]},${B[1]}`;
          const ang = Math.atan2(B[1] - C[1], B[0] - C[0]), hl = note * 0.07;
          const head = p > 0.95 ? `M${B[0] - Math.cos(ang - 0.5) * hl},${B[1] - Math.sin(ang - 0.5) * hl} L${B[0]},${B[1]} L${B[0] - Math.cos(ang + 0.5) * hl},${B[1] - Math.sin(ang + 0.5) * hl}` : '';
          return (
            <g key={i}>
              <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} fill="none" stroke={ink} strokeWidth={U * 0.005} strokeLinecap="round" />
              {head && <path d={head} fill="none" stroke={ink} strokeWidth={U * 0.005} strokeLinecap="round" strokeLinejoin="round" />}
              {it.via && <text x={tall ? C[0] + note * 0.05 : C[0]} y={tall ? C[1] : A[1] - note * 0.26} fontFamily={fonts.anton} fontSize={U * (tall ? 0.03 : 0.022)} fill={ink} textAnchor={tall ? 'start' : 'middle'} opacity={p}>{it.via.toUpperCase()}</text>}
            </g>
          );
        })}
      </svg>
      {items.map((it, i) => {
        const k = interpolate(t, [it.at, it.at + Math.round(0.3 * fps)], [0, 1], {...clamp, easing: back});
        if (k <= 0) return null;
        const pic = interpolate(t, [it.at + Math.round(0.25 * fps), it.at + Math.round(0.45 * fps)], [0, 1], clamp);
        const rot = ((i * 37) % 7) - 3;
        return (
          <div key={i} style={{position: 'absolute', left: at(i)[0], top: at(i)[1], width: note, height: note, background: paper, boxShadow: `0 ${U * 0.012}px ${U * 0.02}px rgba(0,0,0,0.22)`,
            transform: `${tall ? 'translateY' : 'translateX'}(${(1 - k) * U * 0.12}px) rotate(${rot}deg) scale(${0.8 + 0.2 * k})`, opacity: Math.min(1, k * 1.5),
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: note * 0.05}}>
            <div style={{opacity: pic}}><Pic it={it} size={note * 0.56} /></div>
            <div style={{fontFamily: fonts.anton, fontSize: note * 0.11, color: ink, letterSpacing: 1, textAlign: 'center'}}>{(it.text ?? '').toUpperCase()}</div>
          </div>
        );
      })}
    </>
  );
};

// ── wheel (cycle) ───────────────────────────────────────────────────────────────────────────────────────────────
const Wheel: React.FC<{x: X; t: number; U: number; W: number; H: number}> = ({x, t, U, W, H}) => {
  const {fps} = useVideoConfig();
  const items = x.items, n = Math.max(3, items.length);
  const ci = Math.max(0, cur(items, t));
  const R = U * 0.95, cx = W / 2, cy = H * 0.42 + R; // centre far below: only the top of the wheel is in view
  const step = (360 / n);
  const rotFor = (i: number) => -i * step;
  const from = ci > 0 ? rotFor(ci - 1) : 0, to = rotFor(ci);
  const p = ci > 0 ? interpolate(t, [items[ci].at, items[ci].at + Math.round(0.45 * fps)], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)}) : 1;
  const rot = from + (to - from) * p;
  const moving = p > 0 && p < 1;
  const node = U * 0.42, col = x.color ?? '#137a52', acc = x.accent ?? '#f2d27a';
  const appear = interpolate(t, [0, Math.round(0.35 * fps)], [0, 1], {...clamp, easing: easeOut});
  return (
    <div style={{position: 'absolute', inset: 0, opacity: appear, filter: moving ? `blur(${Math.sin(p * Math.PI) * 5}px)` : undefined}}>
      <div style={{position: 'absolute', left: cx - R, top: cy - R, width: R * 2, height: R * 2, borderRadius: '50%', border: `${U * 0.11}px solid ${col}`, opacity: 0.35, boxSizing: 'border-box'}} />
      {items.map((it, i) => {
        const a = ((i * step + rot) * Math.PI) / 180;
        const px = cx + Math.sin(a) * R, py = cy - Math.cos(a) * R;
        const on = i === ci ? p : 0;
        return (
          <div key={i} style={{position: 'absolute', left: px - node / 2, top: py - node / 2, width: node, height: node, borderRadius: '50%', background: col,
            boxShadow: `0 ${U * 0.02}px ${U * 0.05}px rgba(0,0,0,0.35)`, transform: `rotate(${(i * step + rot)}deg)`, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: node * 0.14, boxSizing: 'border-box'}}>
            <div style={{fontFamily: fonts.inter, fontWeight: 600, fontSize: node * 0.075, color: '#ffffff', opacity: 0.8}}>{it.sub}</div>
            <div style={{fontFamily: fonts.inter, fontWeight: 800, fontSize: node * 0.095, color: mixHex('#ffffff', acc, on), lineHeight: 1.15}}>{it.text}</div>
          </div>
        );
      })}
    </div>
  );
};

// ── chapters ────────────────────────────────────────────────────────────────────────────────────────────────────
const Chapters: React.FC<{x: X; t: number; U: number; W: number; H: number}> = ({x, t, U, W, H}) => {
  const {fps} = useVideoConfig();
  const items = x.items, n = items.length, mode = x.mode ?? 'strip';
  const cw = Math.min((W * 0.82) / n, U * 0.3), ch = cw * 1.4, gap = cw * 0.1;
  const x0 = W / 2 - (n * cw + (n - 1) * gap) / 2, y0 = H * 0.5 - ch / 2;
  const dark = x.color ?? '#123d2c', light = '#f4efe4', ink = x.ink ?? '#ffffff';
  const num = (it: BoardItem, i: number) => it.num ?? String(i + 1).padStart(2, '0');
  return (
    <>
      {items.map((it, i) => {
        const L = x0 + i * (cw + gap);
        if (mode === 'strip') {
          const on = (x.current ?? n) > i || t >= it.at;
          const k = t >= it.at ? interpolate(t, [it.at, it.at + Math.round(0.6 * fps)], [0, 1], clamp) : on && i < (x.current ?? 0) ? 1 : 0;
          const typed = it.text ? it.text.slice(0, Math.floor(interpolate(t, [it.at + Math.round(0.4 * fps), it.at + Math.round(1.2 * fps)], [0, it.text.length], clamp))) : '';
          const appear = interpolate(t, [i * 2, i * 2 + 8], [0, 1], clamp);
          return (
            <div key={i} style={{position: 'absolute', left: L, top: y0, width: cw, height: ch, borderRadius: cw * 0.05, background: mixHex(light, '#0d0d0d', k), opacity: appear,
              border: `1px solid rgba(0,0,0,0.12)`, padding: cw * 0.1, boxSizing: 'border-box'}}>
              <div style={{fontFamily: fonts.inter, fontWeight: 800, fontSize: cw * 0.3, color: mixHex('#141414', '#ffffff', k)}}>{num(it, i)}</div>
              <div style={{fontFamily: fonts.inter, fontWeight: 600, fontSize: cw * 0.085, color: '#ffffff', lineHeight: 1.25, marginTop: cw * 0.04}}>{t >= it.at ? typed : ''}</div>
            </div>
          );
        }
        if (mode === 'flip') {
          const a = interpolate(t, [it.at, it.at + Math.round(0.2 * fps)], [0, 1], clamp);
          const f = interpolate(t, [it.at + Math.round(0.6 * fps), it.at + Math.round(1.0 * fps)], [0, 180], {...clamp, easing: Easing.inOut(Easing.cubic)});
          const face = f > 90;
          return (
            <div key={i} style={{position: 'absolute', left: L, top: y0, width: cw, height: ch, perspective: cw * 4, opacity: a}}>
              <div style={{width: '100%', height: '100%', borderRadius: cw * 0.06, background: dark, transform: `rotateY(${f}deg)`, boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: cw * 0.06}}>
                {!face && <div style={{fontFamily: fonts.anton, fontSize: cw * 0.34, color: ink}}>{num(it, i)}</div>}
                {face && (
                  <div style={{transform: 'scaleX(-1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: cw * 0.06}}>
                    <div style={{fontFamily: fonts.anton, fontSize: cw * 0.09, color: ink, opacity: 0.7}}>{num(it, i)}</div>
                    <Pic it={it} size={cw * 0.72} />
                    <div style={{fontFamily: fonts.anton, fontSize: cw * 0.085, color: ink, textAlign: 'center', padding: `0 ${cw * 0.06}px`}}>{(it.text ?? '').toUpperCase()}</div>
                  </div>
                )}
              </div>
            </div>
          );
        }
        // tumble: falls from the top-left rotating, lands in a pile at the centre, then everything straightens into a row
        const fall = interpolate(t, [it.at, it.at + Math.round(0.6 * fps)], [0, 1], {...clamp, easing: Easing.out(Easing.quad)});
        if (fall <= 0) return null;
        const lastAt = Math.max(...items.map((q) => q.at)) + Math.round(0.9 * fps);
        const tidy = interpolate(t, [lastAt, lastAt + Math.round(0.4 * fps)], [0, 1], {...clamp, easing: easeOut});
        const pileX = W / 2 - cw / 2 + (i - (n - 1) / 2) * cw * 0.18, pileY = y0 + ((i * 13) % 5) * U * 0.004;
        const sx = W * 0.15, sy = -ch * 1.2;
        const px = sx + (pileX - sx) * fall, py = sy + (pileY - sy) * fall;
        const pr = (1 - fall) * (-160 + i * 50) + ((i * 29) % 21) - 10;
        return (
          <div key={i} style={{position: 'absolute', left: px + (L - px) * tidy, top: py + (y0 - py) * tidy, width: cw, height: ch, borderRadius: cw * 0.06, background: dark,
            transform: `rotate(${pr * (1 - tidy)}deg)`, boxShadow: '0 12px 30px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: i}}>
            <div style={{fontFamily: fonts.anton, fontSize: cw * 0.34, color: ink}}>{num(it, i)}</div>
          </div>
        );
      })}
    </>
  );
};

// ── pile of reactions ───────────────────────────────────────────────────────────────────────────────────────────
const Pile: React.FC<{x: X; t: number; U: number; W: number; H: number}> = ({x, t, U, W, H}) => {
  const {fps} = useVideoConfig();
  const items = x.items;
  const cw = Math.min(W * 0.62, U * 0.8);
  const shown = items.filter((it) => t >= it.at).length;
  const drift = interpolate(t, [0, Math.max(1, items[items.length - 1]?.at ?? 1) + fps], [0, -U * 0.08], clamp); // camera follows the pile
  return (
    <div style={{position: 'absolute', inset: 0, transform: `translateY(${drift}px)`}}>
      {items.map((it, i) => {
        if (t < it.at) return null;
        const k = interpolate(t, [it.at, it.at + Math.round(0.35 * fps)], [0, 1], {...clamp, easing: easeOut});
        const side = [[-1.2, 0.3], [1.2, -0.2], [0.1, -1.1], [-1, -0.8], [1.1, 0.9]][i % 5];
        const hx = W / 2 - cw / 2 + (((i * 53) % 7) - 3) * U * 0.035, hy = H * 0.24 + i * U * 0.11 - Math.max(0, i - 3) * U * 0.05;
        const rot = (((i * 31) % 9) - 4) * 1.2;
        const depth = shown - 1 - i;
        return (
          <div key={i} style={{position: 'absolute', left: hx + side[0] * W * (1 - k), top: hy + side[1] * H * (1 - k), width: cw, background: '#ffffff', borderRadius: U * 0.022,
            padding: U * 0.025, boxSizing: 'border-box', boxShadow: '0 10px 30px rgba(0,0,0,0.25)', transform: `rotate(${rot + (1 - k) * side[0] * 12}deg)`, zIndex: i,
            filter: depth > 2 ? 'brightness(0.92)' : undefined}}>
            <div style={{display: 'flex', alignItems: 'center', gap: U * 0.015}}>
              <div style={{width: U * 0.055, height: U * 0.055, borderRadius: '50%', background: `hsl(${(i * 67) % 360},45%,62%)`, overflow: 'hidden', flexShrink: 0}}>
                {it.img && <Pic it={it} size={U * 0.055} round />}
              </div>
              <div>
                <div style={{fontFamily: fonts.inter, fontWeight: 800, fontSize: U * 0.026, color: '#111'}}>{it.name ?? 'someone'}</div>
                <div style={{fontFamily: fonts.inter, fontWeight: 500, fontSize: U * 0.02, color: '#7a7a80'}}>{it.handle ?? ''}</div>
              </div>
              <div style={{marginLeft: 'auto', fontFamily: fonts.inter, fontWeight: 900, fontSize: U * 0.03, color: '#111'}}>𝕏</div>
            </div>
            <div style={{fontFamily: fonts.inter, fontWeight: 500, fontSize: U * 0.028, color: '#111', marginTop: U * 0.015, lineHeight: 1.3}}>{it.text}</div>
          </div>
        );
      })}
    </div>
  );
};

export const Board: React.FC<{x: X; t: number}> = ({x, t}) => {
  const {fps, width: W, height: H} = useVideoConfig();
  const U = Math.min(W, H * 0.5625);
  const full = x.style !== 'over';
  const bg = x.bg ?? (x.type === 'wheel' ? '#0b0f0d' : x.type === 'pile' ? '#0f5a3e' : '#efe9dc');
  const out = interpolate(t, [x.frames - Math.round(0.3 * fps), x.frames], [1, 0], clamp);
  const bgIn = interpolate(t, [0, Math.round(0.2 * fps)], [0, 1], clamp);
  const body = x.type === 'list' ? <List x={x} t={t} U={U} W={W} H={H} />
    : x.type === 'chain' ? <Chain x={x} t={t} U={U} W={W} H={H} />
    : x.type === 'wheel' ? <Wheel x={x} t={t} U={U} W={W} H={H} />
    : x.type === 'chapters' ? <Chapters x={x} t={t} U={U} W={W} H={H} />
    : <Pile x={x} t={t} U={U} W={W} H={H} />;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
      {full && <div style={{position: 'absolute', inset: 0, background: bg, opacity: bgIn}} />}
      <div style={{position: 'absolute', inset: 0, opacity: out, transform: `translateY(${(1 - out) * -H * 0.06}px)`, filter: out < 1 ? `blur(${(1 - out) * 8}px)` : undefined}}>{body}</div>
    </div>
  );
};
