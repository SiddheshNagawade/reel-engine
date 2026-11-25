// Render a geometry tutorial (composition "Geo", src/geometry) safely: picture in 2-minute chunks (each a fresh
// browser, resumes after a crash), the sound once as WAV, then joined losslessly. One 33-minute render in a single
// go crashed after hours ("Session closed") and hung, so long geometry videos always go through this.
//   node scripts/geo-render.mjs <lesson> [--name elementary] [--note "..."] [--fresh]
// Output: output/<name>/<name>-full-vN.mp4 (never overwrites) + a CHANGELOG line. Chunks live in _work/<name>/chunks.
import fs from 'node:fs';
import path from 'node:path';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {cachedBundle} from './render.mjs';
import {outputRoot, workRoot} from './lib/paths.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const lesson = args[0];
if (!lesson) throw new Error('usage: node scripts/geo-render.mjs <lesson> [--name x] [--note "..."]');
const name = opt('--name', lesson);
const chromiumOptions = {gl: process.env.REEL_GL || 'angle'};
const concurrency = Number(process.env.REEL_CONCURRENCY) || 4; // 8 GB Mac: 4 tabs is the safe number

const serveUrl = await cachedBundle();
const inputProps = {lesson};
const composition = await selectComposition({serveUrl, id: 'Geo', inputProps, chromiumOptions});
const fps = composition.fps, total = composition.durationInFrames;
const outDir = path.join(outputRoot(), name);
fs.mkdirSync(outDir, {recursive: true});
let v = 1;
while (fs.existsSync(path.join(outDir, `${name}-full-v${v}.mp4`))) v++;
const out = path.join(outDir, `${name}-full-v${v}.mp4`);
const tmpDir = path.join(workRoot(), name, 'chunks');
if (args.includes('--fresh')) fs.rmSync(tmpDir, {recursive: true, force: true});
fs.mkdirSync(tmpDir, {recursive: true});
// a chunk set belongs to one exact video: if the lesson changed (other length), old chunks are wrong
const stamp = path.join(tmpDir, 'frames.txt');
if (fs.existsSync(stamp) && fs.readFileSync(stamp, 'utf8') !== String(total)) fs.rmSync(tmpDir, {recursive: true, force: true}), fs.mkdirSync(tmpDir, {recursive: true});
fs.writeFileSync(stamp, String(total));

const t0 = Date.now(), CH = 120 * fps, parts = [];
console.log(`${lesson}: ${(total / fps / 60).toFixed(1)} min, ${Math.ceil(total / CH)} chunks → ${out}`);
for (let a = 0; a < total; a += CH) {
  const b = Math.min(total - 1, a + CH - 1), part = path.join(tmpDir, `v-${a}-${b}.mp4`);
  parts.push(part);
  if (fs.existsSync(part) && fs.statSync(part).size > 1e5) continue; // done before a crash
  for (let tryN = 0; ; tryN++) {
    try {
      await renderMedia({composition, serveUrl, codec: 'h264', crf: 16, muted: true, inputProps, outputLocation: part + '.tmp.mp4', chromiumOptions,
        concurrency, frameRange: [a, b], timeoutInMilliseconds: 120000});
      fs.renameSync(part + '.tmp.mp4', part);
      break;
    } catch (e) {
      if (tryN >= 3) throw e;
      console.log(`  chunk ${a}-${b} failed (${String(e.message).slice(0, 80)}), retrying`);
    }
  }
  console.log(`  ${Math.round(((b + 1) / total) * 100)}% (${((Date.now() - t0) / 60000).toFixed(1)} min)`);
}
const wav = path.join(tmpDir, 'audio.wav');
if (!fs.existsSync(wav)) await renderMedia({composition, serveUrl, codec: 'wav', inputProps, outputLocation: wav, chromiumOptions, concurrency});
const list = path.join(tmpDir, 'list.txt');
fs.writeFileSync(list, parts.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'));
const {spawnSync} = await import('node:child_process');
const ff = (await import('ffmpeg-static')).default;
const r = spawnSync(ff, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-i', wav, '-map', '0:v', '-map', '1:a',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', out], {encoding: 'utf8'});
if (r.status !== 0) throw new Error(r.stderr);
fs.rmSync(tmpDir, {recursive: true, force: true});
fs.appendFileSync(path.join(outDir, 'CHANGELOG.md'), `\n## ${name}-full v${v} (${new Date().toISOString().slice(0, 10)}): ${(total / fps / 60).toFixed(1)} min\n${opt('--note', '- full video')}\n`);
console.log(`✅ ${out} (${((Date.now() - t0) / 60000).toFixed(0)} min)`);
