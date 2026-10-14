// One command: raw footage in → finished reel out. 100% local.
//
//   npm run reel -- <video file | folder of clips | previous reel name> [options]
//
// A folder = one reel made from all its clips (ordered by recording time).
// Only AUDIO is read from the full footage; just the kept seconds of video are ever copied/processed.
//
// Options: --no-render  --fresh (redo everything)  --redirect (re-decide the edit, keep transcripts)
//          --lang hinglish|hi|en|auto
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
import {probe, extractAudio, detectSilences, extractPiece, joinPieces, wordLoudness} from './lib/media.mjs';
import {directLocal} from './lib/director.mjs';
import {analyzeFrames, pickTheme} from './lib/themes.mjs';
import {buildEdit, buildTranscript, brollTags} from './lib/plan.mjs';
import {mediaRoots, outputRoot, workRoot, listVideos, libraryRoot} from './lib/paths.mjs';
import {syncToDrive} from './lib/sync.mjs';
import {writePostFacts} from './postkit.mjs';
import {skinBalanceSegments} from './lib/skin.mjs';
import {requirePlan} from './lib/editplan.mjs';
import os from 'node:os';
import {renderEdit} from './render.mjs';
import {writeRenderedFcpxml} from './lib/fcpxml.mjs';
import {auditCuts} from './lib/cutaudit.mjs';

const FPS = 30;
const GAP = 1.0; // virtual silence between clips, so every clip boundary is a clean cut

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f, d) => (args.includes(f) ? args[args.indexOf(f) + 1] : d);
const target = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1] === '--lang'));
const slug = (s) => path.basename(s).replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'reel';
const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const writeJson = (f, o) => fs.writeFileSync(f, JSON.stringify(o, null, 2));
const timings = [];
let stepStart = Date.now();
let stepName = 'Setup';
const step = (msg) => {
  timings.push([stepName, (Date.now() - stepStart) / 1000]);
  stepName = msg.replace(/…$/, '');
  stepStart = Date.now();
  console.log(`\n▸ ${msg}`);
};

if (!target) {
  console.error('Usage: npm run reel -- <video | folder of clips | previous reel name> [--no-render] [--fresh] [--redirect]');
  process.exit(1);
}

syncToDrive(); // anything made on the Mac while the T7 was unplugged → drive
const roots = mediaRoots();
const name = slug(target.replace(/\/+$/, ''));
const work = path.join(workRoot(), name);
fs.mkdirSync(work, {recursive: true});
const fresh = flag('--fresh');
const style = readJson('style.json');

// ── 1. Which clips? ────────────────────────────────────────────────────────────
let clips;
const clipsFile = path.join(work, 'clips.json');
const resolveTarget = () => {
  for (const base of ['', ...roots.map((r) => path.join(r, 'projects')), ...roots.map((r) => path.join(r, 'inbox'))]) {
    const p = path.resolve(base, target);
    if (fs.existsSync(p)) return p;
  }
  return null;
};
const src = resolveTarget();
if (src) {
  const files = fs.statSync(src).isDirectory() ? listVideos(src) : [src];
  if (!files.length) throw new Error(`No videos in ${src}`);
  clips = [];
  for (const f of files) clips.push({src: f, ...(await probe(f))});
  clips.sort((a, b) => (a.creationTime ?? '').localeCompare(b.creationTime ?? '') || a.src.localeCompare(b.src));
  writeJson(clipsFile, clips);
} else if (fs.existsSync(clipsFile)) {
  clips = readJson(clipsFile); // re-edit of a previous reel
} else {
  console.error(`Not found: ${target}`);
  process.exit(1);
}
console.log(`🎬 ReelEngine: ${name}: ${clips.length} clip${clips.length > 1 ? 's' : ''}, ${clips.reduce((n, c) => n + c.duration, 0).toFixed(0)}s of footage`);

// ── 2. Audio + transcript per clip (cached; only reads the audio stream) ───────
const transcribe = (audio, out) => {
  const py = spawnSync('.venv/bin/python', ['scripts/transcribe.py', audio, out, '--lang', opt('--lang', style.language ?? 'hinglish')], {
    stdio: ['ignore', 'inherit', 'pipe'],
    env: {...process.env, PATH: `${path.dirname(ffmpegPath)}:${process.env.PATH}`},
  });
  if (py.status !== 0) throw new Error(`Transcription failed:\n${py.stderr}`);
};

