// Find pictures / logos / GIFs for a moment, choose by LOOKING at one sheet, keep the winner in the Library.
//
//   node scripts/findimg.mjs search <reel> <id> "<search words>" [--src wiki,openverse,giphy] [--n 8]
//       Fetches up to n candidates per source (free APIs, no scraping) → one numbered contact sheet
//       _work/<reel>/finds/<id>.jpg + <id>.json. I look at that ONE image and pick (cheap: 1 picture per moment).
//   node scripts/findimg.mjs pick <reel> <id> <number> [--kind sticker|image|gif] [--tags a,b] [--what "…"]
//       Downloads the full-size original into Library/wanted/<id>/ with an about.txt (source, licence, credit) and runs
//       `assets.mjs import` → cut-out / transparent webm / catalog entry, exactly like his own files.
//
// Sources (brain/skills.md "Find pictures"):
//   wiki      Wikimedia Commons: logos, brands, places, famous people, objects (often transparent PNG/SVG)
//   openverse Openverse: openly licensed photos/illustrations (CC), no key
//   giphy     GIPHY: reaction GIFs / memes; needs a free key in secrets.local.json {"giphyKey": "…"} (gitignored)
// Current Indian memes and inside jokes still come from him (pass 9): these sites don't have them.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
import {libraryRoot, workRoot, driveAttached} from './lib/paths.mjs';
import {upscale, upscalerReady, size} from './upscale.mjs';

const UA = 'ReelEngine/1.0 (personal video editing tool; contact via github.com/SiddheshNagawade/reel-engine)';
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const [cmd, reel, id] = args;
const secrets = fs.existsSync('secrets.local.json') ? JSON.parse(fs.readFileSync('secrets.local.json', 'utf8')) : {};
const giphyKey = process.env.GIPHY_API_KEY || secrets.giphyKey;

const getJson = async (url) => {
  const r = await fetch(url, {headers: {'User-Agent': UA}});
  if (!r.ok) throw new Error(`${r.status} ${url.split('?')[0]}`);
  return r.json();
};
const download = async (url, file) => {
  const r = await fetch(url, {headers: {'User-Agent': UA}});
  if (!r.ok) throw new Error(`${r.status} downloading`);
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
};

const SOURCES = {
  async wiki(q, n) {
    const u = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=${n}&prop=imageinfo&iiprop=url|size|extmetadata|mime&iiurlwidth=320&format=json`;
    const pages = Object.values((await getJson(u)).query?.pages ?? {}).sort((a, b) => a.index - b.index);
    return pages.flatMap((p) => {
      const ii = p.imageinfo?.[0];
      if (!ii || !/image\//.test(ii.mime)) return [];
      const md = ii.extmetadata ?? {};
      const strip = (s) => (s ?? '').replace(/<[^>]+>/g, '').trim();
      return [{src: 'wiki', title: p.title.replace(/^File:/, ''), thumb: ii.thumburl, full: ii.url, // SVGs stay SVG (sharp at any size)
        w: ii.width, h: ii.height, licence: strip(md.LicenseShortName?.value), credit: strip(md.Artist?.value), page: ii.descriptionurl}];
    });
  },
  async openverse(q, n) {
    const d = await getJson(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=${n}`);
    return (d.results ?? []).map((x) => ({src: 'openverse', title: x.title, thumb: x.thumbnail || x.url, full: x.url, w: x.width, h: x.height,
      licence: `${x.license ?? ''} ${x.license_version ?? ''}`.trim().toUpperCase(), credit: x.creator ?? '', page: x.foreign_landing_url}));
  },
  async giphy(q, n) {
    if (!giphyKey) { console.log('  (giphy skipped: no key in secrets.local.json)'); return []; }
    const d = await getJson(`https://api.giphy.com/v1/gifs/search?api_key=${giphyKey}&q=${encodeURIComponent(q)}&limit=${n}&rating=pg-13`);
    return (d.data ?? []).map((g) => ({src: 'giphy', title: g.title, thumb: g.images?.fixed_width_still?.url, full: g.images?.original?.mp4 || g.images?.original?.url,
      w: +g.images?.original?.width, h: +g.images?.original?.height, licence: 'GIPHY', credit: g.username || 'GIPHY', page: g.url, moving: true}));
  },
};

if ((cmd === 'search' || cmd === 'pick') && !driveAttached()) {
  console.log('The T7 drive is not plugged in: the Library and work files live there (nothing is written to the Mac). Plug it in and run again.');
  process.exit(2);
}
const finds = path.join(workRoot(), reel ?? '', 'finds');

