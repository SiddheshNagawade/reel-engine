// Clip renderer for Whop-style clipping: 16:9 source → 9:16 post, ORIGINAL picture + audio (no grade, no film look).
// Fan-page layout (his pick, 2026-10-11: "the first format was perfect"): campaign logo on top, ONE short hook line
// under it, the clip (cropped above its burned-in subtitles) in the middle on a blurred copy of itself, subtitles below
// (read from the source with scripts/subocr.py). Little text, no ad-style banners.
//
//   node scripts/clip.mjs <clip.json> [--still <seconds> <out.png>]
// clip.json: {
//   src, out, subs?,                          // subs = subocr.py JSON ([{s,e,text}] in source seconds)
//   segments: [{in, out, fx?}],               // source seconds; fx = horizontal centre of the crop (0..1, default 0.5)
//   crop: {w: 1150, h: 810, y: 0}, fgY: 540,  // source pixels kept (exclude the burned subtitle band); y of the picture
//   logo?: {file, h: 130, y: 200},            // campaign logo, centred at the top
//   hook?: "bro's priorities were set at age 10",  // ONE short fan-voice line; *word* = accent colour
//   highlight?: ['HASAN', ...],               // subtitle words drawn in the accent colour (use sparingly)
//   look?: 'comic' | 'gothic' | 'marker' | {...}   // fonts/sizes, see LOOKS
//   accent?: '#FFE14D'
// }
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import ffmpeg from 'ffmpeg-static';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const FONTS = path.join(ROOT, 'public/assets/library/fonts');
// Font family names are the ones INSIDE the files (fontsource files can be odd: "Montserrat Thin Black").
const LOOKS = {
  comic: {hookFont: 'Bangers', hookSize: 96, hookCase: 'none', hookSpacing: 2, capFont: 'Montserrat Thin Black', capSize: 58},
  gothic: {hookFont: 'Dela Gothic One', hookSize: 70, hookCase: 'lower', hookSpacing: 0, capFont: 'Poppins ExtraBold', capSize: 68},
  marker: {hookFont: 'Permanent Marker', hookSize: 78, hookCase: 'lower', hookSpacing: 0, capFont: 'Poppins ExtraBold', capSize: 60},
};

const args = process.argv.slice(2);
const cfg = JSON.parse(fs.readFileSync(args[0], 'utf8'));
const still = args.includes('--still') ? {t: +args[args.indexOf('--still') + 1], out: args[args.indexOf('--still') + 2]} : null;
const look = {...LOOKS.comic, ...(typeof cfg.look === 'string' ? LOOKS[cfg.look] : cfg.look)};
const W = 1080, H = 1920, SRC_W = 1920;
const crop = {w: 1150, h: 810, y: 0, ...cfg.crop};
const fgY = cfg.fgY ?? 540;
const fgH = Math.round((W / crop.w) * crop.h);
const capY = fgY + fgH + 36;
const accent = cfg.accent ?? '#FFE14D';

// ASS colours are &HBBGGRR
const assColour = (hex) => `&H00${hex.slice(5, 7)}${hex.slice(3, 5)}${hex.slice(1, 3)}`.toUpperCase();
const ACC = assColour(accent), WHITE = '&H00FFFFFF';
const ts = (t) => {
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = (t % 60).toFixed(2).padStart(5, '0');
  return `${h}:${String(m).padStart(2, '0')}:${s}`;
};
const marked = (text) => text.replace(/\*([^*]+)\*/g, `{\\c${ACC}}$1{\\c${WHITE}}`);
const cased = (t, c) => (c === 'lower' ? t.toLowerCase() : c === 'upper' ? t.toUpperCase() : t);

// Map source-time subtitle lines onto the output timeline.
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
for (const f of fs.readdirSync(FONTS).filter((f) => f.endsWith('.ttf'))) fs.copyFileSync(path.join(FONTS, f), path.join(fontsDir, f));