let offset = 0;
const vWords = [];
const vSilences = [];
for (const [k, c] of clips.entries()) {
  const audio = path.join(work, `clip-${k}.mp3`);
  const wordsFile = path.join(work, `clip-${k}.words.json`);
  if (fresh || !fs.existsSync(audio)) {
    step(`Clip ${k + 1}/${clips.length}: reading audio (${path.basename(c.src)})…`);
    await extractAudio(c.src, audio);
  }
  if (fresh || !fs.existsSync(wordsFile)) {
    step(`Clip ${k + 1}/${clips.length}: transcribing locally…`);
    transcribe(audio, wordsFile);
  }
  const clipWords = readJson(wordsFile).words;
  const dbs = await wordLoudness(audio, clipWords);
  clipWords.forEach((w, j) => vWords.push({...w, s: w.s + offset, e: w.e + offset, clip: k, db: dbs[j]}));
  for (const [a, b] of await detectSilences(audio, style.edit.silenceDb, style.edit.minSilence, c.duration)) vSilences.push([a + offset, b + offset]);
  c.offset = offset;
  if (k < clips.length - 1) vSilences.push([offset + c.duration, offset + c.duration + GAP]);
  offset += c.duration + GAP;
}
const vDuration = offset - GAP;

// ── 3. Decide the edit on the combined transcript ─────────────────────────────
const dirFile = path.join(work, 'direction.json');
let direction;
if (fresh || flag('--redirect') || !fs.existsSync(dirFile)) {
  step('Director planning the edit across all clips…');
  direction = directLocal(vWords, {brollTags: brollTags(), silences: vSilences});
  writeJson(dirFile, direction);
} else {
  step(`Using saved direction (work/${name}/direction.json)…`);
  direction = readJson(dirFile);
}
for (const n of direction.notes ?? []) console.log(`  · ${n}`);
// Per-reel tweaks of the look (templates are starting points): direction.styleOverride is merged over style.json.
const deepMerge = (t, o) => {
  for (const [k, v] of Object.entries(o ?? {})) {
    if (v && typeof v === 'object' && !Array.isArray(v) && t[k] && typeof t[k] === 'object') deepMerge(t[k], v);
    else t[k] = v;
  }
  return t;
};
deepMerge(style, direction.styleOverride);

const clipAt = (t) => clips.findLastIndex((c) => t >= c.offset - 0.5);
const plan = (theme) => buildEdit({name, video: `input/${name}.mp4`, duration: vDuration, silences: vSilences, words: vWords, direction, style, theme, clipAt, fps: FPS});
const provisional = plan(pickTheme({topic: direction.topic, pace: direction.pace, frames: {dominantHue: 0, brightness: 0.5}}));

// ── 4. Copy ONLY the kept seconds off the source footage ──────────────────────
const selects = path.join(work, 'selects.mp4');
const segKey = crypto.createHash('md5').update(JSON.stringify([...provisional.segments.map((s) => [s.srcFrame, s.frames, s.freeze ? 1 : 0]), clips.map((c) => (c.hdr ? 1 : 0)), [style.film.scurve, style.film.sharpen, style.film.halation, style.film.hdrTonemap]])).digest('hex');
const keyFile = path.join(work, 'selects.key');
if (fresh || !fs.existsSync(selects) || !fs.existsSync(keyFile) || fs.readFileSync(keyFile, 'utf8') !== segKey) {
  step(`Extracting ${provisional.segments.length} kept pieces (${(provisional.durationInFrames / FPS).toFixed(1)}s of ${vDuration.toFixed(0)}s)…`);
  const piecesDir = path.join(work, 'pieces');
  fs.rmSync(piecesDir, {recursive: true, force: true});
  fs.mkdirSync(piecesDir);
  const pieces = [];
  for (const [i, s] of provisional.segments.entries()) {
    const t = s.srcFrame / FPS;
    const k = clips.findLastIndex((c) => t >= c.offset - 0.5);
    const local = Math.max(0, Math.min(clips[k].duration - s.frames / FPS, t - clips[k].offset));
    const out = path.join(piecesDir, `${String(i).padStart(4, '0')}.mov`);
    // v1 look (his favourite): keep the iPhone's HDR colour tags and let the renderer convert. Tone-mapping only if asked.
    await extractPiece(clips[k].src, local, s.frames, out, FPS, !!s.freeze, !!clips[k].hdr && !!style.film.hdrTonemap, style.film);
    pieces.push(out);
    process.stdout.write(`\r  ${i + 1}/${provisional.segments.length}`);
  }
  console.log('\n  cleaning voice + loudness (-14 LUFS)…');
  await joinPieces(pieces, selects, work);
  fs.rmSync(piecesDir, {recursive: true, force: true});
  fs.writeFileSync(keyFile, segKey);
}

