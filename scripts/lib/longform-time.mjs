// Timing helpers for a long-form episode builder: find a spoken line / word in the cut (pieces.json from
// scripts/longcut.mjs) and get its time in the OUTPUT video. Lines are found by a unique piece of their text.
//   const T = loadTiming(workDir); T.at('they change the font'); T.word('they change the font', 'font'); T.end(…)
import fs from 'node:fs';
import path from 'node:path';

export function loadTiming(W) {
  const {pieces, rows, total} = JSON.parse(fs.readFileSync(path.join(W, 'pieces.json'), 'utf8'));
  const main = JSON.parse(fs.readFileSync(path.join(W, 'words.json'), 'utf8')).words;
  let extra = [];
  const gp = path.join(W, 'words-gaps.json'); if (fs.existsSync(gp)) extra = JSON.parse(fs.readFileSync(gp, 'utf8'));
  const wp = path.join(W, 'audio16.wav.win.jsonl');
  if (fs.existsSync(wp)) for (const l of fs.readFileSync(wp, 'utf8').split('\n').filter(Boolean)) extra.push(...JSON.parse(l));
  const words = [...main, ...extra].sort((a, b) => a.s - b.s);
  const norm = (x) => x.toLowerCase().replace(/[^a-z0-9$₹ ]/g, '').replace(/\s+/g, ' ').trim();
  const row = (sub) => {
    const hits = rows.map((r, i) => [r, i]).filter(([r]) => norm(r.text).includes(norm(sub)));
    if (hits.length !== 1) throw new Error(`line "${sub}": ${hits.length} matches`);
    return hits[0][1];
  };
  // source time → output time (inside a kept piece; else the nearest kept moment)
  const out = (t) => {
    for (const p of pieces) if (t >= p.s && t <= p.e) return p.at + (t - p.s);
    const nx = pieces.find((p) => p.s > t);
    return nx ? nx.at : total;
  };
  const rowPieces = (i) => pieces.filter((p) => p.row === i);
  const api = {
    total, rows, pieces,
    at: (sub) => rowPieces(row(sub))[0].at,
    end: (sub) => { const ps = rowPieces(row(sub)); const l = ps[ps.length - 1]; return l.at + (l.e - l.s); },
    // first occurrence of `w` (a word or prefix) inside the line's kept pieces
    word: (sub, w, nth = 0) => {
      const i = row(sub);
      const ps = rowPieces(i);
      const hits = words.filter((x) => norm(x.w).startsWith(norm(w)) && ps.some((p) => x.s >= p.s - 0.15 && x.s <= p.e));
      const uniq = hits.filter((x, k) => k === 0 || Math.abs(x.s - hits[k - 1].s) > 0.2);
      if (!uniq[nth]) throw new Error(`word "${w}" not in line "${sub}"`);
      return +Math.max(api.at(sub), out(uniq[nth].s)).toFixed(2);
    },
  };
  return api;
}
