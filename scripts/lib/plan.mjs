// Turns raw analysis (silences, words, AI direction) into a frame-exact Edit for Remotion.
import fs from 'node:fs';
import path from 'node:path';
import {libraryRoot} from './paths.mjs';

const PUBLIC = path.resolve('public');
const VIDEO_EXT = /\.(mp4|mov|m4v|webm)$/i;
const MEDIA_EXT = /\.(mp4|mov|m4v|webm|png|jpe?g|webp|gif)$/i;
const AUDIO_EXT = /\.(mp3|wav|m4a|aac|ogg)$/i;

const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const pick = (list, key) => (list.length ? list[hash(key) % list.length] : null);

function listAssets(sub, re) {
  const dir = path.join(PUBLIC, 'assets', sub);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => re.test(f) && !f.startsWith('.'))
    .map((f) => path.posix.join('assets', sub, f));
}

export const brollTags = () =>
  listAssets('broll', MEDIA_EXT).map((p) => path.basename(p).replace(/\.[^.]+$/, ''));

function merge(intervals, gap = 0) {
  const s = [...intervals].sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const iv of s) {
    const last = out[out.length - 1];
    if (last && iv[0] - last[1] <= gap) last[1] = Math.max(last[1], iv[1]);
    else out.push([...iv]);
  }
  return out;
}

function subtract(keep, remove) {
  let out = keep.map((x) => [...x]);
  for (const [ra, rb] of remove) {
    const next = [];
    for (const [a, b] of out) {
      if (rb <= a || ra >= b) next.push([a, b]);
      else {
        if (ra > a) next.push([a, ra]);
        if (rb < b) next.push([rb, b]);
      }
    }
    out = next;
  }
  return out;
}