// Face tracking (Apple Vision) on the kept footage → zooms and camera moves follow the speaker's head.
const facesFile = path.join(work, 'faces.json');
const facesKey = path.join(work, 'faces.key');
if (!fs.existsSync(facesFile) || !fs.existsSync(facesKey) || fs.readFileSync(facesKey, 'utf8') !== segKey) {
  step('Tracking face…');
  const r = spawnSync('.venv/bin/python', ['scripts/facetrack.py', selects, facesFile, '10'], {stdio: ['ignore', 'inherit', 'pipe']});
  if (r.status === 0) fs.writeFileSync(facesKey, segKey);
  else console.log('  (face tracking failed, using fixed framing)');
}
const faces = fs.existsSync(facesFile) ? readJson(facesFile) : [];

// Skin balance (scripts/skinbalance.py, brain/color.md): measures HIS skin every 0.5 s; where a warm/yellow (or pink)
// light pushed it off the skin-tone line, a small per-shot white-balance fix brings it back. Off: style film.skinBalance=false.
const skinFile = path.join(work, 'skin.json');
const skinKey = path.join(work, 'skin.key');
if (!fs.existsSync(skinFile) || !fs.existsSync(skinKey) || fs.readFileSync(skinKey, 'utf8') !== segKey) {
  step('Measuring skin tones…');
  const r = spawnSync('.venv/bin/python', ['scripts/skinbalance.py', selects, skinFile, '0.5'], {stdio: ['ignore', 'inherit', 'pipe']});
  if (r.status === 0) fs.writeFileSync(skinKey, segKey);
  else console.log('  (skin balance failed, original colours kept)');
}
const skin = fs.existsSync(skinFile) ? readJson(skinFile) : [];

// Expose only this reel's selects to Remotion.
fs.mkdirSync('public/input', {recursive: true});
// Only clear THIS reel's old temp files: another chat may be rendering a different reel at the same time.
for (const f of fs.readdirSync('public/input')) if (f === `${name}.mp4` || f.startsWith(`${name}-fg`)) fs.rmSync(path.join('public/input', f), {force: true});
const tempInput = path.resolve('public/input', `${name}.mp4`);
fs.copyFileSync(selects, tempInput); // temporary: deleted right after rendering

// ── 5. Look + final edit (selects timeline == output timeline) ────────────────
step('Choosing the look…');
const frames = await analyzeFrames(selects, provisional.durationInFrames / FPS);
const theme = pickTheme({topic: direction.topic, pace: direction.pace, frames, override: {...style.theme, ...direction.themeOverride}});
console.log(`  topic ${theme.topic} (${theme.pace}) → ${theme.captionStyle} captions, accent ${theme.accent}, transitions: ${theme.transitions.join('/')}`);

// Secrets sweep (opt-in for videos with screens on camera): private text on screens gets blurred boxes.
if (direction.blurSecrets) {
  const sf = path.join(work, `secrets-${segKey.slice(0, 8)}.json`);
  if (!fs.existsSync(sf)) {
    step('Looking for private text on screens (secrets sweep)…');
    const r = spawnSync('.venv/bin/python', ['scripts/secrets.py', selects, '--fps', '2', '--out', sf], {stdio: ['ignore', 'inherit', 'pipe']});
    if (r.status !== 0) console.log(`  (secrets sweep failed: ${String(r.stderr).slice(-200)})`);
  }
  if (fs.existsSync(sf)) direction.blurs = [...(direction.blurs ?? []), ...readJson(sf)];
}
const {stats, wordFrames, ...edit} = plan(theme);

