// Library files used by a render are copied from the drive into public/ only for the render, then removed.
// The Mac stays empty; if the drive is unplugged, elements whose file is missing are dropped (render still works).
import fs from 'node:fs';
import path from 'node:path';
import {libraryRoot, LOCAL_LIBRARY} from './paths.mjs';

const PREFIX = 'assets/library/';

export function stageLibrary(edit) {
  const staged = [];
  const ok = (rel) => {
    if (!rel || !rel.startsWith(PREFIX)) return true;
    const sub = rel.slice(PREFIX.length);
    const dest = path.join(LOCAL_LIBRARY, sub);
    if (fs.existsSync(dest)) return true; // e.g. fonts or already staged
    const src = path.join(libraryRoot(), sub);
    if (!fs.existsSync(src)) return false;
    fs.mkdirSync(path.dirname(dest), {recursive: true});
    fs.copyFileSync(src, dest);
    staged.push(dest);
    return true;
  };
  const before = (edit.memes?.length ?? 0) + (edit.sfx?.length ?? 0);
  edit.memes = (edit.memes ?? []).filter((m) => ok(m.sound) && ok(m.visual));
  edit.sfx = (edit.sfx ?? []).filter((x) => ok(x.src));
  edit.musicCues = (edit.musicCues ?? []).filter((x) => ok(x.src));
  const dropped = before - edit.memes.length - edit.sfx.length;
  if (dropped) console.log(`  ⚠️ ${dropped} sound/sticker(s) skipped: library not found (is the T7 plugged in?)`);
  return () => {
    for (const f of staged) fs.rmSync(f, {force: true});
    // remove now-empty staging folders (never the fonts folder)
    const prune = (d) => {
      if (!fs.existsSync(d) || path.basename(d) === 'fonts') return;
      for (const e of fs.readdirSync(d)) {
        const p = path.join(d, e);
        if (fs.statSync(p).isDirectory()) prune(p);
      }
      if (d !== LOCAL_LIBRARY && fs.readdirSync(d).filter((e) => e !== '.DS_Store').length === 0) fs.rmSync(d, {recursive: true, force: true});
    };
    prune(LOCAL_LIBRARY);
  };
}
