// Final Cut Pro project export (FCPXML 1.11).
// Every clip on the timeline points at the ORIGINAL full recording with in/out points, so dragging a clip's edge
// in Final Cut reveals the rest of the footage. Captions become editable titles, memes/sounds become connected clips,
// camera moves become markers, and the finished MP4 sits on a disabled top lane as a reference.
import fs from 'node:fs';
import path from 'node:path';
import {ffmpeg} from './media.mjs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const url = (p) => 'file://' + p.split('/').map(encodeURIComponent).join('/');
const T = (frames, fps = 30) => `${Math.round(frames)}/${fps}s`; // frame-aligned rational time
const TITLE_UID = '.../Titles.localized/Bumper:Opener.localized/Basic Title.localized/Basic Title.moti';

// Final Cut can't read transparent WebM, so stickers are converted once to ProRes 4444 (with alpha), kept on the drive.
async function fcpReadySticker(srcAbs, cacheDir) {
  fs.mkdirSync(cacheDir, {recursive: true});
  const out = path.join(cacheDir, path.basename(path.dirname(srcAbs)) + '.mov');
  if (!fs.existsSync(out)) {
    await ffmpeg(['-y', '-c:v', 'libvpx-vp9', '-i', srcAbs, '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-an', out]);
  }
  return out;
}

