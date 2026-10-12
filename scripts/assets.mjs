// His memes, GIFs, stickers and illustrations → the Library, for this video and every later one.
//
//   node scripts/assets.mjs request <name>
//       Reads the "Asset requests" table in _work/<name>/plan.md. Every row with status "asked" gets a folder
//       Library/wanted/<id>/ with about.txt (what it's for, Google search words, tags). Prints the message for him.
//   node scripts/assets.mjs import
//       Every wanted/<id>/ folder he dropped files into becomes a Library item:
//         sticker  picture → cut out (Apple Vision) with a white outline   → stickers/<id>/sticker.png
//         image / photo / illustration → kept whole (svg stays svg)         → stickers/<id>/sticker.png|svg
//         gif / video → transparent-capable webm + poster (+ its sound)     → stickers/<id>/sticker.webm
//         sound → level-matched mp3 (-20 LUFS, silence trimmed)             → sounds/<id>/sound.mp3
//       Catalog entry with his tags, the original kept beside it, the plan row marked "received", wanted folder removed.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {libraryRoot, workRoot} from './lib/paths.mjs';
import {ffmpeg, probe} from './lib/media.mjs';
import {planFile, readPlan} from './lib/editplan.mjs';

const [cmd, name] = process.argv.slice(2);
const LIB = libraryRoot();
const WANTED = path.join(LIB, 'wanted');
const IMAGE = /\.(png|jpe?g|webp|heic|heif|avif|bmp|tiff?)$/i;
const MOVING = /\.(gif|mp4|mov|m4v|webm|mkv)$/i;
const AUDIO = /\.(mp3|wav|m4a|aac|ogg|opus|flac)$/i;
const SVG = /\.svg$/i;
const media = (f) => !f.startsWith('.') && (IMAGE.test(f) || MOVING.test(f) || AUDIO.test(f) || SVG.test(f));

function field(text, key) {
  return new RegExp(`^${key}:\\s*(.+)$`, 'mi').exec(text)?.[1]?.trim() ?? '';
}

if (cmd === 'request') {
  if (!name) throw new Error('Usage: node scripts/assets.mjs request <name>');
  const plan = readPlan(path.join(workRoot(), name));
  const rows = plan?.passes.asks?.rows.filter((r) => /^asked$/i.test(r.status)) ?? [];
  if (rows.length === 0) {
    console.log('No rows with status "asked" in the Asset requests table.');
    process.exit(0);
  }
  const lines = [];
  for (const r of rows) {
    const dir = path.join(WANTED, r.id);
    fs.mkdirSync(dir, {recursive: true});
    fs.writeFileSync(path.join(dir, 'about.txt'), [
      `Wanted for ${name} (${r.moment}): ${r.what}`,
      `Kind: ${r.kind}`,
      `Search: ${r.search}`,
      `Tags: ${r.tags}`,
      `For: ${name}`,
      'Drop the file (png / jpg / gif / mp4 / mp3…) in this folder, then tell Claude.',
      '',
    ].join('\n'));
    lines.push(`- **${r.id}** · ${r.moment}: ${r.what} (${r.kind})\n  Google: "${r.search}"`);
  }
  const msg = `Memes / pictures I'd like for ${name}. Search, save, and drop each file in its folder:\n${WANTED}/<id>/\n\n${lines.join('\n')}\n\nSkip any you don't like; tell me and I'll mark it declined.`;
  fs.writeFileSync(path.join(workRoot(), name, 'asset-requests.md'), msg + '\n');
  console.log(msg);
  process.exit(0);
}

if (cmd !== 'import') {
  console.error('Usage: node scripts/assets.mjs request <name> | import');
  process.exit(1);
}

