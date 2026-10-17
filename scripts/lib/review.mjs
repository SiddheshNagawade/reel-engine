// Automatic frame review of a rendered version (Pass 10 starts here, before anyone watches it).
// Ported from cth9191/animate tools/review.mjs + textcheck.mjs (MIT), rebuilt for Remotion + real footage:
//   1. contact sheet: one frame every 0.5 s, tiled (<version>.review.jpg), to read the whole reel at phone size
//   2. measured text/picture checks (src/layers/Probe.tsx logs every block's on-screen box, every Nth frame):
//        text cut off by the frame edge · text overlapping other text · the same text twice on screen ·
//        a sticker/graphic/text over his face (faces found by Apple Vision in the RENDER, so layouts are respected) ·
//        text under the Instagram UI (safe zones)
//      Only things AT REST are judged: a graphic flying in from outside the frame is supposed to be cut off for a moment.
//   3. sound: integrated loudness (LUFS), true peak, loudness range, the loudest moment
//   4. dead stretches: > 3 s where the picture barely changes
// Writes <version>.review.md next to the version; FAIL lines must be fixed (or explained in plan.md) before he sees it.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
import {renderFrames, selectComposition} from '@remotion/renderer';
import {cachedBundle} from '../render.mjs';
import {stageLibrary} from './assets.mjs';

const ff = (args, opts = {}) => spawnSync(ffmpegPath, ['-hide_banner', '-nostats', ...args], {maxBuffer: 1 << 28, ...opts});
const durationOf = (mp4) => { const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(String(ff(['-i', mp4]).stderr)); return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : 0; };
const area = (b) => Math.max(0, b[2] - b[0]) * Math.max(0, b[3] - b[1]);
const inter = (a, b) => area([Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])]);
const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim();

// 1. contact sheet
function contactSheet(mp4, out, dur) {
  const n = Math.max(1, Math.ceil(dur * 2)), cols = 10, rows = Math.ceil(n / cols);
  ff(['-v', 'error', '-y', '-i', mp4, '-vf', `fps=2,scale=216:-2,tile=${cols}x${rows}:padding=4:color=white`, '-frames:v', '1', '-q:v', '4', out]);
  return fs.existsSync(out);
}

// 2a. probe render: where every text block / picture sits on every Nth frame
async function probe(edit, every) {
  const unstage = stageLibrary(edit);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-probe-'));
  const frames = new Map();
  try {
    const serveUrl = await cachedBundle();
    const inputProps = {edit, probe: true};
    const chromiumOptions = {gl: process.env.REEL_GL || 'angle'};
    const composition = await selectComposition({serveUrl, id: 'Reel', inputProps, chromiumOptions});
    await renderFrames({
      composition, serveUrl, inputProps, chromiumOptions, outputDir: dir, imageFormat: 'jpeg', scale: 0.1,
      everyNthFrame: every, concurrency: Number(process.env.REEL_CONCURRENCY) || Math.max(2, Math.floor(os.cpus().length / 2)),
      onStart: () => {}, onFrameUpdate: () => {}, logLevel: 'error',
      onBrowserLog: ({text}) => { if (text.startsWith('__PROBE__')) { const p = JSON.parse(text.slice(9)); frames.set(p.f, p.items); } },
    });
    return {frames, W: composition.width, H: composition.height};
  } finally {
    fs.rmSync(dir, {recursive: true, force: true});
    unstage();
  }
}

// 2b. faces in the render (Apple Vision); a face hidden for a moment by something on top is carried over from its neighbours
function faces(mp4) {
  const out = path.join(os.tmpdir(), `reel-faces-${process.pid}.json`);
  const py = path.resolve('.venv/bin/python');
  if (!fs.existsSync(py)) return null;
  const r = spawnSync(py, ['scripts/faceboxes.py', mp4, out, '5'], {encoding: 'utf8'});
  if (r.status !== 0 || !fs.existsSync(out)) return null;
  const rows = JSON.parse(fs.readFileSync(out, 'utf8')).map((x) => ({t: x.t, b: x.b.sort((a, b) => b[2] * b[3] - a[2] * a[3])[0] ?? null}));
  fs.rmSync(out, {force: true});
  return (t) => {
    const near = rows.filter((r) => Math.abs(r.t - t) <= 0.12 && r.b);
    if (near.length) return {b: near[0].b, seen: true};
    const before = rows.filter((r) => r.b && r.t < t && t - r.t <= 1).at(-1), after = rows.find((r) => r.b && r.t > t && r.t - t <= 1);
    if (before && after) { const u = (t - before.t) / (after.t - before.t); return {b: before.b.map((v, i) => v + (after.b[i] - v) * u), seen: false}; }
    return null;
  };
}

