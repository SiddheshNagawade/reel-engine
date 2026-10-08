// Hand-drawn (code) props that stick to tracked points: anime reaction marks, accessories, bubbles, callouts.
// Each prop draws in its own space where 100 units = the speaker's face height, (0,0) = its anchor point.
// t = frames since it appeared, k = 0→1 entrance progress (for draw-on strokes), n = frames it lasts.
// Add a prop: one entry in PROPS (default anchor, size, motion) + its drawing. List: .claude/skills/motion-graphics/SKILL.md
import React from 'react';
import {Img, staticFile} from 'remotion';
import {fonts} from '../layers/fonts';

export type Anchor =
  | 'eyes' | 'leye' | 'reye' | 'nose' | 'mouth' | 'chin' | 'head' | 'face'
  | 'hand' | 'hand.L' | 'hand.R' | 'finger' | 'finger.L' | 'finger.R'
  | 'neck' | 'shoulder.L' | 'shoulder.R' | 'screen';
export type Enter = 'pop' | 'drop' | 'fade' | 'draw' | 'slide' | 'none';
export type Idle = 'bob' | 'wiggle' | 'pulse' | 'spin' | 'float' | 'none';
export type DrawArgs = {t: number; k: number; n: number; text?: string; color?: string; src?: string; seed: number; back: [number, number]}; // back = from the prop to its anchor (units)
export type PropDef = {
  to: Anchor; // default anchor
  offset?: [number, number]; // default offset from the anchor (units)
  tilt?: boolean; // follow the head's tilt (default: true on face anchors)
  enter?: Enter;
  idle?: Idle;
  sound?: string | null; // sfx folder in public/assets/sfx (pop / whoosh / hit) or null
  box?: (a: {text?: string}) => [number, number]; // half width/height (units): kept inside the frame, flips to the roomier side
  draw: (a: DrawArgs) => React.ReactNode;
};

