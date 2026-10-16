// Capture a website as evidence for an explainer (brain/explainers.md Style B): a full-page screenshot + a smooth
// scrolling video, with the exact place of the lines you want to highlight.
// Usage: node scripts/capture.mjs <reel> <url> [--id name] [--find "a line on the page"]… [--mobile] [--max 6000]
//                                 [--seconds 8] [--no-video] [--keep-overlays] [--never "a,b"] [--library]
//   → <T7>/_work/<reel>/captures/<id>.jpg   full page (2× sharp), cookie banners / sign-up pop-ups removed
//     <T7>/_work/<reel>/captures/<id>.json  {url, title, site, width, height, found: [{text, rects: [[x,y,w,h]…]}]}
//     <T7>/_work/<reel>/captures/<id>.mp4   smooth scroll top → bottom (holds, eased), for direction.plane / vlogs
//   --find: the line(s) the camera will move to and the yellow marker will sweep (direction.evidence look "page")
//   --mobile: phone-width page (reads better inside a 9:16 reel); default is a 1280 px desktop page
//   --out <dir>: save somewhere else (tests); without it the T7 must be plugged in (nothing is written to the Mac)
//   --library: also file it in Library/wanted/<id> (Kind: picture, Source: url) and import it, for reuse in other videos
// Private info (emails, phone numbers, UPI, keys, names in --never / never.txt) is found with scripts/secretsweep.py
// (Apple Vision OCR of the screenshot) and blurred INTO the picture before anything else sees it.
// Browser: Remotion's own Chrome (node_modules/.remotion/chrome-headless-shell), driven over the DevTools protocol.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn, spawnSync} from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
import {driveAttached, libraryRoot, workRoot} from './lib/paths.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const many = (n) => args.flatMap((a, i) => (a === n ? [args[i + 1]] : []));
const VALUED = new Set(['--id', '--find', '--max', '--seconds', '--never', '--out']);
const [reel, url] = args.filter((a, i) => !a.startsWith('--') && !VALUED.has(args[i - 1]));
if (!reel || !/^https?:\/\//.test(url ?? '')) {
  console.log('Usage: node scripts/capture.mjs <reel> <url> [--id name] [--find "line"]… [--mobile] [--max 6000] [--seconds 8] [--no-video] [--library]');
  process.exit(1);
}
const mobile = args.includes('--mobile');
const id = opt('--id', new URL(url).hostname.replace(/^www\./, '').split('.')[0] + '-' + (new URL(url).pathname.split('/').filter(Boolean).pop() ?? 'home').replace(/\W+/g, '-').slice(0, 30)).toLowerCase();
const maxH = +opt('--max', mobile ? 5000 : 6000);
const finds = many('--find');
// data lives on the T7 only (rules.md); --out <dir> = somewhere else on purpose (a scratch test)
if (!driveAttached() && !opt('--out')) {
  console.log('The T7 is not plugged in: captures are kept on the drive only. Plug it in and run this again.');
  process.exit(2);
}
const outDir = opt('--out') ?? path.join(workRoot(), reel, 'captures');
fs.mkdirSync(outDir, {recursive: true});
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reelengine-capture-'));
const VW = mobile ? 430 : 1280, VH = mobile ? 932 : 800, DPR = 2;

// ── a tiny DevTools-protocol client (Node 22 has WebSocket built in) ─────────────────────────────────────────────
const shell = fs.readdirSync('node_modules/.remotion/chrome-headless-shell').map((p) => path.resolve('node_modules/.remotion/chrome-headless-shell', p))
  .filter((d) => fs.statSync(d).isDirectory()).flatMap((d) => fs.readdirSync(d).map((s) => path.join(d, s, 'chrome-headless-shell'))).find((f) => fs.existsSync(f));
