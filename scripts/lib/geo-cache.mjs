// Render cache for geometry videos, like the green render bar in a video editor.
// A lesson is cut into its questions (lessonParts in src/geometry/lessons.ts). Each question renders once, in final
// quality with sound, into _work/<lesson>/cache/<id>.<key>.mp4. The key is a fingerprint of everything visible or
// audible in that question (its drawings, camera, tools, sounds, timing RELATIVE to its own start, the previous
// question it pans out of, and the drawing code). So an edit to Q7 re-renders Q7 only; later questions just move
// in time and keep their files. The preview page plays these files; the export joins them (no second render).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {renderMedia, selectComposition, makeCancelSignal} from '@remotion/renderer';
import {cachedBundle} from '../render.mjs';
import {workRoot} from './paths.mjs';

const FPS = 30;
const chromiumOptions = {gl: process.env.REEL_GL || 'angle'};
const concurrency = Number(process.env.REEL_CONCURRENCY) || 4; // 8 GB Mac
export const cacheDir = (lesson) => path.join(workRoot(), lesson, 'cache');

/** the lesson as data (bundled fresh from src/, so edits show up) */
export async function loadLesson(lesson) {
  const {build} = await import('esbuild');
  const out = path.join(os.tmpdir(), `geo-lessons-${process.pid}-${Date.now()}.mjs`);
  await build({entryPoints: ['src/geometry/lessons.ts'], bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'error'});
  try {
    const mod = await import(out);
    return {L: mod.LESSONS[lesson](), parts: mod.lessonParts(lesson)};
  } finally {
    fs.rmSync(out, {force: true});
  }
}

// the drawing code + sound files: changing these changes every frame
function codeHash() {
  const h = crypto.createHash('md5');
  for (const f of ['src/geometry/GeoVideo.tsx', 'src/geometry/Tools.tsx', 'src/geometry/GeoPart.tsx']) h.update(fs.readFileSync(f));
  const sfx = 'public/geo-stage/sfx';
  if (fs.existsSync(sfx)) for (const f of fs.readdirSync(sfx).sort()) h.update(f + fs.statSync(path.join(sfx, f)).size);
  return h.digest('hex');
}

const TK = new Set(['t', 't0', 't1', 'tMark', 's0', 's1']); // every field that holds a time (glyph: s0/s1 = when the number shrinks)
const r3 = (x) => Math.round(x * 1000) / 1000;
function times(o, acc = []) {
  if (Array.isArray(o)) o.forEach((x) => times(x, acc));
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) TK.has(k) && typeof v === 'number' ? acc.push(v) : times(v, acc);
  return acc;
}
/** a copy with times made relative to `base` (or dropped once settled), numbers rounded, keys sorted */
function rel(o, base, settled, q = 1000) {
  if (Array.isArray(o)) return o.map((x) => rel(x, base, settled, q));
  if (o && typeof o === 'object') {
    const c = {};
    for (const k of Object.keys(o).sort()) {
      const v = o[k];
      if (TK.has(k) && typeof v === 'number') { if (!settled) c[k] = v < base - 1.5 ? 'old' : Math.round((v - base) * q) / q; } else c[k] = rel(v, base, settled, q);
    }
    return c;
  }
  return typeof o === 'number' ? r3(o) : o;
}
function partKey(L, p, prevF0, code) {
  const from = p.f0 / FPS, to = p.f1 / FPS, prev = prevF0 / FPS;
  const h = crypto.createHash('md5').update(code).update(String(p.f1 - p.f0));
  for (const field of ['shapes', 'qtexts', 'sheets', 'guides', 'sfx', 'fades', 'voice']) { // subs are never drawn
    for (const it of L[field] ?? []) {
      const ts = times(it);
      if (!ts.length) continue;
      const mn = Math.min(...ts), mx = Math.max(...ts);
      if (mn >= to || mn < prev) continue; // later, or from a question that is long out of view
      // finished before this question starts → only its shape counts; the previous question's last moments → its
      // timing to the nearest 0.1 s (sub-frame shifts from an earlier edit don't count as a change)
      h.update(field + JSON.stringify(rel(it, from, mx < from - 1.5, mn < from ? 10 : 1000)));
    }
  }
  const tracks = {cam: L.cam, compass: L.compass, scale: L.scale, pencil: L.pencil, protractor: L.protractor, eraser: L.eraser};
  for (const [k, tr] of Object.entries(L.vis ?? {})) tracks['vis-' + k] = tr;
  for (const [k, tr] of Object.entries(tracks)) {
    h.update(k + JSON.stringify(rel(tr.valueAt(from), 0, true)));
    h.update(JSON.stringify(tr.keys.filter((x) => x.t >= from - 1.5 && x.t <= to + 0.1).map((x) => rel(x, from, false, x.t < from ? 10 : 1000))));
  }
  for (const [k, iv] of Object.entries(L.uses ?? {})) h.update(k + JSON.stringify(iv.filter(([a, b]) => b >= from - 1.5 && a <= to).map(([a, b]) => [Math.round((a - from) * 10) / 10, r3(b - from)])));
  return h.digest('hex').slice(0, 12);
}

