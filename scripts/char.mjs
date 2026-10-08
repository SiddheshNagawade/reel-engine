// Vector character overlays: a cartoon character living in real footage (painted on a wall, behind real
// objects, jumping onto things). One command prepares everything; the story is data (scene.json).
//
//   npm run char -- <video> --sheet <character.eps|ai|pdf|png> [--start 0] [--dur 10.6]
//        → plate (tone-mapped, trimmed), camera tracks, character heads, inspection pictures, starter scene.json
//   npm run char -- <name> --stills 25,190     → test frames (work/char/<name>/inspect/still-*.png)
//   npm run char -- <name> --render [--note "what changed"]   → output/char/<name>/<name>-vN.mp4 (never overwrites)
//
// Steps are cached: delete a file in work/char/<name>/ to redo it (or pass --fresh).
// Workflow + lessons: .claude/skills/character-overlay/SKILL.md and brain/genres/character-overlay.md.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {ffmpeg, probe, TONEMAP} from './lib/media.mjs';
import {mediaRoots, outputRoot, workRoot, VIDEO_RE} from './lib/paths.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const flag = (k) => argv.includes(k);
const target = argv[0];
if (!target || target.startsWith('--')) {
  console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(0, 10).join('\n'));
  process.exit(1);
}
const slug = (s) => path.basename(s).replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const PY = fs.existsSync('.venv/bin/python') ? '.venv/bin/python' : 'python3';
const py = (args) => {
  const r = spawnSync(PY, args, {stdio: 'inherit'});
  if (r.status !== 0) throw new Error(`${args[0]} failed`);
};
const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const step = (s) => console.log(`\n▸ ${s}`);

// ── resolve video / project ────────────────────────────────────────────────
const findVideo = (v) => {
  if (fs.existsSync(v)) return path.resolve(v);
  for (const r of mediaRoots()) for (const d of ['inbox', 'projects', '']) {
    const p = path.join(r, d, v);
    if (fs.existsSync(p)) return p;
  }
  return null;
};
const name = slug(target);
const dir = path.join(workRoot(), 'char', name);
fs.mkdirSync(path.join(dir, 'inspect'), {recursive: true});
const sceneFile = path.join(dir, 'scene.json');
const metaFile = path.join(dir, 'source.json');
const meta = fs.existsSync(metaFile) ? readJson(metaFile) : {};
if (VIDEO_RE.test(target)) {
  const v = findVideo(target);
  if (!v) throw new Error(`can't find ${target} (looked in inbox/projects on the drive and locally)`);
  meta.video = v;
}
if (opt('--sheet')) {
  const s = findVideo(opt('--sheet'));
  if (!s) throw new Error(`can't find the character sheet ${opt('--sheet')}`);
  meta.sheet = s;
}
if (opt('--start')) meta.start = +opt('--start');
if (opt('--dur')) meta.dur = +opt('--dur');
if (!meta.video) throw new Error(`no video for "${name}" yet: run with the video file first`);
meta.start ??= 0;
meta.dur ??= 10.6;
fs.writeFileSync(metaFile, JSON.stringify(meta, null, 1));

const fresh = flag('--fresh');
const plate = path.join(dir, 'plate.mp4');
const plateKey = `${meta.video}|${meta.start}|${meta.dur}`;

try {
  spawnSync(PY, ['-c', 'import cv2'], {stdio: 'ignore'}).status === 0 ||
    (() => {
      throw new Error(`OpenCV missing for ${PY}: ${PY} -m pip install opencv-python-headless numpy`);
    })();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

// ── 1. plate: SDR, 30fps, trimmed ─────────────────────────────────────────
if (fresh || !fs.existsSync(plate) || meta.plateKey !== plateKey) {
  step(`Plate: ${path.basename(meta.video)} from ${meta.start}s, ${meta.dur}s`);
  const info = await probe(meta.video);
  const vf = (info.hdr ? TONEMAP : '') + 'format=yuv420p';
  await ffmpeg(['-y', '-ss', String(meta.start), '-i', meta.video, '-t', String(meta.dur), '-map', '0:v:0', '-map', '0:a:0?', '-vf', vf, '-r', '30',
    '-c:v', 'libx264', '-crf', '16', '-preset', 'fast', '-c:a', 'aac', plate]);
  meta.plateKey = plateKey;
  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 1));
  for (const f of ['track-wall.json', 'track-dark.json']) fs.rmSync(path.join(dir, f), {force: true});
}
const plateInfo = await probe(plate);
const frames = Math.round(plateInfo.duration * 30);

