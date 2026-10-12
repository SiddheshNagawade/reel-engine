// Edit plan: create it, see which pass is next, and find boring stretches.
//   node scripts/editplan.mjs <name> init --kind reel|vlog|process   → _work/<name>/plan.md (one section per pass)
//   node scripts/editplan.mjs <name>                                 → status: done / next / what blocks the render
//   node scripts/editplan.mjs <name> density [--edit vlog.json] [--gap 6]
//        vlog: every stretch longer than --gap seconds where nothing new is added (no graphic, sticker, sound),
//        with the segment it sits in. Cuts alone don't count: that was the Chandigarh problem.
import fs from 'node:fs';
import path from 'node:path';
import {workRoot} from './lib/paths.mjs';
import {PASSES, planFile, problems, readPlan, template} from './lib/editplan.mjs';

const args = process.argv.slice(2);
const opt = (f, d) => (args.includes(f) ? args[args.indexOf(f) + 1] : d);
const [name, cmd = 'status'] = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!name) {
  console.error('Usage: node scripts/editplan.mjs <name> [init --kind reel|vlog|process | status | density]');
  process.exit(1);
}
const work = path.join(workRoot(), name);

if (cmd === 'init') {
  const kind = opt('--kind', 'reel');
  if (!['reel', 'vlog', 'process'].includes(kind)) throw new Error(`unknown kind ${kind}`);
  fs.mkdirSync(work, {recursive: true});
  if (fs.existsSync(planFile(work))) {
    console.log(`Plan already exists: ${planFile(work)}`);
  } else {
    fs.writeFileSync(planFile(work), template(name, kind));
    console.log(`✅ ${planFile(work)}\n   Start with pass 0 (story). One pass at a time.`);
  }
  process.exit(0);
}

if (cmd === 'status') {
  const plan = readPlan(work);
  if (!plan) {
    console.log(`No plan yet. Start one: node scripts/editplan.mjs ${name} init --kind reel|vlog|process`);
    process.exit(1);
  }
  let next = null;
  PASSES.forEach((p, i) => {
    const got = plan.passes[p.id];
    const st = got?.status ?? 'todo';
    const mark = st === 'done' ? '✓' : st === 'none' ? '–' : '·';
    const extra = p.id === 'visuals' ? ` (${got?.items ?? 0} ideas)` : p.id === 'asks' ? ` (${got?.rows.length ?? 0} requests)` : '';
    const optional = p.need.includes(plan.kind) ? '' : ' (not required for a render)';
    console.log(`${mark} ${i}. ${p.title}${extra}${optional}`);
    if (!next && st === 'todo' && p.need.includes(plan.kind)) next = `${i}. ${p.title}`;
  });
  const list = problems(plan);
  console.log(next ? `\nNext pass: ${next}` : '');
  console.log(list.length ? `Render blocked by:\n${list.map((l) => `  - ${l}`).join('\n')}` : '✅ All required passes closed: final render allowed.');
  process.exit(0);
}

if (cmd === 'density') {
  const edit = JSON.parse(fs.readFileSync(path.join(work, opt('--edit', 'vlog.json')), 'utf8'));
  const GAP = +opt('--gap', 6);
  const segs = edit.segments ?? [];
  const events = []; // absolute seconds where something new appears
  const starts = {};
  let clock = 0;
  for (const s of segs) {
    const len = s.dur ?? ((s.out ?? 0) - (s.in ?? 0)) / (s.speed ?? 1) + (s.hold ?? 0);
    starts[s.id] = clock;
    if (s.chapter) events.push(clock);
    for (const g of s.gfx ?? []) events.push(clock + (g.at ?? 0));
    s._start = clock;
    s._len = len;
    clock += len;
  }
  for (const x of edit.sfx ?? []) if (starts[x.at] !== undefined) events.push(starts[x.at] + (x.t ?? 0));
  events.sort((a, b) => a - b);
  const pts = [0, ...events, clock];
  const gaps = [];
  for (let i = 1; i < pts.length; i++) if (pts[i] - pts[i - 1] > GAP) gaps.push([pts[i - 1], pts[i]]);
  const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const inSeg = (t) => segs.find((s) => t >= s._start && t < s._start + s._len)?.id ?? '?';
  const empty = gaps.reduce((a, [x, y]) => a + (y - x), 0);
  console.log(`${fmt(clock)} long · ${events.length} edit events (${(events.length / (clock / 60)).toFixed(1)}/min) · ${gaps.length} stretches over ${GAP}s with nothing new (${Math.round((100 * empty) / clock)}% of the video)\n`);
  for (const [a, b] of gaps) console.log(`  ${fmt(a)}–${fmt(b)}  (${(b - a).toFixed(0)}s)  in ${inSeg(a + 0.01)}${inSeg(b - 0.01) !== inSeg(a + 0.01) ? ` → ${inSeg(b - 0.01)}` : ''}`);
  console.log('\nTalk that carries itself can stay calm; everything else needs an idea from any layer (or a reason in the plan).');
  process.exit(0);
}

console.error(`Unknown command ${cmd}`);
process.exit(1);
