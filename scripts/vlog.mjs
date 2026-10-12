// Long-form vlog (YouTube 16:9): many phone clips + photos → one story-paced video with music, sound design,
// subtitles and motion graphics. The edit lives in _work/<name>/vlog.json (Claude writes it after watching contact
// sheets + transcripts). Playbook: brain/vlog.md.
//
//   node scripts/vlog.mjs <name> [--note "- what changed"] [--only id1,id2 --preview]   (preview = low-res, stills check)
//
// vlog.json
// {
//   "srcDir": "/Volumes/T7 Shield/ReelEngine/inbox/<folder>", "photoDir": "<_work/<name>/photos>",
//   "size": [1920, 1080], "fps": 30,
//   "look": {"contrast": 1.03, "vibrance": 0.12, "grain": 4, "vignette": 0.3},   // one light shared look on top
//   "segments": [{
//     "id": "shave-ask",                      // unique; subs/music/sfx can point at it
//     "layout": "full" | "card" | "split" | "photo" | "photos" | "graphic",
//     // full  = clip fills 16:9 (landscape footage, or portrait footage that was filmed sideways → rotate)
//     // card  = portrait clip as a rounded card on a blurred, darker copy of itself (cx moves it sideways: 0..1)
//     // split = 2–3 clips/photos side by side as cards (same moment from several phones/angles, or a mini montage)
//     // photo = one still with a slow push (portrait stills become a card)
//     // photos / graphic = drawn by Remotion (photo wall, title, map, chapter card): see "gfx"
//     "src": "IMG_1.MOV", "in": 3.2, "out": 9.0,  // source range (s)
//     "dur": 4 | "speed": 8,                      // output length or speed (time-lapse); default speed 1
//     "rotate": 90 | 180 | 270,                   // phone held sideways/upside down (after the file's own rotation)
//     "fx": 0.5, "fy": 0.45,                      // focus point for the crop
//     "zoom": 1, "toZoom": 1.08,                  // slow push / pull over the segment (eased)
//     "audio": 1,                                 // natural sound volume (0 = silent); speech segments stay at 1
//     "clips": [{src, in, out, rotate, fx, fy, photo}], "audioFrom": 0,   // split
//     "cx": 0.5,                                  // card centre (0..1 of width)
//     "stabilize": 12,                            // handheld shake → vidstab (value = smoothing)
//     "hold": 0.6,                                // freeze the last frame (seconds)
//     "jumps": [[a,b],…], "rampTo", "jcut", "lcut", "transition", "smash"   // cut styles: scripts/lib/vlog-cuts.mjs
//     "gfx": [{type, at, dur, ...}],              // Remotion layers drawn over this segment (src/vlog/*)
//     "subs": [{"s": 4.1, "e": 6.0, "t": "line"}] // subtitles, SOURCE time of src (in..out), Hinglish
//   }],
//   "music": [{"file": "Library/music/<id>/x.mp3", "from": "seg-id", "to": "seg-id", "offset": 0, "volume": 0.16,
//             "fadeIn": 1, "fadeOut": 1.5}],   // ducked automatically under speech
//   "sfx": [{"id": "whoosh-short-03", "at": "seg-id", "t": 0, "volume": 0.5}]   // Library/sounds/<id>/sound.mp3
// }
// Output: <drive>/output/<name>/<name>-vN.mp4 + CHANGELOG.md + vlog copy. Versions never overwrite. No fade at the end, ever.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import crypto from 'node:crypto';
import ffmpegPath from 'ffmpeg-static';
import {outputRoot, workRoot, libraryRoot} from './lib/paths.mjs';
import {TONEMAP} from './lib/media.mjs';
import {requirePlan} from './lib/editplan.mjs';
import {expandSegments} from './lib/vlog-cuts.mjs';

const args = process.argv.slice(2);
const opt = (f, d) => (args.includes(f) ? args[args.indexOf(f) + 1] : d);
const name = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!name) {
  console.error('Usage: node scripts/vlog.mjs <name> [--note "..."] [--only id1,id2] [--preview]');
  process.exit(1);
}
const PREVIEW = args.includes('--preview');
const ONLY = opt('--only', '') ? new Set(opt('--only', '').split(',')) : null;
const work = path.join(workRoot(), name);
const EDIT = opt('--edit', 'vlog.json');                  // e.g. vlog-long.json: another cut of the same footage
const OUTNAME = opt('--out', name);                       // e.g. chandigarh-long
const V = JSON.parse(fs.readFileSync(path.join(work, EDIT), 'utf8'));
// Previews (stills checks while planning) may run any time; a real version needs every pass decided.
const PLAN_NOTE = PREVIEW || args.includes('--pieces-only') ? '' : requirePlan(work, name, args, 'vlog');
const [W, H] = PREVIEW ? [960, 540] : (V.size ?? [1920, 1080]);
const FPS = V.fps ?? 30;
const S = W / 1920; // layout scale