// 3. loudness
function loudness(mp4) {
  const eb = String(ff(['-i', mp4, '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr);
  const num = (re) => { const m = eb.match(re); return m ? Number(m[1]) : null; };
  const I = num(/Integrated loudness:[\s\S]*?I:\s+(-?[\d.]+) LUFS/), LRA = num(/Loudness range:[\s\S]*?LRA:\s+(-?[\d.]+) LU/), TP = num(/True peak:[\s\S]*?Peak:\s+(-?[\d.]+) dBFS/);
  const SR = 8000, WIN = SR / 10, pcm = ff(['-v', 'error', '-i', mp4, '-ac', '1', '-ar', String(SR), '-f', 's16le', '-']).stdout;
  let L = 0, best = -200;
  for (let o = 0, w = 0; o + WIN * 2 <= pcm.length; o += WIN * 2, w++) {
    let q = 0; for (let i = 0; i < WIN; i++) { const v = pcm.readInt16LE(o + i * 2) / 32768; q += v * v; }
    const db = 10 * Math.log10(q / WIN + 1e-12); if (db > best) { best = db; L = w; }
  }
  return {I, LRA, TP, loudestAt: L / 10, loudestDb: best};
}

// 4. dead stretches (picture barely changes)
function deadStretches(mp4, maxS = 3) {
  const w = 36, h = 64, fps = 4, raw = ff(['-v', 'error', '-i', mp4, '-vf', `fps=${fps},scale=${w}:${h},format=gray`, '-f', 'rawvideo', '-']).stdout;
  const n = Math.floor(raw.length / (w * h)), lag = 2, d = [];
  for (let f = lag; f < n; f++) { let s = 0; for (let i = 0; i < w * h; i++) s += Math.abs(raw[f * w * h + i] - raw[(f - lag) * w * h + i]); d.push([f / fps, s / (w * h)]); }
  const med = [...d.map((x) => x[1])].sort((a, b) => a - b)[Math.floor(d.length / 2)] ?? 0, thr = Math.max(0.8, 0.25 * med);
  const runs = []; let r0 = null;
  for (const [t, v] of [...d, [Infinity, Infinity]]) {
    if (v < thr) { if (r0 == null) r0 = t; } else if (r0 != null) { if (t - r0 >= maxS && t !== Infinity) runs.push([r0, t]); else if (t === Infinity && d.at(-1)[0] - r0 >= maxS) runs.push([r0, d.at(-1)[0]]); r0 = null; }
  }
  return runs;
}

// the checks on the probe data
function judge({frames, W, H}, edit, faceAt) {
  const fps = edit.fps, issues = new Map();
  const add = (sev, kind, label, f) => { const k = `${sev}|${kind}|${label}`; const v = issues.get(k); if (v) { v.f1 = f; v.n++; } else issues.set(k, {sev, kind, label, f0: f, f1: f, n: 1}); };
  const capWords = (f) => new Set((edit.captions ?? []).filter((g) => f >= g.f0 - 2 && f <= g.f1 + 2).flatMap((g) => g.words.flatMap((w) => w.w.split(/\s+/).map(norm))));
  const keyOf = (it) => (it.k === 'text' ? 't:' + it.s : `m:${it.tag}:${Math.round((it.b[2] - it.b[0]) / 20)}x${Math.round((it.b[3] - it.b[1]) / 20)}`);
  const fs_ = [...frames.keys()].sort((a, b) => a - b);
  let prev = new Map(), prevF = -1e9;
  const capFace = new Set();
  for (const f of fs_) {
    const items = frames.get(f), cap = capWords(f), byKey = new Map();
    for (const it of items) byKey.set(keyOf(it), it);
    const restTol = W * 0.01;
    const atRest = (it) => { const p = f - prevF <= 12 ? prev.get(keyOf(it)) : null; return !!p && it.b.every((v, i) => Math.abs(v - p.b[i]) < restTol); };
    const isCap = (it) => it.k === 'text' && it.s.split(' ').filter(Boolean).every((w) => !norm(w) || cap.has(norm(w)));
    const texts = items.filter((it) => it.k === 'text');
    const label = (s) => (s.length > 40 ? s.slice(0, 40) + '…' : s);
    for (const it of texts) {
      if (!atRest(it)) continue;
      const [x0, y0, x1, y1] = it.b;
      if (it.s.trim().length > 1 && (x0 < -3 || y0 < -3 || x1 > W + 3 || y1 > H + 3)) add('FAIL', 'text cut off by the frame edge', `"${label(it.s)}"`, f);
      else if (!isCap(it) && (y0 < H * 0.08 || y1 > H * 0.8 || (x1 > W * 0.87 && y1 > H * 0.5))) add('WARN', 'text under the Instagram UI (safe zone)', `"${label(it.s)}"`, f);
    }
    for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i], b = texts[j];
      if (a.up.includes(b.id) || b.up.includes(a.id)) continue;
      const na = norm(a.s), nb = norm(b.s);
      const far = Math.hypot((a.b[0] + a.b[2] - b.b[0] - b.b[2]) / 2, (a.b[1] + a.b[3] - b.b[1] - b.b[3]) / 2) > 24;
      if (na && na === nb) { if (far && (na.includes(' ') || na.length >= 6)) add('FAIL', 'the same text twice on screen', `"${label(a.s)}"`, f); continue; }
      if (na.includes(nb) || nb.includes(na)) continue;
      if (!atRest(a) || !atRest(b)) continue;
      const tight = (x) => { const m = (x[3] - x[1]) * 0.15; return [x[0], x[1] + m, x[2], x[3] - m]; }; // line boxes include leading
      if (inter(tight(a.b), tight(b.b)) > 0.25 * Math.min(area(tight(a.b)), area(tight(b.b)))) add('FAIL', 'text overlaps other text', `"${label(a.s)}" × "${label(b.s)}"`, f);
    }
    // a full-screen scene (solid backdrop or a full-frame drawing over everything) hides the footage: no face to protect
    const footage = items.filter((it) => it.tag === 'img').sort((a, b) => area(b.b) - area(a.b))[0];
    const fullScene = !footage || items.some((it) => it.tag === 'backdrop' && area(it.b) > 0.8 * W * H && !footage.up.includes(it.id) && !it.up.includes(footage.id));
    const face = fullScene ? null : faceAt?.(f / fps);
    if (face) {
      const fb = [face.b[0] * W, face.b[1] * H, (face.b[0] + face.b[2]) * W, (face.b[1] + face.b[3]) * H], fa = area(fb);
      for (const it of items) {
        if (area(it.b) > 0.5 * W * H || it.tag === 'overlay' || !atRest(it)) continue; // the footage itself / full-screen scenes
        if (it.k === 'media' && face.seen && inter(it.b, fb) > 0.9 * fa) continue; // the face is IN this picture (footage card, meme)
        // covers a fifth of his face, or sits mostly ON his face (a small word on his mouth counts too)
        if (inter(it.b, fb) > 0.2 * fa || inter(it.b, fb) > 0.4 * area(it.b)) {
          const cap = isCap(it);
          if (cap) capFace.add(f); // one summary line, not one per caption
          // stickers/cards/pictures on his face break a hard rule (FAIL); other text (hook lines, labels) is a judgement call
          else if (it.k === 'text') add('WARN', 'text on his face', `"${label(it.s)}"`, f);
          else add('FAIL', 'something covers his face', it.tag === 'card' ? 'a card/box' : `a picture (${it.tag})`, f);
        }
      }
    }
    prev = byKey; prevF = f;
  }
  if (capFace.size) {
    const fr = [...capFace].sort((a, b) => a - b);
    issues.set('capface', {sev: 'WARN', kind: 'captions on his face', label: `in ${Math.round((100 * fr.length) / fs_.length)} % of the measured frames (move them down / off his mouth with captionMoves where it hurts)`, f0: fr[0], f1: fr.at(-1), n: fr.length});
  }
  if (process.env.REVIEW_DUMP) fs.writeFileSync(process.env.REVIEW_DUMP, JSON.stringify({W, H, frames: [...frames]}));
  return [...issues.values()];
}

export async function reviewVersion({edit, mp4, outBase, every = 6, probeOn = true}) {
  const t0 = Date.now(), dur = durationOf(mp4), lines = [], fmt = (f) => `${(f / edit.fps).toFixed(1)}s`;
  const sheet = `${outBase}.review.jpg`;
  const sheetOk = contactSheet(mp4, sheet, dur);
  let issues = [], probeNote = '';
  if (probeOn) {
    try {
      const faceAt = faces(mp4);
      const p = await probe(edit, every);
      issues = judge(p, edit, faceAt);
      probeNote = `${p.frames.size} frames measured (every ${every}th)${faceAt ? '' : ', face check skipped (no Vision/venv)'}`;
    } catch (e) {
      probeNote = `measuring skipped: ${String(e.message ?? e).split('\n')[0]}`;
    }
  } else probeNote = 'measuring skipped (footage not staged)';
  const snd = loudness(mp4), dead = deadStretches(mp4);
  const fails = issues.filter((i) => i.sev === 'FAIL'), warns = issues.filter((i) => i.sev === 'WARN');
  const sndWarn = [];
  if (snd.I != null && (snd.I < -17 || snd.I > -12)) sndWarn.push(`integrated loudness ${snd.I.toFixed(1)} LUFS (phone target about -16 to -14)`);
  if (snd.TP != null && snd.TP > -1) sndWarn.push(`true peak ${snd.TP.toFixed(1)} dBFS (keep <= -1: Instagram's encoder clips above that)`);
  lines.push(`# Frame review: ${path.basename(outBase)}`, '', `Automatic checks (scripts/lib/review.mjs). Fix every FAIL before he sees it, or say in plan.md why it is deliberate.`, '');
  lines.push(`Contact sheet: ${sheetOk ? path.basename(sheet) + ' (one frame every 0.5 s, left to right)' : 'failed'}`, `Measured: ${probeNote}`, '');
  lines.push(`## Text and pictures: ${fails.length ? 'FAIL' : 'PASS'} (${fails.length} fail, ${warns.length} warn)`);
  for (const i of [...fails, ...warns]) lines.push(`- ${i.sev} ${i.kind}: ${i.label} at ${fmt(i.f0)}${i.f1 > i.f0 ? `–${fmt(i.f1)}` : ''}`);
  lines.push('', `## Sound: ${sndWarn.length ? 'WARN' : 'PASS'}`,
    `- loudness ${snd.I?.toFixed(1) ?? 'n/a'} LUFS integrated, range ${snd.LRA?.toFixed(1) ?? 'n/a'} LU, true peak ${snd.TP?.toFixed(1) ?? 'n/a'} dBFS`,
    `- loudest moment ${snd.loudestAt.toFixed(1)}s (${snd.loudestDb.toFixed(1)} dBFS): should be the turn/payoff, not a random whoosh`, ...sndWarn.map((w) => `- WARN ${w}`));
  lines.push('', `## Dead stretches (> 3 s with almost no change): ${dead.length ? 'WARN' : 'PASS'}`, ...dead.map(([a, b]) => `- WARN ${a.toFixed(1)}–${b.toFixed(1)}s: something new should happen here (rules: every ~2–3 s)`));
  lines.push('', `(review took ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  fs.writeFileSync(`${outBase}.review.md`, lines.join('\n') + '\n');
  return {fails: fails.length + 0, warns: warns.length + sndWarn.length + dead.length, file: `${outBase}.review.md`, sheet: sheetOk ? sheet : null, text: lines.join('\n')};
}
