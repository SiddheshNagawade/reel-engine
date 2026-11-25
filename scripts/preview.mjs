// The preview page with a render bar, like a video editor: http://localhost:4500 (and the Network address on the
// phone, same Wi-Fi). Each question of a video renders once into the cache (green on the bar), the page plays the
// rendered questions back smoothly, in final quality. Edit the code → only the questions that changed turn grey and
// re-render. The export (node scripts/geo-render.mjs <lesson>) joins the cached questions, so nothing renders twice.
// Rendering is PAUSED at start (he edits first): the page's "Start rendering" button fills the bar, "Pause" stops at
// once. --render starts it straight away.
//   npm run preview                         (both geometry videos)
//   npm run preview -- intermediate --render --port 4500 --studio http://localhost:3001
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {plan, refresh, fill, cacheDir} from './lib/geo-cache.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const flags = new Set(['--port', '--studio']);
const lessons = args.filter((a, i) => !a.startsWith('--') && !flags.has(args[i - 1]));
if (!lessons.length) lessons.push('elementary', 'intermediate');
const PORT = Number(opt('--port', 4500)), STUDIO = opt('--studio', 'http://localhost:3001');
let RENDER = args.includes('--render');

const plans = {};
let dirty = true, viewing = lessons[0];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function replan() {
  dirty = false;
  for (const l of lessons) {
    try { plans[l] = await plan(l); } catch (e) { console.log(`plan ${l} failed: ${e.message}`); }
  }
}
// an edit in src/ → fingerprints again (only the changed questions turn grey)
let tm = null;
fs.watch('src', {recursive: true}, (_, f) => {
  if (!f || f.includes('edits')) return;
  clearTimeout(tm);
  tm = setTimeout(() => (dirty = true), 1500);
});

async function renderLoop() {
  for (;;) {
    if (!RENDER) { await sleep(1000); continue; }
    if (dirty) await replan();
    const order = [viewing, ...lessons.filter((l) => l !== viewing)];
    let all = true;
    for (const l of order) {
      const r = await fill(l, {shouldStop: () => !RENDER || dirty || viewing !== order[0]}).catch((e) => (console.log(`render ${l}: ${e.message}`), 'busy'));
      if (r !== 'done') { all = false; break; }
    }
    await sleep(all ? 3000 : 15000);
  }
}

const PAGE = fs.readFileSync(new URL('./lib/preview-page.html', import.meta.url), 'utf8');
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  try {
    if (u.pathname === '/') {
      res.writeHead(200, {'content-type': 'text/html; charset=utf-8'});
      return res.end(PAGE);
    }
    if (u.pathname === '/api/render' && req.method === 'POST') {
      RENDER = u.searchParams.get('on') === '1';
      console.log(RENDER ? 'Rendering started from the page.' : 'Rendering paused from the page.');
      return res.writeHead(204).end();
    }
    if (u.pathname === '/api/status') {
      const l = u.searchParams.get('lesson') || lessons[0];
      if (lessons.includes(l)) viewing = l;
      if (!plans[l]) await replan();
      const st = plans[l] ? refresh(plans[l]) : null;
      res.writeHead(200, {'content-type': 'application/json', 'cache-control': 'no-store'});
      return res.end(JSON.stringify({lessons, lesson: l, studio: STUDIO, rendering: RENDER, checking: dirty, ...(st ?? {})}));
    }
    const m = u.pathname.match(/^\/media\/([\w-]+)\/([\w.-]+\.mp4)$/);
    if (m && lessons.includes(m[1])) {
      const f = path.join(cacheDir(m[1]), m[2]);
      if (!fs.existsSync(f)) return res.writeHead(404).end();
      const size = fs.statSync(f).size, range = req.headers.range?.match(/bytes=(\d*)-(\d*)/);
      if (range) {
        const a = range[1] ? Number(range[1]) : size - Number(range[2]), b = range[1] && range[2] ? Number(range[2]) : size - 1;
        res.writeHead(206, {'content-type': 'video/mp4', 'accept-ranges': 'bytes', 'content-range': `bytes ${a}-${b}/${size}`, 'content-length': b - a + 1, 'cache-control': 'max-age=31536000, immutable'});
        return fs.createReadStream(f, {start: a, end: b}).pipe(res);
      }
      res.writeHead(200, {'content-type': 'video/mp4', 'accept-ranges': 'bytes', 'content-length': size});
      return fs.createReadStream(f).pipe(res);
    }
    res.writeHead(404).end();
  } catch (e) {
    res.writeHead(500).end(String(e.message));
  }
}).listen(PORT, '0.0.0.0', () => {
  const lan = Object.values(os.networkInterfaces()).flat().find((i) => i && i.family === 'IPv4' && !i.internal)?.address;
  console.log(`Preview: http://localhost:${PORT}${lan ? `   phone (same Wi-Fi): http://${lan}:${PORT}` : ''}`);
  console.log(RENDER ? 'Rendering missing questions in the background.' : 'Rendering paused: press "Start rendering" on the page.');
});
await replan();
renderLoop();
