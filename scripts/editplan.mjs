// Edit plan: create it, see which pass is next, and run the automatic checks.
//   node scripts/editplan.mjs <name> init --kind reel|vlog|process   → _work/<name>/plan.md (passes + technique checklists)
//   node scripts/editplan.mjs <name>                                 → status: done / next / what blocks the render
//   node scripts/editplan.mjs <name> check [--edit vlog.json] [--gap 6]
//        the rules a computer can check (fast-forward, emoji, repeated meme sounds, transitions inside a shot, short shots…)
//        + every stretch where nothing new is added (vlog). Cuts alone don't count: that was the Chandigarh problem.
//   node scripts/editplan.mjs --coverage                             → brain/coverage.md (every technique he taught, its status)
import fs from 'node:fs';
import path from 'node:path';
import {workRoot} from './lib/paths.mjs';
import {PASSES, planFile, problems, readPlan, template} from './lib/editplan.mjs';
import {lint, vlogGaps, editFile} from './lib/lint.mjs';
import {TECHNIQUES} from './lib/techniques.mjs';

const args = process.argv.slice(2);
const opt = (f, d) => (args.includes(f) ? args[args.indexOf(f) + 1] : d);
const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

if (args.includes('--coverage')) {
  const rows = PASSES.flatMap((p) => TECHNIQUES.filter((t) => t.pass === p.id).map((t) =>
    `| ${p.id} | ${t.name} | ${t.kinds.join(', ')} | ${t.built ? '✅' : '❌ to build'} | ${t.how.replace(/\|/g, '/')} | ${t.src} |`));
  const open = TECHNIQUES.filter((t) => !t.built);
  fs.writeFileSync('brain/coverage.md', `# Coverage: everything he taught → built? → where it's checked

Generated from scripts/lib/techniques.mjs (\`node scripts/editplan.mjs --coverage\`); edit that file, not this one.
Every technique appears as a checklist line in its pass of every plan.md and must be marked used / not used (with a
reason) before a render. Rules a computer can measure are also checked on the edit itself (scripts/lib/lint.mjs).

${TECHNIQUES.length} techniques · ${TECHNIQUES.length - open.length} built · ${open.length} still to build${open.length ? `: ${open.map((t) => t.name).join('; ')}` : ''}

| pass | technique | kinds | status | how | from |
|---|---|---|---|---|---|
${rows.join('\n')}
`);
  console.log(`✅ brain/coverage.md (${TECHNIQUES.length} techniques, ${open.length} to build)`);
  process.exit(0);
}

const [name, cmd = 'status'] = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!name) {
  console.error('Usage: node scripts/editplan.mjs <name> [init --kind reel|vlog|process | status | check] | --coverage');
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
    const open = got?.unchecked?.length ? `, ${got.unchecked.length} techniques unmarked` : '';
    const optional = p.need.includes(plan.kind) ? '' : ' (not required for a render)';
    console.log(`${mark} ${i}. ${p.title}${extra}${open}${optional}`);
    if (!next && st === 'todo' && p.need.includes(plan.kind)) next = `${i}. ${p.title}`;
  });
  const list = problems(plan);
  console.log(next ? `\nNext pass: ${next}` : '');
  console.log(list.length ? `Render blocked by:\n${list.map((l) => `  - ${l}`).join('\n')}` : '✅ All required passes closed. (`check` runs the automatic rules too.)');
  process.exit(0);
}

if (cmd === 'check' || cmd === 'density') {
  const kind = readPlan(work)?.kind ?? opt('--kind', fs.existsSync(path.join(work, 'vlog.json')) ? 'vlog' : fs.existsSync(path.join(work, 'timeline.json')) ? 'process' : 'reel');
  const r = lint(work, kind, opt('--edit'));
  console.log(`Checks on ${r.file}:`);
  console.log(r.errors.length ? `\n✗ ${r.errors.length} must be fixed before a render:\n${r.errors.map((e) => `  - ${e}`).join('\n')}` : '\n✓ no blocking problems');
  if (kind === 'vlog') {
    const edit = JSON.parse(fs.readFileSync(editFile(work, kind, opt('--edit')), 'utf8'));
    const GAP = +opt('--gap', 6);
    const {gaps, clock, events} = vlogGaps(edit, GAP);
    const empty = gaps.reduce((a, g) => a + g.b - g.a, 0);
    console.log(`\n${fmt(clock)} long · ${events.length} edit events (${(events.length / (clock / 60)).toFixed(1)}/min) · ${gaps.length} stretches over ${GAP}s with nothing new (${Math.round((100 * empty) / clock)}% of the video)`);
    for (const g of gaps) console.log(`  ${fmt(g.a)}–${fmt(g.b)}  (${(g.b - g.a).toFixed(0)}s)  in ${g.from}${g.to !== g.from ? ` → ${g.to}` : ''}`);
    console.log('Talk that carries itself can stay calm; everything else needs an idea from any layer (or a reason in the plan).');
  } else if (r.warnings.length) {
    console.log(`\n⚠️ ${r.warnings.join('\n⚠️ ')}`);
  }
  const other = r.warnings.filter((w) => !/stretches over/.test(w));
  if (kind === 'vlog' && other.length) console.log(`\n⚠️ ${other.join('\n⚠️ ')}`);
  process.exit(r.errors.length ? 2 : 0);
}

console.error(`Unknown command ${cmd}`);
process.exit(1);