const ff = (a) => {
  const r = spawnSync(ffmpegPath, ['-hide_banner', '-loglevel', 'error', '-y', ...a], {encoding: 'utf8', maxBuffer: 1 << 26});
  if (r.status !== 0) throw new Error((r.stderr || '').slice(-3000) || `ffmpeg failed: ${a.join(' ')}`);
};
const ffInfo = (file) => String(spawnSync(ffmpegPath, ['-hide_banner', '-i', file], {encoding: 'utf8'}).stderr);
const ROT = {90: 'transpose=1,', 270: 'transpose=2,', [-90]: 'transpose=2,', 180: 'hflip,vflip,'};
const even = (x) => Math.round(x / 2) * 2;
// Hardware H.264 (Apple VideoToolbox): visually transparent at these bitrates and several times faster than x264.
const ENC_V = ['-c:v', 'h264_videotoolbox', '-b:v', PREVIEW ? '5M' : '26M', '-maxrate', PREVIEW ? '8M' : '34M', '-profile:v', 'high', '-allow_sw', '1',
  '-pix_fmt', 'yuv420p', '-r', String(FPS), '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv'];
const ENC_A = ['-c:a', 'pcm_s16le', '-ar', '48000', '-ac', '2'];

const srcPath = (f) => (path.isAbsolute(f) ? f : path.join(V.srcDir, f));
const photoPath = (f) => (path.isAbsolute(f) ? f : path.join(V.photoDir ?? path.join(work, 'photos'), f));
const infoCache = {};
function info(file) {
  if (infoCache[file]) return infoCache[file];
  const e = ffInfo(file);
  const v = /Video:.*?(\d{2,5})x(\d{2,5})/.exec(e);
  const rot = /rotation of (-?[\d.]+)/.exec(e);
  let [w, h] = v ? [+v[1], +v[2]] : [0, 0];
  if (rot && Math.abs(Math.round(+rot[1])) % 180 === 90) [w, h] = [h, w]; // what ffmpeg delivers after autorotate
  return (infoCache[file] = {w, h, hdr: /arib-std-b67|smpte2084/.test(e), audio: /Audio:/.test(e)});
}
// Size of the clip after our own extra rotation
function dims(file, rotate = 0) {
  const i = info(file);
  return Math.abs(rotate) % 180 === 90 ? [i.h, i.w] : [i.w, i.h];
}

// Rounded-rect alpha mask (cached per size)
const masks = {};
function mask(w, h, r, dir) {
  const k = `${w}x${h}r${r}`;
  if (masks[k]) return masks[k];
  const f = path.join(dir, `mask-${k}.png`);
  ff(['-f', 'lavfi', '-i', `color=black:s=${w}x${h}`, '-frames:v', '1', '-vf',
    `format=gray,geq=lum='if(gt(abs(X-W/2),W/2-${r})*gt(abs(Y-H/2),H/2-${r}),if(lte(hypot(abs(X-W/2)-(W/2-${r}),abs(Y-H/2)-(H/2-${r})),${r}),255,0),255)'`, f]);
  return (masks[k] = f);
}

// Source → timed, colour-converted, rotated stream (no scaling yet)
function clipChain(c, speed) {
  const file = srcPath(c.src);
  const hdr = info(file).hdr;
  return `${PREVIEW ? 'scale=trunc(iw/4)*2:trunc(ih/4)*2,' : ''}${hdr ? TONEMAP : ''}${ROT[c.rotate ?? 0] ?? ''}setpts=(PTS-STARTPTS)/${speed},fps=${FPS}`;
}
// cover-crop a stream of size (sw, sh) to (w, h) around focus fx/fy (zoom ≥ 1 punches in)
function cover(sw, sh, w, h, fx = 0.5, fy = 0.5, zoom = 1) {
  const k = Math.max(w / sw, h / sh) * zoom;
  const tw = even(sw * k), th = even(sh * k);
  const x = Math.round(Math.max(0, Math.min(tw - w, tw * fx - w / 2)));
  const y = Math.round(Math.max(0, Math.min(th - h, th * fy - h / 2)));
  return `scale=${tw}:${th}:flags=lanczos,crop=${w}:${h}:${x}:${y}`;
}
// eased push/pull on a finished WxH frame (zoompan on 2× so it stays smooth)
function pushChain(z0, z1, total, zx = 0.5, zy = 0.5, linear = false) {
  if (z0 === z1) return '';
  const lin = `min(1,on/${Math.max(1, Math.round(total * FPS))})`;
  // linear for the parts of a speed ramp: the ease is spread over the whole ramp, not repeated per part
  const k = linear ? lin : `(${lin})*(${lin})*(3-2*(${lin}))`;
  return `,scale=${W * 2}:${H * 2}:flags=bicubic,zoompan=z='${z0}+(${z1 - z0})*${k}'` +
    `:x='max(0,min(iw-iw/zoom,iw*${zx}-iw/zoom/2))':y='max(0,min(ih-ih/zoom,ih*${zy}-ih/zoom/2))':d=1:s=${W}x${H}:fps=${FPS}`;
}
const BG = (sw, sh) => `${cover(sw, sh, W, H)},boxblur=${Math.round(28 * S)}:2,eq=brightness=-0.13:saturation=0.75`;
// slide-up + fade entrance for a card (delay d)
const enterY = (y, d) => `'${y}+${Math.round(70 * S)}*pow(1-min(1,max(0,(t-${d})/0.5)),3)'`;

function segTiming(s) {
  const span = (s.out ?? 0) - (s.in ?? 0);
  const speed = s.speed ?? (s.dur && span ? span / s.dur : 1);
  const moving = s.dur ?? span / speed;
  return {span, speed, moving, total: moving + (s.hold ?? 0)};
}

