import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate} from 'remotion';

// Card stage: clips/images as rounded "photo cards" on a calm background that MORPH between layouts
// (single → row → grid → stack) instead of cutting. Objects carry across beats, so the eye follows the story.
// Entrances blur→sharp with a soft overshoot; fast moves get a little motion blur. Works in 9:16 and 16:9.
export type StageItem = {src: string; video?: boolean; trimBefore?: number; label?: string};
export type StageBeat = {at: number; layout: 'single' | 'row' | 'grid' | 'stack' | 'focus'; focus?: number};

type Rect = {x: number; y: number; w: number; h: number; r: number; o: number};

function layoutRects(layout: StageBeat['layout'], n: number, W: number, H: number, focus = 0): Rect[] {
  const portrait = H > W;
  const gap = Math.min(W, H) * 0.03;
  const rects: Rect[] = [];
  for (let i = 0; i < n; i++) {
    let r: Rect;
    if (layout === 'single' || (layout === 'focus' && i === focus)) {
      const w = portrait ? W * 0.82 : W * 0.6, h = portrait ? H * 0.5 : H * 0.7;
      r = {x: (W - w) / 2, y: (H - h) / 2, w, h, r: 0, o: 1};
    } else if (layout === 'focus') {
      const w = W * 0.18, h = w * 1.2;
      r = {x: gap + (i < focus ? i : i - 1) * (w + gap), y: H - h - gap * 2, w, h, r: 0, o: 0.85};
    } else if (layout === 'row') {
      if (portrait) {
        const h = (H * 0.78 - gap * (n - 1)) / n, w = Math.min(W * 0.8, h * 1.4);
        r = {x: (W - w) / 2, y: H * 0.11 + i * (h + gap), w, h, r: 0, o: 1};
      } else {
        const w = (W * 0.86 - gap * (n - 1)) / n, h = w * 1.25;
        r = {x: W * 0.07 + i * (w + gap), y: (H - h) / 2, w, h, r: 0, o: 1};
      }
    } else if (layout === 'grid') {
      const cols = n <= 4 ? 2 : 3, rows = Math.ceil(n / cols);
      const cw = (W * 0.86 - gap * (cols - 1)) / cols, ch = Math.min(cw * (portrait ? 1.3 : 0.75), (H * 0.8 - gap * (rows - 1)) / rows);
      const c = i % cols, rr = Math.floor(i / cols);
      const gridH = rows * ch + (rows - 1) * gap;
      r = {x: W * 0.07 + c * (cw + gap), y: (H - gridH) / 2 + rr * (ch + gap), w: cw, h: ch, r: 0, o: 1};
    } else {
      // stack: cards piled with slight offsets and tilts (top card = last)
      const w = portrait ? W * 0.7 : W * 0.42, h = w * 1.2;
      r = {x: (W - w) / 2 + (i - (n - 1) / 2) * gap * 1.5, y: (H - h) / 2 - (n - 1 - i) * gap, w, h, r: (i - (n - 1) / 2) * 4, o: 1};
    }
    rects.push(r);
  }
  return rects;
}

const lerp = (a: Rect, b: Rect, t: number): Rect => ({
  x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, w: a.w + (b.w - a.w) * t, h: a.h + (b.h - a.h) * t, r: a.r + (b.r - a.r) * t, o: a.o + (b.o - a.o) * t,
});

export const CardStage: React.FC<{items: StageItem[]; beats: StageBeat[]; bg?: string; frames: number}> = ({items, beats, bg = '#f4f3ef', frames}) => {
  const frame = useCurrentFrame();
  const {fps, width: W, height: H} = useVideoConfig();
  const sorted = [...beats].sort((a, b) => a.at - b.at);
  const rectAt = (f: number, i: number) => {
    let cur = layoutRects(sorted[0].layout, items.length, W, H, sorted[0].focus)[i];
    for (const b of sorted.slice(1)) {
      if (f < b.at) break;
      const next = layoutRects(b.layout, items.length, W, H, b.focus)[i];
      const t = spring({frame: f - b.at - i * 2, fps, config: {damping: 18, stiffness: 120, mass: 0.9}}); // staggered morph
      cur = lerp(cur, next, t);
    }
    return cur;
  };
  const exit = interpolate(frame, [frames - 8, frames], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: bg, opacity: exit}}>
      {items.map((it, i) => {
        const r = rectAt(frame, i);
        const prev = rectAt(frame - 1, i);
        const speed = Math.hypot(r.x - prev.x, r.y - prev.y) + Math.abs(r.w - prev.w);
        const inn = spring({frame: frame - i * 4, fps, config: {damping: 13, stiffness: 170, mass: 0.8}}); // blur→sharp entrance
        const media: React.CSSProperties = {width: '100%', height: '100%', objectFit: 'cover'};
        return (
          <div
            key={i}
            style={{
              position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: Math.min(r.w, r.h) * 0.06, overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(0,0,0,0.22)', opacity: Math.min(1, inn * 1.4) * r.o,
              transform: `scale(${0.86 + 0.14 * inn}) rotate(${r.r}deg)`,
              filter: `blur(${Math.max((1 - inn) * 14, Math.min(8, speed * 0.25))}px)`,
            }}
          >
            {it.video ? <OffthreadVideo src={staticFile(it.src)} trimBefore={it.trimBefore ?? 0} muted style={media} /> : <Img src={staticFile(it.src)} style={media} />}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
