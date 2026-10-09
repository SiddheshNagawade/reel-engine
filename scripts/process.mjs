// Process / time-lapse videos (drawing, unboxing, making-of): many long clips with no voice → one vertical reel.
// The edit lives in _work/<name>/timeline.json (Claude writes it after looking at contact sheets, see scripts/sheet.mjs).
//
//   node scripts/process.mjs <name> [--note "- what changed"]
//
// timeline.json:
// {
//   "srcDir": "/Volumes/T7 Shield/Raw videos/<folder>",
//   "size": [1080, 1920], "fps": 30,
//   "look": {"contrast": 1.04, "vibrance": 0.2, "vignette": 0.35, "grain": 5},  // optional, shared look ON TOP of per-clip exposure:
//      vibrance = boosts dull colours more than strong ones (gentler than saturation), vignette = angle (0 = off), grain = noise.
//      ("whites" exists but lifts every clip equally; exposure belongs per segment, see measureGain. Avoid it.)
//   "endFade": 0,  // seconds of fade to black at the end; 0 = hard cut (loops)
//   "segments": [{
//     "src": "video_x.mp4", "in": 12, "out": 40,     // source range (seconds)
//     "dur": 3,                  // output seconds (→ speed = (out-in)/dur); or "speed": 8
//     "rotate": 90,              // fix a phone turned mid-recording: 90 = clockwise, 270 = counter-clockwise, 180 = upside down
//     "fx": 0.5, "fy": 0.5,      // focus point (0..1 of the (rotated) source frame) the vertical window centres on
//     "toFx": 0.6,               // optional pan: focus at the END of the segment
//     "zoom": 1, "toZoom": 1.1,  // 1 = full source height; >1 punches in; toZoom animates (push-in / pull-out, eased)
//     "zx": 0.5, "zy": 0.5,      // where an animated zoom is centred inside the vertical window (e.g. on a face)
//     "mode": "fill" | "fit",    // fill = vertical crop (default); fit = whole frame as a card on its own blurred copy
//     "hold": 0,                 // freeze the last frame this many extra seconds
//     "rampTo": 1,               // speed ramp: starts at "speed", eases (geometric steps) to this speed over "dur"; out is derived
//     "stabilize": 15,           // handheld shake → two-pass vidstab, value = smoothing (frames); only where the camera shakes
//     "exposure": 1.1,           // luma gain override; omitted = measured per segment (paper white → shared target, no clipping)
//     "audio": 0.6,              // keep natural sound at this volume (only for speed ≤ 2); omitted = silent
//     "vo": "line to say here"   // voice-over guide line (lasts until the next segment that has one)
//   }]
// }
// Output: <drive>/output/<name>/<name>-vN.mp4 (+ -vN-vo-guide.mp4 when lines exist) + CHANGELOG.md. Versions never overwrite.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
import {outputRoot, workRoot} from './lib/paths.mjs';

const args = process.argv.slice(2);
const opt = (f, d) => (args.includes(f) ? args[args.indexOf(f) + 1] : d);
const name = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!name) {
  console.error('Usage: node scripts/process.mjs <name> [--note "..."]');
  process.exit(1);
}
const work = path.join(workRoot(), name);
const tl = JSON.parse(fs.readFileSync(path.join(work, 'timeline.json'), 'utf8'));
const [W, H] = tl.size ?? [1080, 1920];
const FPS = tl.fps ?? 30;
const FONT = '/System/Library/Fonts/Supplemental/Arial Bold.ttf';