// Cut audit: every cut measured on the audio. A cut on sound = a clipped word start/tail (fix: widen the gap in
// removeRanges or let the word stay). Saved for the plan's automatic checks.
{
  const audit = auditCuts(selects, edit.segments, FPS, edit.captions.flatMap((g) => g.words));
  writeJson(path.join(work, 'cut-audit.json'), audit);
  if (audit.flagged.length) {
    console.log(`  ⚠️ ${audit.flagged.length} of ${audit.cuts} cuts land on sound:`);
    for (const c of audit.flagged) console.log(`     ${c.t}s (f${c.frame}) ${c.what}${c.near ? `: "${c.near}"` : ''}`);
  } else console.log(`  cut audit: all ${audit.cuts} cuts land in pauses ✓`);
}
edit.styleOverride = direction.styleOverride ?? null;
const virtSegs = edit.segments.map((s) => ({...s})); // positions in the ORIGINAL recordings (for Final Cut)
edit.segments = edit.segments.map((s) => ({...s, srcFrame: s.outFrame}));
edit.faces = faces.map((p) => [p.f, +p.x.toFixed(3), +p.y.toFixed(3), +p.h.toFixed(3)]);
if ((direction.styleOverride?.film?.skinBalance ?? true) !== false) {
  edit.segments = skinBalanceSegments(edit.segments, skin);
  const fixed = edit.segments.filter((s) => s.wb);
  if (fixed.length) console.log(`  skin balance: ${fixed.length}/${edit.segments.length} shots corrected (max ${Math.max(...fixed.flatMap((s) => s.wb.map((g) => Math.abs(g - 1) * 100))).toFixed(0)} %)`);
}

const tempFiles = [tempInput];
// Things stuck onto the speaker (direction.attach): track face / hands / body once per cut (cached on the drive).
if (edit.attach?.length) {
  const needsTrack = edit.attach.some((a) => a.to !== 'screen');
  const motionFile = path.join(work, `motion-${segKey.slice(0, 8)}.json`);
  if (needsTrack && !fs.existsSync(motionFile)) {
    step('Tracking face, hands and body for attachments…');
    const r = spawnSync('.venv/bin/python', ['scripts/motiontrack.py', selects, motionFile], {stdio: ['ignore', 'inherit', 'pipe']});
    if (r.status !== 0) console.log(`  (motion tracking failed: ${r.stderr?.toString().slice(-300)})`);
  }
  if (fs.existsSync(motionFile)) edit.motion = readJson(motionFile);
  // Pictures (stickers cut with scripts/sticker.py, library PNGs): copied in only for the render.
  for (const [i, a] of edit.attach.entries()) {
    if (a.what !== 'image' || !a.src) continue;
    const file = [a.src, path.join(work, a.src), path.join(libraryRoot(), a.src)].find((p) => fs.existsSync(p));
    if (!file) { console.log(`  (attachment picture not found: ${a.src})`); continue; }
    const rel = `input/${name}-att${i}${path.extname(file)}`;
    fs.copyFileSync(file, path.resolve('public', rel));
    tempFiles.push(path.resolve('public', rel));
    a.src = rel;
  }
  // Props drawn behind him need the person cut out on top for those frames.
  for (const a of edit.attach.filter((x) => x.behind)) (edit.foreground ??= []).push({f: a.f, frames: a.frames});
}
// Canvas mode: where the footage key says cut (just him on the canvas), make his cut-out for that stretch.
if (edit.canvas) {
  const ks = [...(edit.canvas.footage ?? [])].sort((a, b) => a.at - b.at);
  ks.forEach((k, i) => {
    if (!k.cut) return;
    const end = ks.slice(i + 1).find((n) => !n.cut)?.at ?? edit.durationInFrames;
    (edit.foreground ??= []).push({f: k.at, frames: Math.max(1, end - k.at), canvas: true});
  });
  // pictures used by canvas items: {file} → staged like insert media
  for (const [j, it] of (edit.canvas.items ?? []).entries()) {
    if (!it.file) continue;
    const file = [it.file, path.join(work, it.file), path.join(libraryRoot(), it.file)].find((p) => fs.existsSync(p));
    if (!file) { console.log(`  (canvas picture not found: ${it.file})`); continue; }
    const rel = `input/${name}-cv${j}${path.extname(file)}`;
    fs.copyFileSync(file, path.resolve('public', rel));
    tempFiles.push(path.resolve('public', rel));
    it.src = rel;
    delete it.file;
  }
}
// Designed text / cards behind him (brain/pablo.md) need the same cut-out over them.
for (const x of (edit.inserts ?? []).filter((x) => x.behind)) (edit.foreground ??= []).push({f: x.f, frames: x.frames});

