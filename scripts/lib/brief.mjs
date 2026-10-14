// Pass briefings: what to READ at the moment of each decision, so nothing in brain/ is stored and never seen again.
// His ask (2026-10-14): "arrange it so you go through everything every time, so you actually use it". Before, ~1,100
// lines of brain/ loaded at the start of every chat (all at once = nothing at the right time). Now each pass prints:
// its question, the rulebook sections tagged for it, the playbook sections that matter for it, its technique checklist
// and what the Library holds for it. `node scripts/editplan.mjs <name> brief <pass>` (or `brief start`).
import fs from 'node:fs';
import path from 'node:path';
import {libraryRoot} from './paths.mjs';

// pass → playbook sections ([file, heading starts with], optional kinds)
export const READS = {
  start: [['brain/edit-layers.md', 'Enforced'], ['brain/principles.md', '8. Checklist']],
  story: [['brain/hooks.md', 'His hook rules'], ['brain/hooks.md', 'The 4 hook mistakes check'], ['brain/hooks.md', 'The 3-second formula'], ['brain/hooks.md', '3. Cold open'],
    ['brain/content-brief.md', '3. Five-beat', ['reel']], ['brain/content-brief.md', '10. Story craft'],
    ['brain/vlog.md', 'His notes on the first look', ['vlog']], ['brain/process-videos.md', 'The process that worked', ['process']]],
  cuts: [['brain/craft.md', 'The cut vocabulary'], ['brain/craft.md', 'Built 2026-10-12'], ['brain/process-videos.md', 'Craft rules', ['process']],
    ['brain/vlog.md', 'Cuts + graphics', ['vlog']]],
  captions: [['brain/edit-layers.md', 'Pass 1'], ['brain/principles.md', '5. Captions']],
  visuals: [['brain/edit-layers.md', 'Pass 2'], ['brain/memes.md', 'When a meme belongs'], ['brain/memes.md', 'How to show it'], ['brain/motion-design.md', 'Mood first'], ['brain/motion-design.md', 'Frame grammar'],
    ['brain/expensive.md', 'The core idea'], ['brain/pablo.md', 'When it fits']],
  layout: [['brain/edit-layers.md', 'Pass 3'], ['brain/canvas.md', 'What it can do'], ['brain/canvas.md', 'When to use it']],
  connectors: [['brain/edit-layers.md', 'Pass 4']],
  depth: [['brain/edit-layers.md', 'Pass 5']],
  motion: [['brain/edit-layers.md', 'Pass 6'], ['brain/motion-design.md', 'Motion vocabulary'], ['brain/pablo.md', 'The method'], ['brain/canvas.md', 'When to use it']],
  look: [['brain/color.md', 'Rules'], ['brain/color.md', 'Status']],
  sound: [['brain/edit-layers.md', 'Pass 7'], ['brain/memes.md', 'When a meme belongs'], ['brain/sounds.md', 'Moment → sound'], ['brain/sounds.md', 'Rules'], ['brain/sounds.md', 'Music by mood'], ['brain/sounds.md', 'Silence and transitions']],
  density: [['brain/edit-layers.md', 'Pass 8'], ['brain/principles.md', '3. Pattern interrupts']],
  asks: [['brain/edit-layers.md', 'Pass 9']],
  viewer: [['brain/edit-layers.md', 'Pass 10'], ['brain/principles.md', '8. Checklist']],
};

// One markdown section: from the heading that starts with `start` to the next heading of the same or higher level.
export function section(file, start) {
  if (!fs.existsSync(file)) return '';
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const i = lines.findIndex((l) => /^#{1,4} /.test(l) && l.replace(/^#+\s*/, '').startsWith(start));
  if (i < 0) return '';
  const level = lines[i].match(/^#+/)[0].length;
  let j = i + 1;
  while (j < lines.length && !(new RegExp(`^#{1,${level}} `).test(lines[j]))) j++;
  return lines.slice(i, j).join('\n').trim();
}

// rules.md sections tagged {pass,…} (or {all} for the start briefing)
export function rulesFor(pass, kind) {
  const text = fs.existsSync('brain/rules.md') ? fs.readFileSync('brain/rules.md', 'utf8') : '';
  return text.split(/^## /m).slice(1).filter((c) => {
    const [tagPart, kindPart] = (/\{([a-z,;]+)\}/.exec(c.split('\n')[0])?.[1] ?? '').split(';');
    const tags = tagPart.split(',');
    if (kindPart && kind && !kindPart.split(',').includes(kind)) return false; // e.g. vlog-only rules in a reel briefing
    return pass === 'start' ? tags.includes('all') : tags.includes(pass);
  }).map((c) => `## ${c.trim()}`).join('\n\n');
}

// What the Library holds that this pass could use (on the T7; empty when it's unplugged).
export function libraryFor(pass) {
  const f = path.join(libraryRoot(), 'catalog.json');
  if (!fs.existsSync(f)) return '(Library not found: is the T7 plugged in?)';
  const all = JSON.parse(fs.readFileSync(f, 'utf8')).memes ?? [];
  const byTag = (items) => {
    const m = new Map();
    for (const it of items) for (const t of (it.tags ?? []).filter((t) => !['his-pick', 'meme-card', 'clip'].includes(t))) m.set(t, [...(m.get(t) ?? []), it.id]);
    return [...m].sort((a, b) => b[1].length - a[1].length).map(([t, ids]) => `  ${t}: ${ids.slice(0, 8).join(', ')}${ids.length > 8 ? ` (+${ids.length - 8})` : ''}`).join('\n');
  };
  if (pass === 'visuals' || pass === 'asks') {
    const stickers = all.filter((m) => m.kind === 'sticker' && !m.card);
    const clips = all.filter((m) => m.kind === 'clip');
    const cards = all.filter((m) => m.card);
    return [`Meme video clips (${clips.length}), by meaning:\n${byTag(clips) || '  none yet'}`,
      `Stickers (${stickers.length}), by meaning:\n${byTag(stickers) || '  none'}`,
      `Meme cards (${cards.length}): ${cards.map((c) => c.id).join(', ') || 'none'}`,
      `Wanted (asked, not yet dropped by him): ${fs.existsSync(path.join(libraryRoot(), 'wanted')) ? fs.readdirSync(path.join(libraryRoot(), 'wanted')).filter((d) => !d.startsWith('.')).join(', ') : ''}`].join('\n\n');
  }
  if (pass === 'sound') {
    const sounds = all.filter((m) => m.kind === 'sound');
    const fam = new Map();
    for (const s of sounds) fam.set(s.family ?? 'classic meme', [...(fam.get(s.family ?? 'classic meme') ?? []), s.id]);
    const clips = all.filter((m) => m.kind === 'clip');
    return `Sounds (${sounds.length}) by family:\n${[...fam].sort((a, b) => b[1].length - a[1].length).map(([f, ids]) => `  ${f} (${ids.length}): ${ids.slice(0, 6).join(', ')}${ids.length > 6 ? ' …' : ''}`).join('\n')}\n` +
      `Meme clips with their own sound (${clips.length}): use the clip's sound with its picture, not alone.`;
  }
  return '';
}
