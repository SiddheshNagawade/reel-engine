// Renders the vector-character test (src/character) over a tracked plate.
// Usage: node scripts/char-render.mjs [--stills 0,40,120] [--out output/char-test/char-test-v1.mp4]
// Needs: public/char-test/plate.mp4 (SDR plate), public/char-test/parts (scripts/char-parts.py),
//        work/char-test/track-wall.json + track-bag.json (scripts/walltrack.py).
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {ffmpeg} from './lib/media.mjs';

const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const stills = arg('--stills', '');
const out = arg('--out', 'output/char-test/char-test-v1.mp4');
// Linux/cloud: use a local headless Chrome if Remotion can't download its own.
const browserExecutable = process.env.REEL_BROWSER || undefined;
const chromiumOptions = {gl: process.env.REEL_GL || (process.platform === 'darwin' ? 'angle' : 'swangle'), ignoreCertificateErrors: !!process.env.REEL_BROWSER};

// Cartoon sound effects, synthesised (no library files needed).
const SFX = {
  flicker: ["aevalsrc='0.5*(random(0)*2-1)*gt(mod(t\\,0.06)\\,0.03)*exp(-7*t)':d=0.3:s=48000", 'highpass=f=900'],
  boing: ["aevalsrc='0.6*sin(2*PI*(170*t+420*t*t))*exp(-4.5*t)*(1+0.35*sin(2*PI*16*t))':d=0.5:s=48000"],
  bonk: ["aevalsrc='0.8*sin(2*PI*560*t)*exp(-28*t)+0.7*sin(2*PI*180*t)*exp(-14*t)+0.3*(random(1)*2-1)*exp(-90*t)':d=0.45:s=48000"],
  thud: ["aevalsrc='0.95*sin(2*PI*(46*t+14*(1-exp(-12*t))))*exp(-5*t)+0.2*(random(2)*2-1)*exp(-50*t)':d=0.6:s=48000"],
  twinkle: ["aevalsrc='0.3*sin(2*PI*(2200+500*floor(t/0.11))*t)*exp(-16*mod(t\\,0.11))*(1-t/0.9)':d=0.9:s=48000"],
  whoosh: ["aevalsrc='(random(0)*2-1)*pow(sin(PI*t/0.5)\\,3)':d=0.5:s=48000", 'bandpass=f=1400:width_type=o:w=2.5,lowpass=f=5000,volume=2'],
  pop: ["aevalsrc='0.7*sin(2*PI*(700*t+120*(1-exp(-40*t))))*exp(-28*t)':d=0.18:s=48000"],
  mwah: ["aevalsrc='0.5*sin(2*PI*(420*t+520*t*t))*exp(-8*t)*(1-exp(-90*t))':d=0.35:s=48000", 'lowpass=f=3000'],
  tap: ["aevalsrc='0.4*(random(3)*2-1)*exp(-80*t)':d=0.07:s=48000", 'lowpass=f=1800'],
};

async function makeSfx() {
  const dir = 'public/char-test/sfx';
  fs.mkdirSync(dir, {recursive: true});
  for (const [name, [src, af]] of Object.entries(SFX)) {
    const file = `${dir}/${name}.wav`;
    if (fs.existsSync(file)) continue;
    await ffmpeg(['-y', '-f', 'lavfi', '-i', src, ...(af ? ['-af', af] : []), file]);
  }
}

const inv = ([[a, c, e], [b, d, f]]) => {
  const det = a * d - b * c;
  return [[d / det, -c / det, (c * f - d * e) / det], [-b / det, a / det, (b * e - a * f) / det]];
};
const mul = (A, B) => [0, 1].map((r) => [A[r][0] * B[0][0] + A[r][1] * B[1][0], A[r][0] * B[0][1] + A[r][1] * B[1][1], A[r][0] * B[0][2] + A[r][1] * B[1][2] + A[r][2]]);
const apply = (A, [x, y]) => [A[0][0] * x + A[0][1] * y + A[0][2], A[1][0] * x + A[1][1] * y + A[1][2]];

await makeSfx();
const wall = JSON.parse(fs.readFileSync('work/char-test/track-wall.json', 'utf8')).matrices;
const bag = JSON.parse(fs.readFileSync('work/char-test/track-bag.json', 'utf8')).matrices;
const heads = JSON.parse(fs.readFileSync('public/char-test/parts/parts.json', 'utf8')).heads;
const n = Math.min(wall.length, 318);
// Seat: a spot on top of the bag, picked on frame 280 (screen px) → wall coords via the bag track.
const SEAT_FRAME = 268;
const seatScreen = [1000, 470];
const [sx, sy] = apply(inv(wall[SEAT_FRAME]), apply(mul(bag[SEAT_FRAME], inv(bag[280])), seatScreen));
// The leaning steel rod in front of where he first appears (frame-0 pixels, edges measured on the plate).
const rod = [[337, -300], [395, -300], [684, 1000], [622, 1000]];

const inputProps = {
  plate: 'char-test/plate.mp4',
  wall: wall.slice(0, n),
  bag: bag.slice(0, n),
  heads,
  seat: {x: sx, y: sy},
  occluders: [{from: 0, to: 70, poly: rod}],
};

const bundleDir = path.join(os.tmpdir(), 'reelengine-char-bundle');
fs.rmSync(bundleDir, {recursive: true, force: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), symlinkPublicDir: true, outDir: bundleDir});
const composition = await selectComposition({serveUrl, id: 'CharTest', inputProps, browserExecutable, chromiumOptions});
fs.mkdirSync(path.dirname(out), {recursive: true});

if (stills) {
  for (const frame of stills.split(',').map(Number)) {
    const file = path.join(path.dirname(out), `still-${String(frame).padStart(3, '0')}.png`);
    await renderStill({composition, serveUrl, frame, output: file, inputProps, browserExecutable, chromiumOptions});
    console.log('  still', file);
  }
} else {
  let last = -1;
  await renderMedia({
    composition, serveUrl, codec: 'h264', crf: 17, audioBitrate: '256k', outputLocation: out, inputProps,
    browserExecutable, chromiumOptions, concurrency: Number(process.env.REEL_CONCURRENCY) || Math.max(2, Math.floor(os.cpus().length / 2)),
    onProgress: ({progress}) => {
      const p = Math.floor(progress * 100);
      if (p !== last && p % 10 === 0) process.stdout.write(`\r  rendering ${p}%   `);
      last = p;
    },
  });
  console.log(`\n  → ${out}`);
}
