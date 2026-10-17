// direction.kit → the ported component kit (src/layers/Vendor.tsx, components from remocn + snapcn, MIT).
// Each entry: {use, at: wordIndex, until|seconds, …}. Inner moments land on his words: any key "<name>Word" (a word
// index) or "<name>S" (seconds from the item start) becomes "<name>At" in frames from the item start (markWord →
// markAt, drawWord → drawAt, rollWord, fireWord, lineWord, pushWord, typeWord, notchWord). cam: [{word|s, zoom, x, y,
// seconds}] = the screen camera (push in to a spot, hold, pull back). media: {word|t} = his own footage, {file} = a file.
// Cut transitions ({use: whip-pan|zoom-blur|page-turn|glitch-cut, at}) snap to the nearest real cut within 0.5 s.
export const KIT_CUTS = new Set(['whip-pan', 'zoom-blur', 'page-turn', 'glitch-cut']);
const DEFAULT_SECONDS = {marker: 2.5, underline: 2.2, scribble: 2.2, rolling: 2.4, confetti: 2.2, speedlines: 1.2, phone: 4, laptop: 4, screen: 4, search: 3.5};
const CUT_SECONDS = {'whip-pan': 0.5, 'zoom-blur': 0.5, 'page-turn': 0.6, 'glitch-cut': 0.35};
// sound by meaning (sounds.md): a marker/pen = tick, a number rolling = count, a win = reward, a device arriving =
// soft whoosh, a dive into a screen = whoosh, typing = typing; cuts get their whoosh/glitch from the cut type
const SOUND = {marker: 'tick', underline: 'tick', scribble: 'tick', rolling: 'count', confetti: 'reward', speedlines: 'whoosh', phone: 'soft-whoosh', laptop: 'soft-whoosh', screen: 'soft-whoosh', search: 'typing'};

export function buildKit({direction, byIndex, segments, fps, durationInFrames, span, media}) {
  const kit = [], kitCuts = [], sounds = [];
  const cutsAt = segments.slice(1).filter((s) => !s.freeze).map((s) => s.outFrame);
  for (const raw of direction?.kit ?? []) {
    const w = byIndex.get(raw.at);
    if (!w || !raw.use) continue;
    if (KIT_CUTS.has(raw.use)) {
      const near = cutsAt.reduce((b, c) => (Math.abs(c - w.f0) < Math.abs(b - w.f0) ? c : b), Infinity);
      const f = Math.abs(near - w.f0) <= fps / 2 ? near : w.f0;
      const frames = Math.max(6, Math.round((raw.seconds ?? CUT_SECONDS[raw.use]) * fps));
      const {at, seconds, sound, ...rest} = raw;
      kitCuts.push({...rest, f, frames});
      if (sound !== null) sounds.push(raw.use === 'glitch-cut' ? {type: 'glitch', f: f - 2, v: 0.4} : raw.use === 'page-turn' ? {type: 'soft-whoosh', f: f - 6, v: 0.4, fade: 4} : {type: 'whoosh', f: f - Math.floor(frames / 2), v: 0.45, fade: 5});
      continue;
    }
    const sp = span({...raw, seconds: raw.seconds ?? DEFAULT_SECONDS[raw.use] ?? 2.5}, DEFAULT_SECONDS[raw.use] ?? 2.5);
    if (!sp) continue;
    const local = (o) => (o.word != null ? (byIndex.get(o.word)?.f0 ?? sp.f) - sp.f : Math.round((o.s ?? 0) * fps));
    const item = {};
    for (const [k, v] of Object.entries(raw)) {
      if (['at', 'until', 'seconds', 'delay', 'sound', 'media', 'cam'].includes(k)) continue;
      const m = k.match(/^(\w+?)(Word|S)$/);
      if (m && typeof v === 'number') item[`${m[1]}At`] = m[2] === 'Word' ? local({word: v}) : Math.round(v * fps);
      else item[k] = v;
    }
    if (raw.media) {
      const md = media(raw.media);
      if (md) item.media = md.file ? {file: md.file, video: md.video, trimBefore: md.trimBefore} : {src: md.src, video: md.video, trimBefore: md.trimBefore};
    }
    if (raw.cam) item.cam = raw.cam.map((c) => ({at: local(c), ...(c.seconds != null ? {duration: Math.round(c.seconds * fps)} : {}), ...(c.zoom != null ? {zoom: c.zoom} : {}), ...(c.x != null ? {x: c.x} : {}), ...(c.y != null ? {y: c.y} : {})}));
    kit.push({...item, f: sp.f, frames: sp.frames});
    if (raw.sound === null) continue;
    const at = item.markAt ?? item.drawAt ?? item.rollAt ?? item.fireAt ?? item.lineAt ?? item.typeAt ?? 0;
    const type = raw.sound ?? SOUND[raw.use];
    if (type) sounds.push({type, f: sp.f + at, v: type === 'reward' ? 0.5 : 0.3, fade: /whoosh/.test(type) ? 4 : 0});
    if (raw.use === 'laptop' && item.pushAt != null) sounds.push({type: 'whoosh', f: sp.f + item.pushAt, v: 0.4, fade: 5});
  }
  return {kit, kitCuts, sounds: sounds.filter((s) => s.f >= 0 && s.f < durationInFrames)};
}
