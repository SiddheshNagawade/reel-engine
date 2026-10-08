// Cut a sound-effect compilation into named, level-matched audio files and add them to the meme catalog.
// Usage: node scripts/sfx-extract.mjs <source> <segments.json>
//   segments.json: [{id, start, end, tags:[], seconds (how long to use it), beat? (needs a silent pause), note}]
import fs from 'node:fs';
import path from 'node:path';
import {ffmpeg} from './lib/media.mjs';

const [src, segFile] = process.argv.slice(2);
const segments = JSON.parse(fs.readFileSync(segFile, 'utf8'));
const MEMES = path.resolve('public/assets/library');
const KIND = 'sounds';
const catalogFile = path.join(MEMES, 'catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf8'));

for (const s of segments) {
  const dir = path.join(MEMES, KIND, s.id);
  fs.rmSync(dir, {recursive: true, force: true});
  fs.mkdirSync(dir, {recursive: true});
  const dur = s.end - s.start;
  // Level-match every effect (so none is suddenly louder than the voice), tiny fades to avoid clicks.
  await ffmpeg([
    '-y', '-ss', String(s.start), '-t', String(dur), '-i', src, '-vn',
    '-af', `loudnorm=I=-20:TP=-3:LRA=11,afade=t=in:d=0.01,afade=t=out:st=${Math.max(0, dur - 0.05)}:d=0.05`,
    '-ar', '48000', '-ac', '2', path.join(dir, 'sound.wav'),
  ]);
  catalog.memes = catalog.memes.filter((m) => m.id !== s.id);
  catalog.memes.push({id: s.id, dir: `${KIND}/${s.id}`, kind: 'sound', tags: s.tags, seconds: Math.min(s.seconds, dur), soundOnly: true, beat: !!s.beat, volume: 0.7, length: +dur.toFixed(2), note: s.note});
  console.log(`  ${s.id.padEnd(22)} ${dur.toFixed(1)}s (use ${Math.min(s.seconds, dur).toFixed(1)}s)  [${s.tags.join(', ')}]${s.beat ? '  ⏸ beat' : ''}`);
}
fs.writeFileSync(catalogFile, JSON.stringify(catalog, null, 2));
console.log(`✅ ${segments.length} sound effects → Library/`);
