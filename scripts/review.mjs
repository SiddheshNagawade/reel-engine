// Automatic frame review of a rendered version (runs by itself after every `npm run reel` render; Pass 10 reads it).
//   node scripts/review.mjs <name> [vN] [--every 6] [--no-probe]
// Writes output/<name>/<name>-vN.review.md (+ .review.jpg contact sheet). What it checks: scripts/lib/review.mjs.
// The text/face measuring renders the edit again (frames only, small): it needs the footage still staged in public/;
// without it (or with --no-probe) only the contact sheet, loudness and dead stretches run.
import fs from 'node:fs';
import path from 'node:path';
import {outputRoot, workRoot} from './lib/paths.mjs';
import {reviewVersion} from './lib/review.mjs';

const args = process.argv.slice(2);
const opt = (f, d) => (args.includes(f) ? args[args.indexOf(f) + 1] : d);
const [name, ver] = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!name) { console.error('usage: node scripts/review.mjs <name> [vN] [--every 6] [--no-probe]'); process.exit(2); }
const dir = path.join(outputRoot(), name);
const versions = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => !f.startsWith('._') && /-v\d+\.mp4$/.test(f)).sort((a, b) => +a.match(/-v(\d+)/)[1] - +b.match(/-v(\d+)/)[1]) : [];
const file = ver ? `${name}-${ver.replace(/^v?/, 'v')}.mp4` : versions.at(-1);
if (!file || !fs.existsSync(path.join(dir, file))) { console.error(`No rendered version found in ${dir}`); process.exit(2); }
const editFile = `src/edits/${name}.json`;
const edit = fs.existsSync(editFile) ? JSON.parse(fs.readFileSync(editFile, 'utf8')) : {fps: 30};
// After a render reel.mjs has already removed its staged copies from public/: bring back what the measuring needs
// from the drive (the footage = selects.mp4, his cut-outs = fg-<f>-<frames>-*.webm), only for this run.
const work = path.join(workRoot(), name), staged = [];
const stage = (rel, src) => {
  const dst = path.resolve('public', rel);
  if (fs.existsSync(dst) || !src || !fs.existsSync(src)) return fs.existsSync(dst);
  fs.copyFileSync(src, dst); staged.push(dst); return true;
};
const newest = (re) => (fs.existsSync(work) ? fs.readdirSync(work).filter((f) => !f.startsWith('._') && re.test(f)).map((f) => path.join(work, f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0] : null);
let missing = 0;
const haveVideo = !!edit.video && stage(edit.video, path.join(work, 'selects.mp4'));
// cut-outs only sit on top of him (text behind the person): a missing one is dropped, positions don't change
edit.foreground = (edit.foreground ?? []).filter((fg) => !fg.src || stage(fg.src, newest(new RegExp(`^fg-${fg.f}-${fg.frames}-.*\\.webm$`))) || (missing++, false));
// anything else in public/input that is gone (stickers, insert pictures): measuring can't run without it
const refs = JSON.stringify(edit).match(/"input\/[^"]+"/g) ?? [];
const gone = [...new Set(refs.map((r) => r.slice(1, -1)))].filter((rel) => !fs.existsSync(path.resolve('public', rel)));
let r;
try {
  r = await reviewVersion({edit, mp4: path.join(dir, file), outBase: path.join(dir, file.replace(/\.mp4$/, '')),
    every: +opt('--every', 6), probeOn: !args.includes('--no-probe') && haveVideo && !gone.length});
} finally {
  for (const f of staged) fs.rmSync(f, {force: true}); // the Mac keeps nothing
}
if (missing) console.log(`(${missing} person cut-out(s) not found on the drive: measured without them)`);
if (gone.length) console.log(`(measuring skipped, not on the drive any more: ${gone.join(', ')})`);
console.log(r.text);
process.exit(r.fails ? 1 : 0);