export function buildEdit({name, video, duration, silences, words, direction, style, theme, clipAt = null, fps = 30}) {
  const e = style.edit;

  // 1. Speech = everything that isn't real silence, padded so words never get clipped.
  const speech = [];
  let cursor = 0;
  for (const [a, b] of silences) {
    if (a > cursor) speech.push([cursor, a]);
    cursor = Math.max(cursor, b);
  }
  if (cursor < duration) speech.push([cursor, duration]);
  const padded = merge(speech.map(([a, b]) => [Math.max(0, a - e.padding), Math.min(duration, b + e.padding)]));

  // 2. Retakes/fillers the AI chose to remove, cut at the gaps between words.
  const removals = [];
  for (const r of direction?.removeRanges ?? []) {
    const from = Math.max(0, Math.min(r.from, r.to));
    const to = Math.min(words.length - 1, Math.max(r.from, r.to));
    if (!words[from] || !words[to]) continue;
    const a = words[from - 1] ? (words[from - 1].e + words[from].s) / 2 : words[from].s - 0.05;
    const b = words[to + 1] ? (words[to].e + words[to + 1].s) / 2 : duration;
    removals.push([a, b]);
  }

  // 3. Kept pieces → segments; near-continuous pieces merge so we only jump-cut where time actually skips.
  // keepTimeline: the picture is already final (a process/drawing video with his voice-over): no silence cuts,
  // no retake cuts, no zoom jumps; only captions, hook, sound design and graphics are added on top.
  const keep = !!direction?.keepTimeline;
  const kept = keep ? [[0, duration]] : merge(subtract(padded, removals), 0).filter(([a, b]) => b - a >= e.minSegment);
  const pieces = [];
  for (const k of kept) {
    const last = pieces[pieces.length - 1];
    if (last && k[0] - last[1] < e.mergeGap) last[1] = k[1];
    else pieces.push([...k]);
  }
  if (!pieces.length) pieces.push([0, duration]);
  // Cold open (brain/hooks.md): the strongest line plays first, then the story from the top (that line plays again
  // in its place). direction.coldOpen = {from: wordIndex, to: wordIndex}.
  const co = direction?.coldOpen;
  if (co && words[co.from] && words[co.to]) {
    const a = Math.max(0, words[co.from].s - 0.08), b = Math.min(duration, words[co.to].e + 0.15);
    pieces.unshift(Object.assign([a, b], {cold: true}));
  }
  // Let the ending breathe: keep a little room tone after the last word instead of cutting dead on it.
  const lastPiece = pieces[pieces.length - 1];
  if (!keep) lastPiece[1] = Math.min(duration, lastPiece[1] + (e.endTail ?? 0.5));

  // Beats: after a line that deserves a reaction (bad take, cringe…), hold a silent freeze so the sound lands in the pause.
  const beatsIn = (direction?.beats ?? [])
    .map((b) => ({...b, t: words[b.after]?.e}))
    .filter((b) => b.t != null)
    .sort((x, y) => x.t - y.t);
  for (const b of beatsIn) {
    const k = pieces.findIndex(([a, z]) => b.t >= a - 0.05 && b.t <= z + 0.3);
    if (k < 0) continue;
    const t = Math.min(pieces[k][1], b.t + 0.08);
    const head = [pieces[k][0], t];
    const tail = [t, pieces[k][1]];
    const freeze = Object.assign([t, t], {freeze: b.seconds ?? 1.2, beat: b});
    pieces.splice(k, 1, head, freeze, ...(tail[1] - tail[0] >= 0.1 ? [tail] : []));
  }

  const zooms = style.motion.zoomPattern;
  let out = 0;
  let zi = 0;
  const segments = pieces.map((p, i) => {
    const [a, b] = p;
    const frames = p.freeze ? Math.round(p.freeze * fps) : Math.max(8, Math.round((b - a) * fps));
    // a freeze punches in a little on the held frame
    const zoom = keep ? 1 : p.freeze ? zooms[Math.max(0, zi - 1) % zooms.length] + 0.06 : zooms[zi++ % zooms.length];
    const seg = {srcFrame: Math.round(a * fps), outFrame: out, frames, zoom: p.cold ? zoom + 0.12 : zoom, ...(p.freeze ? {freeze: true} : {})};
    out += seg.frames;
    return {...seg, a, b, beat: p.beat, cold: p.cold};
  });
  const durationInFrames = out;

  const mapT = (t) => {
    const s = segments.find((x) => !x.cold && t >= x.a && t < x.b); // a cold-open copy never steals the original
    return s ? {f: s.outFrame + Math.round((t - s.a) * fps), seg: s} : null;
  };

  // 4. Words on the new timeline.
  const emphSet = new Set(direction?.emphasis ?? []);
  const outWords = [];
  // Whisper often starts a word a little early (inside the silence), so try several points of the word.
  const wordFrames = new Map();
  words.forEach((w, i) => {
    if (!w.w?.trim()) return; // merged-away word
    const m = [(w.s + w.e) / 2, w.e - 0.04, w.s + 0.04].map(mapT).find(Boolean);
    if (!m) return;
    const start = mapT(w.s) ?? {f: m.seg.outFrame};
    const f0 = Math.max(m.seg.outFrame, start.f);
    wordFrames.set(i, f0);
    const f1 = Math.min(m.seg.outFrame + m.seg.frames, f0 + Math.max(2, Math.round((w.e - w.s) * fps)));
    outWords.push({i, w: w.w, f0, f1, emph: emphSet.has(i)});
  });
  // the cold-open copy gets its own captions (pushed first, so byIndex keeps pointing at the original)
  const coldSeg = segments.find((x) => x.cold);
  if (coldSeg) {
    const extra = [];
    words.forEach((w, i) => {
      if (i < co.from || i > co.to || !w.w?.trim()) return;
      const f0 = coldSeg.outFrame + Math.max(0, Math.round((w.s - coldSeg.a) * fps));
      extra.push({i, w: w.w, f0, f1: Math.min(coldSeg.outFrame + coldSeg.frames, f0 + Math.max(2, Math.round((w.e - w.s) * fps))), emph: emphSet.has(i)});
    });
    outWords.unshift(...extra);
  }

  // 5. Caption groups: short, punchy, broken at punctuation and pauses.
  const c = style.captions;
  const maxWords = {'glow-grad': 2, 'highlight-box': 5, 'editorial': 4, 'script-accent': 4, 'condensed-stack': 4}[theme.captionStyle] ?? c.maxWords;
  const maxChars = maxWords > 3 ? 26 : c.maxChars;
  const captions = [];
  let cur = [];
  const flush = () => {
    if (cur.length) captions.push({f0: cur[0].f0, f1: cur[cur.length - 1].f1, words: cur.map(({i, ...w}) => w)});
    cur = [];
  };
  for (const w of outWords) {
    const prev = cur[cur.length - 1];
    const chars = cur.reduce((n, x) => n + x.w.length + 1, 0);
    const hasEmph = cur.some((x) => x.emph);
    if (prev && (cur.length >= maxWords || chars + w.w.length > maxChars || w.f0 - prev.f1 > 0.4 * fps || /[.,!?।]$/.test(prev.w) || (w.emph && hasEmph)))
      flush();
    cur.push(w);
  }
  flush();
  captions.forEach((g, k) => {
    const next = captions[k + 1];
    g.f1 = Math.min(next ? next.f0 : durationInFrames, g.f1 + Math.round(0.5 * fps));
  });

  const beatSegs = segments.filter((sg) => sg.freeze);
  for (const g of captions) {
    const nb = beatSegs.find((sg) => sg.outFrame >= g.f0);
    if (nb) g.f1 = Math.min(g.f1, nb.outFrame);
  }

  const byIndex = new Map(outWords.map((w) => [w.i, w]));
  const emphasisFrames = outWords.filter((w) => w.emph).map((w) => w.f0);

  // 6. Pop-ups, spaced out.
  const popups = [];
  const popFrames = Math.round(style.popup.seconds * fps);
  for (const p of [...(direction?.popups ?? [])].sort((a, b) => a.at - b.at)) {
    const w = byIndex.get(p.at);
    if (!w || !p.text?.trim()) continue;
    if (style.hook.enabled && direction?.hookText && w.f0 < style.hook.seconds * fps) continue; // hook owns the opening
    const last = popups[popups.length - 1];
    if (last && w.f0 - last.f < style.popup.minGapSeconds * fps) continue;
    const frames = Math.min(popFrames, durationInFrames - w.f0);
    // Never show the same words twice on screen: skip a pop-up that repeats any word in the captions visible meanwhile.
    const toks = (s) => s.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter((t) => t.length > 1 || /\d/.test(t));
    const onScreen = new Set(captions.filter((g) => g.f0 < w.f0 + frames && g.f1 > w.f0).flatMap((g) => g.words.flatMap((x) => toks(x.w))));
    if (toks(p.text).some((t) => onScreen.has(t))) continue;
    popups.push({text: p.text.trim().toUpperCase(), f: w.f0, frames});
  }

  // 7. B-roll from your assets folder.
  const brollFiles = listAssets('broll', MEDIA_EXT);
  const broll = [];
  for (const b of direction?.broll ?? []) {
    const file = brollFiles.find((f) => path.basename(f).replace(/\.[^.]+$/, '').toLowerCase() === b.tag.toLowerCase());
    const w = byIndex.get(b.at);
    if (!file || !w) continue;
    broll.push({src: file, f: w.f0, frames: Math.min(Math.round(b.duration * fps), durationInFrames - w.f0), isVideo: VIDEO_EXT.test(file)});
  }

  // 8. Transitions ONLY where the picture really changes (a different clip). A slide on the same shot fakes a scene
  //    change that never comes. New sections in the same shot get a camera move instead (slow push-in / pull-out).
  const transitions = [];
  // the cold open ends on a flash: "now, from the beginning"
  if (coldSeg) transitions.push({f: coldSeg.outFrame + coldSeg.frames, type: 'flash'});
  segments.forEach((sg, i) => {
    if (i === 0 || sg.freeze || !clipAt) return;
    const prev = segments.slice(0, i).reverse().find((x) => !x.freeze);
    if (prev && clipAt(sg.a) !== clipAt(prev.a)) transitions.push({f: sg.outFrame, type: theme.transitions[transitions.length % theme.transitions.length]});
  });
  // white light-leaks at the few big scene changes (brain/pablo.md): direction.leaks [wordIndex…] (or {at, end: true}
  // = at the end of that word, for the way back from a full-screen scene)
  for (const l of direction?.leaks ?? []) {
    const w = byIndex.get(typeof l === 'number' ? l : l.at);
    if (w) transitions.push({f: typeof l === 'object' && l.end ? w.f1 : w.f0, type: 'leakwhite'});
  }
  const moves = [];
  (direction?.sections ?? []).forEach((i, k) => {
    const w = byIndex.get(i);
    if (!w || w.f0 < fps || transitions.some((t) => Math.abs(t.f - w.f0) < fps)) return;
    moves.push({f: w.f0, type: k % 2 ? 'pull' : 'push'});
  });
  // Chosen camera moves (brain/pablo.md): zoomout = the intro pull from tight to normal (eyes stay put: the zoom grows
  // from his face), keypush = a small push-in that lands on a key word and holds, pull/push as above.
  for (const c of direction?.camera ?? []) {
    const w = byIndex.get(c.at);
    if (w) moves.push({f: Math.max(0, w.f0 - (c.type === 'zoomout' ? 2 : 4)), type: c.type});
  }

  // Text cards (minimal "expensive" inserts): direction.cards [{at: wordIndex, seconds, text, mode, bg, accentWord, glow}]
  const cards = (direction?.cards ?? []).filter((c) => c.mode !== 'scatter').flatMap((c) => {
    const w = byIndex.get(c.at);
    const f = w ? w.f0 : c.frame;
    if (f == null) return [];
    return [{...c, at: undefined, frame: undefined, f, frames: Math.min(Math.round((c.seconds ?? 1.6) * fps), durationInFrames - f)}];
  });

  // 8a. Graphics on a word (src/layers/Inserts.tsx): counters, before/after reveals, card stages, UI mockups (chat,
  //     notifications, button + cursor), connector arrows, light bursts, scatter text; plus the footage making room
  //     (layouts) and captions moving aside (captionMoves). "at" = word index, "seconds" or "until" (word) = length,
  //     times inside an item (message.at, beat.t, clickAt) are seconds from its start. "sound": null = silent.
  const span = (x, def) => {
    const w = byIndex.get(x.at);
    if (!w) return null;
    const end = x.until !== undefined ? byIndex.get(x.until)?.f1 : undefined;
    const f = w.f0 + Math.round((x.delay ?? 0) * fps);
    return {f, frames: Math.max(8, Math.min(durationInFrames - f, end !== undefined ? end - f : Math.round((x.seconds ?? def) * fps)))};
  };
  const sec = (v) => (v == null ? undefined : Math.round(v * fps));
  // media: {word: i} or {t: s} = his own footage from that moment; {file: path} = a picture/clip (staged by reel.mjs)
  const media = (m) => {
    if (!m) return null;
    if (m.file) return {file: m.file, video: m.video ?? /\.(mp4|mov|m4v|webm)$/i.test(m.file), trimBefore: sec(m.from) ?? 0, filter: m.filter, label: m.label};
    // the rendered video is the cut itself, so "his footage at word i" = that word's place in the cut
    const f = m.word !== undefined ? byIndex.get(m.word)?.f0 : m.t !== undefined ? mapT(m.t)?.f : undefined;
    return f == null ? null : {src: video, video: true, trimBefore: f, filter: m.filter, label: m.label};
  };
  const inserts = [];
  const put = (kind, x, def, extra = {}) => {
    const sp = span(x, def);
    if (!sp) return;
    const {at, until, seconds, delay, sound, ...rest} = x;
    inserts.push({...rest, kind, ...sp, ...extra, ...(sound === null ? {silent: true} : {})});
  };
  for (const x of direction?.counters ?? []) put('counter', x, 2.4);
  for (const x of direction?.reveals ?? []) {
    const before = media(x.before), after = media(x.after);
    if (before && after) put('reveal', x, 2.5, {before, after});
  }
  for (const x of direction?.stages ?? []) {
    const items = (x.items ?? []).map(media).filter(Boolean);
    if (items.length) put('stage', x, 3, {items, beats: (x.beats ?? [{t: 0, layout: 'row'}]).map(({t, ...b}) => ({...b, at: sec(t ?? 0)}))});
  }
  for (const x of direction?.ui ?? []) {
    const {kind, messages, items, clickAt, ...rest} = x;
    if (kind === 'chat') put('chat', rest, 3.5, {messages: (messages ?? []).map((m) => ({...m, at: sec(m.at)}))});
    else if (kind === 'notify') put('notify', rest, 3, {items: (items ?? []).map((n) => ({...n, at: sec(n.at)}))});
    else if (kind === 'cursor') put('cursor', rest, 2, {clickAt: sec(clickAt)});
  }
  for (const x of direction?.connectors ?? []) put('connector', x, 1.8);
  // Pablo-style designed graphics (brain/pablo.md): times inside are WORD indexes ({word: i}) or seconds from the
  // start of the insert ({s: 1.2}); both become frames from the insert start, so everything lands on his words.
  //   direction.scenes [{at, until, bg, cam: [{word|s, x, y, zoom}], items: [{word|s, type, …}]}]
  //   direction.titles [{at, until, kind: 'words', lines: [[{word|s, text, font, enter, highlight}]]} | {kind: 'stack', lines, words: [i…]}]
  const local = (f0) => (o) => {
    const {word, s, ...rest} = o;
    const at = word != null ? (byIndex.get(word)?.f0 ?? f0) - f0 : s != null ? Math.round(s * fps) : rest.at ?? 0;
    return {...rest, at, ...(rest.out != null ? {out: Math.round(rest.out * fps)} : {})};
  };
  for (const x of direction?.scenes ?? []) {
    const sp = span(x, 4);
    if (!sp) continue;
    const L = local(sp.f);
    const {at, until, seconds, delay, sound, cam, items, ...rest} = x;
    inserts.push({...rest, kind: 'scene', ...sp, cam: (cam ?? [{s: 0, x: 0.5, y: 0.5}]).map(L), items: (items ?? []).map(L), ...(sound === null ? {silent: true} : {})});
  }
  // a picture of who/what he names rises in beside him; a screen recording / page floats behind him
  for (const x of direction?.photos ?? []) { const m = media(x.media); if (m) put('photo', x, 2.5, {media: m}); }
  for (const x of direction?.floats ?? []) { const m = media(x.media); if (m) put('card', x, 3, {media: m}); }
  for (const x of direction?.titles ?? []) {
    const sp = span(x, 2.5);
    if (!sp) continue;
    const L = local(sp.f);
    const {at, until, seconds, delay, sound, kind = 'words', lines, words, ...rest} = x;
    if (kind === 'stack') inserts.push({...rest, kind, ...sp, lines, at: (words ?? []).map((w) => L({word: w}).at), ...(sound === null ? {silent: true} : {})});
    else inserts.push({...rest, kind: 'words', ...sp, lines: lines.map((ln) => ln.map(L)), ...(sound === null ? {silent: true} : {})});
  }
  // blurs: private things on screens. Tracks from scripts/secrets.py run on the cut (selects.mp4): key times are
  // seconds on the output timeline. reel.mjs fills direction.blurs itself when direction.blurSecrets is on.
  for (const tr of direction?.blurs ?? []) {
    const ks = tr.keys ?? [];
    if (!ks.length) continue;
    const f = Math.round(ks[0][0] * fps);
    const frames = Math.max(2, Math.round((ks[ks.length - 1][0] - ks[0][0]) * fps) + 1);
    inserts.push({kind: 'blur', f, frames, keys: ks.map(([t, ...b]) => [Math.round(t * fps) - f, ...b]), silent: true});
  }
  for (const x of direction?.planes ?? []) { const m = media(x.media); if (m) put('plane', x, 3, {media: m}); }
  for (const x of direction?.pushes ?? []) put('push', x, 0.8, x.media ? {media: media(x.media)} : {});
  for (const x of direction?.bursts ?? []) put('burst', x, 0.5);
  for (const c of (direction?.cards ?? []).filter((c) => c.mode === 'scatter')) {
    const {mode, bg, glow, ...rest} = c;
    put('scatter', rest, 1.8);
  }
  const layouts = (direction?.layouts ?? []).flatMap((x) => {
    const sp = span(x, 3);
    const {at, until, seconds, delay, ...rest} = x;
    return sp ? [{...rest, ...sp}] : [];
  });
  const captionMoves = (direction?.captionMoves ?? []).flatMap((x) => {
    const sp = span(x, 3);
    const {at, until, seconds, delay, ...rest} = x;
    return sp ? [{...rest, ...sp}] : [];
  });

  // 8b. Screen effects: B&W/dark on beats, red burn on angry lines.
  const effects = beatSegs.map((sg) => ({f: sg.outFrame, frames: sg.frames, type: sg.beat?.effect ?? 'mono', end: 'cut'}));
  for (const fx of direction?.effects ?? []) {
    const a = byIndex.get(fx.from), z = byIndex.get(fx.to);
    if (!a || !z) continue;
    effects.push({f: Math.max(0, a.f0 - 3), frames: z.f1 - a.f0 + 10, type: fx.type, end: fx.end ?? 'fade'});
  }

  // 9. Memes: a short reaction clip/sticker + its sound, in the top half, while captions continue below.
  const catalogFile = path.join(libraryRoot(), 'catalog.json');
  // Each meme lives in public/assets/memes/<id>/ : any audio file = its sound, any video/image = its clip. Empty folders are skipped.
  const catalog = (fs.existsSync(catalogFile) ? JSON.parse(fs.readFileSync(catalogFile, 'utf8')).memes : [])
    .map((m) => {
      const dir = path.join(libraryRoot(), m.dir ?? m.id);
      const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => !f.startsWith('.')) : [];
      const sound = files.find((f) => AUDIO_EXT.test(f));
      const visual = files.find((f) => /^sticker\./.test(f)) ?? files.find((f) => f === 'clip.mp4') ?? files.find((f) => MEDIA_EXT.test(f) && !/^(poster|full)\./.test(f));
      const rel = m.dir ?? m.id;
      return {...m, sound: sound && `${rel}/${sound}`, visual: visual && `${rel}/${visual}`};
    })
    .filter((m) => (m.sound || m.visual) && !m.tags.includes('unrated'));
  const memes = [];
  const used = new Set();
  // Memory across reels: avoid what was used in the last few reels, so the same joke doesn't keep repeating.
  const usageFile = path.resolve('brain', 'usage.json');
  const usage = fs.existsSync(usageFile) ? JSON.parse(fs.readFileSync(usageFile, 'utf8')) : {reels: []};
  const recent = new Set(usage.reels.filter((r) => r.name !== name).slice(-3).flatMap((r) => r.memes ?? []));
  // Where a meme appears follows what it means (with a little natural variation), not a fixed rotation.
  const PLACE_BY_TAG = {
    sleepy: ['corner-left', 'corner-right'], yawn: ['corner-left', 'corner-right'], idle: ['corner-left', 'corner-right'],
    yapping: ['corner-right', 'corner-left'], shock: ['peek-left', 'peek-right'], wtf: ['peek-right', 'peek-left'],
    confused: ['corner-right', 'drop-top'], question: ['corner-right', 'drop-top'], sus: ['peek-left', 'peek-right'],
    sarcastic: ['corner-left', 'peek-right'], happy: ['drop-top', 'corner-right'], pain: ['peek-left', 'corner-left'],
    soft: ['corner-right', 'corner-left'], disgust: ['peek-right', 'corner-right'], 'zoned-out': ['corner-left', 'drop-top'],
  };
  const VARIANTS = ['corner-right', 'peek-left', 'drop-top', 'peek-right', 'corner-left'];
  const gap = (style.memes?.minGapSeconds ?? 6) * fps;
  // A reel that's already lively (many cuts/transitions per second) needs fewer extras.
  const liveliness = (segments.length + transitions.length * 2 + moves.length) / (durationInFrames / fps);
  const budget = Math.max(liveliness > 0.6 ? 0 : 1, Math.floor(durationInFrames / fps / (style.memes?.secondsPerMeme ?? 12)) - (liveliness > 0.45 ? 1 : 0));
  const busy = [...transitions.map((t) => [t.f - 20, t.f + 20]), ...moves.map((mv) => [mv.f - 10, mv.f + 30]), ...effects.map((x) => [x.f - 15, x.f + x.frames + 15])];
  const free = (f, frames) =>
    memes.length < budget &&
    !memes.some((x) => Math.abs(x.f - f) < gap) &&
    !popups.some((p) => p.f < f + frames && p.f + p.frames > f) &&
    !busy.some(([a, z]) => f < z && f + frames > a) &&
    f >= style.hook.seconds * fps;
  // Meme sounds wait for the next pause after the cue word, so they never talk over the speaker.
  const nextPause = (i) => {
    let k = i;
    for (let n = 0; n < 6; n++) {
      const cur = byIndex.get(k);
      const nxtIdx = [...byIndex.keys()].filter((x) => x > k).sort((x, y) => x - y)[0];
      const nxt = nxtIdx !== undefined && byIndex.get(nxtIdx);
      if (!cur) return null;
      if (!nxt || nxt.f0 - cur.f1 >= 6) return cur.f1;
      k = nxtIdx;
    }
    return byIndex.get(i)?.f1 ?? null;
  };
  const place = (m, f, volumeScale = 1, show = null) => {
    used.add(m.id);
    // video memes (Library/clips): shown as card / half / full / zoom, cut to their punch (brain/memes.md)
    if (m.kind === 'clip') {
      const placement = show ?? m.show ?? 'card';
      const frames = Math.min(Math.round((m.seconds ?? 2) * fps), durationInFrames - f);
      memes.push({f, frames, sound: m.sound ? path.posix.join('assets', 'library', m.sound) : null, fadeOut: 3,
        visual: path.posix.join('assets', 'library', m.visual), isVideo: true, sticker: false, clip: true, placement, w: m.w, h: m.h,
        volume: (m.volume ?? 0.9) * volumeScale, id: m.id, tilt: (hash(`${name}-${f}-r`) % 13) - 6});
      if (placement === 'half') {
        // his footage glides to the bottom half (blurred fill around it); captions sit just under the meme
        layouts.push({f, frames, scale: 0.5, y: 0.24, radius: 36});
        captionMoves.push({f, frames, top: 0.55});
      }
      return;
    }
    // Peeking cats always peek from their own side; others rotate through entrance styles for variety.
    const options = PLACE_BY_TAG[m.tags.find((t) => PLACE_BY_TAG[t])] ?? VARIANTS;
    const lastPlacement = memes[memes.length - 1]?.placement;
    const fresh = options.filter((o) => o !== lastPlacement);
    const placement = m.placement?.startsWith('peek') ? m.placement : pick(fresh.length ? fresh : options, `${name}-${f}-place`);
    memes.push({
      f,
      frames: Math.min(Math.round((m.seconds ?? 1.8) * fps), durationInFrames - f),
      sound: m.sound && (m.volume ?? 0.8) > 0 ? path.posix.join('assets', 'library', m.sound) : null,
      fadeOut: m.length && m.length > (m.seconds ?? 1.8) + 0.2 ? 8 : 0, // long sounds are trimmed → fade out
      visual: m.visual ? path.posix.join('assets', 'library', m.visual) : null,
      isVideo: m.visual ? VIDEO_EXT.test(m.visual) : false,
      sticker: !!m.sticker,
      placement,
      volume: (m.volume ?? 0.8) * volumeScale,
      id: m.id,
      // small natural variation so no two appearances look stamped out
      scale: 0.85 + (hash(`${name}-${f}-s`) % 30) / 100,
      lift: (hash(`${name}-${f}-y`) % 9) - 4,
      tilt: (hash(`${name}-${f}-r`) % 13) - 6,
    });
  };
  const choose = (tag, key) => {
    const fits = catalog.filter((m) => m.tags.includes(tag) && m.priority !== 'low');
    const pool = fits.filter((m) => !used.has(m.id) && !recent.has(m.id));
    const fallback = fits.filter((m) => !used.has(m.id));
    return pick(pool.length ? pool : fallback.length ? fallback : catalog.filter((m) => m.tags.includes(tag)), key);
  };
  for (const cue of [...(direction?.memes ?? [])].sort((a, b) => a.at - b.at)) {
    const w = byIndex.get(cue.at);
    const m = cue.id ? catalog.find((x) => x.id === cue.id) : w && choose(cue.tag, `${name}-${cue.at}`);
    if (!w || !m) continue;
    const f = m.soundOnly || m.sound ? nextPause(cue.at) ?? w.f0 : w.f0;
    if (free(f, Math.round((m.seconds ?? 1.8) * fps))) place(m, f, 1, cue.show ?? null);
    // a cue I chose that the restraint rules drop (budget, too close to another meme, hook, a transition) is reported
    else console.log(`  ⚠️ meme ${m.id} at word ${cue.at} dropped (budget ${budget} for this length, or too close to another event)`);
  }
  // Boring stretches: if nothing visual happens for a while, an idle cat peeks in from a corner (sound turned down).
  const fill = (style.memes?.fillGapSeconds ?? 8) * fps;
  const events = () =>
    [0, ...popups.map((p) => p.f), ...memes.map((m) => m.f), ...transitions.map((t) => t.f), ...broll.map((b) => b.f), durationInFrames].sort((a, b) => a - b);
  // Only when the director allows it (Claude turns this off when the story carries itself).
  for (let guard = 0; guard < 20 && direction?.fillIdle !== false; guard++) {
    const ev = events();
    const k = ev.findIndex((e, i) => i > 0 && e - ev[i - 1] > fill);
    if (k < 0) break;
    const f = Math.round((ev[k - 1] + ev[k]) / 2);
    const m = choose('idle', `${name}-idle-${f}`);
    if (!m || !free(f, Math.round((m.seconds ?? 1.8) * fps))) break;
    place(m, f, style.memes?.idleVolume ?? 0.3);
    memes.sort((a, b) => a.f - b.f);
  }

  for (const sg of beatSegs) {
    const b = sg.beat ?? {};
    const m = b.id ? catalog.find((x) => x.id === b.id) : pick(catalog.filter((x) => x.beat && x.tags.includes(b.tag ?? 'bad-take')), `${name}-beat-${sg.outFrame}`);
    if (!m?.sound) continue;
    memes.push({f: sg.outFrame + 3, frames: sg.frames - 3, sound: path.posix.join('assets', 'library', m.sound), fadeOut: 0, visual: null, isVideo: false, sticker: false, placement: 'drop-top', volume: 0.9});
  }

  // 9b. Things stuck onto him / the screen (src/motion): {at, until? | seconds?, what, to?, text?, …} → output frames.
  const attach = [];
  for (const a of direction?.attach ?? []) {
    const w = byIndex.get(a.at);
    if (!w) continue;
    const end = a.until !== undefined ? byIndex.get(a.until)?.f1 : undefined;
    const frames = Math.max(12, Math.min(durationInFrames - w.f0, end !== undefined ? end - w.f0 : Math.round((a.seconds ?? 2) * fps)));
    const {at, until, seconds, sound, ...rest} = a;
    attach.push({...rest, f: w.f0 + (a.delay ?? 0), frames});
  }
  // One reaction at a time: a sticker meme that overlaps a face/hand prop is dropped (the prop is the more specific choice).
  for (let i = memes.length - 1; i >= 0; i--) {
    const m = memes[i];
    if (m.visual && attach.some((a) => a.to !== 'screen' && a.what !== 'note' && a.f < m.f + m.frames && m.f < a.f + a.frames)) memes.splice(i, 1);
  }

  // 10. Sound design: restraint. Soft whoosh only on real transitions, light pop on pop-ups/hook, meme sounds carry the rest.
  const sfxLib = (t) => listAssets(path.join('sfx', t), AUDIO_EXT);
  const vol = style.audio.sfxVolume;
  const sfx = [];
  const add = (type, f, v, fade = 0) => {
    const src = pick(sfxLib(type), `${name}-${type}-${f}`);
    if (src && !sfx.some((x) => Math.abs(x.f - f) < 10) && !memes.some((m) => Math.abs(m.f - f) < 15)) sfx.push({src, f: Math.max(0, f), volume: v, fade});
  };
  // His sound map for designed graphics (Pablo Quesada, brain/pablo.md): every movement gets its own sound, chosen by
  // what moves, never the same one twice in a row. Families come from the Library (Library/sounds, catalog `family`).
  const PQ = {
    typing: ['typing', 'camera'], // typed text: a short keyboard burst (or a soft camera click)
    rise: ['whoosh-short'], drop: ['whoosh-short'], slide: ['whoosh-short'], blur: ['whoosh-short'], fade: ['whoosh-short'],
    long: ['whoosh-long'], // the hook's first move, starts a little before it
    line: ['tech-ui'], count: ['tech-ui'], // dashed line drawing / number counting: digital ticks
    land: ['money'], // a count lands on its number
    reward: ['success'], // a badge / gem / icon of a win arrives
    pop: ['pop', 'click'], negative: ['fail', 'tech-ui'], // highlight on a bad word
  };
  const lastLib = {};
  const libSound = (type, f, v, fade = 0) => {
    const fams = PQ[type] ?? [type];
    let pool = catalog.filter((m) => m.kind === 'sound' && fams.includes(m.family) && m.seconds <= (type === 'count' ? 6 : 3.5));
    if (type === 'count') { const c = pool.filter((m) => /count|digit/.test(m.id)); if (c.length) pool = c; }
    if (!pool.length) return;
    const fresh = pool.filter((m) => m.id !== lastLib[type]);
    const m = pick(fresh.length ? fresh : pool, `${name}-pq-${type}-${f}`);
    lastLib[type] = m.id;
    if (!sfx.some((x) => Math.abs(x.f - f) < 6)) sfx.push({src: `assets/library/${m.dir}/sound.mp3`, f: Math.max(0, f), volume: v * (m.volume ?? 1), fade});
  };
  function designSounds(x) {
    const q = vol * 0.4;
    if (x.kind === 'stack') { libSound('rise', x.f - 3, q, 3); return; }
    if (x.kind === 'words') {
      x.lines.flat().forEach((tk, i) => {
        const f = x.f + tk.at;
        if (tk.enter === 'type') libSound('typing', f, q * 0.8);
        else if (tk.enter !== 'cut') libSound(i === 0 && x.f < 30 ? 'long' : tk.enter ?? 'rise', f - (i === 0 ? 6 : 3), q, 3);
        if (tk.highlight) libSound('negative', f + 4, q * 0.7);
      });
      return;
    }
    for (const it of x.items) {
      const f = x.f + it.at;
      if (it.type === 'line') libSound('line', f, q * 0.6);
      else if (it.type === 'counter') { libSound('count', f, q * 0.6); libSound('land', f + (it.dur ?? 40), q); }
      else if (it.type === 'badge' || (it.type === 'image' && it.reward)) libSound('reward', f, q);
      else if (it.type === 'num') libSound('pop', f, q * 0.6);
      else if (it.enter === 'type') libSound('typing', f, q * 0.7);
      else if (it.enter !== 'cut') libSound(it.enter ?? 'rise', f - 3, q * 0.8, 3);
    }
    // camera travels get a soft whoosh when they really move (a pan to the next box, a push-in on the payoff)
    const cam = [...(x.cam ?? [])].sort((a, b) => a.at - b.at);
    cam.slice(1).forEach((k, i) => {
      const a = cam[i];
      const far = Math.hypot(k.x - a.x, k.y - a.y) > 0.2 || Math.abs(Math.log((k.zoom ?? 1) / (a.zoom ?? 1))) > 0.25;
      if (far && a.at >= 0) libSound('rise', x.f + a.at, q * 0.7, 4);
    });
  }
  const hookText = style.hook.enabled ? direction?.hookText?.trim() || null : null;
  if (hookText) add('pop', 3, vol * 0.5);
  for (const p of popups) add('pop', p.f, vol * 0.5);
  // Attachments: the prop's own sound (defaults mirror src/motion/props.tsx); "sound": null in direction = silent.
  const PROP_SOUND = {sunglasses: 'whoosh', crown: 'pop', horns: 'pop', anger: 'hit', question: 'pop', exclaim: 'pop', bulb: 'pop', hearts: 'pop', fire: 'whoosh', bubble: 'pop', thought: 'pop', label: 'pop', note: 'pop', image: 'pop'};
  for (const [i, a] of attach.entries()) {
    const d = direction.attach.filter((x) => byIndex.get(x.at))[i];
    const snd = d && 'sound' in d ? d.sound : PROP_SOUND[a.what];
    if (snd) add(snd, a.f - (snd === 'whoosh' ? 6 : 0), vol * 0.45);
  }
  // Text cards get their own subtle sound: tick for typewriter, soft whoosh for wave, hit for a slam.
  for (const c of cards) add(c.mode === 'slam' ? 'hit' : c.mode === 'typewriter' ? 'tick' : 'soft-whoosh', c.f, vol * (c.mode === 'slam' ? 0.6 : 0.35));
  // Inserts get small UI sounds that follow what moves (brain/expensive.md): pops for bubbles, ticks for notifications…
  for (const x of inserts.filter((x) => !x.silent)) {
    if (x.kind === 'chat') x.messages.forEach((m, i) => add('pop', x.f + (m.at ?? 8 + i * (x.gap ?? 22)), vol * 0.3));
    else if (x.kind === 'notify') x.items.forEach((n, i) => add('tick', x.f + (n.at ?? i * (x.gap ?? 14)), vol * 0.35));
    else if (x.kind === 'cursor') add('click', x.f + (x.clickAt ?? 22), vol * 0.5);
    else if (x.kind === 'burst') add('hit', x.f, vol * 0.5);
    else if (x.kind === 'counter') add('tick', x.f, vol * 0.3);
    else if (x.kind === 'scatter') add('pop', x.f, vol * 0.35);
    else if (x.kind === 'push') add('whoosh', x.f + x.frames - 10, vol * 0.45, 4);
    else if (x.kind === 'scene' || x.kind === 'words' || x.kind === 'stack') designSounds(x);
    else add('soft-whoosh', x.f - 4, vol * 0.3, 4);
  }
  for (const l of layouts.filter((l) => !memes.some((m) => m.clip && m.f === l.f))) add('soft-whoosh', l.f - 4, vol * 0.3, 4);
  // video memes get their entry sound: a slam (hit) for a card, a whoosh for half/zoom; a full cut needs none (the meme
  // itself is the sound). Pushed directly: add() keeps clear of memes on purpose.
  for (const m of memes.filter((x) => x.clip)) {
    const type = m.placement === 'card' ? 'hit' : m.placement === 'full' ? null : 'whoosh';
    const src = type && pick(sfxLib(type), `${name}-${type}-meme-${m.f}`);
    if (src) sfx.push({src, f: Math.max(0, m.f - (type === 'whoosh' ? 5 : 0)), volume: vol * (type === 'hit' ? 0.55 : 0.4), fade: type === 'whoosh' ? 4 : 0});
  }
  for (const t of transitions) {
    if (t.type === 'flash') add('hit', t.f, vol * 0.5);
    else if (t.type !== 'lightleak') add('whoosh', t.f - 8, vol * 0.45, 6);
  }

  // Pinned open-loop headline: stays at the top until the payoff word, then disappears.
  const banner = direction?.banner?.text
    ? {text: direction.banner.text, f0: 0, f1: byIndex.get(direction.banner.until)?.f0 ?? durationInFrames}
    : null;

  // Text behind the person (Magnetic-Mask style): which frames need a person cut-out layered over the text.
  const hookFrames = Math.round(style.hook.seconds * fps);
  const foreground = direction?.hookBehind && hookText ? [{f: 0, frames: Math.min(hookFrames, durationInFrames)}] : [];

  return {
    name,
    video,
    banner,
    cards,
    inserts,
    layouts,
    captionMoves,
    hookBehind: !!(direction?.hookBehind && hookText),
    foreground,
    endFade: Math.round((style.edit.endFade ?? 0) * fps),
    fps,
    durationInFrames,
    segments: segments.map(({a, b, cold, ...s}) => s),
    captions,
    emphasisFrames,
    speech: merge(outWords.map((w) => [w.f0, w.f1]), 4),
    effects,
    moves,
    popups,
    broll,
    sfx,
    music: pick(listAssets('music', AUDIO_EXT), name),
    hookText,
    memes,
    attach,
    theme,
    transitions,
    wordFrames,
    stats: {sourceSeconds: duration, finalSeconds: durationInFrames / fps, cuts: segments.length - 1, removedRetakes: removals.length},
  };
}

