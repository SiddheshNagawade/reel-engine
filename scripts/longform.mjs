// Designomics long-form episode (YouTube 16:9): his cut + graded talking footage (base.mp4) + the episode graphics
// (src/longform: shots = where his footage sits, scenes = the Designomics kit, sfx, music). The edit lives in
// _work/<name>/episode.json (Claude writes it from script.md + editor-brief.md + the transcript).
//
//   node scripts/longform.mjs <name> [--note "- what changed"]        final render (needs the finished plan.md)
//   node scripts/longform.mjs <name> --stills 12.5,40,95               PNG stills at those seconds (checks, no gate)
//   node scripts/longform.mjs <name> --preview [--from 0 --to 60]     quick low-bitrate part render (no gate)
//
// episode.json: {"base": "base.mp4" (in _work/<name>), "shots": [{s,e,layout,zoom,fx,fy}], "scenes": [{type,at,dur,…}],
//   "sfx": [{src,at,vol}], "music": [{src,at,dur,vol,fadeIn,fadeOut,offset}]}
// Any string value "lib:<path>" in scenes/sfx/music = a file under the Library (staged into public/ only for the render).
// Output: <drive>/output/<name>/<name>-vN.mp4 + CHANGELOG.md. Versions never overwrite. No fade at the end.
import fs from 'node:fs';
import path from 'node:path';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {cachedBundle} from './render.mjs';
import {outputRoot, workRoot, libraryRoot} from './lib/paths.mjs';
import {requirePlan} from './lib/editplan.mjs';

const args = process.argv.slice(2);
const opt = (f, d) => (args.includes(f) ? args[args.indexOf(f) + 1] : d);
const name = args[0];
if (!name) { console.error('Usage: node scripts/longform.mjs <name> [--note …] [--stills a,b] [--preview --from s --to s]'); process.exit(1); }
const work = path.join(workRoot(), name);
const ep = JSON.parse(fs.readFileSync(path.join(work, opt('--ep', 'episode.json')), 'utf8'));
const STILLS = opt('--stills', '');
const PREVIEW = args.includes('--preview');
const PLAN_NOTE = STILLS || PREVIEW ? '' : requirePlan(work, name, args, 'vlog');

const STAGE = path.resolve('public/lf-stage');
fs.mkdirSync(STAGE, {recursive: true});
const staged = new Set();
const stage = (abs) => {
  const n = abs.replace(libraryRoot(), 'lib').replace(work, 'work').replace(/[^\w.-]/g, '_');
  const dest = path.join(STAGE, n);
  if (!fs.existsSync(dest) || fs.statSync(dest).size !== fs.statSync(abs).size) fs.copyFileSync(abs, dest);
  staged.add(dest);
  return `lf-stage/${n}`;
};
const resolveStr = (v) => {
  if (typeof v !== 'string') return v;
  if (v.startsWith('lib:')) return stage(path.join(libraryRoot(), v.slice(4)));
  if (v.startsWith('work:')) return stage(path.join(work, v.slice(5)));
  return v;
};
const deep = (o) => Array.isArray(o) ? o.map(deep) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, deep(v)])) : resolveStr(o);

const fps = ep.fps ?? 30;
const total = ep.duration ?? Math.max(...ep.shots.map((s) => s.e));
const props = {...deep({scenes: ep.scenes, sfx: ep.sfx ?? [], music: ep.music ?? [], shots: ep.shots}), base: stage(path.join(work, ep.base)), fps, frames: Math.round(total * fps)};
const chromiumOptions = {gl: process.env.REEL_GL || 'angle'};

try {
  const serveUrl = await cachedBundle();
  const composition = await selectComposition({serveUrl, id: 'Episode', inputProps: props, chromiumOptions});
  if (STILLS) {
    const dir = path.join(work, 'stills');
    fs.mkdirSync(dir, {recursive: true});
    for (const s of STILLS.split(',').map(Number)) {
      const out = path.join(dir, `t${s.toFixed(1)}.jpg`);
      await renderStill({composition, serveUrl, inputProps: props, frame: Math.round(s * fps), output: out, imageFormat: 'jpeg', jpegQuality: 80, chromiumOptions});
      console.log(out);
    }
  } else {
    const outDir = path.join(outputRoot(), name);
    fs.mkdirSync(outDir, {recursive: true});
    let v = 1;
    while (fs.existsSync(path.join(outDir, `${name}-v${v}.mp4`))) v++;
    const from = Number(opt('--from', 0)), to = Number(opt('--to', total));
    const out = PREVIEW ? path.join(work, `preview-${from}-${to}.mp4`) : path.join(outDir, `${name}-v${v}.mp4`);
    const t0 = Date.now();
    let last = -1;
    await renderMedia({composition, serveUrl, codec: 'h264', inputProps: props, outputLocation: out, chromiumOptions, hardwareAcceleration: 'if-possible',
      videoBitrate: opt('--bitrate', PREVIEW ? '5M' : '24M'), audioBitrate: '320k', concurrency: Number(process.env.REEL_CONCURRENCY) || 6,
      ...(PREVIEW ? {frameRange: [Math.round(from * fps), Math.min(Math.round(to * fps), props.frames) - 1]} : {}),
      onProgress: ({progress}) => { const p = Math.floor(progress * 100); if (p !== last && p % 5 === 0) { last = p; console.log(`  ${p}% (${((Date.now() - t0) / 60000).toFixed(1)} min)`); } }});
    if (!PREVIEW) {
      fs.writeFileSync(path.join(outDir, `${name}-v${v}.episode.json`), JSON.stringify(ep, null, 1));
      fs.appendFileSync(path.join(outDir, 'CHANGELOG.md'), `\n## ${name} v${v} (${new Date().toISOString().slice(0, 10)}): ${(total / 60).toFixed(2)} min\n${opt('--note', '- first cut')}${PLAN_NOTE ? `\n${PLAN_NOTE}` : ''}\n`);
    }
    console.log(`✅ ${out}`);
  }
} finally {
  for (const f of staged) fs.rmSync(f, {force: true}); // the Mac keeps nothing
}