/** the parts of a lesson with their key, file and state (done / todo) */
export async function plan(lesson) {
  const {L, parts} = await loadLesson(lesson);
  const code = codeHash();
  const dir = cacheDir(lesson);
  fs.mkdirSync(dir, {recursive: true});
  const segs = parts.map((p, i) => {
    const key = partKey(L, p, i ? parts[i - 1].f0 : 0, code);
    const file = `${p.id}.${key}.mp4`;
    return {...p, key, file, state: fs.existsSync(path.join(dir, file)) ? 'done' : 'todo', progress: 0};
  });
  const audioKey = crypto.createHash('md5').update(code).update(JSON.stringify(rel({sfx: L.sfx, voice: L.voice}, 0, false))).update(String(segs.at(-1).f1)).digest('hex').slice(0, 12);
  return {lesson, fps: FPS, frames: segs.at(-1).f1, segs, audio: `audio.${audioKey}.wav`};
}
/** live state of each question: done (file there), rendering (a live process holds its lock; progress 0..1) or todo */
export function refresh(st) {
  const dir = cacheDir(st.lesson);
  for (const s of st.segs) {
    const out = path.join(dir, s.file);
    if (fs.existsSync(out)) { s.state = 'done'; s.progress = 1; continue; }
    let pid = 0;
    try { pid = Number(fs.readFileSync(out + '.lock', 'utf8')); } catch {}
    s.state = pid && alive(pid) ? 'rendering' : 'todo';
    try { s.progress = s.state === 'rendering' ? Number(fs.readFileSync(out + '.progress', 'utf8')) || 0 : 0; } catch { s.progress = 0; }
  }
  return st;
}
/** old files of a question (an earlier key) go; the cache keeps only what the current video uses */
function prune(st) {
  const keep = new Set(st.segs.map((s) => s.file).concat(st.audio));
  for (const f of fs.readdirSync(cacheDir(st.lesson))) {
    if (keep.has(f) || f.startsWith('.')) continue;
    const base = f.replace(/\.(tmp\.mp4|mp4\.lock|mp4\.progress)$/, '.mp4');
    if (base !== f && (keep.has(base) || fs.existsSync(path.join(cacheDir(st.lesson), base + '.lock')))) continue; // being rendered right now
    fs.rmSync(path.join(cacheDir(st.lesson), f), {force: true});
  }
}

// one renderer at a time on this Mac (8 GB): a global lock, taken per question
const GLOBAL = () => path.join(workRoot(), '.geo-render.lock');
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };
function take(lockFile) {
  if (fs.existsSync(lockFile)) {
    const pid = Number(fs.readFileSync(lockFile, 'utf8'));
    if (pid !== process.pid && alive(pid)) return false;
  }
  fs.writeFileSync(lockFile, String(process.pid));
  return true;
}
const drop = (lockFile) => { try { if (Number(fs.readFileSync(lockFile, 'utf8')) === process.pid) fs.rmSync(lockFile); } catch {} };

/** render every missing question (in timeline order). Returns 'done', 'busy' (another process is rendering) or
 *  'stale' (shouldStop() said the source changed) */
export async function fill(lesson, {shouldStop = () => false, log = console.log} = {}) {
  const st = await plan(lesson);
  prune(st);
  let busy = false, serveUrl = null;
  for (const s of st.segs) {
    if (s.state === 'done') continue;
    if (shouldStop()) return 'stale';
    const out = path.join(cacheDir(lesson), s.file), lock = out + '.lock';
    if (!take(GLOBAL())) { busy = true; break; }
    if (!take(lock)) { drop(GLOBAL()); busy = true; continue; }
    try {
      serveUrl ??= await cachedBundle();
      let lastW = 0;
      for (let n = 0; ; n++) {
        const {cancelSignal, cancel} = makeCancelSignal(); // pause/edit → stop this question now, not at its end
        const iv = setInterval(() => shouldStop() && cancel(), 1000);
        try {
          const inputProps = {lesson, f0: s.f0, f1: s.f1};
          const composition = await selectComposition({serveUrl, id: `${lesson}-${s.id}`, inputProps, chromiumOptions});
          await renderMedia({composition, serveUrl, codec: 'h264', crf: 16, audioBitrate: '320k', inputProps, chromiumOptions, concurrency, cancelSignal,
            outputLocation: out.replace(/\.mp4$/, '.tmp.mp4'), timeoutInMilliseconds: 120000,
            onProgress: ({progress}) => { if (Date.now() - lastW > 1500) (lastW = Date.now()), fs.writeFileSync(out + '.progress', progress.toFixed(3)); }});
          fs.renameSync(out.replace(/\.mp4$/, '.tmp.mp4'), out);
          break;
        } catch (e) {
          fs.rmSync(out.replace(/\.mp4$/, '.tmp.mp4'), {force: true});
          if (shouldStop()) return 'stale';
          if (n >= 3) throw e;
          log(`  ${lesson} ${s.id} failed (${String(e.message).slice(0, 80)}), retrying`);
        } finally {
          clearInterval(iv);
        }
      }
      s.state = 'done';
      log(`  ${lesson} ${s.id} rendered`);
    } finally {
      drop(lock);
      fs.rmSync(out + '.progress', {force: true});
      drop(GLOBAL());
    }
  }
  return busy ? 'busy' : st.segs.every((s) => s.state === 'done') ? 'done' : 'busy';
}

/** the sound of the whole video once as WAV (joined questions would drift by an AAC frame per join) */
export async function audio(lesson) {
  const st = await plan(lesson);
  const wav = path.join(cacheDir(lesson), st.audio);
  if (!fs.existsSync(wav)) {
    const serveUrl = await cachedBundle();
    const composition = await selectComposition({serveUrl, id: `${lesson}-full`, inputProps: {lesson}, chromiumOptions});
    await renderMedia({composition, serveUrl, codec: 'wav', inputProps: {lesson}, outputLocation: wav + '.tmp.wav', chromiumOptions, concurrency});
    fs.renameSync(wav + '.tmp.wav', wav);
  }
  return {st, wav};
}
