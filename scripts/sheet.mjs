// Contact sheet: N frames of a clip (or a time range) tiled into one JPG, each stamped with its time.
// Cheap way to "watch" hours of footage before deciding anything (process / drawing videos).
//
//   node scripts/sheet.mjs <video> <out.jpg> [--from s] [--to s] [--n 12] [--cols 4] [--w 480]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';

const args = process.argv.slice(2);
const opt = (f, d) => (args.includes(f) ? args[args.indexOf(f) + 1] : d);
const [src, out] = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!src || !out) {
  console.error('Usage: node scripts/sheet.mjs <video> <out.jpg> [--from s] [--to s] [--n 12] [--cols 4] [--w 480]');
  process.exit(1);
}
const duration = () => {
  try {
    execFileSync(ffmpegPath, ['-i', src], {stdio: 'pipe'});
  } catch (e) {
    const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(String(e.stderr));
    return +m[1] * 3600 + +m[2] * 60 + +m[3];
  }
};
const from = +opt('--from', 0);
const to = +opt('--to', duration());
const n = +opt('--n', 12);
const cols = +opt('--cols', 4);
const w = +opt('--w', 480);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sheet-'));
const fmt = (t) => (t >= 60 ? `${Math.floor(t / 60)}m${(t % 60).toFixed(0).padStart(2, '0')}` : `${t.toFixed(1)}s`);
try {
  for (let k = 0; k < n; k++) {
    const t = from + ((to - from) * (k + 0.5)) / n;
    execFileSync(ffmpegPath, ['-hide_banner', '-loglevel', 'error', '-y', '-ss', t.toFixed(3), '-i', src, '-frames:v', '1',
      '-vf', `scale=${w}:-2,drawtext=text='${fmt(t)}':x=8:y=8:fontsize=${Math.round(w / 17)}:fontcolor=yellow:box=1:boxcolor=black@0.6`,
      path.join(tmp, `f${String(k).padStart(3, '0')}.jpg`)], {stdio: ['ignore', 'ignore', 'ignore']});
  }
  fs.mkdirSync(path.dirname(path.resolve(out)), {recursive: true});
  execFileSync(ffmpegPath, ['-hide_banner', '-loglevel', 'error', '-y', '-i', path.join(tmp, 'f%03d.jpg'),
    '-vf', `tile=${cols}x${Math.ceil(n / cols)}`, '-frames:v', '1', out]);
  console.log(out);
} finally {
  fs.rmSync(tmp, {recursive: true, force: true});
}
