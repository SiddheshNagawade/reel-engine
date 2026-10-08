// Render the motion-template showcase: node scripts/gallery.mjs <footage.mp4> <out.mp4>
import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
const [footage, out] = process.argv.slice(2);
const tmp = path.resolve('public/input/gallery.mp4');
fs.copyFileSync(footage, tmp); // temporary, removed below
try {
  const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), symlinkPublicDir: true});
  const opts = {serveUrl, id: 'Gallery', inputProps: {footage: 'input/gallery.mp4'}, chromiumOptions: {gl: 'angle'}};
  const composition = await selectComposition(opts);
  await renderMedia({...opts, composition, codec: 'h264', outputLocation: out, concurrency: 4});
  console.log('gallery →', out);
} finally {
  fs.rmSync(tmp, {force: true});
}
