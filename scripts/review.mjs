// Automatic frame review of a rendered version (runs by itself after every `npm run reel` render; Pass 10 reads it).
//   node scripts/review.mjs <name> [vN] [--every 6] [--no-probe]
// Writes output/<name>/<name>-vN.review.md (+ .review.jpg contact sheet). What it checks: scripts/lib/review.mjs.
// The text/face measuring renders the edit again (frames only, small): it needs the footage still staged in public/;
// without it (or with --no-probe) only the contact sheet, loudness and dead stretches run.
import fs from 'node:fs';
import path from 'node:path';
import {outputRoot} from './lib/paths.mjs';
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
const staged = edit.video && fs.existsSync(path.resolve('public', edit.video));
const r = await reviewVersion({edit, mp4: path.join(dir, file), outBase: path.join(dir, file.replace(/\.mp4$/, '')),
  every: +opt('--every', 6), probeOn: !args.includes('--no-probe') && staged});
console.log(r.text);
process.exit(r.fails ? 1 : 0);
