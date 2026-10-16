// The toolbox: open-source code we may reuse, kept on the T7 (toolbox/repos), mapped in brain/toolbox.md.
//   node scripts/toolbox.mjs find <word…>   component/recipe names in every repo + matching lines of brain/toolbox.md
//   node scripts/toolbox.mjs list           repos with licence and size
//   node scripts/toolbox.mjs fetch          clone any repo in SOURCES that's missing (shallow, no .git kept)
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {DRIVE_ROOT, driveAttached} from './lib/paths.mjs';

// repo → [github path, licence, what it's for]. Add new finds here AND a line in brain/toolbox.md.
export const SOURCES = {
  remocn: ['Remocn/remocn', 'MIT', '250+ Remotion components: captions, text, transitions, shaders, UI flows'],
  snapcn: ['shadcn-labs/snapcn', 'MIT', 'Remotion product-demo shots: device frames, screen recording, AI chat, logos'],
  'video-shotcraft': ['Vincentwei1021/video-shotcraft', 'Apache-2.0', '150 shot recipes (camera, typography, transitions, data, UI)'],
  'anatomy-figures': ['wheresryan22/anatomy-figures', 'MIT', '52 isometric machine figures as React components'],
  anatomy: ['wheresryan22/anatomy', 'MIT', 'skill: explain an idea as a working isometric object'],
  isokit: ['aadilghani1/isokit', 'MIT', 'isometric SVG kit (boxes, faces, keys)'],
  'motion-skills': ['iart-ai/motion-skills', 'MIT', 'index of 18 motion skill packs (maps, b-roll, data, kinetic type)'],
  lottie: ['diffusionstudio/lottie', 'MIT', 'text-to-Lottie skill'],
  explainroo: ['vincentsch/explainroo', 'MIT', 'narrated explainers, narration-following camera'],
  'vox-explainer-skill': ['CK42BB/vox-explainer-skill', 'MIT', 'Vox-style explainer pipeline'],
  'bang-motion': ['bangtutorial/bang-motion', 'MIT', 'motion-graphics method: one world, moving camera, concept menu'],
  AIEV: ['notivn/AIEV', 'MIT', 'Claude-directed clip editing (HyperFrames + Remotion)'],
  anything2explainer: ['Vincentwei1021/anything2explainer', 'custom (read LICENSE)', 'black-canvas explainer template + primitives'],
  'template-tiktok': ['remotion-dev/template-tiktok', 'Remotion licence', 'TikTok captions template'],
  animate: ['cth9191/animate', 'MIT', 'procedural canvas styles incl. isometric; story grammar; review tools'],
  'claude-motion-design': ['howseen-ai/claude-motion-design', 'MIT', 'code motion design: springs, SFX on peaks, remake mode'],
  'animation-principles': ['dylantarre/animation-principles', 'MIT', 'Disney 12 principles notes (low value)'],
  'claude-code-video-toolkit': ['digitalsamba/claude-code-video-toolkit', 'MIT', 'Remotion components + transitions, AI gen tools (cloud GPU)'],
  'motion-video-kit': ['echris6/motion-video-kit', 'MIT', 'business film grammar, critic loop, audio scripts'],
};

const root = path.join(driveAttached() ? DRIVE_ROOT : path.resolve('.'), 'toolbox', 'repos');
const [cmd, ...words] = process.argv.slice(2);

if (cmd === 'fetch') {
  if (!driveAttached()) { console.log('T7 not mounted: the toolbox lives on the drive only.'); process.exit(1); }
  fs.mkdirSync(root, {recursive: true});
  for (const [name, [gh]] of Object.entries(SOURCES)) {
    const dir = path.join(root, name);
    if (fs.existsSync(dir)) continue;
    console.log(`cloning ${gh}…`);
    spawnSync('git', ['clone', '-q', '--depth', '1', `https://github.com/${gh}.git`, dir], {stdio: 'inherit'});
    fs.rmSync(path.join(dir, '.git'), {recursive: true, force: true});
  }
} else if (cmd === 'list') {
  for (const [name, [gh, lic, what]] of Object.entries(SOURCES)) console.log(`${fs.existsSync(path.join(root, name)) ? '✓' : '·'} ${name.padEnd(26)} ${lic.padEnd(20)} ${what}  (github.com/${gh})`);
} else if (cmd === 'find' && words.length) {
  const re = new RegExp(words.join('|'), 'i');
  const hits = [];
  const walk = (dir, depth) => {
    if (depth > 5) return;
    let ents = [];
    try { ents = fs.readdirSync(dir, {withFileTypes: true}); } catch { return; }
    for (const e of ents) {
      if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'dist' || e.name === 'public' || e.name === 'assets') continue;
      const p = path.join(dir, e.name);
      if (re.test(e.name)) hits.push(path.relative(root, p));
      if (e.isDirectory()) walk(p, depth + 1);
    }
  };
  if (fs.existsSync(root)) walk(root, 0);
  console.log(`In the repos (${root}):`);
  for (const h of hits.slice(0, 60)) console.log('  ' + h);
  if (hits.length > 60) console.log(`  … ${hits.length - 60} more`);
  console.log('\nIn brain/toolbox.md:');
  for (const l of fs.readFileSync('brain/toolbox.md', 'utf8').split('\n')) if (re.test(l)) console.log('  ' + l.trim().slice(0, 200));
} else {
  console.log('node scripts/toolbox.mjs find <word…> | list | fetch');
}
