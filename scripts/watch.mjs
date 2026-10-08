// Auto-edit: watches inbox/ and projects/ on the T7 drive (when plugged in) and in ~/ReelEngine.
//   inbox/<video>        → one reel per video
//   projects/<folder>/   → one reel from all clips in the folder (starts 60s after the last file stops changing)
// Usage: npm run watch
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {mediaRoots, listVideos} from './lib/paths.mjs';

const seen = new Map(); // path -> {sig, since}
let busy = false;

const run = (target) =>
  new Promise((resolve) => {
    const p = spawn(process.execPath, ['scripts/reel.mjs', target], {stdio: 'inherit'});
    p.on('close', (code) => resolve(code === 0));
  });

// A path is "ready" once its size signature hasn't changed for `quiet` ms (still copying otherwise).
function ready(key, sig, quiet) {
  const prev = seen.get(key);
  if (!prev || prev.sig !== sig) {
    seen.set(key, {sig, since: Date.now()});
    return false;
  }
  return Date.now() - prev.since >= quiet;
}

async function tick() {
  if (busy) return;
  for (const root of mediaRoots()) {
    const inbox = path.join(root, 'inbox');
    for (const f of listVideos(inbox)) {
      if (!ready(f, String(fs.statSync(f).size), 5000)) continue;
      busy = true;
      const ok = await run(f);
      const dest = path.join(inbox, ok ? 'done' : 'failed');
      fs.mkdirSync(dest, {recursive: true});
      fs.renameSync(f, path.join(dest, path.basename(f)));
      seen.delete(f);
      busy = false;
      return;
    }
    const projects = path.join(root, 'projects');
    for (const d of fs.readdirSync(projects)) {
      const dir = path.join(projects, d);
      if (!fs.statSync(dir).isDirectory() || fs.existsSync(path.join(dir, '.done'))) continue;
      const vids = listVideos(dir);
      if (!vids.length) continue;
      const sig = vids.map((v) => `${v}:${fs.statSync(v).size}`).join('|');
      if (!ready(dir, sig, 60000)) continue;
      busy = true;
      const ok = await run(dir);
      if (ok) fs.writeFileSync(path.join(dir, '.done'), new Date().toISOString());
      seen.delete(dir);
      busy = false;
      return;
    }
  }
}

console.log(`👀 Watching:\n${mediaRoots().map((r) => `   ${r}/inbox  ·  ${r}/projects`).join('\n')}\nCtrl+C to stop.`);
setInterval(() => tick().catch((e) => {
  console.error(e);
  busy = false;
}), 3000);