export async function writeFcpxml({edit, virtSegs, clips, clipAt, fps = 30, outFile, title, referenceMp4, publicDir, cacheDir}) {
  const res = [];
  const assetIds = new Map();
  let n = 1;
  res.push(`<format id="r1" name="FFVideoFormat1080x1920p30" frameDuration="1/${fps}s" width="1080" height="1920"/>`);
  res.push(`<effect id="r2" name="Basic Title" uid="${TITLE_UID}"/>`);
  const asset = (file, {video = true, audio = true, duration}) => {
    if (assetIds.has(file)) return assetIds.get(file);
    const id = `a${n++}`;
    assetIds.set(file, id);
    res.push(
      `<asset id="${id}" name="${esc(path.basename(file))}" start="0s" duration="${T(Math.ceil(duration * fps))}" hasVideo="${video ? 1 : 0}" hasAudio="${audio ? 1 : 0}"${video ? ' format="r1"' : ''}><media-rep kind="original-media" src="${url(file)}"/></asset>`,
    );
    return id;
  };

  const spine = [];
  let tsN = 1;
  for (const [i, s] of edit.segments.entries()) {
    const v = virtSegs[i];
    const offset = T(s.outFrame);
    const dur = T(s.frames);
    if (s.freeze) {
      spine.push(`<gap name="Freeze beat (B&amp;W + sound in the MP4)" offset="${offset}" duration="${dur}" start="0s"><marker start="0s" duration="1/${fps}s" value="Freeze-frame beat"/></gap>`);
      continue;
    }
    const k = clipAt(v.srcFrame / fps);
    const c = clips[k];
    const localFrame = Math.max(0, Math.round((v.srcFrame / fps - c.offset) * fps));
    const id = asset(c.src, {duration: c.duration});
    const startF = localFrame; // clip's in-point in the source
    const toLocal = (outF) => T(startF + (outF - s.outFrame)); // connected items are timed in the parent's source time
    const inside = (f0, f1) => f0 < s.outFrame + s.frames && f1 > s.outFrame;
    const kids = []; // titles + connected clips
    const marks = []; // markers must come after them (FCPXML order)
    const adj = [];
    if (s.zoom && s.zoom !== 1) adj.push(`<adjust-transform scale="${s.zoom.toFixed(3)} ${s.zoom.toFixed(3)}"/>`);

    // Captions → editable titles (lane 1), clipped to this segment.
    for (const g of edit.captions) {
      if (!inside(g.f0, g.f1)) continue;
      const f0 = Math.max(g.f0, s.outFrame);
      const f1 = Math.min(g.f1, s.outFrame + s.frames);
      if (f1 - f0 < 2) continue;
      const text = g.words.map((w) => w.w).join(' ');
      const ts = `ts${tsN++}`;
      kids.push(
        `<title ref="r2" lane="1" offset="${toLocal(f0)}" duration="${T(f1 - f0)}" name="${esc(text)}">` +
          `<param name="Position" key="9999/999166631/999166633/1/100/101" value="0 -270"/>` +
          `<text><text-style ref="${ts}">${esc(text)}</text-style></text>` +
          `<text-style-def id="${ts}"><text-style font="Helvetica Neue" fontSize="84" fontFace="Bold" fontColor="1 1 1 1" bold="1" strokeColor="0 0 0 1" strokeWidth="-4" alignment="center"/></text-style-def>` +
          `</title>`,
      );
    }
    // Memes: sticker (lane 2) and sound (lane -1), plus a marker.
    for (const m of edit.memes ?? []) {
      if (m.f < s.outFrame || m.f >= s.outFrame + s.frames) continue;
      const frames = Math.min(m.frames, s.outFrame + s.frames - m.f);
      if (m.visual && m.isVideo) {
        const mov = await fcpReadySticker(path.join(publicDir, m.visual), cacheDir);
        kids.push(`<asset-clip ref="${asset(mov, {audio: false, duration: frames / fps + 5})}" lane="2" offset="${toLocal(m.f)}" duration="${T(frames)}" start="0s" name="${esc(m.id ?? 'meme')}"/>`);
      }
      if (m.sound) {
        kids.push(`<asset-clip ref="${asset(path.join(publicDir, m.sound), {video: false, duration: frames / fps + 5})}" lane="-1" offset="${toLocal(m.f)}" duration="${T(frames)}" start="0s" name="${esc((m.id ?? 'meme') + ' sound')}"/>`);
      }
      marks.push(`<marker start="${toLocal(m.f)}" duration="1/${fps}s" value="${esc('Meme: ' + (m.id ?? ''))}"/>`);
    }
    for (const x of edit.sfx ?? []) {
      if (x.f < s.outFrame || x.f >= s.outFrame + s.frames) continue;
      kids.push(`<asset-clip ref="${asset(path.join(publicDir, x.src), {video: false, duration: 3})}" lane="-2" offset="${toLocal(x.f)}" duration="${T(Math.min(30, s.outFrame + s.frames - x.f))}" start="0s" name="sfx"/>`);
    }
    for (const mv of edit.moves ?? []) {
      if (mv.f >= s.outFrame && mv.f < s.outFrame + s.frames) marks.push(`<marker start="${toLocal(mv.f)}" duration="1/${fps}s" value="Camera ${mv.type === 'push' ? 'push-in' : 'pull-out'} (in MP4)"/>`);
    }
    // The finished MP4 as a disabled reference on the first clip (lane 10).
    if (i === 0 && referenceMp4) {
      kids.push(`<asset-clip ref="${asset(referenceMp4, {duration: edit.durationInFrames / fps})}" lane="10" offset="${T(startF)}" duration="${T(edit.durationInFrames)}" start="0s" enabled="0" name="Finished reel (reference)"/>`);
    }
    spine.push(`<asset-clip ref="${id}" offset="${offset}" name="${esc(path.basename(c.src))}" start="${T(startF)}" duration="${dur}" format="r1" tcFormat="NDF">${adj.join('')}${kids.join('')}${marks.join('')}</asset-clip>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.11">
<resources>
${res.join('\n')}
</resources>
<library>
<event name="ReelEngine">
<project name="${esc(title)}">
<sequence format="r1" duration="${T(edit.durationInFrames)}" tcStart="0s" tcFormat="NDF" audioLayout="stereo" audioRate="48k">
<spine>
${spine.join('\n')}
</spine>
</sequence>
</project>
</event>
</library>
</fcpxml>
`;
  fs.writeFileSync(outFile, xml);
  return outFile;
}

// "Exact look" export: the RENDERED reel, bladed at every cut, so the look is identical to the MP4 and each piece can be
// trimmed / removed / reordered in Final Cut. (Can't be extended past the cut: the rendered file only holds the reel.)
export function writeRenderedFcpxml({edit, mp4, fps = 30, outFile, title}) {
  const cuts = [...new Set([0, ...edit.segments.map((s) => s.outFrame), edit.durationInFrames])].sort((a, b) => a - b);
  const clipsXml = cuts.slice(0, -1).map((f, i) => {
    const len = cuts[i + 1] - f;
    const words = edit.captions.filter((g) => g.f0 >= f && g.f0 < f + len).flatMap((g) => g.words.map((w) => w.w)).slice(0, 6).join(' ');
    return `<asset-clip ref="a1" offset="${T(f)}" start="${T(f)}" duration="${T(len)}" name="${esc(`${i + 1}. ${words || 'clip'}`)}" format="r1" tcFormat="NDF"/>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.11">
<resources>
<format id="r1" name="FFVideoFormat1080x1920p30" frameDuration="1/${fps}s" width="1080" height="1920"/>
<asset id="a1" name="${esc(path.basename(mp4))}" start="0s" duration="${T(edit.durationInFrames)}" hasVideo="1" hasAudio="1" format="r1"><media-rep kind="original-media" src="${url(mp4)}"/></asset>
</resources>
<library>
<event name="ReelEngine">
<project name="${esc(title)}">
<sequence format="r1" duration="${T(edit.durationInFrames)}" tcStart="0s" tcFormat="NDF" audioLayout="stereo" audioRate="48k">
<spine>
${clipsXml.join('\n')}
</spine>
</sequence>
</project>
</event>
</library>
</fcpxml>
`;
  fs.writeFileSync(outFile, xml);
  return outFile;
}