// Build one segment → piece.mp4 (video WxH + PCM stereo audio)
function renderSegment(s, out, tmp) {
  const {span, speed, moving, total} = segTiming(s);
  const T = total.toFixed(3);
  const holdF = s.hold ? `,tpad=stop_mode=clone:stop_duration=${s.hold}` : '';
  const vol = s.audio ?? 0;
  const audioOf = (inputIdx, sp, mov) => (vol > 0 && sp <= 2.01
    ? `[${inputIdx}:a]atrim=0:${(mov * sp).toFixed(3)},asetpts=PTS-STARTPTS,${sp !== 1 ? `atempo=${sp},` : ''}volume=${vol},` +
      `afade=t=in:d=0.04,afade=t=out:st=${Math.max(0, mov - 0.05).toFixed(3)}:d=0.05,apad,atrim=0:${T}[a]`
    : null);
  const silent = ['-f', 'lavfi', '-t', T, '-i', 'anullsrc=r=48000:cl=stereo'];
  const layout = s.layout ?? 'full';
  let inputs = [], fc = '', aLabel = null, nIn = 0;
  const addClip = (c) => {
    const keyOnly = speed >= 40 ? ['-skip_frame', 'nokey'] : [];
    inputs.push(...keyOnly, '-ss', String(c.in), '-t', String(c.out - c.in), '-i', srcPath(c.src));
    return nIn++;
  };
  const addPhoto = (f) => {
    inputs.push('-loop', '1', '-framerate', String(FPS), '-t', T, '-i', photoPath(f));
    return nIn++;
  };

  if (layout === 'full' || layout === 'card') {
    const i = addClip(s);
    const [sw, sh] = dims(srcPath(s.src), s.rotate);
    let stab = '';
    if (s.stabilize) {
      const trf = path.join(tmp, `${s.id}.trf`);
      ff(['-ss', String(s.in), '-t', String(span), '-i', srcPath(s.src), '-vf', `${ROT[s.rotate ?? 0] ?? ''}vidstabdetect=shakiness=7:result=${trf}`, '-f', 'null', '-']);
      stab = `,vidstabtransform=input=${trf}:smoothing=${s.stabilize}:optzoom=1:interpol=bicubic`;
    }
    const base = `[${i}:v]${clipChain(s, speed)}${stab}${holdF}`;
    if (layout === 'full') {
      fc = `${base},${cover(sw, sh, W, H, s.fx, s.fy, s.crop ?? 1)}${pushChain(s.zoom ?? 1, s.toZoom ?? s.zoom ?? 1, total, s.zx, s.zy, s.linearZoom)},setsar=1,format=yuv420p[v]`;
    } else {
      const ch = even(H * (s.cardH ?? 0.9)), cw = even(ch * sw / sh), r = Math.round(26 * S);
      const x = Math.round(W * (s.cx ?? 0.5) - cw / 2), y = Math.round((H - ch) / 2);
      const m = mask(cw, ch, r, tmp);
      inputs.push('-loop', '1', '-i', m);
      const mi = nIn++;
      fc = `${base},split[s1][s2];[s1]${BG(sw, sh)},drawbox=x=${x + 10}:y=${y + 24}:w=${cw}:h=${ch}:color=black@0.55:t=fill,gblur=sigma=${Math.round(22 * S)}[bg];` +
        `[s2]${cover(sw, sh, cw, ch, s.fx, s.fy, s.crop ?? 1)},format=rgba[fg0];[${mi}:v]format=gray,scale=${cw}:${ch}[m];[fg0][m]alphamerge[fg];` +
        `[bg][fg]overlay=${x}:${y}:shortest=1${pushChain(s.zoom ?? 1, s.toZoom ?? s.zoom ?? 1, total, 0.5, 0.5, s.linearZoom)},setsar=1,format=yuv420p[v]`;
    }
    const af = audioOf(i, speed, moving);
    if (af) { fc += `;${af}`; aLabel = '[a]'; }
  } else if (layout === 'split') {
    const n = s.clips.length, gap = Math.round(36 * S);
    const ch = even(H * (s.cardH ?? 0.84));
    const sizes = s.clips.map((c) => (c.photo ? photoDims(c.photo, c.rotate) : dims(srcPath(c.src), c.rotate)));
    const ar = s.cardAspect ?? 9 / 16;
    const cw = even(Math.min(ch * ar, (W - gap * (n + 1)) / n));
    const ch2 = even(cw / ar);
    const totalW = n * cw + (n - 1) * gap, x0 = Math.round((W - totalW) / 2), y = Math.round((H - ch2) / 2);
    const r = Math.round(24 * S);
    const ids = s.clips.map((c) => (c.photo ? addPhoto(c.photo) : addClip(c)));
    inputs.push('-loop', '1', '-i', mask(cw, ch2, r, tmp));
    const mi = nIn++;
    const parts = [];
    s.clips.forEach((c, j) => {
      const sp = c.photo ? 1 : (c.out - c.in) / moving;
      const chain = c.photo ? `${ROT[c.rotate ?? 0] ?? ''}fps=${FPS},trim=duration=${T}` : `${clipChain(c, sp)}`;
      parts.push(`[${ids[j]}:v]${chain}${holdF},${j === 0 ? 'split[c0][bgsrc]' : `null[c${j}]`}`);
    });
    parts.push(`[bgsrc]${BG(...sizes[0])},` + s.clips.map((_, j) => `drawbox=x=${x0 + j * (cw + gap) + 8}:y=${y + 22}:w=${cw}:h=${ch2}:color=black@0.5:t=fill`).join(',') + `,gblur=sigma=${Math.round(20 * S)}[bg0]`);
    parts.push(`[${mi}:v]format=gray,split=${n}${s.clips.map((_, j) => `[m${j}]`).join('')}`);
    let cur = 'bg0';
    s.clips.forEach((c, j) => {
      const d = (s.stagger ?? 0.12) * j;
      parts.push(`[c${j}]${cover(...sizes[j], cw, ch2, c.fx, c.fy, c.zoom ?? 1)},format=rgba[f${j}];[f${j}][m${j}]alphamerge,fade=t=in:st=${d}:d=0.35:alpha=1[g${j}]`);
      parts.push(`[${cur}][g${j}]overlay=x=${x0 + j * (cw + gap)}:y=${s.enter === false ? y : enterY(y, d)}:eval=frame:eof_action=repeat[o${j}]`);
      cur = `o${j}`;
    });
    parts.push(`[${cur}]trim=duration=${T},setsar=1,format=yuv420p[v]`);
    fc = parts.join(';');
    const ai = s.audioFrom ?? 0, ac = s.clips[ai];
    if (ac && !ac.photo) {
      const af = audioOf(ids[ai], (ac.out - ac.in) / moving, moving);
      if (af) { fc += `;${af}`; aLabel = '[a]'; }
    }
  } else if (layout === 'photo') {
    const i = addPhoto(s.src);
    const [sw, sh] = photoDims(s.src, s.rotate);
    const z0 = s.zoom ?? 1, z1 = s.toZoom ?? 1.07;
    const rot = ROT[s.rotate ?? 0] ?? '';
    if (sw >= sh) {
      fc = `[${i}:v]${rot}${cover(sw, sh, W, H, s.fx, s.fy)},fps=${FPS}${pushChain(z0, z1, total, s.zx, s.zy)},trim=duration=${T},setsar=1,format=yuv420p[v]`;
    } else {
      const ch = even(H * 0.88), cw = even(ch * sw / sh), r = Math.round(22 * S);
      const x = Math.round(W * (s.cx ?? 0.5) - cw / 2), y = Math.round((H - ch) / 2);
      inputs.push('-loop', '1', '-i', mask(cw, ch, r, tmp));
      const mi = nIn++;
      fc = `[${i}:v]${rot}fps=${FPS},split[s1][s2];[s1]${BG(sw, sh)},drawbox=x=${x + 10}:y=${y + 24}:w=${cw}:h=${ch}:color=black@0.55:t=fill,gblur=sigma=${Math.round(22 * S)}[bg];` +
        `[s2]scale=${cw}:${ch},format=rgba[fg0];[${mi}:v]format=gray,scale=${cw}:${ch}[m];[fg0][m]alphamerge[fg];[bg][fg]overlay=${x}:${y}${pushChain(z0, z1, total)},trim=duration=${T},setsar=1,format=yuv420p[v]`;
    }
  } else if (layout === 'photos' || layout === 'graphic') {
    // plain stage; Remotion draws everything on top (gfx)
    inputs.push('-f', 'lavfi', '-t', T, '-i', `color=c=${s.stage ?? '0x111214'}:s=${W}x${H}:r=${FPS}`);
    fc = `[${nIn++}:v]format=yuv420p[v]`;
  } else throw new Error(`unknown layout ${layout} (${s.id})`);

  if (!aLabel) { inputs.push(...silent); fc += `;[${nIn++}:a]anull[a]`; }
  ff([...inputs, '-filter_complex', fc, '-map', '[v]', '-map', '[a]', '-t', T, ...ENC_V, ...ENC_A, out]);
  if (s.censor?.length) censorPiece(out, s.censor, tmp);
  return total;
}

