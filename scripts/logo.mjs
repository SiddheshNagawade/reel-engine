// Brand logos as SVG (sharp at any size, real brand colours) into the Library, for explainers and brand videos.
// Usage: node scripts/logo.mjs <brand> [<brand>…] [--for <reel>] [--dark] [--wordmark] [--slug simple-icons-slug]
//   1. svgl.app (designer-made colour logos, light/dark and wordmark versions)
//   2. simple-icons (3,000+ brands, one-colour icon; painted in the brand's official hex) as the fallback
//   → Library/wanted/logo-<brand>/logo.svg + about.txt → scripts/assets.mjs import → Library/stickers/logo-<brand>/sticker.svg
//   Use it: direction.evidence {look: "logo", logo: "stickers/logo-zomato/sticker.svg", name: "Zomato"} (or illos obj "svg").
// Idea ported from howseen-ai/claude-motion-design skill/motion-design/scripts/svgl_logos.py (MIT, © 2026 Howseen AI,
// Raphaël Aubry): search the svgl API, take the best title match, prefer the light version. Added here: dark/wordmark
// choice, the simple-icons fallback with brand colour, and filing into his Library with source + licence.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {libraryRoot} from './lib/paths.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const VALUED = new Set(['--for', '--slug']);
const brands = args.filter((a, i) => !a.startsWith('--') && !VALUED.has(args[i - 1]));
if (!brands.length) {
  console.log('Usage: node scripts/logo.mjs <brand> [<brand>…] [--for <reel>] [--dark] [--wordmark] [--slug <simple-icons slug>]');
  process.exit(1);
}
const UA = {'User-Agent': 'Mozilla/5.0 (ReelEngine logo fetch)'};
const SIMPLE_ICONS = 'simple-icons@15.0.0'; // pinned: the icon set renames/removes brands between majors
const getText = async (url) => {
  const r = await fetch(url, {headers: UA});
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
};
const key = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

async function fromSvgl(brand) {
  let res;
  try { res = JSON.parse(await getText(`https://api.svgl.app?search=${encodeURIComponent(brand)}`)); } catch { return null; }
  if (!Array.isArray(res) || !res.length) return null;
  const pick = res.find((r) => key(r.title) === key(brand)) ?? res.find((r) => key(r.title).startsWith(key(brand)));
  if (!pick) return null;
  const variant = (v) => (typeof v === 'string' ? v : v?.[args.includes('--dark') ? 'dark' : 'light']);
  const route = (args.includes('--wordmark') && variant(pick.wordmark)) || variant(pick.route);
  return route ? {svg: await getText(route), from: `svgl.app · ${route}`, title: pick.title, site: pick.url, licence: 'brand logo (trademark of its owner), via svgl.app'} : null;
}

async function fromSimpleIcons(brand) {
  const slug = opt('--slug', key(brand));
  let svg;
  try { svg = await getText(`https://cdn.jsdelivr.net/npm/${SIMPLE_ICONS}/icons/${slug}.svg`); } catch { return null; }
  // official brand colour from the set's data file, painted into the one-colour icon
  let hex = null, title = brand;
  try {
    const data = JSON.parse(await getText(`https://cdn.jsdelivr.net/npm/${SIMPLE_ICONS}/data/simple-icons.json`));
    const list = Array.isArray(data) ? data : data.icons;
    const hit = list.find((i) => (i.slug ?? key(i.title)) === slug || key(i.title) === slug);
    if (hit) ({hex, title} = hit);
  } catch {}
  if (hex) svg = svg.replace('<svg ', `<svg fill="#${hex}" `);
  return {svg, from: `simple-icons · ${slug}`, title, hex, licence: 'brand logo (trademark of its owner), via simple-icons (CC0 data)'};
}

let got = 0;
for (const brand of brands) {
  const logo = (await fromSvgl(brand)) ?? (await fromSimpleIcons(brand));
  if (!logo) {
    console.log(`✗ ${brand}: not on svgl.app or simple-icons (try --slug, or node scripts/findimg.mjs search … "${brand} logo svg")`);
    continue;
  }
  const id = `logo-${key(brand)}${args.includes('--dark') ? '-dark' : ''}${args.includes('--wordmark') ? '-wordmark' : ''}`;
  const dir = path.join(libraryRoot(), 'wanted', id);
  fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(path.join(dir, 'logo.svg'), logo.svg);
  fs.writeFileSync(path.join(dir, 'about.txt'), [
    `${logo.title} logo (SVG)`,
    'Kind: picture',
    `Tags: logo, brand, ${key(brand)}, ${logo.title.toLowerCase()}`,
    `For: ${opt('--for', 'library')}`,
    `Source: ${logo.from}`,
    `Licence: ${logo.licence}`,
    `Credit: ${logo.title}`,
    ...(logo.hex ? [`Brand colour: #${logo.hex}`] : []),
    '',
  ].join('\n'));
  console.log(`✓ ${brand} ← ${logo.from}${logo.hex ? ` (brand colour #${logo.hex})` : ''}`);
  got++;
}
if (got) spawnSync('node', ['scripts/assets.mjs', 'import'], {stdio: 'inherit'});