const hl = new Set((cfg.highlight ?? []).map((w) => w.toUpperCase()));
const lines = [
  '[Script Info]', 'ScriptType: v4.00+', `PlayResX: ${W}`, `PlayResY: ${H}`, 'WrapStyle: 0', '',
  '[V4+ Styles]',
  'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
  `Style: Hook,${look.hookFont},${look.hookSize},${WHITE},${WHITE},&H00000000,&H80000000,0,0,0,0,100,100,${look.hookSpacing},0,1,6,4,8,70,70,0,1`,
  `Style: Cap,${look.capFont},${look.capSize},${WHITE},${WHITE},&H00000000,&H90000000,0,0,0,0,100,100,0,0,1,6,3,8,80,80,0,1`,
  '', '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
];
const logo = cfg.logo ? {h: 130, y: 200, ...cfg.logo} : null;
if (cfg.hook) {
  const y = logo ? logo.y + logo.h + 28 : fgY - 180;
  lines.push(`Dialogue: 2,${ts(0)},${ts(total)},Hook,,0,0,0,,{\\pos(${W / 2},${y})\\an8}${marked(cased(cfg.hook, look.hookCase))}`);
}
for (const ev of events) {
  const text = ev.text
    .split(/\s+/)
    .map((w) => (hl.has(w.toUpperCase().replace(/[^A-Z0-9'/-]/g, '')) ? `{\\c${ACC}}${w}{\\c${WHITE}}` : w))
    .join(' ');
  // quick pop-in, no fade (reads instantly)
  lines.push(`Dialogue: 1,${ts(ev.s)},${ts(ev.e)},Cap,,0,0,0,,{\\pos(${W / 2},${capY})\\an8\\fscx85\\fscy85\\t(0,90,\\fscx103\\fscy103)\\t(90,160,\\fscx100\\fscy100)}${text}`);
}
const assFile = path.join(fontsDir, 'clip.ass');
fs.writeFileSync(assFile, lines.join('\n'));

// Filter graph: trim each segment (picture + audio), concat, then build the vertical layout.
const parts = [];
cfg.segments.forEach((seg, i) => {
  const fx = seg.fx ?? 0.5;
  const x = Math.round(Math.max(0, Math.min(SRC_W - crop.w, SRC_W * fx - crop.w / 2)));
  parts.push(`[0:v]trim=${seg.in}:${seg.out},setpts=PTS-STARTPTS,crop=${crop.w}:${crop.h}:${x}:${crop.y}[v${i}]`);
  const d = seg.out - seg.in;
  parts.push(`[0:a]atrim=${seg.in}:${seg.out},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st=${(d - 0.03).toFixed(3)}:d=0.03[a${i}]`);
});
const n = cfg.segments.length;
parts.push(`${cfg.segments.map((_, i) => `[v${i}][a${i}]`).join('')}concat=n=${n}:v=1:a=1[cv][ca]`);
parts.push(`[cv]split[fgsrc][bgsrc]`);
parts.push(`[bgsrc]scale=-2:${H},crop=${W}:${H},gblur=sigma=40,eq=brightness=-0.25[bg]`);
parts.push(`[fgsrc]scale=${W}:${fgH}[fg]`);
parts.push(`[bg][fg]overlay=0:${fgY}[l1]`);
let last = '[l1]';
const inputs = ['-i', cfg.src];
if (logo) {
  inputs.push('-i', logo.file);
  parts.push(`[1:v]scale=-2:${logo.h}[logo]`);
  parts.push(`${last}[logo]overlay=(W-w)/2:${logo.y}[l2]`);
  last = '[l2]';
}
const esc = (p) => p.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'");
parts.push(`${last}ass='${esc(assFile)}':fontsdir='${esc(fontsDir)}',format=yuv420p[out]`);
if (still) parts.push('[ca]anullsink');

const outFile = still ? still.out : cfg.out;
fs.mkdirSync(path.dirname(outFile), {recursive: true});
const enc = still
  ? ['-map', '[out]', '-ss', String(still.t), '-frames:v', '1', outFile]
  : ['-map', '[out]', '-map', '[ca]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-r', '24', '-pix_fmt', 'yuv420p',
     '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', outFile];
execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...inputs, '-filter_complex', parts.join(';'), ...enc], {stdio: 'inherit'});
fs.rmSync(fontsDir, {recursive: true, force: true});
console.log(`${outFile}  (${total.toFixed(1)}s, ${events.length} subtitles)`);