// Mosaic ("Japanese blur") that follows hand-placed keyframes: censor: [{keys: [[t, x, y, w, h], ...], block?: 18}]
// t = piece seconds, box = fractions of the frame (top-left). Box size is the largest of the keys (generous on
// purpose); its position is interpolated per frame, so it tracks the spot.
function censorPiece(file, list, tmp) {
  const lin = (keys, i) => {
    let e = `${keys[keys.length - 1][i]}`;
    for (let k = keys.length - 2; k >= 0; k--) {
      const [t0, t1, a, b] = [keys[k][0], keys[k + 1][0], keys[k][i], keys[k + 1][i]];
      e = `if(lt(t,${t1}),${a}+(${b - a})*(t-${t0})/${Math.max(0.001, t1 - t0)},${e})`;
    }
    return `if(lt(t,${keys[0][0]}),${keys[0][i]},${e})`;
  };
  const parts = [], labels = [];
  let cur = '0:v';
  list.forEach((c, j) => {
    const keys = c.keys;
    const bw = even(Math.max(...keys.map((k) => k[3])) * W), bh = even(Math.max(...keys.map((k) => k[4])) * H);
    const blk = Math.max(4, Math.round((c.block ?? 22) * S));
    // centre of the box follows the keys; keep the fixed-size box inside the frame
    const cx = (t) => `(${lin(keys, 1)}+${lin(keys, 3)}/2)`;
    const cy = () => `(${lin(keys, 2)}+${lin(keys, 4)}/2)`;
    const X = `max(0,min(${W - bw},${cx()}*${W}-${bw / 2}))`, Y = `max(0,min(${H - bh},${cy()}*${H}-${bh / 2}))`;
    const on = `between(t,${keys[0][0]},${keys[keys.length - 1][0]})`;
    parts.push(`[${cur}]split[b${j}][s${j}]`);
    parts.push(`[s${j}]crop=w=${bw}:h=${bh}:x='${X}':y='${Y}',scale=${Math.max(2, Math.round(bw / blk))}:${Math.max(2, Math.round(bh / blk))}:flags=area,scale=${bw}:${bh}:flags=neighbor[p${j}]`);
    parts.push(`[b${j}][p${j}]overlay=x='${X}':y='${Y}':enable='${on}':eval=frame[c${j}]`);
    cur = `c${j}`;
  });
  const tmpOut = path.join(tmp, `censor-${path.basename(file)}`);
  ff(['-i', file, '-filter_complex', parts.join(';'), '-map', `[${cur}]`, '-map', '0:a', ...ENC_V, '-c:a', 'copy', tmpOut]);
  fs.copyFileSync(tmpOut, file); // tmp is on the Mac, pieces on the T7 (rename fails across disks)
  fs.rmSync(tmpOut, {force: true});
}
function photoDims(f, rotate = 0) {
  const i = info(photoPath(f));
  return Math.abs(rotate) % 180 === 90 ? [i.h, i.w] : [i.w, i.h];
}

