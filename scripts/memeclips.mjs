// Video memes → the Library (T7 Library/clips/<id>/), cut to their PUNCH, ready for reels and vlogs.
//   node scripts/memeclips.mjs <picks.json> [--src <folder>] [--only id1,id2]
// picks.json: [{file, id, tags, meaning, show: card|half|full|zoom, in?, out?}]  (brain/meme-picks.json is the first set,
// chosen 2026-10-14 from github.com/fgetcat/my-meme-folder after a content filter and a look at every clip).
// Per meme: clip.mp4 (the punch: whole clip if ≤ 3.5 s, else the liveliest 1.5–3 s by cutfinder.py beats, or in/out),
// sound.mp3 (levelled), poster.png, full.mp4 (the original, for when the whole setup is needed), about.txt, catalog entry
// kind "clip" with its tags, meaning and default way to show it. How to SHOW a meme: brain/memes.md.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {driveAttached, libraryRoot} from './lib/paths.mjs';
import {ffmpeg, probe} from './lib/media.mjs';

if (!driveAttached()) {
  console.error('The T7 isn\'t plugged in: meme clips live in its Library.');
  process.exit(1);
}
const args = process.argv.slice(2);
const opt = (f, d) => (args.includes(f) ? args[args.indexOf(f) + 1] : d);
const picks = JSON.parse(fs.readFileSync(args[0], 'utf8'));
const SRC = opt('--src', '/Volumes/T7 Shield/ReelEngine/meme-sources/my-meme-folder');
const only = opt('--only') ? new Set(opt('--only').split(',')) : null;
const LIB = libraryRoot();
const catalogFile = path.join(LIB, 'catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf8'));

function punch(file, dur) {
  if (dur <= 3.5) return [0, dur];
  const len = Math.min(3, Math.max(1.5, dur * 0.35));
  const r = spawnSync('.venv/bin/python', ['scripts/cutfinder.py', 'beats', file, '--n', '1', '--len', String(len)], {encoding: 'utf8'});
  try {
    const [[a, b]] = JSON.parse(r.stdout).jumps;
    return [Math.max(0, a - 0.15), Math.min(dur, b + 0.1)]; // a little air before the hit
  } catch {
    return [Math.max(0, dur - len), dur]; // fallback: memes usually land at the end
  }
}

let n = 0;
for (const p of picks) {
  if (only && !only.has(p.id)) continue;
  const src = path.join(SRC, p.file);
  if (!fs.existsSync(src)) { console.log(`✗ ${p.id}: ${p.file} not found`); continue; }
  const info = await probe(src);
  const [a, b] = p.in != null ? [p.in, p.out ?? info.duration] : punch(src, info.duration);
  const dir = path.join(LIB, 'clips', p.id);
  fs.mkdirSync(dir, {recursive: true});
  const len = +(b - a).toFixed(2);
  await ffmpeg(['-y', '-ss', String(a), '-t', String(len), '-i', src,
    '-vf', "fps=30,scale='if(gt(iw,ih),min(720,iw),-2)':'if(gt(iw,ih),-2,min(720,ih))',format=yuv420p",
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-an', '-movflags', '+faststart', path.join(dir, 'clip.mp4')]);
  if (info.hasAudio) {
    await ffmpeg(['-y', '-ss', String(a), '-t', String(len), '-i', src, '-vn', '-af', 'loudnorm=I=-18:TP=-1.5:LRA=11,afade=t=in:d=0.01',
      '-ar', '48000', '-b:a', '192k', path.join(dir, 'sound.mp3')]);
  }
  await ffmpeg(['-y', '-ss', String(a + len * 0.5), '-i', src, '-frames:v', '1', '-vf', "scale='min(480,iw)':-2", path.join(dir, 'poster.png')]);
  fs.copyFileSync(src, path.join(dir, 'full.mp4'));
  fs.writeFileSync(path.join(dir, 'about.txt'), `${p.meaning}\nTags: ${p.tags.join(', ')}\nShow as: ${p.show} (card / half / full / zoom, see brain/memes.md)\n` +
    `Punch: ${a.toFixed(2)}–${b.toFixed(2)} s of ${info.duration.toFixed(2)} s (full.mp4 = whole clip)\nSource: github.com/fgetcat/my-meme-folder · ${p.file}\n`);
  catalog.memes = catalog.memes.filter((m) => m.id !== p.id);
  catalog.memes.push({id: p.id, dir: `clips/${p.id}`, kind: 'clip', sticker: false, tags: [...p.tags, 'clip'], meaning: p.meaning, show: p.show,
    seconds: len, length: +info.duration.toFixed(2), in: +a.toFixed(2), out: +b.toFixed(2), w: info.width, h: info.height,
    volume: 0.9, placement: p.show, source: 'my-meme-folder', note: p.meaning});
  n++;
  process.stdout.write(`\r  ${n} ${p.id.padEnd(24)} ${len}s`);
}
fs.writeFileSync(catalogFile, JSON.stringify(catalog, null, 2));
fs.writeFileSync('brain/library-catalog.json', JSON.stringify(catalog, null, 2));
console.log(`\n✅ ${n} meme clips in ${path.join(LIB, 'clips')}`);