if (!shell) throw new Error('Remotion Chrome not found (node_modules/.remotion/chrome-headless-shell): run a render once to download it');
const chrome = spawn(shell, ['--remote-debugging-port=0', `--user-data-dir=${tmp}/profile`, '--no-first-run', '--hide-scrollbars', '--mute-audio', 'about:blank'], {stdio: ['ignore', 'ignore', 'pipe']});
const cleanup = () => { try { chrome.kill('SIGKILL'); } catch {} fs.rmSync(tmp, {recursive: true, force: true}); };
process.on('exit', cleanup);
const wsBrowser = await new Promise((ok, no) => {
  let buf = '';
  chrome.stderr.on('data', (d) => { buf += d; const m = buf.match(/ws:\/\/[^\s]+/); if (m) ok(m[0]); });
  setTimeout(() => no(new Error('Chrome did not start')), 20000);
});
const port = new URL(wsBrowser).port;
const page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((ok) => ws.addEventListener('open', ok));
let nextId = 0;
const waiting = new Map(), listeners = [];
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && waiting.has(m.id)) { const {ok, no} = waiting.get(m.id); waiting.delete(m.id); m.error ? no(new Error(m.error.message)) : ok(m.result); }
  else if (m.method) listeners.forEach((l) => l(m));
});
const send = (method, params = {}, ms = 60000) => new Promise((ok, no) => {
  const i = ++nextId;
  const timer = setTimeout(() => { waiting.delete(i); no(new Error(`${method} took over ${ms / 1000} s`)); }, ms);
  waiting.set(i, {ok: (r) => { clearTimeout(timer); ok(r); }, no: (e) => { clearTimeout(timer); no(e); }});
  ws.send(JSON.stringify({id: i, method, params}));
});
const once = (method, ms) => new Promise((ok) => { const l = (m) => m.method === method && ok(true); listeners.push(l); setTimeout(() => ok(false), ms); });
const evaluate = async (expr) => (await send('Runtime.evaluate', {expression: expr, awaitPromise: true, returnByValue: true})).result.value;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  await send('Page.enable');
  await send('Network.enable');
  await send('Network.setUserAgentOverride', {userAgent: mobile
    ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
    : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', acceptLanguage: 'en-IN,en'});
  await send('Emulation.setDeviceMetricsOverride', {width: VW, height: VH, deviceScaleFactor: DPR, mobile});
  console.log(`Opening ${url} …`);
  const loaded = once('Page.loadEventFired', 20000);
  await send('Page.navigate', {url});
  if (!(await loaded)) console.log('  (page kept loading for 20 s; capturing what is there)');
  await sleep(2000);

  // Cookie / consent banners, sign-up and app pop-ups: removed from the page (never "accepted"). Body scrolling restored.
  const clean = `(() => {
    const bad = /cookie|consent|gdpr|onetrust|didomi|cmp-|truste|sp_message|newsletter|subscribe-modal|app-banner|smartbanner|paywall|modal|popup|overlay|interstitial/i;
    let n = 0;
    for (const el of [...document.querySelectorAll('body *')]) {
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
      const r = el.getBoundingClientRect();
      const big = r.width * r.height > innerWidth * innerHeight * 0.3;
      const tag = bad.test((el.id || '') + ' ' + (el.className?.baseVal ?? el.className ?? '') + ' ' + (el.getAttribute('aria-label') || ''));
      if (tag || (big && cs.position === 'fixed')) { el.remove(); n++; }
      else if (cs.position === 'fixed' && r.top > innerHeight * 0.5) { el.remove(); n++; } // bottom bars ("open in app")
    }
    for (const el of [document.documentElement, document.body]) { el.style.setProperty('overflow', 'visible', 'important'); el.style.setProperty('position', 'static', 'important'); }
    return n;
  })()`;
  if (!args.includes('--keep-overlays')) console.log(`  removed ${await evaluate(clean)} banner/pop-up element(s)`);

  // Scroll through once so lazy pictures load, then back to the top.
  await evaluate(`(async () => { for (let y = 0; y < Math.min(document.documentElement.scrollHeight, ${maxH}); y += innerHeight * 0.7) { scrollTo(0, y); await new Promise(r => setTimeout(r, 250)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 1200)); })()`);
  if (!args.includes('--keep-overlays')) await evaluate(clean); // some pop-ups appear only after scrolling
  // sticky headers would repeat in a full-page shot: pin them to where they are at the top
  await evaluate(`document.querySelectorAll('body *').forEach(el => { const p = getComputedStyle(el).position; if (p === 'fixed' || p === 'sticky') el.style.setProperty('position', 'absolute', 'important'); })`);

  // Where the lines to highlight are: exact boxes from the page itself (one box per line of text), in page px.
  const found = await evaluate(`(() => {
    const finds = ${JSON.stringify(finds)};
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = []; let all = '';
    for (let n; (n = walker.nextNode());) {
      const p = n.parentElement; if (!p || /SCRIPT|STYLE|NOSCRIPT/.test(p.tagName)) continue;
      nodes.push({n, at: all.length}); all += n.data;
    }
    const norm = (s) => s.replace(/[\\s\\u00a0]+/g, ' ').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').toLowerCase();
    // map normalised positions back to raw ones
    let flat = '', map = [];
    for (let i = 0; i < all.length; i++) { const c = norm(all[i]); if (c === ' ' && flat.endsWith(' ')) continue; flat += c; map.push(i); }
    const at = (raw) => { let k = nodes.length - 1; while (k > 0 && nodes[k].at > raw) k--; return [nodes[k].n, raw - nodes[k].at]; };
    return finds.map((text) => {
      const q = norm(text).trim(); const i = flat.indexOf(q);
      if (i < 0) return {text, rects: [], near: flat.slice(Math.max(0, flat.indexOf(q.split(" ").slice(-2).join(" ")) - 200), flat.indexOf(q.split(" ").slice(-2).join(" ")) + 200)};
      const r = document.createRange();
      r.setStart(...at(map[i])); r.setEnd(...at(map[i + q.length - 1] + 1));
      const lines = [];
      for (const b of r.getClientRects()) {
        if (b.width < 2 || b.height < 2) continue;
        const y = b.top + scrollY, last = lines[lines.length - 1];
        if (last && Math.abs(last[1] - y) < b.height * 0.5) { const x2 = Math.max(last[0] + last[2], b.right + scrollX); last[0] = Math.min(last[0], b.left + scrollX); last[2] = x2 - last[0]; last[3] = Math.max(last[3], b.height); }
        else lines.push([b.left + scrollX, y, b.width, b.height]);
      }
      return {text, rects: lines.map((l) => l.map((v) => Math.round(v)))};
    });
  })()`);
  for (const f of found) console.log(f.rects.length ? `  found "${f.text.slice(0, 50)}" → ${f.rects.length} line(s) at y ${f.rects[0][1]}` : `  ✗ not on the page: "${f.text.slice(0, 60)}" (copy it exactly as written there)${process.env.DEBUG ? "\n" + f.near : ""}`);

  const meta = await evaluate(`({title: document.title, site: document.querySelector('meta[property="og:site_name"]')?.content || location.hostname.replace(/^www\\./, ''), w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight})`);
  const width = Math.min(meta.w, VW), height = Math.min(meta.h, Math.max(maxH, ...found.flatMap((f) => f.rects.map((r) => r[1] + r[3] + VH))));
  const shot = await send('Page.captureScreenshot', {format: 'jpeg', quality: 92, captureBeyondViewport: true, clip: {x: 0, y: 0, width, height, scale: 1}});
  const raw = path.join(tmp, 'page.jpg');
  fs.writeFileSync(raw, Buffer.from(shot.data, 'base64'));
  ws.close();

  // Private info → blurred into the picture (secretsweep.py --image: Apple Vision OCR in tiles).
  const jpg = path.join(outDir, `${id}.jpg`);
  const neverFile = path.join(workRoot(), reel, 'never.txt'); // names/addresses that must never show
  const never = [opt('--never'), fs.existsSync(neverFile) && fs.readFileSync(neverFile, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean).join(',')].filter(Boolean).join(',');
  const sw = spawnSync('.venv/bin/python', ['scripts/secretsweep.py', '--image', raw, '--out', path.join(tmp, 'secrets.json'), ...(never ? ['--never', never] : [])], {encoding: 'utf8'});
  const secrets = sw.status === 0 && fs.existsSync(path.join(tmp, 'secrets.json')) ? JSON.parse(fs.readFileSync(path.join(tmp, 'secrets.json'), 'utf8')) : [];
  if (sw.status !== 0) console.log(`  ⚠️ secrets sweep failed (${(sw.stderr || '').trim().split('\n').pop()}); check the picture yourself`);
  if (secrets.length) {
    // each box: crop → heavy blur → back on top
    const W = width * DPR, H = height * DPR;
    const px = secrets.map(({box: [x, y, w, h]}) => [x * W, y * H, w * W, h * H].map((v) => Math.max(2, Math.round(v / 2) * 2)));
    const chains = px.map(([x, y, w, h], i) => `[0:v]crop=${w}:${h}:${x}:${y},boxblur=20:3[b${i}]`).join(';');
    const over = px.map(([x, y], i) => `${i ? `[o${i - 1}]` : '[0:v]'}[b${i}]overlay=${x}:${y}${i === px.length - 1 ? '' : `[o${i}]`}`).join(';');
    spawnSync(ffmpegPath, ['-y', '-loglevel', 'error', '-i', raw, '-filter_complex', `${chains};${over}`, '-q:v', '2', jpg]);
    console.log(`  blurred ${secrets.length} private item(s): ${secrets.map((s) => s.kind).join(', ')}`);
  } else fs.copyFileSync(raw, jpg);

  const info = {url, title: meta.title, site: meta.site, captured: new Date().toLocaleDateString('en-CA'), mobile, scale: DPR, width, height, viewport: [VW, VH], found, blurred: secrets.map((s) => s.kind)};
  fs.writeFileSync(path.join(outDir, `${id}.json`), JSON.stringify(info, null, 1));
  console.log(`→ ${jpg}  (${width}×${height} page px, "${meta.title.slice(0, 60)}")`);

  // Smooth scroll video: hold 0.8 s, eased scroll to the bottom of the capture, hold 0.8 s. Made from the screenshot,
  // so it is perfectly smooth (no stutter from a live page) and private info stays blurred.
  if (!args.includes('--no-video')) {
    const secs = +opt('--seconds', 8), hold = 0.8, run = Math.max(1, secs - 2 * hold);
    const ow = Math.min(width * DPR, mobile ? 860 : 1920), oh = Math.round((ow * VH) / VW / 2) * 2;
    const p = `min(max((t-${hold})/${run},0),1)`;
    const vf = `scale=${ow}:-2,crop=${ow}:${oh}:0:'(ih-${oh})*(0.5-0.5*cos(PI*${p}))',fps=30,format=yuv420p`;
    const r = spawnSync(ffmpegPath, ['-y', '-loglevel', 'error', '-loop', '1', '-framerate', '30', '-i', jpg, '-t', String(secs), '-vf', vf, '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', path.join(outDir, `${id}.mp4`)], {encoding: 'utf8'});
    console.log(r.status === 0 ? `→ ${path.join(outDir, `${id}.mp4`)}  (${secs}s scroll)` : `  ✗ scroll video failed: ${r.stderr.slice(-300)}`);
  }

  if (args.includes('--library')) {
    const dir = path.join(libraryRoot(), 'wanted', id);
    fs.mkdirSync(dir, {recursive: true});
    fs.copyFileSync(jpg, path.join(dir, 'page.jpg'));
    fs.writeFileSync(path.join(dir, 'about.txt'), [`Website capture: ${meta.title}`, 'Kind: picture', `Tags: website, screenshot, ${meta.site}`, `For: ${reel}`, `Source: ${meta.site} · ${url}`, 'Licence: screenshot (credit the site on screen)', `Credit: ${meta.site}`, ''].join('\n'));
    spawnSync('node', ['scripts/assets.mjs', 'import'], {stdio: 'inherit'});
  }
  console.log(`\nUse it: direction.evidence [{at, until, look: "page", page: "captures/${id}", mark: 0, zoomWord, markWord, source: "${meta.site}"}]`);
} finally {
  cleanup();
}