// ---------- run ----------
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vlog-'));
const pieces = path.join(work, PREVIEW ? 'pieces-preview' : 'pieces');
fs.mkdirSync(pieces, {recursive: true});
const segs = expandSegments(V.segments.filter((s) => !s.skip)); // jump cuts / ramps → plain parts
const only = (s) => !ONLY || ONLY.has(s.id) || ONLY.has(s.parent);
const timeline = []; // {id, start, total, seg}
let clock = 0;
try {
  for (const [k, s] of segs.entries()) {
    const sig = JSON.stringify({s: {...s, gfx: undefined, chapter: undefined, jcut: undefined, lcut: undefined, transition: undefined, smash: undefined, parent: undefined}, W, enc: 2});
    const out = path.join(pieces, `${s.id}-${crypto.createHash('md5').update(sig).digest('hex').slice(0, 10)}.mov`);
    const sigFile = out + '.sig';
    let total;
    if (!only(s)) {
      total = segTiming(s).total;
    } else if (fs.existsSync(out) && fs.existsSync(sigFile) && fs.readFileSync(sigFile, 'utf8') === sig) {
      total = segTiming(s).total; // unchanged since last render: reuse
    } else {
      total = renderSegment(s, out, tmp);
      fs.writeFileSync(sigFile, sig);
      console.log(`  ${String(k + 1).padStart(3)}. ${clock.toFixed(1).padStart(6)}s  ${s.id.padEnd(22)} ${(s.layout ?? 'full').padEnd(6)} ${total.toFixed(2)}s`);
    }
    // a dissolve INTO this segment overlaps the previous one by d seconds
    const overlap = k > 0 && s.transition?.d ? s.transition.d : 0;
    timeline.push({id: s.id, start: clock - overlap, total, seg: s, file: out});
    clock += total - overlap;
  }
  fs.writeFileSync(path.join(work, `${OUTNAME}${PREVIEW ? '-preview' : ''}.timeline.json`),
    JSON.stringify(timeline.map(({seg, ...t}) => t), null, 1));
  console.log(`\n  ${timeline.length} pieces, ${(clock / 60).toFixed(2)} min`);
  if (args.includes('--pieces-only')) process.exit(0);

  // MrBeast captions (from subs), placed off faces; then the Remotion graphics pass on pieces that have layers
  for (const t of timeline) t.layers = [...(t.seg.gfx ?? []), ...(V.captions === 'plain' ? [] : captionLayers(t))];
  const withGfx = timeline.filter((t) => t.layers.length && only(t.seg));
  if (withGfx.length) {
    const {renderGfx} = await import('./lib/vlog-gfx.mjs');
    await renderGfx(withGfx, {W, H, FPS, work, preview: PREVIEW, photoPath});
  }
  if (ONLY) process.exit(0);

  // join video + natural sound
  const list = path.join(tmp, 'list.txt');
  // dissolves / dips: the two pieces are blended over the overlap (picture xfade + sound crossfade)
  const joins = [];
  for (const t of timeline) {
    const f = t.gfxFile ?? t.file;
    const tr = t.seg.transition;
    if (tr?.d && joins.length) {
      const prev = joins.pop();
      const xf = path.join(tmp, `xf-${joins.length}-${t.id.replace(/[^\w-]/g, '_')}.mov`);
      const type = {dissolve: 'fade', white: 'fadewhite', black: 'fadeblack'}[tr.type ?? 'dissolve'] ?? tr.type;
      ff(['-i', prev.file, '-i', f, '-filter_complex',
        `[0:v][1:v]xfade=transition=${type}:duration=${tr.d}:offset=${(prev.dur - tr.d).toFixed(3)},format=yuv420p[v];[0:a][1:a]acrossfade=d=${tr.d}[a]`,
        '-map', '[v]', '-map', '[a]', ...ENC_V, ...ENC_A, xf]);
      joins.push({file: xf, dur: prev.dur + t.total - tr.d});
    } else joins.push({file: f, dur: t.total});
  }
  fs.writeFileSync(list, joins.map((j) => `file '${j.file.replace(/'/g, "'\\''")}'`).join('\n'));
  const joined = path.join(tmp, 'joined.mov');
  ff(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', joined]);

  // ---- audio: natural sound (levelled) + music (ducked under speech) + sfx ----
  // a segment cut into parts (jump cuts, ramps) is still addressed by its own id: t counts across its parts
  const partsOf = (ref) => timeline.filter((x) => x.id === ref || x.seg.parent === ref);
  const at = (ref, t = 0) => {
    const ps = partsOf(ref);
    if (!ps.length) throw new Error(`unknown segment id "${ref}"`);
    let rest = t;
    for (const p of ps) { if (rest < p.total || p === ps[ps.length - 1]) return p.start + rest; rest -= p.total; }
  };
  const endOf = (ref) => { const ps = partsOf(ref); const s = ps[ps.length - 1]; return s.start + s.total; };
  const aIn = ['-i', joined];
  const chains = [];
  let n = 1;
  // J-cut: the next scene's sound starts early, under the end of the current picture. L-cut: a scene's sound runs on
  // under the next picture. The sound already in the joined pieces fades out/in across the same window.
  const env = [], jl = [];
  timeline.forEach((t, k) => {
    const s = t.seg, sp = segTiming(s).speed;
    const ok = (x) => x && x.src && (x.layout ?? 'full') !== 'split' && segTiming(x).speed === 1 && (x.audio ?? 0) > 0 && !x.transition;
    if (s.jcut && k > 0 && ok(s) && (s.in ?? 0) >= s.jcut) {
      const d = s.jcut, a = t.start - d;
      aIn.push('-ss', String((s.in ?? 0) - d), '-t', String(d), '-i', srcPath(s.src));
      chains.push(`[${n}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=${s.audio},afade=t=in:d=${(d * 0.6).toFixed(3)},adelay=${Math.round(a * 1000)}:all=1[jl${n}]`);
      jl.push(`[jl${n}]`); n++;
      env.push(`if(between(t,${a.toFixed(3)},${t.start.toFixed(3)}),(${t.start.toFixed(3)}-t)/${d},1)`);
    }
    const next = timeline[k + 1];
    if (s.lcut && next && ok(s) && !s.hold && !next.seg.transition && sp === 1) {
      const d = s.lcut, b = t.start + t.total;
      aIn.push('-ss', String(s.out), '-t', String(d), '-i', srcPath(s.src));
      chains.push(`[${n}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=${s.audio},afade=t=out:st=${(d * 0.4).toFixed(3)}:d=${(d * 0.6).toFixed(3)},adelay=${Math.round(b * 1000)}:all=1[jl${n}]`);
      jl.push(`[jl${n}]`); n++;
      env.push(`if(between(t,${b.toFixed(3)},${(b + d).toFixed(3)}),(t-${b.toFixed(3)})/${d},1)`);
    }
  });
  const envExpr = env.length ? `volume=eval=frame:volume='${env.join('*')}',` : '';
  chains.push(`[0:a]${envExpr}anull[n0]`);
  chains.push(`[n0]${jl.join('')}${jl.length ? `amix=inputs=${jl.length + 1}:normalize=0:duration=first,` : ''}highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=5:release=120,loudnorm=I=-16:TP=-2:LRA=9,asplit=2[nat][key]`);
  const mixes = ['[nat]'];
  for (const [j, m] of (V.music ?? []).entries()) {
    const file = path.join(libraryRoot(), '..', m.file.startsWith('Library') ? m.file : path.join('Library', m.file));
    const t0 = at(m.from, m.t ?? 0), t1 = m.to ? endOf(m.to) + (m.toT ?? 0) : clock;
    const d = t1 - t0, fi = m.fadeIn ?? 0.8, fo = m.fadeOut ?? 1.2;
    aIn.push('-stream_loop', '-1', '-ss', String(m.offset ?? 0), '-i', file);
    chains.push(`[${n}:a]atrim=0:${d.toFixed(3)},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo,volume=${m.volume ?? 0.16},` +
      `afade=t=in:d=${fi},afade=t=out:st=${Math.max(0, d - fo).toFixed(3)}:d=${fo},adelay=${Math.round(t0 * 1000)}:all=1[mu${j}]`);
    mixes.push(`[mu${j}]`);
    n++;
  }
  // Expression / meme sounds get their own moment: the music dips (to ~18 %) from just before each one until it ends,
  // with soft ramps. Animation sounds (pop, whoosh, click, paper, camera) simply play over the music.
  const ANIM = /^(pop|cute-menu|whoosh|cine-whoosh|click|paper|camera)/;
  const dips = [];
  for (const x of V.sfx ?? []) {
    if (ANIM.test(x.id) || x.duck === false) continue;
    const dir = path.join(libraryRoot(), x.sticker ? 'stickers' : 'sounds', x.sticker ?? x.id);
    const file = ['sound.mp3', 'sound.wav'].map((f) => path.join(dir, f)).find((f) => fs.existsSync(f));
    if (!file) continue;
    const d = /Duration: (\d+):(\d+):([\d.]+)/.exec(ffInfo(file));
    const len = Math.min(x.trim ?? 99, d ? +d[1] * 3600 + +d[2] * 60 + +d[3] : 1.5, 3.0);
    const t0 = at(x.at, x.t ?? 0);
    dips.push([t0 - 0.3, t0 + len]);
  }
  const dipExpr = dips.length
    ? `volume=eval=frame:volume='1-0.82*max(0,${dips.map(([a, b]) => `min(clip((t-${a.toFixed(2)})/0.25,0,1),clip((${(b + 0.35).toFixed(2)}-t)/0.35,0,1))`).reduce((acc, e) => `max(${acc},${e})`)})'`
    : 'anull';
  // smash cut: music drops to nothing for a moment at that cut (loud → silent contrast)
  const smashes = timeline.filter((t) => t.seg.smash).map((t) => [t.start, t.start + t.seg.smash]);
  const smashExpr = smashes.length ? `,volume=eval=frame:volume='${smashes.map(([a, b]) => `(1-between(t,${a.toFixed(3)},${b.toFixed(3)}))`).join('*')}'` : '';
  let musicBus = null;
  if ((V.music ?? []).length) {
    chains.push(`${mixes.slice(1).join('')}amix=inputs=${mixes.length - 1}:normalize=0,apad[mus];[mus][key]sidechaincompress=threshold=0.03:ratio=8:attack=40:release=500:makeup=1,${dipExpr}${smashExpr}[musd]`);
    musicBus = '[musd]';
  } else chains.push('[key]anullsink');
  const sfxLabels = [];
  for (const [j, x] of (V.sfx ?? []).entries()) {
    const dir = path.join(libraryRoot(), x.sticker ? 'stickers' : 'sounds', x.sticker ?? x.id);
    const file = ['sound.mp3', 'sound.wav'].map((f) => path.join(dir, f)).find((f) => fs.existsSync(f)) ?? path.join(dir, 'sound.mp3');
    if (!fs.existsSync(file)) { console.log(`  ⚠️ sfx ${x.id} not found, skipped`); continue; }
    aIn.push('-i', file);
    chains.push(`[${n}:a]aformat=sample_rates=48000:channel_layouts=stereo,${x.trim ? `atrim=0:${x.trim},` : ''}loudnorm=I=-20,volume=${x.volume ?? 0.5},adelay=${Math.round(at(x.at, x.t ?? 0) * 1000)}:all=1[fx${j}]`);
    sfxLabels.push(`[fx${j}]`);
    n++;
  }
  const allIn = ['[nat]', ...(musicBus ? [musicBus] : []), ...sfxLabels];
  chains.push(`${allIn.join('')}amix=inputs=${allIn.length}:normalize=0:duration=first,alimiter=limit=0.95[aout]`);

  // look + subtitles
  const L = V.look ?? {};
  const look = [
    L.contrast || L.gamma ? `eq=contrast=${L.contrast ?? 1}:gamma=${L.gamma ?? 1}` : '',
    L.vibrance ? `vibrance=intensity=${L.vibrance}` : '',
    L.vignette ? `vignette=angle=${L.vignette}` : '',
    L.grain ? `noise=alls=${L.grain}:allf=t` : '',
  ].filter(Boolean);
  const ass = V.captions === 'plain' ? writeSubs(timeline, path.join(tmp, 'subs.ass')) : null;
  if (ass) look.push(`subtitles=${ass.replace(/[:\\']/g, (c) => '\\' + c)}:fontsdir=${path.resolve('public/assets/library/fonts').replace(/[:\\']/g, (c) => '\\' + c)}`);
  const outDir = path.join(outputRoot(), name);
  const name_ = OUTNAME;
  fs.mkdirSync(outDir, {recursive: true});
  let v = 1;
  while (fs.existsSync(path.join(outDir, `${name_}-v${v}${PREVIEW ? '-preview' : ''}.mp4`))) v++;
  const final = path.join(outDir, `${name_}-v${v}${PREVIEW ? '-preview' : ''}.mp4`);
  // (the music bus is padded with silence: when the last music cue ended before the voice, the sidechain stopped
  // reading the voice copy and the whole graph deadlocked: two overnight renders froze at ~91 % this way.)
  // Audio and video in two passes: one graph with ~130 delayed audio inputs + the video once deadlocked near the end
  // of a 21-min render (4 h frozen, no error). Audio alone is fast; then the video pass just muxes the finished mix.
  const mix = path.join(tmp, 'mix.wav');
  ff([...aIn, '-filter_complex', chains.join(';'), '-map', '[aout]', '-c:a', 'pcm_s16le', '-ar', '48000', '-t', clock.toFixed(3), mix]);
  ff(['-i', joined, '-i', mix, '-filter_complex', `[0:v]${look.length ? look.join(',') : 'null'}[vout]`,
    '-map', '[vout]', '-map', '1:a', ...ENC_V, '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-movflags', '+faststart', '-t', clock.toFixed(3), final]);
  console.log(`\n✅ ${final} (${(clock / 60).toFixed(2)} min)`);
  if (!PREVIEW) {
    const note = opt('--note', V.changeNote ?? '');
    fs.appendFileSync(path.join(outDir, 'CHANGELOG.md'), `\n## ${name_} v${v} (${new Date().toISOString().slice(0, 10)}): ${(clock / 60).toFixed(2)} min\n${note}${PLAN_NOTE ? `\n${PLAN_NOTE}` : ''}\n`);
    fs.copyFileSync(path.join(work, EDIT), path.join(outDir, `${name_}-v${v}.vlog.json`));
    fs.writeFileSync(path.join(outDir, `${name_}-v${v}.chapters.txt`), chapters(timeline));
  }
} finally {
  fs.rmSync(tmp, {recursive: true, force: true});
}

// ---------- MrBeast captions ----------
// Sub lines (source time) → 2–3 word chunks, words timed by length, *word* = yellow, ^word^ = green, !word! = red.
// Each chunk goes to the first spot (bottom, top, beside the card) that doesn't cover a face (Apple Vision boxes).
function faces(t) {
  const f = t.file + '.faces.json';
  const stamp = String(fs.statSync(t.file).mtimeMs);
  if (fs.existsSync(f) && fs.existsSync(f + '.sig') && fs.readFileSync(f + '.sig', 'utf8') === stamp) return JSON.parse(fs.readFileSync(f, 'utf8'));
  const r = spawnSync(path.resolve('.venv/bin/python'), [path.resolve('scripts/faceboxes.py'), t.file, f, '4'], {encoding: 'utf8'});
  if (r.status !== 0) { console.log(`  ⚠️ face boxes failed for ${t.id}: ${r.stderr.slice(-300)}`); return []; }
  fs.writeFileSync(f + '.sig', stamp);
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}
function captionLayers(t) {
  const SPOTS = {bottom: [0.2, 0.72, 0.8, 0.92], top: [0.2, 0.06, 0.8, 0.26], right: [0.68, 0.35, 0.99, 0.65], left: [0.01, 0.35, 0.32, 0.65]};
  const s = t.seg;
  if (!s.subs?.length) return [];
  const {speed} = segTiming(s);
  const fb = faces(t);
  const order = s.capPos ? [s.capPos] : ['bottom', 'top'];
  const out = [];
  for (const l of s.subs) {
    const a = Math.max(0, (l.s - (s.in ?? 0)) / speed), b = Math.min(t.total, (l.e - (s.in ?? 0)) / speed);
    if (b - a < 0.2) continue;
    const words = l.t.split(/\s+/).filter(Boolean).map((w) => {
      const m = /^([*^!])(.+)\1([.,!?…]*)$/.exec(w);
      return m ? {w: m[2] + m[3], hot: {'*': 'yellow', '^': 'green', '!': 'red'}[m[1]]} : {w};
    });
    if (l.w?.length === words.length) {
      words.forEach((w, i) => { w.s = Math.min(b - 0.05, Math.max(a, (l.w[i][1] - (s.in ?? 0)) / speed)); });
    } else {
      const total = words.reduce((n, w) => n + w.w.length + 2, 0);
      let c = a;
      for (const w of words) { w.s = c; c += ((w.w.length + 2) / total) * (b - a); }
    }
    const groups = [];
    for (const w of words) {
      const g = groups[groups.length - 1];
      if (g && g.length < 3 && g.map((x) => x.w).join(' ').length + w.w.length < 18 && !/[.?!,]$/.test(g[g.length - 1].w)) g.push(w);
      else groups.push([w]);
    }
    groups.forEach((g, i) => {
      const ga = g[0].s, gb = i + 1 < groups.length ? groups[i + 1][0].s : b;
      const busy = (r) => fb.some((f) => f.t >= ga - 0.2 && f.t <= gb + 0.2 && f.b.some(([x, y, w, h]) =>
        x - w * 0.1 < r[2] && x + w * 1.1 > r[0] && y - h * 0.1 < r[3] && y + h * 1.1 > r[1]));
      const pos = l.pos ?? order.find((k) => !busy(SPOTS[k])) ?? order[0];
      out.push({type: 'caps', at: +ga.toFixed(3), dur: +(gb - ga).toFixed(3), words: g.map((w) => ({...w, s: +w.s.toFixed(3)})), pos});
    });
  }
  return out;
}

// YouTube chapters from segments that carry a "chapter" title
function chapters(tl) {
  const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  return tl.filter((t) => t.seg.chapter).map((t, i) => `${i === 0 ? '0:00' : fmt(t.start)} ${t.seg.chapter}`).join('\n') + '\n';
}

// Subtitles: source-time lines → timeline → ASS (clean long-form style: white, soft shadow, lower third)
function writeSubs(tl, file) {
  const lines = [];
  for (const t of tl) {
    const s = t.seg;
    const {speed} = segTiming(s);
    for (const l of s.subs ?? []) {
      const a = t.start + (l.s - (s.in ?? 0)) / speed, b = t.start + (l.e - (s.in ?? 0)) / speed;
      const lo = Math.max(t.start, a), hi = Math.min(t.start + t.total, b);
      if (hi - lo > 0.2) lines.push({a: lo, b: hi, t: l.t, pos: l.pos ?? s.subPos});
    }
  }
  if (!lines.length) return null;
  const ts = (x) => `${Math.floor(x / 3600)}:${String(Math.floor(x / 60) % 60).padStart(2, '0')}:${(x % 60).toFixed(2).padStart(5, '0')}`;
  const fs_ = Math.round(46 * S), mv = Math.round(70 * S);
  const head = `[Script Info]\nScriptType: v4.00+\nPlayResX: ${W}\nPlayResY: ${H}\nWrapStyle: 0\n\n[V4+ Styles]\n` +
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n' +
    `Style: Sub,Poppins ExtraBold,${fs_},&H00FFFFFF,&H00FFFFFF,&H64000000,&H8C000000,0,0,0,0,100,100,0.5,0,1,${(2.2 * S).toFixed(1)},${(1.6 * S).toFixed(1)},2,${Math.round(160 * S)},${Math.round(160 * S)},${mv},1\n\n` +
    '[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n';
  const body = lines.map((l) => `Dialogue: 0,${ts(l.a)},${ts(l.b)},Sub,,0,0,0,,{\\fad(120,100)${l.pos ? `\\pos(${Math.round(l.pos[0] * W)},${Math.round(l.pos[1] * H)})` : ''}}${l.t.replace(/\n/g, '\\N')}`).join('\n');
  fs.writeFileSync(file, head + body + '\n');
  return file;
}