// Person cut-outs (for text behind the speaker): made once per range, kept on the drive, copied in only for rendering.
for (const [i, fg] of (edit.foreground ?? []).entries()) {
  const file = path.join(work, `fg-${fg.f}-${fg.frames}-${segKey.slice(0, 8)}.webm`);
  if (!fs.existsSync(file)) {
    step(`Cutting out the person for text-behind (${fg.frames} frames)…`);
    const r = spawnSync('.venv/bin/python', ['scripts/personmask.py', selects, file, String(fg.f), String(fg.frames)], {stdio: ['ignore', 'inherit', 'pipe']});
    if (r.status !== 0) {
      console.log('  (cut-out failed, text goes on top instead)');
      edit.hookBehind = false;
      continue;
    }
  }
  const rel = `input/${name}-fg${i}.webm`;
  fs.copyFileSync(file, path.resolve('public', rel));
  tempFiles.push(path.resolve('public', rel));
  fg.src = rel;
}
// Pictures/clips used by inserts (reveals, card stages): {file} → copied into public/ only for the render.
let mk = 0;
for (const x of edit.inserts ?? []) {
  for (const m of [x.before, x.after, x.media, ...(x.items ?? [])].filter((m) => m?.file)) {
    const file = [m.file, path.join(work, m.file), path.join(libraryRoot(), m.file)].find((p) => fs.existsSync(p));
    if (!file) { console.log(`  (insert media not found: ${m.file})`); continue; }
    const rel = `input/${name}-m${mk++}${path.extname(file)}`;
    fs.copyFileSync(file, path.resolve('public', rel));
    tempFiles.push(path.resolve('public', rel));
    m.src = rel;
    delete m.file;
  }
}
// His own adjustments from the timeline editor (npm run editor -- <name>) win over the plan: _work/<name>/edited.json.
const handFile = path.join(work, 'edited.json');
if (fs.existsSync(handFile) && !flag('--ignore-hand')) {
  const hand = readJson(handFile);
  for (const k of ['captions', 'memes', 'popups', 'sfx', 'cards', 'inserts', 'effects', 'transitions', 'moves', 'layouts', 'captionMoves', 'attach', 'banner', 'hookText', 'segments', 'durationInFrames'])
    if (k in hand) edit[k] = hand[k];
  console.log('  ✋ his timeline-editor adjustments applied (edited.json; --ignore-hand to skip)');
}
fs.mkdirSync('src/edits', {recursive: true});
writeJson(`src/edits/${name}.json`, edit);
writeJson('src/edits/latest.json', edit);
console.log(`  ${vDuration.toFixed(1)}s → ${stats.finalSeconds.toFixed(1)}s, ${stats.cuts} cuts, ${edit.popups.length} pop-ups, ${edit.transitions.length} transitions`);

const outDir = outputRoot();
const transcript = buildTranscript({words: vWords, direction, edit, wordFrames, clipNames: clips.map((c) => path.basename(c.src))});
fs.writeFileSync(path.join(work, 'transcript.md'), transcript);

// ── 6. Render on the internal SSD, then copy the finished reel to the output folder ──
const exportFcp = async (vName) => {
  const reelDir = path.join(outDir, name);
  const file = path.join(reelDir, `${vName}.fcpxml`);
  // Exact-look export (the rendered reel, cut at every edit). The rebuilt-from-footage export (writeFcpxml) lost the
  // whole look in FCP, so it's no longer used by default.
  writeRenderedFcpxml({edit, mp4: path.join(reelDir, `${vName}.mp4`), fps: FPS, outFile: file, title: vName});
  // Validate against Final Cut's own schema (shipped inside the app) before handing it over.
  const dtd = '/Applications/Final Cut Pro.app/Contents/Frameworks/Interchange.framework/Versions/A/Resources/FCPXMLv1_11.dtd';
  if (fs.existsSync(dtd)) {
    const tmpDtd = path.join(os.tmpdir(), 'fcpxml-1.11.dtd');
    fs.copyFileSync(dtd, tmpDtd);
    const v = spawnSync('xmllint', ['--noout', '--dtdvalid', tmpDtd, file], {encoding: 'utf8'});
    console.log(v.status === 0 ? '  Final Cut project validated ✓' : `  ⚠️ Final Cut project has schema issues:\n${v.stderr.slice(0, 800)}`);
  }
  return file;
};

