// Import a sound-effect pack into Library/sounds with MEANINGS (contextual uses), not just literal names.
// Usage: node scripts/sfx-import.mjs <pack-folder> <scan.json> <labels.json>
//   scan.json   = output of scripts/sfx-scan.mjs (durations, parts, duplicates)
//   labels.json = per-file decisions: {file: {id, family, meanings?, music?, split?: [{part, id, family}], splitAll?: family, titles?}}
// Every sound: own folder, level-matched mp3 (-20 LUFS, silence trimmed), about.txt; catalog entry with family tags.
import fs from 'node:fs';
import path from 'node:path';
import {libraryRoot} from './lib/paths.mjs';
import {ffmpeg} from './lib/media.mjs';
import {FAMILIES} from './lib/sound-families.mjs';

const [packDir, scanFile, labelsFile] = process.argv.slice(2);
const scan = JSON.parse(fs.readFileSync(scanFile, 'utf8'));
const labels = JSON.parse(fs.readFileSync(labelsFile, 'utf8'));
const LIB = libraryRoot(); // on the T7 (Mac only as fallback)
const catalogFile = path.join(LIB, 'catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf8'));
const packName = path.basename(labelsFile).replace(/\.labels\.json$/, '');

async function importOne({src, start, dur, id, family, extraMeanings = [], extraTags = [], music = false, note = ''}) {
  const fam = FAMILIES[family];
  if (!fam && !music) throw new Error(`unknown family ${family} for ${id}`);
  const dir = path.join(LIB, music ? 'music' : 'sounds', id);
  fs.mkdirSync(dir, {recursive: true});
  const out = path.join(dir, music ? 'track.mp3' : 'sound.mp3');
  const trim = music ? '' : 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,';
  await ffmpeg(['-y', ...(start != null ? ['-ss', String(start)] : []), ...(dur != null ? ['-t', String(dur)] : []), '-i', src, '-vn',
    '-af', `${trim}loudnorm=I=${music ? -24 : -20}:TP=-2:LRA=11,afade=t=in:d=0.005`, '-ar', '48000', '-b:a', '192k', out]);
  const meanings = [...(fam?.meanings ?? []), ...extraMeanings];
  const tags = [...new Set([...(fam?.tags ?? []), family, ...extraTags])];
  const length = dur ?? scan.find((s) => path.join(packDir, s.file) === src)?.duration ?? 0;
  fs.writeFileSync(path.join(dir, 'about.txt'),
    `${note || id}\nFamily: ${family}${music ? ' (music bed)' : ''}\nUse it for (contextual, not literal):\n${meanings.map((m) => `- ${m}`).join('\n')}\nSource: ${path.basename(src)} (${packName})\n`);
  catalog.memes = catalog.memes.filter((m) => m.id !== id);
  catalog.memes.push({
    id, dir: `${music ? 'music' : 'sounds'}/${id}`, kind: music ? 'music' : 'sound', soundOnly: true, family, tags, meanings,
    seconds: Math.min(length || 2, fam?.useSeconds ?? 2.5), length: +(+length).toFixed(2), volume: fam?.volume ?? 0.7,
    beat: !!fam?.beat, pack: packName, note,
  });
}

let n = 0;
for (const s of scan) {
  if (s.duplicateOf) continue;
  const L = labels[s.file];
  if (!L || L.skip) continue;
  const src = path.join(packDir, s.file);
  if (L.split || L.splitAll) {
    // compilation: one sound per part (silence-separated), named by title / my listening-by-shape labels
    const parts = s.parts;
    for (const [i, p] of parts.entries()) {
      const spec = L.split?.find((x) => x.part === i + 1);
      if (L.split && !spec) continue;
      const family = spec?.family ?? L.splitAll;
      const id = spec?.id ?? `${L.id}-${String(i + 1).padStart(2, '0')}`;
      await importOne({src, start: p[0], dur: Math.min(p[1] - p[0], FAMILIES[family]?.maxSeconds ?? 12), id, family, note: spec?.note ?? `${L.note ?? L.id} (part ${i + 1})`});
      n++;
    }
  } else {
    await importOne({src, id: L.id, family: L.family, music: !!L.music, extraMeanings: L.meanings ?? [], extraTags: L.tags ?? [], note: L.note ?? '',
      dur: L.music ? undefined : Math.min(s.duration, FAMILIES[L.family]?.maxSeconds ?? 12)});
    n++;
  }
  process.stdout.write(`\r  ${n} sounds imported`);
}
fs.writeFileSync(catalogFile, JSON.stringify(catalog, null, 2));
fs.writeFileSync('brain/library-catalog.json', JSON.stringify(catalog, null, 2)); // metadata backup in git
console.log(`\n✅ ${n} sounds from ${packName} → Library/`);
