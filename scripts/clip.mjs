// Clip renderer for Whop-style clipping: 16:9 source → 9:16 post, ORIGINAL picture + audio (no grade, no film look).
// Layout: blurred copy of the clip as background, the clip (cropped above its burned-in subtitles) in the middle,
// the campaign logo + a title above, big captions below (taken from the source subtitles via scripts/subocr.py).
//
//   node scripts/clip.mjs <clip.json>
// clip.json: {
//   src, out, subs?,                       // subs = subocr.py JSON ([{s,e,text}] in source seconds)
//   segments: [{in, out, fx?}],            // source seconds; fx = horizontal centre of the crop (0..1, default 0.5)
//   crop: {w: 1280, h: 940, y: 0},         // source pixels kept for the main picture (exclude the burned subtitle band)
//   logo?: {file, h: 150, y: 170},         // campaign logo (required by most campaigns)
//   title?: {text, accent?, size: 112, y: 345}, // accent = one word drawn in the accent colour
//   caption?: {size: 66, colour: '#FFD84A', y: 1365},
//   accent?: '#E63946', blurBg?: true
// }
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import ffmpeg from 'ffmpeg-static';

const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const W = 1080, H = 1920;
const crop = {w: 1280, h: 940, y: 0, ...cfg.crop};
const cap = {size: 66, colour: '#FFD84A', y: 1365, ...cfg.caption};
const accent = cfg.accent ?? '#E63946';
const fgH = Math.round((W / crop.w) * crop.h);
const fgY = cfg.fgY ?? 520;

// ASS colours are &HBBGGRR
const assColour = (hex) => `&H00${hex.slice(5, 7)}${hex.slice(3, 5)}${hex.slice(1, 3)}`.toUpperCase();
const ts = (t) => {
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = (t % 60).toFixed(2).padStart(5, '0');
  return `${h}:${String(m).padStart(2, '0')}:${s}`;
};

// Map source-time subtitles onto the output timeline.
const subs = cfg.subs ? JSON.parse(fs.readFileSync(cfg.subs, 'utf8')) : [];
const events = [];
let offset = 0;
for (const seg of cfg.segments) {
  for (const l of subs) {
    const s = Math.max(l.s, seg.in), e = Math.min(l.e, seg.out);
    if (e - s > 0.15) events.push({s: s - seg.in + offset, e: e - seg.in + offset, text: l.text});
  }
  offset += seg.out - seg.in;
}
const total = offset;

const fontsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clipfonts-'));
for (const f of ['/System/Library/Fonts/Supplemental/DIN Condensed Bold.ttf', '/System/Library/Fonts/Avenir Next.ttc']) {
  fs.copyFileSync(f, path.join(fontsDir, path.basename(f)));
}

const lines = [
  '[Script Info]', 'ScriptType: v4.00+', `PlayResX: ${W}`, `PlayResY: ${H}`, 'WrapStyle: 0', '',
  '[V4+ Styles]',
  'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
  `Style: Title,DIN Condensed,${cfg.title?.size ?? 112},&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,1,0,0,0,100,100,2,0,1,6,4,8,60,60,0,1`,
  `Style: Cap,Avenir Next,${cap.size},${assColour(cap.colour)},&H00FFFFFF,&H00000000,&H96000000,1,0,0,0,100,100,0,0,1,6,3,8,90,90,0,1`,
  '', '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
];
if (cfg.title) {
  const {text, accent: word, y = 345} = cfg.title;
  const body = word ? text.replace(word, `{\\c${assColour(accent)}}${word}{\\c&H00FFFFFF&}`) : text;
  lines.push(`Dialogue: 1,${ts(0)},${ts(total)},Title,,0,0,0,,{\\pos(${W / 2},${y})\\an8}${body}`);
}
for (const ev of events) {
  // pop-in: tiny scale overshoot, no fade (reads instantly)
  lines.push(`Dialogue: 0,${ts(ev.s)},${ts(ev.e)},Cap,,0,0,0,,{\\pos(${W / 2},${cap.y})\\an8\\fscx88\\fscy88\\t(0,90,\\fscx104\\fscy104)\\t(90,160,\\fscx100\\fscy100)}${ev.text}`);
}
const assFile = path.join(fontsDir, 'clip.ass');
fs.writeFileSync(assFile, lines.join('\n'));

// Filter graph: trim each segment (picture + audio), concat, then build the vertical layout.
const parts = [];
cfg.segments.forEach((seg, i) => {
  const fx = seg.fx ?? 0.5;
  const x = Math.round(Math.max(0, Math.min(1920 - crop.w, 1920 * fx - crop.w / 2))); // source is 1920 wide
  parts.push(`[0:v]trim=${seg.in}:${seg.out},setpts=PTS-STARTPTS,crop=${crop.w}:${crop.h}:${x}:${crop.y}[v${i}]`);
  const d = seg.out - seg.in;
  parts.push(`[0:a]atrim=${seg.in}:${seg.out},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st=${(d - 0.03).toFixed(3)}:d=0.03[a${i}]`);
});
const n = cfg.segments.length;
parts.push(`${cfg.segments.map((_, i) => `[v${i}][a${i}]`).join('')}concat=n=${n}:v=1:a=1[cv][ca]`);
parts.push(`[cv]split[fgsrc][bgsrc]`);
parts.push(`[bgsrc]scale=-2:${H},crop=${W}:${H},gblur=sigma=40,eq=brightness=-0.22[bg]`);
parts.push(`[fgsrc]scale=${W}:${fgH}[fg]`);
let last = '[bg][fg]';
parts.push(`${last}overlay=0:${fgY}[l1]`);
last = '[l1]';
let inputs = ['-i', cfg.src];
if (cfg.logo) {
  const {file, h = 150, y = 170} = cfg.logo;
  inputs.push('-i', file);
  parts.push(`[1:v]scale=-2:${h}[logo]`);
  parts.push(`${last}[logo]overlay=(W-w)/2:${y}[l2]`);
  last = '[l2]';
}
const esc = (p) => p.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'");
parts.push(`${last}ass='${esc(assFile)}':fontsdir='${esc(fontsDir)}',format=yuv420p[out]`);

fs.mkdirSync(path.dirname(cfg.out), {recursive: true});
execFileSync(ffmpeg, [
  '-hide_banner', '-loglevel', 'error', '-y', ...inputs,
  '-filter_complex', parts.join(';'), '-map', '[out]', '-map', '[ca]',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-r', '24', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', cfg.out,
], {stdio: 'inherit'});
fs.rmSync(fontsDir, {recursive: true, force: true});
console.log(`${cfg.out}  (${total.toFixed(1)}s, ${events.length} captions)`);