const catalogFile = path.join(LIB, 'catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf8'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reelengine-assets-'));
const done = [];

const run = (bin, args) => {
  const r = spawnSync(bin, args, {encoding: 'utf8'});
  if (r.status !== 0) throw new Error(`${bin} failed: ${(r.stderr || r.stdout || '').slice(-800)}`);
  return r.stdout;
};
const hasAlpha = (png) => /hasAlpha:\s*yes/.test(run('sips', ['-g', 'hasAlpha', png]));

async function soundFrom(src, out) {
  await ffmpeg(['-y', '-i', src, '-vn', '-af',
    'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,loudnorm=I=-20:TP=-2:LRA=11,afade=t=in:d=0.005',
    '-ar', '48000', '-b:a', '192k', out]);
}

async function importOne(id) {
  const from = path.join(WANTED, id);
  const files = fs.readdirSync(from).filter(media);
  if (files.length === 0) return;
  const about = fs.existsSync(path.join(from, 'about.txt')) ? fs.readFileSync(path.join(from, 'about.txt'), 'utf8') : '';
  const file = files[0];
  const src = path.join(from, file);
  let kind = field(about, 'Kind').toLowerCase();
  if (!kind) kind = AUDIO.test(file) ? 'sound' : MOVING.test(file) ? 'gif' : 'sticker'; // older wanted folders
  const tags = (field(about, 'Tags') || field(about, 'Planned tags')).split(/[,;]/).map((t) => t.trim().toLowerCase()).filter(Boolean);
  const note = about.split('\n')[0] || id;
  const isSound = AUDIO.test(file);
  const dir = path.join(LIB, isSound ? 'sounds' : 'stickers', id);
  fs.mkdirSync(dir, {recursive: true});
  const entry = {id, dir: `${isSound ? 'sounds' : 'stickers'}/${id}`, tags: [...new Set([...tags, 'his-pick'])], note, source: 'Siddhesh', placement: 'any'};

  if (isSound) {
    await soundFrom(src, path.join(dir, 'sound.mp3'));
    const p = await probe(path.join(dir, 'sound.mp3'));
    Object.assign(entry, {kind: 'sound', soundOnly: true, seconds: Math.min(p.duration || 2, 3), length: +p.duration.toFixed(2), volume: 0.7});
  } else if (MOVING.test(file)) {
    const p = await probe(src);
    await ffmpeg(['-y', '-i', src, '-an', '-vf', "fps=30,scale=-2:'min(ih,720)',format=yuva420p",
      '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '30', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '4',
      path.join(dir, 'sticker.webm')]);
    await ffmpeg(['-y', '-i', src, '-frames:v', '1', path.join(dir, 'poster.png')]);
    if (p.hasAudio) await soundFrom(src, path.join(dir, 'sound.mp3')).catch(() => fs.rmSync(path.join(dir, 'sound.mp3'), {force: true}));
    Object.assign(entry, {kind: 'sticker', sticker: /\.(gif|webm)$/i.test(file), seconds: +Math.min(p.duration || 2.5, 4).toFixed(2), length: +(p.duration || 0).toFixed(2), volume: 0.6});
  } else if (SVG.test(file)) {
    fs.copyFileSync(src, path.join(dir, 'sticker.svg'));
    Object.assign(entry, {kind: 'sticker', sticker: true, seconds: 2.5, volume: 0});
  } else {
    const png = path.join(tmp, `${id}.png`);
    run('sips', ['-s', 'format', 'png', src, '--out', png]);
    const out = path.join(dir, 'sticker.png');
    if (kind === 'sticker' && !hasAlpha(png)) {
      // Cut the subject out of its background, white outline + shadow (same tool as direction.attach stickers).
      run('.venv/bin/python', ['scripts/sticker.py', png, out]);
      fs.rmSync(out.replace(/\.png$/, '-check.jpg'), {force: true});
    } else {
      fs.copyFileSync(png, out);
    }
    Object.assign(entry, {kind: 'sticker', sticker: kind === 'sticker' || hasAlpha(out), seconds: 2.5, volume: 0});
  }

  fs.copyFileSync(src, path.join(dir, `original${path.extname(file).toLowerCase()}`));
  fs.writeFileSync(path.join(dir, 'about.txt'), `${about.trim()}\nImported: ${new Date().toISOString().slice(0, 10)} as ${entry.kind}${entry.sticker ? ' (transparent)' : ''}\n`);
  catalog.memes = catalog.memes.filter((m) => m.id !== id);
  catalog.memes.push(entry);
  fs.rmSync(from, {recursive: true, force: true});
  done.push({id, kind: entry.kind, forVideo: field(about, 'For')});
}

try {
  for (const id of fs.existsSync(WANTED) ? fs.readdirSync(WANTED) : []) {
    if (id.startsWith('.') || !fs.statSync(path.join(WANTED, id)).isDirectory()) continue;
    try {
      await importOne(id);
    } catch (e) {
      console.error(`✗ ${id}: ${e.message}`);
    }
  }
} finally {
  fs.rmSync(tmp, {recursive: true, force: true});
}

if (done.length === 0) {
  console.log('Nothing new in Library/wanted/ (folders without a dropped file are still waiting).');
  process.exit(0);
}
fs.writeFileSync(catalogFile, JSON.stringify(catalog, null, 2));
fs.writeFileSync('brain/library-catalog.json', JSON.stringify(catalog, null, 2)); // git backup of the catalog

// Mark the rows "received" in each video's plan.
for (const d of done.filter((x) => x.forVideo)) {
  const f = planFile(path.join(workRoot(), d.forVideo));
  if (!fs.existsSync(f)) continue;
  const text = fs.readFileSync(f, 'utf8').replace(new RegExp(`^(\\|\\s*${d.id}\\s*\\|.*\\|)\\s*asked\\s*\\|\\s*$`, 'mi'), '$1 received |');
  fs.writeFileSync(f, text);
}
for (const d of done) console.log(`✅ ${d.id} → Library (${d.kind})${d.forVideo ? `, marked received in ${d.forVideo}` : ''}`);
