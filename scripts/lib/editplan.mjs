// The edit plan: one file per video (_work/<name>/plan.md) with one section per editing pass (brain/edit-layers.md).
// Why it exists: when I decided everything in one go, the easy layers (captions, pop text) won and the thinking layers
// (graphics, vector illustrations, memes, asking him for assets) were silently skipped. Renders now refuse to run until
// every pass has a decision written down, so a new session can't skip a step either.
import fs from 'node:fs';
import path from 'node:path';

// Every pass: what to decide. `need` = which kinds must finish it before a final render.
export const PASSES = [
  {id: 'story', title: 'Story lock (cut, order, hook, ending)', need: ['reel', 'vlog', 'process'],
    ask: 'Cut, order, hook, ending. Give him 3–4 hook options (English text + first 3 s) and let him pick. Timing is locked after this.'},
  {id: 'captions', title: 'Captions & hero words', need: ['reel', 'vlog'],
    ask: 'Caption look for this video. The hero words (numbers, emotions, objects, twists) and how each one is exaggerated.'},
  {id: 'visuals', title: 'Support visuals (graphics, vector illustrations, props, bubbles, memes, UI frames, charts)', need: ['reel', 'vlog', 'process'], minItems: 3,
    ask: 'Walk every beat: what does the viewer SEE besides the footage? He describes something visual → show it. Vector illustration, prop on his face/hands, speech/thought bubble, label + arrow, chart, counter, UI frame, meme sticker/GIF, photo. One bullet per idea: time → what → why. Missing asset → build it, or put it in "Asset requests".'},
  {id: 'layout', title: 'Canvas & layout', need: ['reel', 'vlog'],
    ask: 'Which visuals need space? Footage shrinks/moves aside (eased), freed space filled, back to full. Never over eyes/mouth.'},
  {id: 'connectors', title: 'Caption placement & connectors', need: ['reel', 'vlog'],
    ask: 'Captions move when a visual takes their place. Arrows/lines drawn from a hero word to its visual.'},
  {id: 'depth', title: 'Depth (things behind him)', need: ['reel', 'vlog'],
    ask: 'Moments for text/objects/effects BEHIND the person (person mask). Costly: only where it pays.'},
  {id: 'motion', title: 'Motion & transitions', need: ['reel', 'vlog'],
    ask: 'Every element enters/leaves with motion. Camera push/punch on ideas; real transitions only at real picture changes.'},
  {id: 'sound', title: 'Sound design (by meaning)', need: ['reel', 'vlog', 'process'],
    ask: 'Whoosh for real movement, tick for text/UI, impact for reveals, meme voices for his attitude (brain/sounds.md). Music sections.'},
  {id: 'density', title: 'Density walk (something new every 2–3 s)', need: ['reel', 'vlog'],
    ask: 'Walk the timeline in 2–3 s steps. Boring stretch → add from any layer. Overloaded → remove. Vlog: run `node scripts/editplan.mjs <name> density`.'},
  {id: 'asks', title: 'Asset requests to Siddhesh (CHECKPOINT: ask him)', need: ['reel', 'vlog', 'process'],
    ask: 'What would make this land harder that the Library lacks? Expression memes, reaction GIFs, stickers, illustrations, photos, names, inside jokes. One row each with Google search words; he finds them, drops them in Library/wanted/<id>/, `node scripts/assets.mjs import` adds them to the Library for good. Status per row: asked → received / declined / have.'},
  {id: 'viewer', title: 'Viewer check (after the render)', need: [],
    ask: 'Watch at 1x with sound like a stranger: hook in 1 s? still watching at 6 s? Stills at every graphic, layout change and the ending.'},
];

// One row per request. tags = when the Library should offer it again in future videos.
const ASK_TABLE = `| id | for (time · moment) | what I need | kind | Google search words | tags | status |
|---|---|---|---|---|---|---|
`;

export const planFile = (work) => path.join(work, 'plan.md');

