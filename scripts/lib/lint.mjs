// Automatic checks on the edit itself: the rules from his feedback that a computer can measure.
// errors block the final render (requirePlan); warnings are printed for the density / viewer passes.
//   vlog    → _work/<name>/vlog.json (or --edit file)
//   reel    → _work/<name>/direction.json (+ style.json)
//   process → _work/<name>/timeline.json
import fs from 'node:fs';
import path from 'node:path';
import {expandSegments, segLength} from './vlog-cuts.mjs';
import {libraryRoot} from './paths.mjs';

// "Never the same meme sound twice in a row" is about expression sounds (meme voices, cartoon/fail/crowd reactions,
// the classic memes). Impacts, whooshes, clicks may repeat: an impact under every hero intro is a pattern.
const EXPRESSIVE = new Set(['meme-voice', 'cartoon', 'fail', 'crowd', 'success', 'join-leave']);
let families = null;
function isExpression(id) {
  if (!families) {
    families = new Map();
    try {
      for (const m of JSON.parse(fs.readFileSync(path.join(libraryRoot(), 'catalog.json'), 'utf8')).memes) families.set(m.id, m.family ?? null);
    } catch {}
  }
  if (!families.has(id)) return /^meme-/.test(id);
  const f = families.get(id);
  return f === null || EXPRESSIVE.has(f);
}
const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const read = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null);

export function editFile(work, kind, editName) {
  return path.join(work, editName ?? {vlog: 'vlog.json', reel: 'direction.json', process: 'timeline.json'}[kind]);
}

// Stretches where nothing new appears (no graphic, sticker, sound, chapter) in a vlog. Cuts alone don't count.
export function vlogGaps(edit, gap = 6) {
  const parts = expandSegments((edit.segments ?? []).filter((s) => !s.skip));
  const events = [], starts = {};
  let clock = 0;
  for (const [k, s] of parts.entries()) {
    const overlap = k > 0 && s.transition?.d ? s.transition.d : 0;
    const start = clock - overlap, len = segLength(s);
    if (starts[s.parent ?? s.id] === undefined) starts[s.parent ?? s.id] = start;
    if (s.chapter) events.push(start);
    for (const g of s.gfx ?? []) events.push(start + (g.at ?? 0));
    s._start = start;
    s._len = len;
    clock = start + len;
  }
  for (const x of edit.sfx ?? []) if (starts[x.at] !== undefined) events.push(starts[x.at] + (x.t ?? 0));
  events.sort((a, b) => a - b);
  const pts = [0, ...events, clock];
  const gaps = [];
  for (let i = 1; i < pts.length; i++) if (pts[i] - pts[i - 1] > gap) gaps.push([pts[i - 1], pts[i]]);
  const inSeg = (t) => parts.find((s) => t >= s._start && t < s._start + s._len);
  return {clock, events, parts, gaps: gaps.map(([a, b]) => ({a, b, from: inSeg(a + 0.01)?.parent ?? inSeg(a + 0.01)?.id, to: inSeg(b - 0.01)?.parent ?? inSeg(b - 0.01)?.id}))};
}

const DEVANAGARI = /[\u0900-\u097F]/;
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, '');

// The reel's words, all clips in order (direction.json word indices point into this list).
function reelWords(work) {
  const out = [];
  for (let k = 0; fs.existsSync(path.join(work, `clip-${k}.words.json`)); k++) {
    const d = read(path.join(work, `clip-${k}.words.json`));
    out.push(...(Array.isArray(d) ? d : d.words ?? []));
  }
  return out;
}

