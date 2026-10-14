// AI upscale for small pictures and GIFs: Real-ESRGAN (xinntao/Real-ESRGAN, BSD-3, trained model, runs on the Mac GPU).
//   node scripts/upscale.mjs <in> <out> [--anime]       picture (png/jpg/webp) or moving (gif/mp4/webm)
// Models in models/esrgan/ (gitignored; re-download: github.com/xinntao/Real-ESRGAN releases → realesrgan-ncnn-vulkan
// macos zip). realesrgan-x4plus = real photos/people (natural skin, ~8 s per frame); realesr-animevideov3 = cartoons /
// anime (fast, but waxy on real faces, so only with --anime). Result capped at 1080 px on the long side.
// findimg.mjs pick calls this automatically for anything under 1000 px (pictures) / 720 px (GIFs).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import ffmpegPath from 'ffmpeg-static';

const BIN = path.resolve('models/esrgan/realesrgan-ncnn-vulkan');
const MODELS = path.resolve('models/esrgan/models');
const MOVING = /\.(gif|mp4|mov|m4v|webm)$/i;
const ff = (a) => { const r = spawnSync(ffmpegPath, ['-nostdin', '-loglevel', 'error', '-y', ...a]); if (r.status) throw new Error(String(r.stderr)); };
export const upscalerReady = () => fs.existsSync(BIN);

export function size(file) {
  const m = /, (\d{2,5})x(\d{2,5})/.exec(spawnSync(ffmpegPath, ['-hide_banner', '-i', file], {encoding: 'utf8'}).stderr ?? '');
  return m ? [+m[1], +m[2]] : [0, 0];
}

function esrgan(inp, out, anime) {
  const args = ['-i', inp, '-o', out, '-m', MODELS, ...(anime ? ['-n', 'realesr-animevideov3', '-s', '2'] : ['-n', 'realesrgan-x4plus', '-s', '4'])];
  const r = spawnSync(BIN, args, {stdio: ['ignore', 'ignore', 'pipe']});
  if (r.status) throw new Error(`upscaler failed: ${String(r.stderr).slice(-200)}`);
}

export function upscale(inp, out, {anime = false} = {}) {
  const [w, h] = size(inp);
  const cap = `scale='if(gt(iw,ih),min(1080,iw),-2)':'if(gt(iw,ih),-2,min(1080,ih))':flags=lanczos`;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'upscale-'));
  try {
    if (!MOVING.test(inp)) {
      ff(['-i', inp, path.join(tmp, 'in.png')]);
      esrgan(path.join(tmp, 'in.png'), path.join(tmp, 'up.png'), anime);
      ff(['-i', path.join(tmp, 'up.png'), '-vf', cap, out]);
    } else {
      const fps = /(\d+(?:\.\d+)?) fps/.exec(spawnSync(ffmpegPath, ['-hide_banner', '-i', inp], {encoding: 'utf8'}).stderr ?? '')?.[1] ?? '25';
      fs.mkdirSync(path.join(tmp, 'f')); fs.mkdirSync(path.join(tmp, 'u'));
      ff(['-i', inp, path.join(tmp, 'f', '%05d.png')]);
      esrgan(path.join(tmp, 'f'), path.join(tmp, 'u'), anime);
      const audio = /Audio:/.test(spawnSync(ffmpegPath, ['-hide_banner', '-i', inp], {encoding: 'utf8'}).stderr ?? '');
      ff(['-framerate', fps, '-i', path.join(tmp, 'u', '%05d.png'), ...(audio ? ['-i', inp, '-map', '0:v', '-map', '1:a', '-c:a', 'aac'] : []),
        '-vf', `${cap},format=yuv420p`, '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-shortest', out]);
    }
  } finally {
    fs.rmSync(tmp, {recursive: true, force: true});
  }
  const [W, H] = size(out);
  return {from: [w, h], to: [W, H]};
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [inp, out] = process.argv.slice(2);
  if (!inp || !out) { console.log('usage: node scripts/upscale.mjs <in> <out> [--anime]'); process.exit(1); }
  const r = upscale(inp, out, {anime: process.argv.includes('--anime')});
  console.log(`upscaled ${r.from.join('x')} → ${r.to.join('x')}: ${out}`);
}