// ── 2. camera tracks ───────────────────────────────────────────────────────
for (const [surface, band] of [['wall', '0.35,0.78'], ['dark', '0.25,1.0']]) {
  const f = path.join(dir, `track-${surface}.json`);
  if (fresh || !fs.existsSync(f)) {
    step(`Tracking the ${surface === 'wall' ? 'wall' : 'dark objects (bags…)'}`);
    py(['scripts/walltrack.py', plate, f, '--surface', surface, '--band', opt(`--band-${surface}`, band)]);
  }
}

// ── 3. character parts ─────────────────────────────────────────────────────
let partsDir = null;
if (meta.sheet) {
  partsDir = path.join(workRoot(), 'char', 'parts', slug(meta.sheet));
  if (fresh || !fs.existsSync(path.join(partsDir, 'parts.json'))) {
    step(`Cutting heads from ${path.basename(meta.sheet)}`);
    py(['scripts/char-parts.py', meta.sheet, partsDir]);
  }
}

// ── 4. sound effects (synthesised once, shared) ────────────────────────────
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
const sfxDir = path.join(workRoot(), 'char', 'sfx');
fs.mkdirSync(sfxDir, {recursive: true});
for (const [n, [src, af]] of Object.entries(SFX)) {
  const f = path.join(sfxDir, `${n}.wav`);
  if (!fs.existsSync(f)) await ffmpeg(['-y', '-f', 'lavfi', '-i', src, ...(af ? ['-af', af] : []), f]);
}

// ── 5. inspection pictures + starter scene ─────────────────────────────────
const ins = path.join(dir, 'inspect');
if (fresh || !fs.existsSync(path.join(ins, 'contact.jpg'))) {
  step('Inspection pictures');
  py(['scripts/char-inspect.py', 'contact', plate, path.join(ins, 'contact.jpg'), '--every', '15']);
  py(['scripts/char-inspect.py', 'frame', plate, path.join(ins, 'frame.jpg'), '0', String(Math.floor(frames / 2)), String(frames - 1)]);
}
if (!fs.existsSync(sceneFile)) {
  const w = plateInfo.width;
  const h = plateInfo.height;
  const starter = {
    name,
    frames,
    fps: 30,
    character: {pxPerUnit: +(h * 0.42 / 1700).toFixed(3), heads: {smile: '1', shock: '2', laugh: '3', sad: '4', kiss: '5'}},
    ground: {y0: Math.round(h * 0.6), slope: 0, fix: []},
    occluders: [],
    anchors: {},
    beats: [
      {do: 'appear', to: 14, x: Math.round(w * 0.3)},
      {do: 'wave', to: 40},
      {do: 'turn', to: 46},
      {do: 'walk', to: frames - 1, x: Math.round(w * 0.9)},
    ],
    sfx: [],
    fadeOut: 14,
  };
  fs.writeFileSync(sceneFile, JSON.stringify(starter, null, 1));
  console.log(`\n  Starter scene written: ${sceneFile}\n  Measure the floor line on inspect/frame-0000.jpg, map heads from parts.png, then write the beats.`);
}
const scene = readJson(sceneFile);
scene.frames = Math.min(scene.frames ?? frames, frames);
step(`Ready: ${name} (${frames} frames, ${plateInfo.width}x${plateInfo.height})`);
console.log(`  work:    ${dir}`);
console.log(`  look at: inspect/contact.jpg, inspect/frame-*.jpg${partsDir ? `, ${path.join(partsDir, 'parts.png')}` : ''}`);
if (fs.existsSync(sceneFile)) {
  py(['scripts/char-inspect.py', 'check', plate, path.join(dir, 'track-wall.json'), sceneFile, path.join(ins, 'track-check.jpg'), '--every', '30']);
}
if (!flag('--render') && !opt('--stills')) process.exit(0);

