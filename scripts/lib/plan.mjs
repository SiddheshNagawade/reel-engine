// Turns raw analysis (silences, words, AI direction) into a frame-exact Edit for Remotion.
import fs from 'node:fs';
import path from 'node:path';

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
  const kept = merge(subtract(padded, removals), 0).filter(([a, b]) => b - a >= e.minSegment);
  const pieces = [];
  for (const k of kept) {
    const last = pieces[pieces.length - 1];
    if (last && k[0] - last[1] < e.mergeGap) last[1] = k[1];
    else pieces.push([...k]);
  }
  if (!pieces.length) pieces.push([0, duration]);
  // Let the ending breathe: keep a little room tone after the last word instead of cutting dead on it.
  const lastPiece = pieces[pieces.length - 1];
  lastPiece[1] = Math.min(duration, lastPiece[1] + (e.endTail ?? 0.5));

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
    const zoom = p.freeze ? zooms[Math.max(0, zi - 1) % zooms.length] + 0.06 : zooms[zi++ % zooms.length];
    const seg = {srcFrame: Math.round(a * fps), outFrame: out, frames, zoom, ...(p.freeze ? {freeze: true} : {})};
    out += seg.frames;
    return {...seg, a, b, beat: p.beat};
  });
  const durationInFrames = out;

  const mapT = (t) => {
    const s = segments.find((x) => t >= x.a && t < x.b);
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

  // 5. Caption groups: short, punchy, broken at punctuation and pauses.
  const c = style.captions;
  const maxWords = {'highlight-box': 5, 'editorial': 4, 'script-accent': 4, 'condensed-stack': 4}[theme.captionStyle] ?? c.maxWords;
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
  segments.forEach((sg, i) => {
    if (i === 0 || sg.freeze || !clipAt) return;
    const prev = segments.slice(0, i).reverse().find((x) => !x.freeze);
    if (prev && clipAt(sg.a) !== clipAt(prev.a)) transitions.push({f: sg.outFrame, type: theme.transitions[transitions.length % theme.transitions.length]});
  });
  const moves = [];
  (direction?.sections ?? []).forEach((i, k) => {
    const w = byIndex.get(i);
    if (!w || w.f0 < fps || transitions.some((t) => Math.abs(t.f - w.f0) < fps)) return;
    moves.push({f: w.f0, type: k % 2 ? 'pull' : 'push'});
  });

  // Text cards (minimal "expensive" inserts): direction.cards [{at: wordIndex, seconds, text, mode, bg, accentWord, glow}]
  const cards = (direction?.cards ?? []).flatMap((c) => {
    const w = byIndex.get(c.at);
    const f = w ? w.f0 : c.frame;
    if (f == null) return [];
    return [{...c, at: undefined, frame: undefined, f, frames: Math.min(Math.round((c.seconds ?? 1.6) * fps), durationInFrames - f)}];
  });

  // 8b. Screen effects: B&W/dark on beats, red burn on angry lines.
  const effects = beatSegs.map((sg) => ({f: sg.outFrame, frames: sg.frames, type: sg.beat?.effect ?? 'mono', end: 'cut'}));
  for (const fx of direction?.effects ?? []) {
    const a = byIndex.get(fx.from), z = byIndex.get(fx.to);
    if (!a || !z) continue;
    effects.push({f: Math.max(0, a.f0 - 3), frames: z.f1 - a.f0 + 10, type: fx.type, end: fx.end ?? 'fade'});
  }

  // 9. Memes: a short reaction clip/sticker + its sound, in the top half, while captions continue below.
  const catalogFile = path.join(PUBLIC, 'assets', 'library', 'catalog.json');
  // Each meme lives in public/assets/memes/<id>/ : any audio file = its sound, any video/image = its clip. Empty folders are skipped.
  const catalog = (fs.existsSync(catalogFile) ? JSON.parse(fs.readFileSync(catalogFile, 'utf8')).memes : [])
    .map((m) => {
      const dir = path.join(PUBLIC, 'assets', 'library', m.dir ?? m.id);
      const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => !f.startsWith('.')) : [];
      const sound = files.find((f) => AUDIO_EXT.test(f));
      const visual = files.find((f) => /^sticker\./.test(f)) ?? files.find((f) => MEDIA_EXT.test(f) && !/^poster\./.test(f));
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
  const place = (m, f, volumeScale = 1) => {
    used.add(m.id);
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
    if (free(f, Math.round((m.seconds ?? 1.8) * fps))) place(m, f);
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

  // 10. Sound design: restraint. Soft whoosh only on real transitions, light pop on pop-ups/hook, meme sounds carry the rest.
  const sfxLib = (t) => listAssets(path.join('sfx', t), AUDIO_EXT);
  const vol = style.audio.sfxVolume;
  const sfx = [];
  const add = (type, f, v, fade = 0) => {
    const src = pick(sfxLib(type), `${name}-${type}-${f}`);
    if (src && !sfx.some((x) => Math.abs(x.f - f) < 10) && !memes.some((m) => Math.abs(m.f - f) < 15)) sfx.push({src, f: Math.max(0, f), volume: v, fade});
  };
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
    hookBehind: !!(direction?.hookBehind && hookText),
    foreground,
    endFade: Math.round((style.edit.endFade ?? 0.6) * fps),
    fps,
    durationInFrames,
    segments: segments.map(({a, b, ...s}) => s),
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
