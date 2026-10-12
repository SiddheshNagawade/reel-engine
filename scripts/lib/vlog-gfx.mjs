// Remotion graphics pass for the vlog (scripts/vlog.mjs): each piece with "gfx" is re-rendered with its layers on top
// (src/vlog/VlogPiece.tsx), then re-encoded like every other piece so the final join stays a lossless concat.
// Pieces/photos are copied into public/vlog-stage only for the render and removed afterwards (Mac stays clean).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import crypto from 'node:crypto';
import ffmpegPath from 'ffmpeg-static';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {cachedBundle} from '../render.mjs';
import {libraryRoot} from './paths.mjs';

const STAGE = path.resolve('public/vlog-stage');
const chromiumOptions = {gl: process.env.REEL_GL || 'angle'};

export async function renderGfx(items, {W, H, FPS, preview, photoPath, work}) {
  // the folder itself stays (with .gitkeep) so the cached Remotion bundle links it; only its contents are temporary
  const clear = () => { fs.mkdirSync(STAGE, {recursive: true}); for (const f of fs.readdirSync(STAGE)) if (f !== '.gitkeep') fs.rmSync(path.join(STAGE, f), {force: true}); };
  clear();
  const link = (abs, as) => {
    const name = (as ?? path.basename(abs)).replace(/[^\w.-]/g, '_');
    const dest = path.join(STAGE, name);
    if (!fs.existsSync(dest)) fs.copyFileSync(abs, dest); // the Remotion server refuses symlinks that leave public/
    return `vlog-stage/${name}`;
  };
  try {
    const serveUrl = await cachedBundle();
    for (const it of items) {
      const s = it.seg;
      const frames = Math.round(it.total * FPS);
      const layers = (it.layers ?? s.gfx).map((g) => ({
        ...g,
        dur: g.dur ?? it.total - (g.at ?? 0),
        at: g.at ?? 0,
        ...(g.photos ? {photos: g.photos.map((p) => link(photoPath(p)))} : {}),
        ...(g.photo ? {photo: link(photoPath(g.photo))} : {}),
        ...(g.type === 'hero' && g.cut ? {cut: link(path.isAbsolute(g.cut) ? g.cut : path.join(work, g.cut))} : {}),
        ...(g.type === 'hero' && g.bg ? {bg: link(path.isAbsolute(g.bg) ? g.bg : g.bg.startsWith('heroes/') ? path.join(work, g.bg) : photoPath(g.bg))} : {}),
        ...(g.sticker ? (() => {
          // Moving stickers are sticker.webm; his imported memes can also be sticker.png / .svg (scripts/assets.mjs).
          const dir = path.join(libraryRoot(), 'stickers', g.sticker);
          const file = ['sticker.webm', 'sticker.png', 'sticker.svg', 'sticker.jpg'].find((f) => fs.existsSync(path.join(dir, f))) ?? 'sticker.webm';
          return {src: link(path.join(dir, file), g.sticker + path.extname(file))};
        })() : {}),
        ...(g.people ? {people: g.people.map((p) => ({...p, photo: link(photoPath(p.photo))}))} : {}),
      }));
      const sig = JSON.stringify({layers: it.layers ?? s.gfx, base: fs.statSync(it.file).mtimeMs, v: fs.statSync(path.resolve('src/vlog/VlogPiece.tsx')).mtimeMs});
      const out = it.file.replace(/\.mov$/, `.gfx-${crypto.createHash('md5').update(sig).digest('hex').slice(0, 8)}.mov`);
      if (fs.existsSync(out) && fs.existsSync(out + '.sig') && fs.readFileSync(out + '.sig', 'utf8') === sig) { it.gfxFile = out; continue; }
      const inputProps = {base: link(it.file), frames, layers, size: [W, H], fps: FPS, stage: s.stage};
      const composition = await selectComposition({serveUrl, id: 'VlogPiece', inputProps, chromiumOptions});
      const tmp = path.join(os.tmpdir(), `vlog-gfx-${process.pid}.mp4`);
      const t0 = Date.now();
      await renderMedia({composition, serveUrl, codec: 'h264', videoBitrate: preview ? '6M' : '32M', muted: true, outputLocation: tmp, inputProps, hardwareAcceleration: 'if-possible',
        concurrency: Number(process.env.REEL_CONCURRENCY) || 3, chromiumOptions});
      const r = spawnSync(ffmpegPath, ['-hide_banner', '-loglevel', 'error', '-y', '-i', tmp, '-i', it.file, '-map', '0:v', '-map', '1:a',
        '-c:v', 'h264_videotoolbox', '-b:v', preview ? '5M' : '26M', '-maxrate', preview ? '8M' : '34M', '-profile:v', 'high', '-allow_sw', '1', '-pix_fmt', 'yuv420p', '-r', String(FPS),
        '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-c:a', 'copy', out], {encoding: 'utf8'});
      fs.rmSync(tmp, {force: true});
      if (r.status !== 0) throw new Error(r.stderr);
      it.gfxFile = out;
      fs.writeFileSync(out + '.sig', sig);
      console.log(`  gfx ${s.id}: ${[...new Set((it.layers ?? s.gfx).map((g) => g.type))].join('+')} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
  } finally {
    clear();
  }
}
