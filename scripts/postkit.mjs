// Posting kit (brain/posting.md): the facts a post needs, for the latest (or a given) version of a video.
//   node scripts/postkit.mjs <name> [vN]   → prints facts + the template; I then write output/<name>/<name>-vN.post.md
// Renders call writePostFacts() so every version gets <name>-vN.post.json next to the mp4.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {outputRoot, libraryRoot} from './lib/paths.mjs';

const catalog = () => {
  const f = path.join(libraryRoot(), 'catalog.json');
  if (!fs.existsSync(f)) return [];
  const c = JSON.parse(fs.readFileSync(f, 'utf8'));
  return Array.isArray(c) ? c : c.items ?? [];
};

// Spoken lines kept in the cut, from the version's transcript.md (lines that start with a frame stamp).
const spokenLines = (md) =>
  md.split('\n').filter((l) => /^`f\d+/.test(l)).map((l) => l.replace(/^`[^`]*`\s*/, '').replace(/\*\*|⟦[^⟧]*⟧/g, '').trim());

export function writePostFacts({reelDir, vName, edit, direction, transcriptMd, fps}) {
  const cat = catalog();
  const music = [...new Set((edit.musicCues ?? []).map((m) => m.id))].map((id) => {
    const m = cat.find((x) => x.id === id) ?? {};
    return {id, credit: m.credit ?? null, licence: m.licence ?? null};
  });
  const facts = {
    version: vName,
    seconds: +(edit.durationInFrames / fps).toFixed(1),
    hookText: direction?.hookText ?? null,
    topic: direction?.topic ?? null,
    spoken: spokenLines(transcriptMd ?? ''),
    music,
    credits: music.map((m) => m.credit).filter(Boolean),
  };
  const file = path.join(reelDir, `${vName}.post.json`);
  fs.writeFileSync(file, JSON.stringify(facts, null, 2));
  return file;
}

const TEMPLATE = `# Posting kit: {version}

## Instagram
Caption (paste as is):
\`\`\`
<line 1: second hook ≤125 chars with the search words>
<1–2 lines of context, his voice>
<send/comment trigger that fits this reel>
<series line if any>
<3–5 hashtags>
<music credit if needed>
\`\`\`
- Cover frame: <time + why> · Audio in the picker: <mood/kind of song, volume ~5–10 %> · Collab/location: <only if real>

## YouTube Shorts
- Title: <≤60 chars>
- Description:
\`\`\`
<one-line summary with keywords>
<series / next part>
<3 hashtags>
<music credit if needed>
\`\`\`
- Tags: <comma list incl. Hinglish spellings>
- Related video: <previous part or none>

## When
<day + time IST, reason>
`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [name, v] = process.argv.slice(2);
  if (!name) { console.log('usage: node scripts/postkit.mjs <name> [vN]'); process.exit(1); }
  const dir = path.join(outputRoot(), name);
  const versions = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /-v\d+\.mp4$/.test(f) && !f.startsWith('._')) : [];
  const vName = v ? `${name}-${v}` : versions.map((f) => f.replace('.mp4', '')).sort((a, b) => +a.split('-v').pop() - +b.split('-v').pop()).at(-1);
  if (!vName) { console.log(`no versions in ${dir}`); process.exit(1); }
  const factsFile = path.join(dir, `${vName}.post.json`);
  let facts;
  if (fs.existsSync(factsFile)) facts = JSON.parse(fs.readFileSync(factsFile, 'utf8'));
  else { // older versions rendered before the kit existed: rebuild what we can from the transcript
    const md = fs.existsSync(path.join(dir, `${vName}.transcript.md`)) ? fs.readFileSync(path.join(dir, `${vName}.transcript.md`), 'utf8') : '';
    facts = {version: vName, hookText: md.match(/Hook: "([^"]+)"/)?.[1] ?? null, seconds: +(md.match(/length ([\d.]+)s/)?.[1] ?? 0), spoken: spokenLines(md), music: [], credits: []};
  }
  console.log(JSON.stringify(facts, null, 2));
  console.log(`\nWrite → ${path.join(dir, `${vName}.post.md`)} following brain/posting.md:\n`);
  console.log(TEMPLATE.replace('{version}', vName));
}
