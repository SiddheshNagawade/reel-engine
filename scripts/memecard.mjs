// Meme cards: a classic captioned meme (Drake, Two Buttons, This Is Fine…) made with the meme-maker skill he added,
// saved straight into the Library so reels (attach image) and vlogs (gfx sticker) can use it, now and later.
//
//   node scripts/memecard.mjs suggest "<what the moment is about>"        → which templates fit
//   node scripts/memecard.mjs <template> --text "top" --text "bottom" --id <slug> --tags "choice, captions"
//       → Library/stickers/<id>/sticker.svg (+ about.txt, catalog entry, tags)
//
// Use it for a choice / comparison / irony beat in HIS story, about one per video. His current Indian memes (asked for
// in the asset-request pass) come first; these templates are older international formats.
// The template image cache lives on the T7 (Library/.meme-cache), never on the Mac.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {driveAttached, libraryRoot} from './lib/paths.mjs';

const SKILL = [
  path.join(os.homedir(), '.claude/plugins/marketplaces/local-desktop-app-uploads/mcpmarket-me/skills/meme-maker/scripts/meme.mjs'),
  ...(process.env.MEME_MAKER ? [process.env.MEME_MAKER] : []),
].find((f) => fs.existsSync(f));
if (!SKILL) {
  console.error('meme-maker skill not found (set MEME_MAKER=<path to scripts/meme.mjs>)');
  process.exit(1);
}

const args = process.argv.slice(2);
const opt = (f, d) => (args.includes(f) ? args[args.indexOf(f) + 1] : d);
const LIB = libraryRoot();
// template images are cached on the T7; suggestions alone need no cache
const env = {...process.env, XDG_CACHE_HOME: path.join(LIB, '.meme-cache')};

if (args[0] === 'suggest' || args[0] === 'search' || args[0] === 'list') {
  const r = spawnSync('node', [SKILL, ...args], {encoding: 'utf8', env});
  process.stdout.write(r.stdout || r.stderr);
  process.exit(r.status ?? 0);
}

// Making a card: the Library (and its catalog) lives on the T7 only, so (and its catalog) lives on the T7 only: without the drive there is nowhere to keep a card.
if (!driveAttached()) {
  console.error('The T7 isn\'t plugged in: meme cards are saved in its Library. Plug it in and run again.');
  process.exit(1);
}

const template = args[0];
const texts = args.flatMap((a, i) => (args[i - 1] === '--text' ? [a] : []));
const id = opt('--id', `meme-${template}-${Date.now().toString(36)}`);
const tags = opt('--tags', '').split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
if (!template || !texts.length) {
  console.error('Usage: node scripts/memecard.mjs <template> --text "…" [--text "…"] --id <slug> --tags "a, b"  |  suggest "<topic>"');
  process.exit(1);
}
const dir = path.join(LIB, 'stickers', id);
fs.mkdirSync(dir, {recursive: true});
const out = path.join(dir, 'sticker.svg');
const r = spawnSync('node', [SKILL, 'render', template, ...texts.flatMap((t) => ['--text', t]), '--out', out], {encoding: 'utf8', env});
if (r.status !== 0 || !fs.existsSync(out)) {
  fs.rmSync(dir, {recursive: true, force: true});
  console.error(r.stderr || r.stdout || 'render failed');
  process.exit(1);
}
fs.writeFileSync(path.join(dir, 'about.txt'), `Meme card (${template}): ${texts.join(' / ')}\nKind: image (full card, not a cut-out)\nTags: ${tags.join(', ')}\nMade with the meme-maker skill on ${new Date().toISOString().slice(0, 10)}\n`);
const catalogFile = path.join(LIB, 'catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf8'));
catalog.memes = catalog.memes.filter((m) => m.id !== id);
catalog.memes.push({id, dir: `stickers/${id}`, kind: 'sticker', sticker: false, card: true, template, tags: [...new Set([...tags, 'meme-card'])],
  note: `${template}: ${texts.join(' / ')}`, seconds: 2.5, volume: 0, placement: 'any', source: 'meme-maker'});
fs.writeFileSync(catalogFile, JSON.stringify(catalog, null, 2));
fs.writeFileSync('brain/library-catalog.json', JSON.stringify(catalog, null, 2));
console.log(`✅ ${out}
   reel: direction.attach {at, what: "image", src: "stickers/${id}/sticker.svg", to: "screen", screen: [0.5, 0.3], size: 1.6, seconds: 2.5}
   vlog: gfx {type: "sticker", sticker: "${id}", at, dur: 2.5, x, y, h: 0.6}`);