const ff = (a) => {
  const r = spawnSync(ffmpegPath, ['-hide_banner', '-loglevel', 'error', '-y', ...a], {encoding: 'utf8', maxBuffer: 1 << 26});
  if (r.status !== 0) throw new Error(r.stderr || `ffmpeg failed: ${a.join(' ')}`);
};
const ffLog = (a) => String(spawnSync(ffmpegPath, ['-hide_banner', '-loglevel', 'info', '-y', ...a], {encoding: 'utf8', maxBuffer: 1 << 26}).stderr);
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const ROT = {90: 'transpose=1,', 270: 'transpose=2,', [-90]: 'transpose=2,', 180: 'hflip,vflip,'};
// Per-clip exposure: sample a few frames of the framed area, then bring "paper white" (90th-percentile luma) to a shared
// target without letting the brightest parts clip. Source phone footage is full-range (0–255).
const EXPOSURE = {white: 224, ceiling: 247, min: 0.92, max: 1.22};
function measureGain(src, s, W, H) {
  const rot = ROT[s.rotate ?? 0] ?? '';
  const z = s.zoom ?? 1, fx = s.fx ?? 0.5, fy = s.fy ?? 0.5;
  const ww = `min(iw,ih/${z}*${W}/${H})`, hh = `(${ww})*${H}/${W}`;
  const crop = `crop=w='${ww}':h='${hh}':x='max(0,min(iw-(${ww}),iw*${fx}-(${ww})/2))':y='max(0,min(ih-(${hh}),ih*${fy}-(${hh})/2))'`;
  const highs = [], maxes = [];
  for (const f of [0.2, 0.5, 0.85]) {
    const t = s.in + (s.out - s.in) * f;
    const log = ffLog(['-ss', t.toFixed(2), '-i', src, '-frames:v', '1', '-vf', `${rot}${(s.mode ?? 'fill') === 'fill' ? crop + ',' : ''}scale=360:-2,signalstats,metadata=print`, '-f', 'null', '-']);
    const hi = /YHIGH=(\d+)/.exec(log), mx = /YMAX=(\d+)/.exec(log);
    if (hi) highs.push(+hi[1]);
    if (mx) maxes.push(+mx[1]);
  }
  if (!highs.length) return 1;
  const g = Math.min(EXPOSURE.white / median(highs), EXPOSURE.ceiling / median(maxes));
  return Math.max(EXPOSURE.min, Math.min(EXPOSURE.max, g));
}
// Speed ramp → equal-length steps with geometrically changing speed (reads as a smooth ramp at 6 steps).
function expandRamps(segments) {
  return segments.flatMap((s) => {
    if (s.rampTo == null) return [s];
    const N = 6, d = s.dur / N, v0 = s.speed, v1 = s.rampTo;
    let t = s.in;
    return Array.from({length: N}, (_, j) => {
      const v = v0 * Math.pow(v1 / v0, j / (N - 1));
      const part = {...s, in: t, out: t + v * d, speed: v, dur: undefined, rampTo: undefined,
        vo: j === 0 ? s.vo : undefined, hold: j === N - 1 ? s.hold : 0, toFx: undefined, toZoom: undefined, ramped: true};
      t += v * d;
      return part;
    });
  });
}
const lerp = (a, b, k) => `(${a}+(${b - a})*${k})`;
const ENC_V = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(FPS),
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv'];
const ENC = [...ENC_V, '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2'];

const pieces = path.join(work, 'pieces');
fs.rmSync(pieces, {recursive: true, force: true});
fs.mkdirSync(pieces, {recursive: true});

