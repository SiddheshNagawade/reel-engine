// Render single frames of a reel for checking: node scripts/still.mjs <name> <frame> [frame…]
// Stills go to the Mac's temp folder (scratch only); library files are staged from the drive and always removed afterwards.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {cachedBundle} from './render.mjs';
import {stageLibrary} from './lib/assets.mjs';
import {renderStill, selectComposition} from '@remotion/renderer';
const [name, ...frames] = process.argv.slice(2);
const edit = JSON.parse(fs.readFileSync(`src/edits/${name}.json`, 'utf8'));
const unstage = stageLibrary(edit);
try {
  const serveUrl = await cachedBundle();
  const opts = {serveUrl, inputProps: {edit}, chromiumOptions: {gl: 'angle'}};
  const composition = await selectComposition({...opts, id: 'Reel'});
  for (const f of frames) {
    const out = path.join(os.tmpdir(), `still-${name}-${f}.jpg`);
    await renderStill({...opts, composition, frame: Number(f), output: out, imageFormat: 'jpeg', scale: 0.4});
    console.log(out);
  }
} finally {
  unstage(); // even if the render fails, nothing is left behind on the Mac
}