// Human/Claude-readable record of the edit: what was kept, cut, emphasised, and where effects land (by output frame).
export function buildTranscript({words, direction, edit, wordFrames, clipNames = [], fps = 30}) {
  const removed = new Map();
  for (const r of direction?.removeRanges ?? []) for (let i = r.from; i <= r.to; i++) removed.set(i, r.reason);
  const emph = new Set(direction?.emphasis ?? []);
  const pop = new Map((direction?.popups ?? []).map((p) => [p.at, p.text]));
  const sec = new Set(direction?.sections ?? []);
  const ts = (f) => `${Math.floor(f / fps / 60)}:${((f / fps) % 60).toFixed(1).padStart(4, '0')}`;

  const lines = [];
  let line = [];
  let lineStart = null;
  let prevClip = null;
  words.forEach((w, i) => {
    if (clipNames.length > 1 && w.clip !== prevClip) {
      if (line.length) lines.push(`\`${lineStart}\` ${line.join(' ')}`);
      lines.push(`\n### 🎞 Clip ${w.clip + 1}: ${clipNames[w.clip]}`);
      line = [];
      lineStart = null;
      prevClip = w.clip;
    }
    const f = removed.has(i) ? null : wordFrames.get(i) ?? null;
    if (sec.has(i)) {
      if (line.length) lines.push(`\`${lineStart}\` ${line.join(' ')}`);
      const t = edit.transitions.find((x) => f !== null && Math.abs(x.f - f) <= fps);
      const mv = (edit.moves ?? []).find((x) => f !== null && Math.abs(x.f - f) <= fps);
      lines.push(t ? `\n— ⟦TRANSITION ${t.type} @ f${t.f}⟧ —` : mv ? `\n— ⟦CAMERA ${mv.type === 'push' ? 'push-in' : 'pull-out'} @ f${mv.f}⟧ —` : '\n— ⟦new section⟧ —');
      line = [];
      lineStart = null;
    }
    if (lineStart === null) lineStart = f !== null ? `f${f} ${ts(f)}` : 'cut   ';
    if (!w.w?.trim()) return;
    let txt = w.w;
    if (removed.has(i)) txt = `~~${txt}~~`;
    else if (f === null) txt = `~~${txt}~~`; // fell in a silence cut
    if (emph.has(i) && !removed.has(i)) txt = `**${txt}**`;
    if (pop.has(i) && !removed.has(i) && edit.popups.some((p) => p.text === pop.get(i).toUpperCase())) txt += ` ⟦POP ${pop.get(i)}⟧`;
    line.push(txt);
    if (/[.!?।]$/.test(w.w)) {
      lines.push(`\`${lineStart}\` ${line.join(' ')}`);
      line = [];
      lineStart = null;
    }
  });
  if (line.length) lines.push(`\`${lineStart}\` ${line.join(' ')}`);

  const cuts = (direction?.removeRanges ?? []).map((r) => `- "${words.slice(r.from, r.to + 1).map((w) => w.w).join(' ')}" → ${r.reason}`);
  return `# Edit transcript: ${edit.name}

Theme: **${edit.theme.topic}** (${edit.theme.pace}) · captions: **${edit.theme.captionStyle}** · accent ${edit.theme.accent} / ${edit.theme.accent2}
Hook: "${edit.hookText ?? ''}" · length ${(edit.durationInFrames / fps).toFixed(1)}s · ${edit.segments.length - 1} jump cuts

Legend: ~~cut~~ · **emphasis zoom** · ⟦POP⟧ pop-up text · \`f123\` = output frame (Remotion Studio)

${lines.join('\n')}

## Cuts
${cuts.join('\n') || '- silences only'}
`;
}
