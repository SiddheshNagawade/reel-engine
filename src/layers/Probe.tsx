// Measuring layer for the automatic frame review (scripts/review.mjs). Only mounted when the Reel gets `probe: true`;
// a normal render never sees it. On every frame it lists where each visible text block and picture element sits on
// screen (after all transforms, clipped by overflow-hidden parents) and logs it for the review to read.
// Idea from cth9191/animate tools/textcheck.mjs (MIT): a reviewer looking at thumbnails misses a cropped word, a
// measurement doesn't.
import React, {useEffect} from 'react';
import {continueRender, delayRender, useCurrentFrame} from 'remotion';

type Box = [number, number, number, number]; // x0, y0, x1, y1 in composition px
export type ProbeItem = {k: 'text' | 'media'; s?: string; tag?: string; b: Box; id: number; up: number[]};

const isBlock = (cs: CSSStyleDeclaration) => !cs.display.startsWith('inline'); // inline-block words/letters group into their line

function measure(): ProbeItem[] {
  const style = new Map<Element, CSSStyleDeclaration>();
  const cs = (e: Element) => { let s = style.get(e); if (!s) { s = getComputedStyle(e); style.set(e, s); } return s; };
  const ids = new Map<Element, number>();
  const idOf = (e: Element) => { let i = ids.get(e); if (i == null) { i = ids.size + 1; ids.set(e, i); } return i; };
  // visible part of an element's box: opacity product and every clipping ancestor taken into account
  const visible = (el: Element, r: DOMRect): Box | null => {
    let o = 1, b: Box = [r.left, r.top, r.right, r.bottom];
    for (let e: Element | null = el; e && e !== document.body; e = e.parentElement) {
      const s = cs(e);
      if (s.display === 'none' || s.visibility === 'hidden') return null;
      o *= Number(s.opacity);
      if (e !== el && (s.overflow !== 'visible' || s.clipPath !== 'none')) {
        const q = e.getBoundingClientRect();
        b = [Math.max(b[0], q.left), Math.max(b[1], q.top), Math.min(b[2], q.right), Math.min(b[3], q.bottom)];
      }
    }
    if (o < 0.15 || b[2] - b[0] < 2 || b[3] - b[1] < 2) return null;
    return b;
  };
  // text: grouped by the nearest block-level parent (a caption line, a label, a title), one box per group
  const groups = new Map<Element, {s: string; b: Box}>();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const s = (n.textContent ?? '').trim();
    const el = n.parentElement;
    if (!s || !el || el.closest('svg title, style, script')) continue;
    range.selectNodeContents(n);
    const b = visible(el, range.getBoundingClientRect());
    if (!b) continue;
    let blk: Element = el;
    while (blk.parentElement && blk.parentElement !== document.body && !isBlock(cs(blk))) blk = blk.parentElement;
    const g = groups.get(blk);
    if (g) { g.s += ' ' + s; g.b = [Math.min(g.b[0], b[0]), Math.min(g.b[1], b[1]), Math.max(g.b[2], b[2]), Math.max(g.b[3], b[3])]; }
    else groups.set(blk, {s, b});
  }
  const ancestors = (e: Element) => { const up: number[] = []; for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) if (ids.has(p) || groups.has(p)) up.push(idOf(p)); return up; };
  const out: ProbeItem[] = [];
  for (const [e, g] of groups) out.push({k: 'text', s: g.s.replace(/\s+/g, ' ').slice(0, 80), b: g.b.map(Math.round) as Box, id: idOf(e), up: []});
  // pictures: images/footage frames, top-level SVGs, videos, canvases
  for (const e of Array.from(document.querySelectorAll('img, video, canvas, svg'))) {
    if (e.tagName.toLowerCase() === 'svg' && e.parentElement?.closest('svg')) continue;
    const b = visible(e, e.getBoundingClientRect());
    if (b) out.push({k: 'media', tag: e.tagName.toLowerCase(), b: b.map(Math.round) as Box, id: idOf(e), up: []});
  }
  // cards and panels drawn as coloured boxes (a notification card, a sticker on a div): solid background, not full-frame
  const FA = innerWidth * innerHeight;
  for (const e of Array.from(document.querySelectorAll('div'))) {
    const st = cs(e), bgA = /rgba?\(([^)]+)\)/.exec(st.backgroundColor)?.[1].split(',').map(Number);
    if (!(st.backgroundImage !== 'none' || (bgA && (bgA.length < 4 || bgA[3] > 0.5)))) continue;
    const r = e.getBoundingClientRect(), a = r.width * r.height;
    if (a < FA * 0.003) continue;
    const b = visible(e, r);
    if (!b) continue;
    // a full-frame layer only hides the footage when it is solid: grain, vignette and light-leak overlays are not
    let o = 1; for (let p: Element | null = e; p && p !== document.body; p = p.parentElement) o *= Number(cs(p).opacity);
    const solid = !!bgA && (bgA.length < 4 || bgA[3] >= 0.95) && o >= 0.95 && st.mixBlendMode === 'normal';
    out.push({k: 'media', tag: a <= FA * 0.5 ? 'card' : solid ? 'backdrop' : 'overlay', b: b.map(Math.round) as Box, id: idOf(e), up: []});
  }
  for (const it of out) { const e = [...ids].find(([, i]) => i === it.id)?.[0]; if (e) it.up = ancestors(e); }
  return out;
}

// logged from code without a bundle URL, so the renderer hands it to the review (onBrowserLog) without echoing it
// into the terminal
// eslint-disable-next-line no-new-func
const quiet = new Function('m', 'console.debug(m)') as (m: string) => void;

export const Probe: React.FC = () => {
  const frame = useCurrentFrame();
  useEffect(() => {
    const h = delayRender('probe');
    // measure once every other layer is ready (footage frames and pictures load asynchronously): wait until ours is the
    // only pending delayRender, then two animation frames so this frame's state has painted
    const pending = () => Object.keys((window as unknown as {remotion_delayRenderTimeouts?: object}).remotion_delayRenderTimeouts ?? {}).length;
    const t0 = performance.now();
    const go = () => {
      if (pending() > 1 && performance.now() - t0 < 8000) { setTimeout(go, 20); return; }
      requestAnimationFrame(() => requestAnimationFrame(() => {
        try { quiet('__PROBE__' + JSON.stringify({f: frame, items: measure()})); } finally { continueRender(h); }
      }));
    };
    go();
  }, [frame]);
  return null;
};
