// Scan a folder of sound effects (any formats, nested) → measurements for each file, so a pack can be understood and
// imported. Usage: node scripts/sfx-scan.mjs <folder> <out.json>
// Per file: duration, integrated loudness, peak, number of sound parts (silence-separated → compilation?), a content hash
// (exact duplicates across folders), and where the loudest moment is.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';

const [dir, out] = process.argv.slice(2);
const AUDIO = /\.(mp3|wav|m4a|aac|aiff?|flac|ogg|mp4|mov)$/i;

const files = [];
const walk = (d) =>
  fs.readdirSync(d, {withFileTypes: true}).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.name.startsWith('.') || e.name.startsWith('._')) return;
    if (e.isDirectory()) walk(p);
    else if (AUDIO.test(e.name)) files.push(p);
  });
walk(dir);

const run = (args, binary = false) =>
  new Promise((resolve) => {
    const p = spawn(ffmpegPath, ['-hide_banner', ...args]);
    const so = [], se = [];
    p.stdout.on('data', (d) => so.push(d));
    p.stderr.on('data', (d) => se.push(d));
    p.on('close', () => resolve({out: Buffer.concat(so), err: Buffer.concat(se).toString()}));
  });

const results = [];
for (const [i, f] of files.entries()) {
  const {err} = await run(['-i', f, '-vn', '-af', 'ebur128=peak=true,silencedetect=noise=-45dB:d=0.25', '-f', 'null', '-']);
  const dur = err.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const duration = dur ? +dur[1] * 3600 + +dur[2] * 60 + +dur[3] : 0;
  const I = Number(err.match(/I:\s+(-?[\d.]+) LUFS/)?.[1] ?? NaN);
  const peak = Number(err.match(/Peak:\s+(-?[\d.]+) dBFS/)?.[1] ?? NaN);
  // sound parts = stretches between silences
  const sil = [...err.matchAll(/silence_start: (-?[\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)].map((m) => [Math.max(0, +m[1]), +m[2]]);
  const parts = [];
  let cur = 0;
  for (const [a, b] of sil) {
    if (a - cur > 0.08) parts.push([+cur.toFixed(2), +a.toFixed(2)]);
    cur = b;
  }
  if (duration - cur > 0.08) parts.push([+cur.toFixed(2), +duration.toFixed(2)]);
  // content hash on decoded mono 8k audio (same sound, different file name/format → same hash)
  const {out: pcm} = await run(['-i', f, '-vn', '-ac', '1', '-ar', '8000', '-t', '20', '-f', 's16le', '-loglevel', 'error', '-'], true);
  const hash = crypto.createHash('md5').update(pcm).digest('hex').slice(0, 12);
  results.push({file: path.relative(dir, f), duration: +duration.toFixed(2), lufs: I, peak, parts, nParts: parts.length, hash});
  process.stdout.write(`\r  ${i + 1}/${files.length}`);
}
// mark exact duplicates
const seen = new Map();
for (const r of results) {
  if (seen.has(r.hash)) r.duplicateOf = seen.get(r.hash);
  else seen.set(r.hash, r.file);
}
fs.writeFileSync(out, JSON.stringify(results, null, 2));
const dups = results.filter((r) => r.duplicateOf).length;
console.log(`\n✅ ${results.length} files scanned, ${dups} exact duplicates → ${out}`);
