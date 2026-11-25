// Export a geometry video: every question comes from the render cache (scripts/lib/geo-cache.mjs; missing or
// changed ones are rendered now), the sound once as WAV, then joined losslessly. Nothing already rendered (for the
// preview, or a previous export) renders again.
//   node scripts/geo-render.mjs <lesson> [--note "..."]
// Output: output/<lesson>/<lesson>-full-vN.mp4 (never overwrites) + a CHANGELOG line.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fill, audio, cacheDir} from './lib/geo-cache.mjs';
import {outputRoot} from './lib/paths.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const lesson = args[0];
if (!lesson) throw new Error('usage: node scripts/geo-render.mjs <lesson> [--note "..."]');
const t0 = Date.now();
while ((await fill(lesson)) !== 'done') await new Promise((r) => setTimeout(r, 20000)); // another process is rendering: wait our turn
const {st, wav} = await audio(lesson);
const outDir = path.join(outputRoot(), lesson);
fs.mkdirSync(outDir, {recursive: true});
let v = 1;
while (fs.existsSync(path.join(outDir, `${lesson}-full-v${v}.mp4`))) v++;
const out = path.join(outDir, `${lesson}-full-v${v}.mp4`);
const list = path.join(cacheDir(lesson), `list-${process.pid}.txt`);
fs.writeFileSync(list, st.segs.map((s) => `file '${path.join(cacheDir(lesson), s.file).replace(/'/g, "'\\''")}'`).join('\n'));
const ff = (await import('ffmpeg-static')).default;
const r = spawnSync(ff, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-i', wav, '-map', '0:v', '-map', '1:a',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', out], {encoding: 'utf8'});
fs.rmSync(list, {force: true});
if (r.status !== 0) throw new Error(r.stderr);
fs.appendFileSync(path.join(outDir, 'CHANGELOG.md'), `\n## ${lesson}-full v${v} (${new Date().toISOString().slice(0, 10)}): ${(st.frames / st.fps / 60).toFixed(1)} min\n${opt('--note', '- full video')}\n`);
console.log(`✅ ${out} (${((Date.now() - t0) / 60000).toFixed(0)} min)`);