export function template(name, kind) {
  const parts = [`# Edit plan: ${name} (${kind})`,
    `Kind: ${kind}`,
    '',
    'One pass at a time, in order (brain/edit-layers.md). Each pass ends with a Status line:',
    '`Status: done` (decisions written below it) or `Status: none: <why nothing is needed here>`.',
    'Final renders refuse to run until every required pass is closed. Check with `node scripts/editplan.mjs ' + name + '`.',
    ''];
  PASSES.forEach((p, i) => {
    parts.push(`## ${i}. ${p.title} {#${p.id}}`, `> ${p.ask}`, '');
    if (p.id === 'asks') parts.push('kinds: sticker (cut out) · image (keep whole) · gif · sound · photo · illustration', '', ASK_TABLE);
    parts.push('Status: todo', '');
  });
  return parts.join('\n');
}

// Splits plan.md into its passes: {id, status, reason, body, items}.
export function parse(text) {
  const out = {};
  const kind = /^Kind:\s*(\w+)/m.exec(text)?.[1] ?? 'reel';
  const chunks = text.split(/^## /m).slice(1);
  for (const c of chunks) {
    const id = /\{#([a-z]+)\}/.exec(c.split('\n')[0])?.[1];
    if (!id) continue;
    const st = /^Status:\s*(todo|done|none)\b[:\s—-]*(.*)$/m.exec(c);
    const body = c.split('\n').slice(1).filter((l) => !/^>/.test(l) && !/^Status:/.test(l)).join('\n');
    const items = body.split('\n').filter((l) => /^\s*[-*]\s+\S/.test(l)).length;
    const rows = body.split('\n').filter((l) => /^\|/.test(l) && !/^\|\s*(id|-)/.test(l))
      .map((l) => l.split('|').slice(1, -1).map((x) => x.trim()))
      .filter((r) => r.length >= 6 && r[0]);
    // rows as objects; status is always the last column
    const asks = rows.map((r) => ({id: r[0], moment: r[1], what: r[2], kind: r[3], search: r[4], tags: r.length >= 7 ? r[5] : '', status: r[r.length - 1]}));
    out[id] = {id, status: st?.[1] ?? 'todo', reason: (st?.[2] ?? '').trim(), items, rows: asks};
  }
  return {kind, passes: out};
}

// What still blocks a final render, in plain words.
export function problems(plan) {
  const {kind, passes} = plan;
  const list = [];
  for (const p of PASSES) {
    if (!p.need.includes(kind)) continue;
    const got = passes[p.id];
    if (!got || got.status === 'todo') { list.push(`${p.id}: not done yet (${p.title})`); continue; }
    if (got.status === 'none' && got.reason.length < 10) list.push(`${p.id}: "none" needs a real reason`);
    if (p.minItems && (got.status === 'none' || got.items < p.minItems))
      list.push(`${p.id}: needs at least ${p.minItems} visual ideas as bullets (has ${got.items}); "none" is not allowed here`);
    if (p.id === 'asks' && got.status === 'done') {
      const open = got.rows.filter((r) => /^asked$/i.test(r.status));
      if (open.length) list.push(`asks: waiting on him for ${open.map((r) => r.id).join(', ')} (mark received / declined)`);
    }
  }
  return list;
}

export function readPlan(work) {
  const f = planFile(work);
  return fs.existsSync(f) ? parse(fs.readFileSync(f, 'utf8')) : null;
}

// Called by every render script before a final render. Returns a note for the CHANGELOG.
export function requirePlan(work, name, args, kindHint) {
  const plan = readPlan(work);
  if (args.includes('--no-plan')) {
    console.warn('\n⚠️  Rendering WITHOUT a finished edit plan (--no-plan). Only for tests; the CHANGELOG says so.\n');
    return '- ⚠️ rendered without a finished edit plan (--no-plan)';
  }
  const list = plan ? problems(plan) : [`no plan yet: node scripts/editplan.mjs ${name} init --kind ${kindHint}`];
  if (list.length === 0) return '';
  console.error(`\n✋ The edit plan for "${name}" isn't finished, so this won't render yet:\n${list.map((l) => `   - ${l}`).join('\n')}`);
  console.error(`\n   Work through the passes one by one in ${planFile(work)} (the edit-video skill says how),`);
  console.error(`   check with: node scripts/editplan.mjs ${name}\n`);
  process.exit(2);
}
