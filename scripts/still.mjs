// Render single frames of a reel for checking: node scripts/still.mjs <name> <frame> [frame…]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
const [name, ...frames] = process.argv.slice(2);
const edit = JSON.parse(fs.readFileSync(`src/edits/${name}.json`, 'utf8'));
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), symlinkPublicDir: true});
const opts = {serveUrl, inputProps: {edit}, chromiumOptions: {gl: 'angle'}};
const composition = await selectComposition({...opts, id: 'Reel'});
for (const f of frames) {
  const out = path.join(os.tmpdir(), `still-${name}-${f}.jpg`); // scratch only
  await renderStill({...opts, composition, frame: Number(f), output: out, imageFormat: 'jpeg', scale: 0.4});
  console.log(out);
}