if (cmd === 'search') {
  const q = args[3];
  if (!reel || !id || !q) throw new Error('usage: node scripts/findimg.mjs search <reel> <id> "<search words>" [--src wiki,openverse,giphy] [--n 8]');
  const n = +opt('--n', 8);
  const srcs = opt('--src', giphyKey ? 'wiki,openverse,giphy' : 'wiki,openverse').split(',');
  let cands = [];
  for (const s of srcs) {
    try { cands.push(...(await SOURCES[s](q, n))); } catch (e) { console.log(`  (${s} failed: ${e.message})`); }
  }
  cands = cands.filter((c) => c.thumb && c.full).slice(0, 16); // relevance order; sizes are printed on every tile
  if (!cands.length) { console.log('Nothing found. Try other words, another source, or ask him (pass 9).'); process.exit(1); }
  // one numbered contact sheet: 4 per row, each tile 240×240 with its number, source and size
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'findimg-'));
  try {
    const tiles = [];
    for (const [i, c] of cands.entries()) {
      const raw = path.join(tmp, `raw${i}`);
      try { await download(c.thumb, raw); } catch { try { await download(c.full, raw); } catch { continue; } } // Openverse thumbs can 424
      const out = path.join(tmp, `t${String(tiles.length).padStart(2, '0')}.png`);
      const label = `${i + 1}  ${c.src}  ${c.w || '?'}x${c.h || '?'}`.replace(/:/g, '\\:');
      const r = spawnSync(ffmpegPath, ['-nostdin', '-loglevel', 'error', '-y', '-i', raw, '-frames:v', '1', '-vf',
        `scale=240:216:force_original_aspect_ratio=decrease,pad=240:240:(ow-iw)/2:24:color=0x303030,drawtext=fontfile=public/assets/library/fonts/Montserrat-Black.ttf:text='${label}':x=6:y=5:fontsize=13:fontcolor=white`, out]);
      if (r.status === 0) tiles.push(out);
    }
    fs.mkdirSync(finds, {recursive: true});
    // rows of 4 with hstack (empty slots = dark tiles), then vstack
    const blank = path.join(tmp, 'blank.png');
    spawnSync(ffmpegPath, ['-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=0x101010:s=240x240', '-frames:v', '1', blank]);
    const all = [...tiles];
    while (all.length % 4) all.push(blank);
    const sheet = path.join(finds, `${id}.jpg`);
    const rows = all.length / 4;
    const inputs = all.flatMap((t) => ['-i', t]);
    const fc = Array.from({length: rows}, (_, r) => `${[0, 1, 2, 3].map((k) => `[${r * 4 + k}:v]`).join('')}hstack=4[r${r}]`).join(';') +
      (rows > 1 ? `;${Array.from({length: rows}, (_, r) => `[r${r}]`).join('')}vstack=${rows}[out]` : '');
    spawnSync(ffmpegPath, ['-nostdin', '-loglevel', 'error', '-y', ...inputs, '-filter_complex', fc, '-map', rows > 1 ? '[out]' : '[r0]', '-frames:v', '1', '-q:v', '4', sheet]);
    fs.writeFileSync(path.join(finds, `${id}.json`), JSON.stringify({query: q, candidates: cands}, null, 2));
    console.log(`Sheet (${cands.length} options): ${sheet}\nPick: node scripts/findimg.mjs pick ${reel} ${id} <number> --kind sticker|image|gif --tags "…" --what "…"`);
  } finally {
    fs.rmSync(tmp, {recursive: true, force: true});
  }
} else if (cmd === 'pick') {
  const num = +args[3];
  const {query, candidates} = JSON.parse(fs.readFileSync(path.join(finds, `${id}.json`), 'utf8'));
  const c = candidates[num - 1];
  if (!c) throw new Error(`no option ${num}`);
  const dir = path.join(libraryRoot(), 'wanted', id);
  fs.mkdirSync(dir, {recursive: true});
  const ext = c.moving ? '.mp4' : (path.extname(new URL(c.full).pathname).toLowerCase() || '.jpg');
  const file = path.join(dir, `found${ext}`);
  await download(c.full, file);
  // HD: anything small gets upscaled by Real-ESRGAN before it enters the Library (pictures < 1000 px, GIFs < 720 px)
  if (ext !== '.svg' && upscalerReady()) {
    const [w, h] = size(file);
    if (Math.max(w, h) < (c.moving ? 720 : 1000)) {
      console.log(`  ${w}x${h} is small → AI upscale${c.moving ? ' (a few minutes for a GIF)' : ''}…`);
      const up = path.join(dir, `found-hd${c.moving ? '.mp4' : '.png'}`);
      const r = upscale(file, up, {anime: args.includes('--anime')});
      fs.rmSync(file); // keep only the HD file
      console.log(`  → ${r.to.join('x')}`);
    }
  }
  const kind = opt('--kind', c.moving ? 'gif' : 'image');
  fs.writeFileSync(path.join(dir, 'about.txt'), [
    `Found for ${reel}: ${opt('--what', query)}`,
    `Kind: ${kind}`,
    `Search: ${query}`,
    `Tags: ${opt('--tags', query)}`,
    `For: ${reel}`,
    `Source: ${c.src} · ${c.page ?? ''}`,
    `Licence: ${c.licence || 'unknown'}`,
    `Credit: ${c.credit || '-'}`,
    '',
  ].join('\n'));
  console.log(`→ ${dir} (${c.src}, ${c.licence || 'licence unknown'}); importing…`);
  const r = spawnSync('node', ['scripts/assets.mjs', 'import'], {stdio: 'inherit'});
  fs.rmSync(path.join(finds, `${id}.jpg`), {force: true}); // the sheet was only for choosing
  process.exit(r.status ?? 0);
} else {
  console.log('usage: node scripts/findimg.mjs search|pick … (see the top of this file)');
}
