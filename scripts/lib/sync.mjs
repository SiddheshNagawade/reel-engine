// If work had to happen on the Mac while the T7 was unplugged, move it to the drive as soon as the drive is back.
// Mac → drive: work/ → _work/, output/, inbox/, projects/ (and a Mac-side library fallback, if any was created).
// Files are copied, verified by size, then removed from the Mac. Existing files on the drive are never overwritten.
import fs from 'node:fs';
import path from 'node:path';
import {driveAttached, DRIVE_ROOT, LOCAL_ROOT} from './paths.mjs';

const PAIRS = [['work', '_work'], ['output', 'output'], ['inbox', 'inbox'], ['projects', 'projects']];

function moveTree(src, dest, moved) {
  for (const e of fs.readdirSync(src, {withFileTypes: true})) {
    if (e.name === '.DS_Store' || e.name.startsWith('._') || e.name === '.gitkeep') continue;
    const s = path.join(src, e.name);
    let d = path.join(dest, e.name);
    if (e.isDirectory()) {
      fs.mkdirSync(d, {recursive: true});
      moveTree(s, d, moved);
      if (fs.readdirSync(s).filter((x) => x !== '.DS_Store').length === 0) fs.rmSync(s, {recursive: true, force: true});
      continue;
    }
    if (fs.existsSync(d) && fs.statSync(d).size !== fs.statSync(s).size) d = d.replace(/(\.[^.]*)?$/, `-from-mac$1`); // keep both
    if (!fs.existsSync(d)) fs.copyFileSync(s, d);
    if (fs.statSync(d).size === fs.statSync(s).size) {
      fs.rmSync(s, {force: true});
      moved.n++;
    }
  }
}

export function syncToDrive({quiet = false} = {}) {
  if (!driveAttached()) return 0;
  const moved = {n: 0};
  for (const [local, remote] of PAIRS) {
    const src = path.join(LOCAL_ROOT, local);
    if (!fs.existsSync(src)) continue;
    const dest = path.join(DRIVE_ROOT, remote);
    fs.mkdirSync(dest, {recursive: true});
    moveTree(src, dest, moved);
  }
  if (moved.n && !quiet) console.log(`↪ moved ${moved.n} file(s) made while the T7 was unplugged from the Mac to the drive`);
  return moved.n;
}