const INK = '#141414';
const W = 3.2; // outline width (units)
const rnd = (seed: number, i: number) => {
  const x = Math.sin(seed * 127.1 + i * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const star4 = (r: number, w = 0.28) => `M0,${-r} Q${r * w},${-r * w} ${r},0 Q${r * w},${r * w} 0,${r} Q${-r * w},${r * w} ${-r},0 Q${-r * w},${-r * w} 0,${-r}Z`;
const heart = (s: number) => `M0,${s * 0.35} C${-s * 0.9},${-s * 0.25} ${-s * 0.45},${-s * 0.95} 0,${-s * 0.45} C${s * 0.45},${-s * 0.95} ${s * 0.9},${-s * 0.25} 0,${s * 0.35}Z`;

// Text that wraps to ~maxChars per line; returns lines.
const wrap = (text: string, maxChars: number) => {
  const lines: string[] = [];
  for (const word of text.split(/\s+/)) {
    const last = lines[lines.length - 1];
    if (last && (last + ' ' + word).length <= maxChars) lines[lines.length - 1] = last + ' ' + word;
    else lines.push(word);
  }
  return lines;
};

// A box of text with a hand-made outline, used by bubbles, labels and notes. Returns its size too.
const textBlock = (text: string, size: number, maxChars: number) => {
  const lines = wrap(text, maxChars);
  const w = Math.max(...lines.map((l) => l.length)) * size * 0.56 + size * 1.2;
  const h = lines.length * size * 1.15 + size * 0.8;
  return {lines, w, h};
};
const Lines: React.FC<{lines: string[]; size: number; fill?: string; family?: string; cy?: number}> = ({lines, size, fill = INK, family = fonts.poppins, cy = 0}) => (
  <text textAnchor="middle" fontFamily={family} fontWeight={800} fontSize={size} fill={fill}>
    {lines.map((l, i) => (
      <tspan key={i} x={0} y={cy + (i - (lines.length - 1) / 2) * size * 1.15 + size * 0.36}>
        {l}
      </tspan>
    ))}
  </text>
);

export const PROPS: Record<string, PropDef> = {
  // ── accessories ────────────────────────────────────────────────────────────
  sunglasses: {
    to: 'eyes',
    enter: 'drop',
    idle: 'none',
    sound: 'whoosh',
    draw: () => (
      <g>
        <path d="M-58,-12 L58,-12" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        {[-1, 1].map((s) => (
          <g key={s}>
            <path d={`M${s * 6},-13 L${s * 52},-13 Q${s * 54},13 ${s * 33},15 Q${s * 10},15 ${s * 6},-5 Z`} fill={INK} />
            <path d={`M${s * 38},-9 L${s * 46},-9 L${s * 38},3 L${s * 33},3Z`} fill="#fff" opacity={0.7} />
          </g>
        ))}
      </g>
    ),
  },
  crown: {
    to: 'head',
    offset: [0, 4],
    enter: 'drop',
    idle: 'bob',
    sound: 'pop',
    draw: () => (
      <g>
        <path d="M-34,0 L-38,-34 L-18,-14 L0,-40 L18,-14 L38,-34 L34,0 Z" fill="#FFC531" stroke={INK} strokeWidth={W} strokeLinejoin="round" />
        <rect x={-35} y={-4} width={70} height={10} rx={3} fill="#F2A900" stroke={INK} strokeWidth={W} />
        {[-38, 0, 38].map((x, i) => <circle key={i} cx={x} cy={i === 1 ? -40 : -34} r={4.5} fill="#FF4D6D" stroke={INK} strokeWidth={2} />)}
        <circle cx={0} cy={1} r={3.5} fill="#3DDCFF" stroke={INK} strokeWidth={1.6} />
      </g>
    ),
  },
  halo: {
    to: 'head',
    offset: [0, -10],
    enter: 'fade',
    idle: 'float',
    sound: null,
    draw: ({t}) => (
      <g>
        <ellipse rx={36} ry={9} fill="none" stroke="#FFE066" strokeWidth={14} opacity={0.35 + 0.1 * Math.sin(t / 5)} />
        <ellipse rx={36} ry={9} fill="none" stroke="#FFD43B" strokeWidth={6} />
        <ellipse rx={36} ry={9} fill="none" stroke="#FFF7CC" strokeWidth={2} />
      </g>
    ),
  },
  horns: {
    to: 'head',
    offset: [0, 14],
    enter: 'pop',
    idle: 'none',
    sound: 'pop',
    draw: () => (
      <g>
        {[-1, 1].map((s) => (
          <path key={s} d={`M${s * 14},0 Q${s * 18},-26 ${s * 40},-38 Q${s * 30},-16 ${s * 30},2 Z`} fill="#E5383B" stroke={INK} strokeWidth={W} strokeLinejoin="round" />
        ))}
      </g>
    ),
  },
  // ── anime reaction marks (manpu) ───────────────────────────────────────────
  anger: {
    to: 'head',
    offset: [42, 22],
    enter: 'pop',
    idle: 'pulse',
    sound: 'hit',
    draw: () => (
      <g stroke="#E5383B" strokeWidth={6} fill="none" strokeLinecap="round">
        {[0, 90, 180, 270].map((r) => (
          <path key={r} transform={`rotate(${r})`} d="M5,-17 Q5,-5 17,-5" />
        ))}
      </g>
    ),
  },
  sweat: {
    to: 'head',
    offset: [40, 38],
    enter: 'pop',
    idle: 'none',
    sound: null,
    draw: ({t}) => {
      const y = Math.min(12, t * 0.5);
      return (
        <g transform={`translate(0,${y})`}>
          <path d="M0,-16 Q11,0 9,7 Q6,15 0,15 Q-6,15 -9,7 Q-11,0 0,-16Z" fill="#8FD3FF" stroke={INK} strokeWidth={2.4} />
          <path d="M-4,2 Q-5,8 -1,10" stroke="#fff" strokeWidth={2.6} fill="none" strokeLinecap="round" />
        </g>
      );
    },
  },
  question: {
    to: 'head',
    offset: [38, 6],
    enter: 'pop',
    idle: 'wiggle',
    sound: 'pop',
    draw: ({t}) => (
      <g fontFamily={fonts.chewy} fontWeight={400} textAnchor="middle" stroke={INK} strokeWidth={2.2} paintOrder="stroke">
        <text x={0} y={0} fontSize={46} fill="#FFD43B" transform={`rotate(${10 + 6 * Math.sin(t / 6)})`}>?</text>
        <text x={-24} y={-22} fontSize={30} fill="#FFD43B" transform={`rotate(${-14 + 6 * Math.sin(t / 5 + 1)})`}>?</text>
      </g>
    ),
  },
  exclaim: {
    to: 'head',
    offset: [30, 0],
    enter: 'pop',
    idle: 'pulse',
    sound: 'pop',
    draw: () => (
      <g>
        {[-50, -20, 10].map((a, i) => (
          <path key={i} transform={`rotate(${a})`} d="M0,-28 L0,-40" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        ))}
        <text x={0} y={14} textAnchor="middle" fontFamily={fonts.anton} fontSize={50} fill="#FF4D4D" stroke={INK} strokeWidth={2.4} paintOrder="stroke">!</text>
      </g>
    ),
  },
  bulb: {
    to: 'head',
    offset: [0, -14],
    enter: 'pop',
    idle: 'bob',
    sound: 'pop',
    draw: ({t}) => {
      const on = t > 6 ? 1 : 0;
      return (
        <g>
          {on ? [-60, -30, 0, 30, 60].map((a) => <path key={a} transform={`rotate(${a})`} d={`M0,-30 L0,${-40 - 3 * Math.sin(t / 3)}`} stroke="#FFD43B" strokeWidth={4} strokeLinecap="round" />) : null}
          <circle r={18} cy={-6} fill={on ? '#FFE066' : '#F1F1F1'} stroke={INK} strokeWidth={W} />
          <rect x={-8} y={10} width={16} height={10} rx={2} fill="#9AA5B1" stroke={INK} strokeWidth={2.4} />
          <path d="M-5,-4 Q0,4 5,-4" stroke={INK} strokeWidth={2} fill="none" />
        </g>
      );
    },
  },
  blush: {
    to: 'eyes',
    enter: 'fade',
    idle: 'none',
    sound: null,
    draw: () => (
      <g>
        {[-1, 1].map((s) => (
          <g key={s} transform={`translate(${s * 30},20)`}>
            <ellipse rx={12} ry={6} fill="#FF7A9A" opacity={0.55} />
            {[-6, 0, 6].map((x) => <path key={x} d={`M${x - 2},3 L${x + 2},-3`} stroke="#E0446A" strokeWidth={1.6} strokeLinecap="round" />)}
          </g>
        ))}
      </g>
    ),
  },
  tears: {
    to: 'eyes',
    enter: 'fade',
    idle: 'none',
    sound: null,
    draw: ({t}) => (
      <g>
        {[-1, 1].map((s) => (
          <g key={s}>
            <path d={`M${s * 22},4 Q${s * 26},40 ${s * 22},75`} stroke="#6EC6FF" strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.9} />
            <path d={`M${s * 22},4 Q${s * 26},40 ${s * 22},75`} stroke="#fff" strokeWidth={3} fill="none" strokeDasharray="6 14" strokeDashoffset={-t * 2.5} />
          </g>
        ))}
      </g>
    ),
  },
  zzz: {
    to: 'head',
    offset: [30, 0],
    enter: 'fade',
    idle: 'none',
    sound: null,
    draw: ({t}) => (
      <g fontFamily={fonts.chewy} textAnchor="middle" fill="#B197FC" stroke={INK} strokeWidth={2} paintOrder="stroke">
        {[0, 1, 2].map((i) => {
          const p = ((t / 40 + i / 3) % 1);
          return <text key={i} x={p * 30} y={-p * 60} fontSize={18 + p * 22} opacity={Math.sin(p * Math.PI)}>Z</text>;
        })}
      </g>
    ),
  },
  hearts: {
    to: 'head',
    offset: [0, 10],
    enter: 'fade',
    idle: 'none',
    sound: 'pop',
    draw: ({t, seed}) => (
      <g>
        {[0, 1, 2, 3].map((i) => {
          const p = (t / 45 + i / 4) % 1;
          const x = (rnd(seed, i) - 0.5) * 110;
          return <path key={i} transform={`translate(${x + 8 * Math.sin(t / 8 + i)},${-p * 70}) scale(${0.7 + 0.5 * Math.sin(p * Math.PI)})`} d={heart(16)} fill="#FF4D6D" stroke={INK} strokeWidth={2} opacity={Math.sin(p * Math.PI)} />;
        })}
      </g>
    ),
  },
  sparkles: {
    to: 'face',
    enter: 'fade',
    idle: 'none',
    sound: null,
    draw: ({t, seed}) => (
      <g>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = rnd(seed, i) * Math.PI * 2;
          const r = 55 + rnd(seed, i + 9) * 25;
          const tw = Math.max(0, Math.sin(t / 5 + i * 1.7));
          return <path key={i} transform={`translate(${Math.cos(a) * r},${Math.sin(a) * r * 1.2}) scale(${0.4 + tw})`} d={star4(10)} fill={i % 2 ? '#FFF3B0' : '#FFFFFF'} stroke="#F2B705" strokeWidth={1.2} />;
        })}
      </g>
    ),
  },
  fire: {
    to: 'hand',
    offset: [0, -20],
    tilt: false,
    enter: 'pop',
    idle: 'none',
    sound: 'whoosh',
    draw: ({t}) => {
      const f = (i: number) => Math.sin(t / 2.2 + i) * 4;
      return (
        <g>
          <path d={`M0,20 C-26,14 -26,-10 -12,-24 C-12,-12 -4,-10 -2,-16 C${-4 + f(1)},-34 ${6 + f(2)},-44 ${2 + f(3)},-58 C20,-40 30,-20 22,4 C18,16 10,20 0,20Z`} fill="#FF6B1A" stroke={INK} strokeWidth={W} strokeLinejoin="round" />
          <path d={`M0,16 C-14,12 -14,-4 -6,-12 C-4,-4 2,-4 2,-10 C${4 + f(4)},-22 ${10 + f(5)},-28 ${8 + f(1)},-34 C16,-20 18,-6 14,6 C10,14 6,16 0,16Z`} fill="#FFD43B" />
        </g>
      );
    },
  },
  // ── talking: bubbles ───────────────────────────────────────────────────────
  bubble: {
    to: 'mouth',
    offset: [70, -60],
    tilt: false,
    enter: 'pop',
    idle: 'none',
    sound: 'pop',
    box: ({text = '…'}) => {
      const {w, h} = textBlock(text, 15, 14);
      return [w / 2, h / 2];
    },
    draw: ({text = '…', color = '#FFFFFF', back}) => {
      const {lines, w, h} = textBlock(text, 15, 14);
      // tail: from the bubble's edge (side facing the mouth) to 70% of the way to the mouth
      const sx = Math.sign(back[0]) || -1;
      const sy = Math.sign(back[1]) || 1;
      const bx = sx * w * 0.18;
      const by = sy * (h / 2 - 2);
      const tx = back[0] * 0.7;
      const ty = back[1] * 0.7;
      return (
        <g>
          <path d={`M${bx - 9},${by} L${tx},${ty} L${bx + 9},${by}Z`} fill={color} stroke={INK} strokeWidth={W} strokeLinejoin="round" />
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.35} fill={color} stroke={INK} strokeWidth={W} />
          <path d={`M${bx - 7},${by - sy} L${bx + 7},${by - sy}`} stroke={color} strokeWidth={W + 2} />
          <Lines lines={lines} size={15} />
        </g>
      );
    },
  },
  thought: {
    to: 'head',
    offset: [55, -30],
    tilt: false,
    enter: 'pop',
    idle: 'float',
    sound: 'pop',
    box: ({text = '…'}) => {
      const {w, h} = textBlock(text, 14, 14);
      return [w * 0.5 + h * 0.3, h * 0.9];
    },
    draw: ({text = '…', back}) => {
      const {lines, w, h} = textBlock(text, 14, 14);
      const bumps = Math.max(6, Math.round((w + h) / 14));
      return (
        <g>
          <circle cx={back[0] * 0.75} cy={back[1] * 0.75} r={4} fill="#fff" stroke={INK} strokeWidth={2.4} />
          <circle cx={back[0] * 0.55} cy={back[1] * 0.55} r={7} fill="#fff" stroke={INK} strokeWidth={2.4} />
          {Array.from({length: bumps}, (_, i) => {
            const a = (i / bumps) * Math.PI * 2;
            return <circle key={i} cx={Math.cos(a) * w * 0.48} cy={Math.sin(a) * h * 0.55} r={h * 0.32} fill="#fff" stroke={INK} strokeWidth={W} />;
          })}
          <ellipse rx={w * 0.5} ry={h * 0.56} fill="#fff" />
          <Lines lines={lines} size={14} />
        </g>
      );
    },
  },
  // ── informative: callouts ──────────────────────────────────────────────────
  label: {
    to: 'face',
    offset: [-70, -95],
    tilt: false,
    enter: 'draw',
    idle: 'none',
    sound: 'pop',
    box: ({text = ''}) => {
      const {w, h} = textBlock(text, 15, 16);
      return [w / 2, h / 2];
    },
    draw: ({text = '', k, color = '#FFD43B', back}) => {
      const {lines, w, h} = textBlock(text, 15, 16);
      // hand-drawn arrow from the label's edge to just short of the anchor, bowing outwards
      const [ax, ay] = back;
      const d = Math.hypot(ax, ay) || 1;
      const sx = (Math.abs(ax) / d > 0.6 ? Math.sign(ax) * w * 0.5 : 0) || 0;
      const sy = sx ? 0 : Math.sign(ay) * h * 0.55;
      const ex = ax - (ax / d) * 14;
      const ey = ay - (ay / d) * 14;
      const cx = (sx + ex) / 2 - (ey - sy) * 0.25;
      const cy = (sy + ey) / 2 + (ex - sx) * 0.25;
      const ang = Math.atan2(ey - cy, ex - cx);
      const head = (a: number) => `${ex - Math.cos(ang + a) * 13},${ey - Math.sin(ang + a) * 13}`;
      const len = d * 1.3 + 20;
      return (
        <g>
          <path d={`M${sx},${sy} Q${cx},${cy} ${ex},${ey}`} stroke="#fff" strokeWidth={4.5} fill="none" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - k)} />
          <path d={`M${head(0.5)} L${ex},${ey} L${head(-0.5)}`} stroke="#fff" strokeWidth={4.5} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={k > 0.9 ? 1 : 0} />
          <g transform={`scale(${Math.min(1, k * 1.6)})`}>
            <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={color} stroke={INK} strokeWidth={W} transform="rotate(-3)" />
            <g transform="rotate(-3)"><Lines lines={lines} size={15} /></g>
          </g>
        </g>
      );
    },
  },
  circle: {
    to: 'face',
    tilt: false,
    enter: 'draw',
    idle: 'none',
    sound: null,
    draw: ({k, color = '#FF3B3B'}) => {
      const len = 420;
      return <path d="M-5,-62 C40,-64 66,-30 62,8 C58,48 20,66 -14,62 C-52,58 -68,22 -62,-14 C-56,-46 -26,-64 8,-60" stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - k)} />;
    },
  },
  note: {
    // a sticky note on screen for key points (informative videos); text lines separated by " | "
    to: 'screen',
    tilt: false,
    box: ({text = ''}) => {
      const items = text.split('|').map((x) => x.trim()).filter(Boolean);
      return [(Math.max(110, ...items.map((it) => (it.length + 3) * 13 * 0.56)) + 28) / 2, (34 + items.length * 26) / 2];
    },
    enter: 'slide',
    idle: 'none',
    sound: 'pop',
    draw: ({text = '', t, color = '#FFE873'}) => {
      const items = text.split('|').map((s) => s.trim()).filter(Boolean);
      const size = 13;
      const w = Math.max(110, ...items.map((it) => (it.length + 3) * size * 0.56)) + 28;
      const h = 34 + items.length * 26;
      return (
        <g transform="rotate(-2.5)">
          <rect x={-w / 2 + 3} y={-h / 2 + 4} width={w} height={h} fill="#000" opacity={0.18} />
          <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={color} />
          <rect x={-18} y={-h / 2 - 7} width={36} height={14} fill="#fff" opacity={0.6} transform="rotate(4)" />
          {items.map((it, i) => (
            <text key={i} x={-w / 2 + 14} y={-h / 2 + 32 + i * 26} fontFamily={fonts.poppins} fontWeight={800} fontSize={size} fill={INK} opacity={Math.min(1, Math.max(0, (t - 8 - i * 12) / 6))}>
              {items.length > 1 ? `${i + 1}. ` : ''}{it}
            </text>
          ))}
        </g>
      );
    },
  },
  // ── any picture: a cut-out sticker (scripts/sticker.py) or library PNG ─────
  image: {
    to: 'face',
    tilt: false,
    enter: 'pop',
    idle: 'bob',
    sound: 'pop',
    box: () => [62, 62],
    draw: ({src}) => (src ? (
      <foreignObject x={-60} y={-60} width={120} height={120}>
        <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
      </foreignObject>
    ) : null),
  },
};