let clock = 0;
const voLines = [];
try {
  const stabDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stab-')); // vidstab can't take paths with spaces
  expandRamps(tl.segments).forEach((s, i) => {
    const src = path.isAbsolute(s.src) ? s.src : path.join(tl.srcDir, s.src);
    const span = s.out - s.in;
    const speed = s.speed ?? (s.dur ? span / s.dur : 1);
    const moving = span / speed; // seconds of motion
    const total = moving + (s.hold ?? 0);
    const k = `min(1,t/${total.toFixed(3)})`; // 0→1 over the whole segment (pans continue through a hold)
    const fx0 = s.fx ?? 0.5, fx1 = s.toFx ?? fx0, fy0 = s.fy ?? 0.5, fy1 = s.toFy ?? fy0;
    const z0 = s.zoom ?? 1, z1 = s.toZoom ?? z0;
    // timing: speed up, then a steady frame rate; hold = clone the last frame
    const rot = ROT[s.rotate ?? 0] ?? '';
    const gain = s.exposure ?? measureGain(src, s, W, H);
    const expo = Math.abs(gain - 1) > 0.01 ? `lutyuv=y='clip(val*${gain.toFixed(3)},0,255)',` : '';
    let stab = '';
    if (s.stabilize) {
      const trf = path.join(stabDir, `${i}.trf`);
      ff(['-ss', String(s.in), '-t', String(span), '-i', src, '-vf', `${rot}vidstabdetect=shakiness=6:result=${trf}`, '-f', 'null', '-']);
      stab = `vidstabtransform=input=${trf}:smoothing=${s.stabilize}:optzoom=1:interpol=bicubic,`;
    }
    const timing = `${rot}${stab}${expo}setpts=(PTS-STARTPTS)/${speed},fps=${FPS}${s.hold ? `,tpad=stop_mode=clone:stop_duration=${s.hold}` : ''}`;
    const conv = `out_color_matrix=bt709:out_range=tv`;
    let vf;
    if ((s.mode ?? 'fill') === 'fill') {
      // vertical window (size fixed per segment; crop w/h are evaluated once), centre follows the focus over time
      const ww = `min(iw,ih/${z1 === z0 ? z0 : 1}*${W}/${H})`, hh = `(${ww})*${H}/${W}`;
      const cx = `(iw*${lerp(fx0, fx1, k)})`, cy = `(ih*${lerp(fy0, fy1, k)})`;
      vf = `${timing},crop=w='${ww}':h='${hh}':x='max(0,min(iw-(${ww}),${cx}-(${ww})/2))':y='max(0,min(ih-(${hh}),${cy}-(${hh})/2))'`;
      if (z1 !== z0) {
        // animated push: zoompan on a 2× upscale so the move stays smooth
        const lin = `min(1,on/${Math.max(1, Math.round(total * FPS))})`;
        const zk = `(${lin})*(${lin})*(3-2*(${lin}))`; // smoothstep: soft start and landing
        const zx = s.zx ?? 0.5, zy = s.zy ?? 0.5;
        vf += `,scale=${W * 2}:${H * 2}:flags=bicubic,zoompan=z='${lerp(z0, z1, zk)}'` +
          `:x='max(0,min(iw-iw/zoom,iw*${zx}-iw/zoom/2))':y='max(0,min(ih-ih/zoom,ih*${zy}-ih/zoom/2))':d=1:s=${W}x${H}:fps=${FPS}`;
      }
      vf += `,scale=${W}:${H}:flags=lanczos:${conv},setsar=1`;
    } else {
      // fit: the whole frame as a card (92% wide), centred, over a dark blurred copy of itself; zoom/toZoom = slow push on the whole stage
      const cw = Math.round(W * 0.92 / 2) * 2;
      const zk = `min(1,on/${Math.max(1, Math.round(total * FPS))})`;
      vf = `${timing},split[a][b];` +
        `[a]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=40:3,eq=brightness=-0.12:saturation=0.8[bg];` +
        `[b]scale=${cw}:-2[fg];` +
        `[bg][fg]overlay=(W-w)/2:(H-h)/2:shortest=1` +
        (z1 !== z0 ? `,scale=${W * 2}:${H * 2},zoompan=z='${lerp(z0, z1, zk)}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${W}x${H}:fps=${FPS}` : '') +
        `,scale=${W}:${H}:${conv},setsar=1`;
    }
    const keyOnly = speed >= 60 ? ['-skip_frame', 'nokey'] : [];
    const inArgs = [...keyOnly, '-ss', String(s.in), '-t', String(span), '-i', src];
    const out = path.join(pieces, `${String(i).padStart(3, '0')}.mp4`);
    const useAudio = s.audio && speed <= 2;
    if (useAudio) {
      const fade = Math.min(0.08, moving / 4);
      const af = `atempo=${speed},volume=${s.audio},afade=t=in:d=${fade},afade=t=out:st=${(moving - fade).toFixed(3)}:d=${fade},apad`;
      ff([...inArgs, '-filter_complex', `[0:v]${vf}[v];[0:a]${af}[a]`, '-map', '[v]', '-map', '[a]', '-t', total.toFixed(3), ...ENC, out]);
    } else {
      ff([...inArgs, '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
        '-filter_complex', `[0:v]${vf}[v]`, '-map', '[v]', '-map', '1:a', '-t', total.toFixed(3), ...ENC, out]);
    }
    if (s.vo) voLines.push({from: clock, to: clock + total, text: s.vo});
    else if (voLines.length) voLines[voLines.length - 1].to = clock + total;
    console.log(`  ${String(i + 1).padStart(2)}. ${clock.toFixed(1).padStart(5)}s  ${path.basename(src)} ${(+s.in).toFixed(1)}→${(+s.out).toFixed(1)}s ×${speed.toFixed(1)} → ${total.toFixed(2)}s  exp ×${gain.toFixed(2)}${s.stabilize ? ' stab' : ''}`);
    clock += total;
  });

  // join
  const list = path.join(pieces, 'list.txt');
  fs.writeFileSync(list, fs.readdirSync(pieces).filter((f) => f.endsWith('.mp4') && !f.startsWith('.')).sort().map((f) => `file '${path.join(pieces, f)}'`).join('\n'));
  const outDir = path.join(outputRoot(), name);
  fs.mkdirSync(outDir, {recursive: true});
  let v = 1;
  while (fs.existsSync(path.join(outDir, `${name}-v${v}.mp4`))) v++;
  const final = path.join(outDir, `${name}-v${v}.mp4`);
  const fadeOut = tl.endFade ?? 0.8;
  const L = tl.look ?? {};
  const look = [
    L.whites ? `colorlevels=rimax=${L.whites}:gimax=${L.whites}:bimax=${L.whites}` : '',
    L.contrast ? `eq=contrast=${L.contrast}` : '',
    L.vibrance ? `vibrance=intensity=${L.vibrance}` : '',
    L.vignette ? `vignette=angle=${L.vignette}` : '',
    L.grain ? `noise=alls=${L.grain}:allf=t` : '',
  ].filter(Boolean).map((f) => f + ',').join('');
  ff(['-f', 'concat', '-safe', '0', '-i', list,
    '-vf', `${look}fade=t=out:st=${(clock - fadeOut).toFixed(3)}:d=${fadeOut}`, '-af', `afade=t=out:st=${(clock - fadeOut).toFixed(3)}:d=${fadeOut}`,
    ...ENC, '-movflags', '+faststart', final]);
  console.log(`\n✅ ${final} (${clock.toFixed(1)}s)`);

  // voice-over guide: the line to say, burned in at the right time (a teleprompter for recording)
  if (voLines.length) {
    const draw = voLines.map((l, j) => {
      const tf = path.join(pieces, `vo-${j}.txt`);
      fs.writeFileSync(tf, l.text);
      return `drawtext=fontfile='${FONT}':textfile='${tf}':fontsize=54:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=24:` +
        `x=(w-text_w)/2:y=h*0.70:line_spacing=12:enable='between(t,${l.from.toFixed(2)},${l.to.toFixed(2)})'`;
    });
    draw.push(`drawtext=fontfile='${FONT}':text='%{pts\\:hms}':fontsize=36:fontcolor=yellow:box=1:boxcolor=black@0.5:boxborderw=10:x=30:y=h*0.12`);
    ff(['-i', final, '-vf', draw.join(','), ...ENC_V, '-c:a', 'copy', path.join(outDir, `${name}-v${v}-vo-guide.mp4`)]);
    fs.writeFileSync(path.join(outDir, `${name}-v${v}-vo-script.txt`),
      voLines.map((l) => `${l.from.toFixed(1).padStart(5)}–${l.to.toFixed(1).padEnd(5)}  ${l.text.replace(/\n/g, ' ')}`).join('\n') + '\n');
    console.log(`   guide: ${name}-v${v}-vo-guide.mp4 + ${name}-v${v}-vo-script.txt`);
  }
  const note = opt('--note', tl.changeNote ?? '');
  fs.appendFileSync(path.join(outDir, 'CHANGELOG.md'), `\n## v${v} (${new Date().toISOString().slice(0, 10)}): ${clock.toFixed(1)}s\n${note}\n`);
  fs.copyFileSync(path.join(work, 'timeline.json'), path.join(outDir, `${name}-v${v}.timeline.json`));
} finally {
  fs.rmSync(pieces, {recursive: true, force: true});
  for (const d of fs.readdirSync(os.tmpdir()).filter((d) => d.startsWith('stab-'))) fs.rmSync(path.join(os.tmpdir(), d), {recursive: true, force: true});
}
