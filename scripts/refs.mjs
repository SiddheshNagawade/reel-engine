// Download reference videos (Instagram reels, YouTube, etc.) to the drive and study them.
// Usage: node scripts/refs.mjs add <url> [<url>…] [--cookies chrome] [--no-study]
//        node scripts/refs.mjs list
// Each video lands in <drive>/references/library/<site>-<id>/ : video.mp4, info.json, transcript.txt, frames/ (stills), notes.md
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
import {DRIVE_ROOT, driveAttached, LOCAL_ROOT} from './lib/paths.mjs';

const root = path.join(driveAttached() ? DRIVE_ROOT : LOCAL_ROOT, 'references', 'library');
fs.mkdirSync(root, {recursive: true});
const args = process.argv.slice(2);
const cmd = args.shift();
const flag = (name) => {
  const i = args.indexOf(name);
  if (i < 0) return null;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const cookies = flag('--cookies');
const study = !args.includes('--no-study');
const urls = args.filter((a) => a.startsWith('http'));
const run = (bin, a, opts = {}) => spawnSync(bin, a, {encoding: 'utf8', ...opts});

if (cmd === 'list') {
  for (const d of fs.readdirSync(root).filter((f) => !f.startsWith('.'))) {
    const p = path.join(root, d, 'info.json');
    if (!fs.existsSync(p)) continue;
    const i = JSON.parse(fs.readFileSync(p, 'utf8'));
    console.log(`${d}  ${Math.round(i.duration || 0)}s  @${i.uploader || '?'}  ${(i.title || '').slice(0, 60)}`);
  }
  process.exit(0);
}
if (cmd !== 'add' || !urls.length) {
  console.log('Usage: node scripts/refs.mjs add <url…> [--cookies chrome] [--no-study] | list');
  process.exit(1);
}

for (const url of urls) {
  const tmp = path.join(root, `.tmp-${Date.now()}`);
  fs.mkdirSync(tmp, {recursive: true});
  const ytArgs = ['-f', 'bv*+ba/b', '--merge-output-format', 'mp4', '--write-info-json', '--no-playlist', '-o', path.join(tmp, 'video.%(ext)s'), url];
  if (cookies) ytArgs.unshift('--cookies-from-browser', cookies);
  console.log(`Downloading ${url} …`);
  const r = run('.venv/bin/yt-dlp', ytArgs, {stdio: ['ignore', 'inherit', 'inherit']});
  const video = path.join(tmp, 'video.mp4');
  if (r.status !== 0 || !fs.existsSync(video)) {
    console.error(`FAILED: ${url}\n(Instagram often needs login: retry with --cookies chrome)`);
    fs.rmSync(tmp, {recursive: true, force: true});
    continue;
  }
  const info = JSON.parse(fs.readFileSync(path.join(tmp, 'video.info.json'), 'utf8'));
  const dir = path.join(root, `${(info.extractor_key || 'site').toLowerCase()}-${info.id}`);
  fs.rmSync(dir, {recursive: true, force: true});
  fs.renameSync(tmp, dir);
  fs.renameSync(path.join(dir, 'video.info.json'), path.join(dir, 'info.json'));
  console.log(`Saved → ${dir}`);
  if (!study) continue;

  // Study: stills every ~2 s (contact sheet) + Hinglish transcript
  const frames = path.join(dir, 'frames');
  fs.mkdirSync(frames, {recursive: true});
  run(ffmpegPath, ['-hide_banner', '-loglevel', 'error', '-i', path.join(dir, 'video.mp4'), '-vf', 'fps=1/2,scale=270:-2', path.join(frames, 'f%03d.jpg')]);
  const wav = path.join(dir, 'audio.wav');
  run(ffmpegPath, ['-hide_banner', '-loglevel', 'error', '-y', '-i', path.join(dir, 'video.mp4'), '-ac', '1', '-ar', '16000', wav]);
  const tj = path.join(dir, 'transcript.json');
  run('.venv/bin/python', ['scripts/transcribe.py', wav, tj], {stdio: ['ignore', 'ignore', 'inherit']});
  fs.rmSync(wav, {force: true});
  let text = '';
  if (fs.existsSync(tj)) {
    const t = JSON.parse(fs.readFileSync(tj, 'utf8'));
    text = (t.segments ? t.segments.map((s) => s.text.trim()).join(' ') : t.text || '').trim();
    fs.writeFileSync(path.join(dir, 'transcript.txt'), text + '\n');
  }
  fs.writeFileSync(
    path.join(dir, 'notes.md'),
    `# ${info.title || info.id}\n@${info.uploader || '?'} · ${Math.round(info.duration || 0)}s · ${url}\n\n## Caption\n${info.description || ''}\n\n## Transcript\n${text}\n\n## What to learn (fill in after watching frames/)\n- Hook:\n- Pacing / cuts:\n- Text & graphics:\n- Sound:\n`,
  );
  console.log('Studied: frames/, transcript.txt, notes.md');
}
