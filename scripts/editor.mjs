// Timeline editor: he adjusts the planned edit himself before the slow render (his ask 2026-10-14: "I should be able to
// edit, not just view"). Opens Remotion Studio (the live preview) + a timeline page; every Save writes
// _work/<name>/edited.json (on the T7, wins over the plan at render) and src/edits/latest.json (Studio reloads live).
//   1. npm run reel -- <name> --no-render --studio      (plan it, keep the footage staged for the preview)
//   2. npm run editor -- <name>                          → http://localhost:4400 (timeline) + Studio on :3000
//   3. npm run reel -- <name> --note "…"                 (renders with his adjustments)
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {workRoot, libraryRoot} from './lib/paths.mjs';
import {stageLibrary} from './lib/assets.mjs';

const name = process.argv[2];
if (!name) { console.error('Usage: npm run editor -- <name>'); process.exit(1); }
const work = path.join(workRoot(), name);
const handFile = path.join(work, 'edited.json');
const planned = `src/edits/${name}.json`;
if (!fs.existsSync(planned)) { console.error(`No planned edit for ${name}: run npm run reel -- ${name} --no-render --studio first.`); process.exit(1); }
const load = () => JSON.parse(fs.readFileSync(fs.existsSync(handFile) ? handFile : planned, 'utf8'));

let unstage = () => {};
const preview = (edit) => { // Library files the edit uses → public/ for the preview only; removed on exit
  unstage();
  const copy = structuredClone(edit);
  unstage = stageLibrary(copy);
  fs.writeFileSync('src/edits/latest.json', JSON.stringify(copy, null, 2));
};
preview(load());

const catalog = () => {
  const f = path.join(libraryRoot(), 'catalog.json');
  if (!fs.existsSync(f)) return [];
  return (JSON.parse(fs.readFileSync(f, 'utf8')).memes ?? []).map((m) => ({id: m.id, kind: m.kind, dir: m.dir, tags: m.tags, meaning: m.meaning, seconds: m.seconds, show: m.show,
    w: m.w, h: m.h, files: fs.existsSync(path.join(libraryRoot(), m.dir ?? '')) ? fs.readdirSync(path.join(libraryRoot(), m.dir)).filter((x) => !x.startsWith('.')) : []}));
};

const page = fs.readFileSync('scripts/editor/index.html', 'utf8');
http.createServer((req, res) => {
  const send = (code, body, type = 'application/json') => { res.writeHead(code, {'content-type': type}); res.end(body); };
  if (req.url === '/') return send(200, page.replaceAll('__NAME__', name), 'text/html');
  if (req.url === '/api/edit' && req.method === 'GET') return send(200, JSON.stringify({edit: load(), hand: fs.existsSync(handFile)}));
  if (req.url === '/api/library') return send(200, JSON.stringify(catalog()));
  if (req.url === '/api/edit' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const edit = JSON.parse(body);
      if (fs.existsSync(handFile)) { // never lose a version of his adjustments
        fs.mkdirSync(path.join(work, 'versions'), {recursive: true});
        fs.copyFileSync(handFile, path.join(work, 'versions', `edited-${Date.now()}.json`));
      }
      fs.writeFileSync(handFile, JSON.stringify(edit, null, 2));
      preview(edit);
      send(200, '{"ok":true}');
    });
    return;
  }
  if (req.url === '/api/reset' && req.method === 'POST') {
    if (fs.existsSync(handFile)) fs.renameSync(handFile, path.join(work, 'versions', `edited-reset-${Date.now()}.json`));
    preview(load());
    return send(200, '{"ok":true}');
  }
  send(404, 'not found', 'text/plain');
}).listen(4400, () => console.log(`\n✋ Timeline editor: http://localhost:4400   (preview: Studio, http://localhost:3000)\n   Ctrl+C when done.`));

const studio = spawn('npx', ['remotion', 'studio', 'src/index.ts', '--port', '3000'], {stdio: 'inherit'});
const quit = () => { unstage(); studio.kill(); process.exit(0); };
process.on('SIGINT', quit);
process.on('SIGTERM', quit);
