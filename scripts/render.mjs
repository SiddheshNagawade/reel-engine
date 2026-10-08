// Renders an edit JSON to MP4.  Usage: npm run render [-- <name>]   (defaults to the latest edit)
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';

// 'angle' uses the Mac's GPU for blend modes/filters; much faster than software rendering.
const chromiumOptions = {gl: process.env.REEL_GL || 'angle'};

// Reuse the compiled bundle while src/ and style.json are unchanged (saves ~10s per render).
async function cachedBundle() {
  const h = crypto.createHash('md5');
  const walk = (d) => fs.readdirSync(d, {withFileTypes: true}).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (!p.includes(`${path.sep}edits${path.sep}`)) h.update(p).update(fs.readFileSync(p));
  });
  walk('src');
  h.update(fs.readFileSync('style.json'));
  const dir = path.join(os.tmpdir(), 'reelengine-bundle', h.digest('hex'));
  if (fs.existsSync(path.join(dir, 'index.html'))) return dir;
  fs.rmSync(path.join(os.tmpdir(), 'reelengine-bundle'), {recursive: true, force: true});
  // symlinkPublicDir: media is linked into the bundle, never copied.
  return bundle({entryPoint: path.resolve('src/index.ts'), symlinkPublicDir: true, outDir: dir});
}

export async function renderEdit(edit, outPath, {frameRange} = {}) {
  const t0 = Date.now();
  process.stdout.write('  bundling…');
  const serveUrl = await cachedBundle();
  const inputProps = {edit};
  const composition = await selectComposition({serveUrl, id: 'Reel', inputProps, chromiumOptions});
  let last = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    crf: 18,
    audioBitrate: '320k',
    outputLocation: outPath,
    inputProps,
    concurrency: Number(process.env.REEL_CONCURRENCY) || Math.max(2, Math.floor(os.cpus().length / 2)),
    chromiumOptions,
    frameRange,
    onProgress: ({progress}) => {
      const p = Math.floor(progress * 100);
      if (p !== last && p % 5 === 0) process.stdout.write(`\r  rendering ${p}%   `);
      last = p;
    },
  });
  process.stdout.write(`\r  rendered in ${((Date.now() - t0) / 1000).toFixed(0)}s → ${outPath}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const name = process.argv[2] || 'latest';
  const edit = JSON.parse(fs.readFileSync(`src/edits/${name}.json`, 'utf8'));
  fs.mkdirSync('output', {recursive: true});
  await renderEdit(edit, path.resolve('output', `${edit.name}.mp4`));
}
