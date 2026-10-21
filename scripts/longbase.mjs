// Scripted long-form: the base video in EXACT piece order (runs of increasing source time are cut with one ffmpeg
// pass each on a 30 fps grid, then joined) + the exact-order audio from longaudio.mjs. Picture and sound share one clock.
//   node scripts/longbase.mjs <name> <source video> <cutaudio.wav> <out.mp4> [--vf "<extra filters>"]
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import {workRoot} from './lib/paths.mjs';

const args = process.argv.slice(2);
const [name, srcVid, wav, out] = args;
const extra = args.includes('--vf') ? args[args.indexOf('--vf') + 1] : '';
const W = path.join(workRoot(), name);
const {pieces, speed = 1} = JSON.parse(fs.readFileSync(path.join(W, 'pieces.json'), 'utf8'));
const runs = [];
for (const p of pieces) { const r = runs[runs.length - 1]; if (r && p.s >= r[r.length - 1].e - 0.001) r.push(p); else runs.push([p]); }
const tmp = path.join(W, 'baseparts'); fs.mkdirSync(tmp, {recursive: true});
const parts = [];
for (const [i, r] of runs.entries()) {
  const t0 = Math.max(0, Math.floor(r[0].s) - 2);
  const sel = r.map((p) => `between(t,${(p.s - t0 - 1 / 60).toFixed(4)},${(p.e - t0 - 1 / 60).toFixed(4)})`).join('+');
  const part = path.join(tmp, `run${i}.mp4`); parts.push(part);
  const vf = `fps=30,select='${sel}',setpts=N/30/TB${extra ? ',' + extra : ''}`;
  console.log(`run ${i + 1}/${runs.length}: ${r.length} pieces from ${r[0].s.toFixed(1)} s`);
  const x = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(t0), '-i', srcVid, '-map', '0:v:0', '-vf', vf, '-an', '-c:v', 'h264_videotoolbox', '-b:v', '30M', '-pix_fmt', 'yuv420p', part], {encoding: 'utf8', maxBuffer: 1e8});
  if (x.status !== 0) throw new Error(x.stderr);
}
const list = path.join(tmp, 'list.txt');
fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join('\n'));
const x = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-i', wav, '-map', '0:v', '-map', '1:a',
  '-vf', `setpts=PTS/${speed},fps=30`, '-c:v', 'h264_videotoolbox', '-b:v', '22M', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
  '-c:a', 'aac', '-b:a', '256k', out], {encoding: 'utf8', maxBuffer: 1e8});
if (x.status !== 0) throw new Error(x.stderr);
fs.rmSync(tmp, {recursive: true, force: true});
console.log('✅', out);