// ── 6. render ──────────────────────────────────────────────────────────────
if (!partsDir) throw new Error('no character sheet yet: pass --sheet <file>');
const tracks = {wall: readJson(path.join(dir, 'track-wall.json')).matrices, dark: readJson(path.join(dir, 'track-dark.json')).matrices};
const inv = ([[a, c, e], [b, d, f]]) => {
  const det = a * d - b * c;
  return [[d / det, -c / det, (c * f - d * e) / det], [-b / det, a / det, (b * e - a * f) / det]];
};
const mul = (A, B) => [0, 1].map((r) => [A[r][0] * B[0][0] + A[r][1] * B[1][0], A[r][0] * B[0][1] + A[r][1] * B[1][1], A[r][0] * B[0][2] + A[r][1] * B[1][2] + A[r][2]]);
const apply = (A, [x, y]) => [A[0][0] * x + A[0][1] * y + A[0][2], A[1][0] * x + A[1][1] * y + A[1][2]];
// Anchor spots (picked in screen px on one frame) → wall coords at their lock frame.
const anchors = {};
for (const [n, a] of Object.entries(scene.anchors ?? {})) {
  const T = tracks[a.track] ?? tracks.wall;
  const lock = a.lock ?? a.frame;
  const [x, y] = apply(inv(tracks.wall[lock]), apply(mul(T[lock], inv(T[a.frame])), a.screen));
  anchors[n] = {x, y};
}

// Stage only what this render needs into public/input (deleted afterwards: the Mac is scratch space).
const stage = path.resolve('public', 'input', `char-${name}`);
fs.rmSync(stage, {recursive: true, force: true});
fs.mkdirSync(path.join(stage, 'parts'), {recursive: true});
fs.mkdirSync(path.join(stage, 'sfx'), {recursive: true});
fs.copyFileSync(plate, path.join(stage, 'plate.mp4'));
for (const f of fs.readdirSync(sfxDir)) fs.copyFileSync(path.join(sfxDir, f), path.join(stage, 'sfx', f));
const parts = readJson(path.join(partsDir, 'parts.json'));
const heads = {};
const mapping = {side: 'side', ...(scene.character.heads ?? {})};
for (const [expr, id] of Object.entries(mapping)) {
  const m = parts.heads[id];
  if (!m) continue;
  fs.copyFileSync(path.join(partsDir, m.file), path.join(stage, 'parts', m.file));
  heads[expr] = {...m, file: `input/char-${name}/parts/${m.file}`};
}
for (const need of ['smile', 'shock', 'laugh', 'sad', 'kiss']) heads[need] ??= heads.smile ?? Object.values(heads)[0];

const inputProps = {scene, plate: `input/char-${name}/plate.mp4`, size: {w: plateInfo.width, h: plateInfo.height}, sfxDir: `input/char-${name}/sfx`, tracks, heads, anchors};
const browserExecutable = process.env.REEL_BROWSER || undefined;
const chromiumOptions = {gl: process.env.REEL_GL || (process.platform === 'darwin' ? 'angle' : 'swangle'), ignoreCertificateErrors: !!process.env.REEL_BROWSER};
try {
  step('Bundling');
  const bundleDir = path.join(os.tmpdir(), 'reelengine-char-bundle');
  fs.rmSync(bundleDir, {recursive: true, force: true});
  const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), symlinkPublicDir: true, outDir: bundleDir});
  const composition = await selectComposition({serveUrl, id: 'CharScene', inputProps, browserExecutable, chromiumOptions});
  if (opt('--stills')) {
    for (const frame of opt('--stills').split(',').map(Number)) {
      const file = path.join(ins, `still-${String(frame).padStart(3, '0')}.png`);
      await renderStill({composition, serveUrl, frame, output: file, inputProps, browserExecutable, chromiumOptions});
      console.log('  still', file);
    }
  } else {
    const outDir = path.join(outputRoot(), 'char', name);
    fs.mkdirSync(outDir, {recursive: true});
    let v = 1;
    while (fs.existsSync(path.join(outDir, `${name}-v${v}.mp4`))) v++;
    const out = path.join(outDir, `${name}-v${v}.mp4`);
    step(`Rendering v${v}`);
    let last = -1;
    await renderMedia({
      composition, serveUrl, codec: 'h264', crf: 17, audioBitrate: '256k', outputLocation: out, inputProps, browserExecutable, chromiumOptions,
      concurrency: Number(process.env.REEL_CONCURRENCY) || Math.max(2, Math.floor(os.cpus().length / 2)),
      onProgress: ({progress}) => {
        const p = Math.floor(progress * 100);
        if (p !== last && p % 10 === 0) process.stdout.write(`\r  ${p}%   `);
        last = p;
      },
    });
    fs.copyFileSync(sceneFile, path.join(outDir, `${name}-v${v}.scene.json`));
    fs.appendFileSync(path.join(outDir, 'CHANGELOG.md'), `\n## v${v} (${new Date().toISOString().slice(0, 10)})\n${opt('--note', '(no note)')}\n`);
    console.log(`\n  → ${out}\n  Check it: ffmpeg frames from the output, never call it done without looking.`);
  }
} finally {
  fs.rmSync(stage, {recursive: true, force: true});
}
