// direction.evidence → ready for the plan: reads the sidecar .json that capture.mjs / refs.mjs clip wrote next to each
// capture or clip, so the direction only names WHAT to show and which line to mark:
//   {at, until|seconds, look: "page", page: "captures/<id>", mark: 0 | [0, 1], zoomWord, markWord, source?}
//   {at, until|seconds, look: "clip", clip: "clips/<id>", name?, role?, source?, volume: 1}
//   {at, until|seconds, look: "logo", logo: "stickers/logo-zomato/sticker.svg", title: "Zomato", bg: "#E23744"}
// Paths are relative to _work/<reel>/ (captures, clips) or the Library (logos); reel.mjs stages the files.
import fs from 'node:fs';
import path from 'node:path';
import {libraryRoot} from './paths.mjs';

const readMeta = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null);

export function resolveEvidence(direction, work) {
  for (const x of direction?.evidence ?? []) {
    if (x.look === 'page' && x.page) {
      const meta = readMeta(path.join(work, `${x.page}.json`));
      if (!meta) { console.log(`  (evidence page not found: ${x.page}.json — run scripts/capture.mjs)`); continue; }
      const idx = x.mark == null ? [] : [].concat(x.mark);
      x.media = {file: `${x.page}.jpg`};
      x.pageSize = {w: meta.width, h: meta.height};
      x.marks ??= idx.flatMap((i) => meta.found?.[i]?.rects ?? []);
      x.site ??= new URL(meta.url).hostname.replace(/^www\./, '');
      x.source ??= meta.site;
    } else if (x.look === 'clip' && x.clip) {
      const meta = readMeta(path.join(work, `${x.clip}.json`)) ?? {};
      x.media = {file: `${x.clip}.mp4`, video: true};
      x.name ??= meta.channel;
      x.role ??= meta.site === 'Youtube' ? 'YouTube' : meta.site;
      x.source ??= meta.channel ? `${meta.channel}${meta.site ? ` / ${meta.site === 'Youtube' ? 'YouTube' : meta.site}` : ''}` : undefined;
    } else if (x.look === 'logo' && x.logo) {
      x.media = {file: x.logo};
      if (!x.bg) {
        const about = path.join(libraryRoot(), path.dirname(x.logo), 'about.txt');
        const hex = fs.existsSync(about) && fs.readFileSync(about, 'utf8').match(/Brand colour: (#[0-9a-f]{6})/i)?.[1];
        x.bg = '#ffffff';
        if (hex && x.brandBg) x.bg = hex;
      }
    }
  }
  return direction;
}