// Final Cut project for an EXISTING version (no re-render): npm run reel -- <name> --fcp v2
if (flag('--fcp')) {
  const v = opt('--fcp', '');
  step(`Writing Final Cut project for ${name}-${v}…`);
  console.log(`  ${await exportFcp(`${name}-${v}`)}`);
  for (const f of tempFiles) fs.rmSync(f, {force: true});
  process.exit(0);
}

if (!flag('--no-render')) {
  const planNote = requirePlan(work, name, args, 'reel'); // every pass decided before a version exists
  step('Rendering…');
  const tmp = path.join(os.tmpdir(), `reelengine-${name}.mp4`);
  await renderEdit(edit, tmp);
  // Every render is a new version; old versions are never overwritten.
  const reelDir = path.join(outDir, name);
  fs.mkdirSync(reelDir, {recursive: true});
  const version = fs.readdirSync(reelDir).filter((f) => !f.startsWith('._') && /-v\d+\.mp4$/.test(f)).length + 1;
  const vName = `${name}-v${version}`;
  fs.copyFileSync(tmp, path.join(reelDir, `${vName}.mp4`));
  fs.rmSync(tmp);
  for (const f of tempFiles) fs.rmSync(f, {force: true}); // Mac scratch space cleaned right away
  fs.writeFileSync(path.join(reelDir, `${vName}.transcript.md`), transcript);
  fs.mkdirSync(path.join(work, 'versions'), {recursive: true});
  writeJson(path.join(work, 'versions', `direction-v${version}.json`), direction);
  const note = opt('--note', direction.changeNote ?? '');
  fs.appendFileSync(
    path.join(reelDir, 'CHANGELOG.md'),
    `\n## v${version} (${new Date().toLocaleString('en-IN', {hour12: false})})\n${note || '- (no notes)'}${planNote ? `\n${planNote}` : ''}\n- Length ${(edit.durationInFrames / FPS).toFixed(1)}s · memes: ${(edit.memes ?? []).map((m) => m.id).filter(Boolean).join(', ') || 'none'} · captions: ${edit.theme.captionStyle}\n`,
  );
  writePostFacts({reelDir, vName, edit, direction, transcriptMd: transcript, fps: FPS}); // posting kit facts (brain/posting.md)
  step('Writing Final Cut project…');
  await exportFcp(vName);
  console.log(`\n✅ ${vName}.mp4 + ${vName}.fcpxml saved in ${reelDir}`);
  console.log(`📝 Posting kit: node scripts/postkit.mjs ${name} v${version} → write ${vName}.post.md (brain/posting.md)`);
  // Remember what this reel used, so the next reels don't repeat the same jokes.
  const usageFile = path.resolve('brain', 'usage.json');
  const usage = fs.existsSync(usageFile) ? readJson(usageFile) : {reels: []};
  usage.reels = usage.reels.filter((r) => r.name !== name);
  usage.reels.push({
    name,
    date: new Date().toISOString().slice(0, 10),
    memes: (edit.memes ?? []).map((m) => m.id).filter(Boolean),
    effects: (edit.effects ?? []).map((x) => x.type),
    transitions: edit.transitions.map((t) => t.type),
    captionStyle: edit.theme.captionStyle,
  });
  writeJson(usageFile, usage);
}
// Planning-only runs leave nothing on the Mac either (use --studio to keep the temp files for Remotion Studio).
if (flag('--no-render') && !flag('--studio')) for (const f of tempFiles) fs.rmSync(f, {force: true});
if (flag('--no-render')) console.log(`\n✅ Planned (not rendered). Transcript: ${path.join(work, 'transcript.md')} · preview: npm run studio`);
timings.push([stepName, (Date.now() - stepStart) / 1000]);
console.log('\n⏱  Time spent:\n' + timings.filter(([, t]) => t >= 0.5).map(([n, t]) => `   ${t.toFixed(0).padStart(4)}s  ${n}`).join('\n'));
