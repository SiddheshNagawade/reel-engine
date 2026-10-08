// Cut a green-screen meme compilation into transparent stickers + sounds, and add them to the meme catalog.
// Usage: node scripts/memes-extract.mjs <source.mp4> <segments.json>
//   segments.json: [{id, start, end, tags:[], placement?: 'peek-left'|'peek-right'|'corner'|'any', note?}]
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {ffmpeg} from './lib/media.mjs';
import ffmpegPath from 'ffmpeg-static';

const [src, segFile] = process.argv.slice(2);
const segments = JSON.parse(fs.readFileSync(segFile, 'utf8'));
const MEMES = path.resolve('public/assets/library');
const KIND = 'stickers';
const KEY = '0x4BBA45';
const MAX_SECONDS = 6;

const raw = (args) =>
  new Promise((resolve) => {
    const p = spawn(ffmpegPath, ['-hide_banner', '-loglevel', 'error', ...args]);
    const chunks = [];
    p.stdout.on('data', (d) => chunks.push(d));
    p.on('close', () => resolve(Buffer.concat(chunks)));
  });

// Bounding box of the non-green subject across a few frames (in 1920x1080 coordinates).
async function subjectBox(start, dur) {
  const W = 480, H = 270, n = 6;
  const buf = await raw(['-ss', String(start), '-t', String(dur), '-i', src, '-vf', `fps=${n / dur},scale=${W}:${H}`, '-frames:v', String(n), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let i = 0; i + 2 < buf.length; i += 3) {
    const [r, g, b] = [buf[i], buf[i + 1], buf[i + 2]];
    const green = g > r + 35 && g > b + 35;
    if (green) continue;
    const px = (i / 3) % (W * H);
    const x = px % W, y = Math.floor(px / W);
    // ignore the very edge rows/cols that are often compression noise
    if (x < 2 || y < 2 || x > W - 3 || y > H - 3) {
      if (!(x === 0 || x === W - 1 || y === H - 1)) continue;
    }
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  const s = 1920 / W, m = 24;
  const bx = Math.max(0, Math.floor(x0 * s) - m), by = Math.max(0, Math.floor(y0 * s) - m);
  let bw = Math.min(1920 - bx, Math.ceil((x1 - x0) * s) + 2 * m), bh = Math.min(1080 - by, Math.ceil((y1 - y0) * s) + 2 * m);
  bw -= bw % 2; bh -= bh % 2;
  return {bx, by, bw, bh, touches: {left: x0 <= 1, right: x1 >= W - 2, bottom: y1 >= H - 2}};
}

const catalogFile = path.join(MEMES, 'catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf8'));

for (const seg of segments) {
  const dur = Math.min(MAX_SECONDS, seg.end - seg.start);
  const dir = path.join(MEMES, KIND, seg.id);
  fs.rmSync(dir, {recursive: true, force: true});
  fs.mkdirSync(dir, {recursive: true});
  const box = await subjectBox(seg.start, dur);

  // Transparent sticker: crop → key out green → remove green fringe → max 720px tall.
  await ffmpeg([
    '-y', '-ss', String(seg.start), '-t', String(dur), '-i', src,
    '-vf', `crop=${box.bw}:${box.bh}:${box.bx}:${box.by},chromakey=${KEY}:0.10:0.02,despill=type=green:mix=0.6:expand=0.1,scale=-2:'min(ih,720)',format=yuva420p`,
    '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '30', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '4', '-an',
    path.join(dir, 'sticker.webm'),
  ]);
  // Poster frame (with transparency) for previews.
  await ffmpeg([
    '-y', '-ss', String(seg.start + Math.min(0.5, dur / 2)), '-i', src,
    '-vf', `crop=${box.bw}:${box.bh}:${box.bx}:${box.by},chromakey=${KEY}:0.10:0.02,despill=type=green:mix=0.6:expand=0.1,scale=-2:300,format=rgba`,
    '-frames:v', '1', path.join(dir, 'poster.png'),
  ]);
  // Sound: keep only if the meme actually has audio worth hearing.
  const stats = await ffmpeg(['-ss', String(seg.start), '-t', String(dur), '-i', src, '-vn', '-af', 'volumedetect', '-f', 'null', '-']);
  const mean = Number(stats.match(/mean_volume: (-?[\d.]+)/)?.[1] ?? -91);
  const hasSound = mean > -42;
  if (hasSound) {
    await ffmpeg(['-y', '-ss', String(seg.start), '-t', String(dur), '-i', src, '-vn', '-af', `afade=t=out:st=${Math.max(0, dur - 0.25)}:d=0.25`, '-ar', '48000', path.join(dir, 'sound.wav')]);
  }

  const placement = seg.placement ?? (box.touches.left ? 'peek-left' : box.touches.right ? 'peek-right' : 'any');
  const entry = {
    id: seg.id,
    dir: `${KIND}/${seg.id}`,
    kind: 'sticker',
    tags: seg.tags,
    seconds: Math.min(dur, seg.seconds ?? 2.2),
    sticker: true,
    placement,
    volume: hasSound ? seg.volume ?? 0.8 : 0,
    source: 'cat-memes compilation',
    note: seg.note ?? '',
  };
  catalog.memes = catalog.memes.filter((m) => m.id !== seg.id);
  catalog.memes.push(entry);
  console.log(`  ${seg.id.padEnd(24)} ${dur.toFixed(1)}s  ${box.bw}x${box.bh}  ${placement.padEnd(10)} sound:${hasSound ? 'yes' : 'no '} (${mean}dB)  [${seg.tags.join(', ')}]`);
}

fs.writeFileSync(catalogFile, JSON.stringify(catalog, null, 2));
console.log(`\n✅ ${segments.length} memes → Library/`);