function lintVlog(edit, work) {
  const errors = [], warnings = [];
  // Hinglish in Roman script, never Devanagari
  for (const s of edit.segments ?? []) for (const l of s.subs ?? []) if (DEVANAGARI.test(l.t)) errors.push(`${s.id}: subtitle in Devanagari ("${l.t.slice(0, 30)}"). Hinglish in Roman script`);
  // never name a person he hasn't labelled (people.json from his who-is-who sheet)
  const people = read(path.join(work, 'people.json'));
  const known = new Set(Object.values(people ?? {}).filter((p) => p?.name).map((p) => norm(p.name)));
  for (const s of edit.segments ?? []) for (const g of s.gfx ?? []) {
    const names = g.type === 'cast' ? (g.people ?? []).map((p) => p.name) : ['tag', 'name', 'hero'].includes(g.type) ? [g.name] : [];
    for (const n of names.filter(Boolean)) {
      if (!people) errors.push(`${s.id}: name "${n}" but no people.json. Get his labelled who-is-who sheet first`);
      else if (![...known].some((k) => norm(n).startsWith(k) || k.startsWith(norm(n)))) errors.push(`${s.id}: "${n}" isn't in people.json. Never tag a person he hasn't confirmed`);
    }
  }
  const segs = (edit.segments ?? []).filter((s) => !s.skip);
  // plain fast-forward of people (Chandigarh: 19 scenes) → must be jump cuts / a ramp, or a stated time-lapse reason
  for (const s of segs) {
    if (!s.src || s.jumps || s.rampTo != null || s.layout === 'split') continue;
    const span = (s.out ?? 0) - (s.in ?? 0), len = segLength(s), sp = span / Math.max(0.01, len - (s.hold ?? 0));
    if (len > 3 && sp > 1.2 && sp < 4 && !s.timelapse)
      errors.push(`${s.id}: plain ${sp.toFixed(1)}× fast-forward. Use "jumps" (cutfinder.py beats) or a speed ramp, or add "timelapse": "<why this is slow progress>"`);
  }
  const parts = expandSegments(segs);
  parts.forEach((s, k) => {
    const prev = parts[k - 1];
    if (s.transition && prev && prev.src === s.src && Math.abs((prev.out ?? 0) - (s.in ?? 0)) < 1)
      errors.push(`${s.id}: a transition inside one continuous shot (same clip, no time skipped). Only where the picture really changes.`);
    const len = segLength(s);
    if (len < 0.9 && !(s.parent && segs.find((x) => x.id === s.parent)?.rampTo != null))
      warnings.push(`${s.id}: ${len.toFixed(2)} s shot. He found sub-second cuts confusing; keep shots ≳ 1 s`);
    for (const g of s.gfx ?? []) if (g.type === 'emoji') errors.push(`${s.parent ?? s.id}: emoji graphic ("so low effort"). Use a meme sticker, prop or pop text with a real joke`);
  });
  // meme / expression sounds: never the same one twice in a row
  const order = new Map(parts.map((s, i) => [s.parent ?? s.id, i]));
  const meme = (edit.sfx ?? []).filter((x) => isExpression(x.sticker ?? x.id)).sort((a, b) => (order.get(a.at) ?? 0) - (order.get(b.at) ?? 0) || (a.t ?? 0) - (b.t ?? 0));
  for (let i = 1; i < meme.length; i++) if (meme[i].id === meme[i - 1].id) errors.push(`sfx ${meme[i].id} twice in a row (${meme[i - 1].at} → ${meme[i].at}). Vary the meme sounds`);
  const {gaps, clock} = vlogGaps(edit);
  const empty = gaps.reduce((a, g) => a + g.b - g.a, 0);
  if (gaps.length) warnings.push(`${gaps.length} stretches over 6 s with nothing new (${Math.round((100 * empty) / clock)}% of the video): ${gaps.slice(0, 12).map((g) => `${fmt(g.a)}–${fmt(g.b)} ${g.from}`).join(', ')}${gaps.length > 12 ? ' …' : ''}`);
  return {errors, warnings};
}

function lintReel(direction, style, work) {
  const errors = [], warnings = [];
  const words = reelWords(work);
  const bad = words.filter((w) => DEVANAGARI.test(w.w ?? ''));
  if (bad.length) errors.push(`${bad.length} words in Devanagari (e.g. "${bad[0].w}"). Fix them in clip-N.words.json: Hinglish in Roman script`);
  // never the same text twice on screen: a pop-up that repeats the words being said right then
  for (const p of direction.popups ?? []) {
    const said = new Set(words.slice(Math.max(0, p.at - 3), p.at + 7).map((w) => norm(w.w ?? '')));
    const pw = (p.text ?? '').split(/\s+/).map(norm).filter((w) => w.length > 2);
    // the planner drops these on its own (plan.mjs §6), so it's a warning: the idea is lost unless the words change
    if (pw.length && pw.filter((w) => said.has(w)).length / pw.length >= 0.5) warnings.push(`pop-up "${p.text}" repeats the words being said, so it gets dropped (never the same text twice). Use different words or a visual`);
  }
  const endFade = direction.styleOverride?.edit?.endFade ?? style?.edit?.endFade ?? 0;
  if (endFade > 0) errors.push(`end fade is ${endFade}: never a fade at the end (his rule). Loop or hard cut`);
  if ((direction.cards ?? []).length > 2) warnings.push(`${direction.cards.length} text cards: 1–2 per reel, they stop the story`);
  const memes = [...(direction.memes ?? [])].sort((a, b) => a.at - b.at);
  for (let i = 1; i < memes.length; i++) if (memes[i].id && memes[i].id === memes[i - 1].id) errors.push(`meme ${memes[i].id} twice in a row`);
  const visuals = ['attach', 'memes', 'cards', 'counters', 'reveals', 'stages', 'ui', 'connectors', 'layouts', 'broll'].reduce((n, k) => n + (direction[k]?.length ?? 0), 0);
  if (visuals < 3) warnings.push(`only ${visuals} visual elements in direction.json: captions alone are not editing`);
  return {errors, warnings};
}

function lintProcess(tl) {
  const errors = [], warnings = [];
  if ((tl.endFade ?? 0) > 0) errors.push('endFade > 0: never a fade at the end');
  for (const s of tl.segments ?? []) {
    const len = s.dur ?? ((s.out ?? 0) - (s.in ?? 0)) / (s.speed ?? 1);
    if (len < 0.9 && s.rampTo == null) warnings.push(`${s.id ?? s.src}: ${len.toFixed(2)} s shot; keep shots ≳ 1 s`);
  }
  return {errors, warnings};
}

export function lint(work, kind, editName) {
  const f = editFile(work, kind, editName);
  const edit = read(f);
  if (!edit) return {errors: [], warnings: [`no ${path.basename(f)} yet`], file: f};
  const r = kind === 'vlog' ? lintVlog(edit, work) : kind === 'reel' ? lintReel(edit, read('style.json'), work) : lintProcess(edit);
  return {...r, file: f};
}
