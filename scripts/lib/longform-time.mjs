// Timing helpers for a long-form episode builder: find a spoken line / word in the cut (pieces.json from
// scripts/longcut.mjs) and get its time in the OUTPUT video. Lines are found by a unique piece of their text.
//   const T = loadTiming(workDir); T.at('they change the font'); T.word('they change the font', 'font'); T.end(…)
import fs from 'node:fs';
import path from 'node:path';

export function loadTiming(W) {
  const {pieces, rows, total, speed = 1} = JSON.parse(fs.readFileSync(path.join(W, 'pieces.json'), 'utf8'));
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
    for (const p of pieces) if (t >= p.s && t <= p.e) return p.at + (t - p.s) / speed;
    const nx = pieces.find((p) => p.s > t);
    return nx ? nx.at : total;
  };
  const rowPieces = (i) => pieces.filter((p) => p.row === i);
  // word times measured on the FINAL cut audio (cutwords.json = Whisper on cutaudio.wav), aligned to the lines:
  // graphics then fire on the actual spoken word, not on an estimate
  const cwp = path.join(W, 'cutwords.json');
  const heard = new Map(); // row index → [{w, s}]
  if (fs.existsSync(cwp)) {
    const cw = JSON.parse(fs.readFileSync(cwp, 'utf8')).words;
    const rw = []; rows.forEach((r, i) => r.text.split(/\s+/).map(norm).filter(Boolean).forEach((w) => rw.push({w, i})));
    // greedy in-order alignment: each line word finds the next matching heard word within a short window
    let k = 0;
    for (const x of rw) {
      for (let j = k; j < Math.min(cw.length, k + 12); j++) if (norm(cw[j].w) === x.w) { (heard.get(x.i) ?? heard.set(x.i, []).get(x.i)).push({w: x.w, s: cw[j].s}); k = j + 1; break; }
    }
  }
  const startOf = (i) => { const ps = rowPieces(i)[0].at; const h = heard.get(i)?.[0]; return h && Math.abs(h.s - ps) < 1.5 ? h.s : ps; };
  const api = {
    total, rows, pieces,
    at: (sub) => +startOf(row(sub)).toFixed(2),
    end: (sub) => { const ps = rowPieces(row(sub)); const l = ps[ps.length - 1]; return l.at + (l.e - l.s) / speed; },
    // first occurrence of `w` (a word or prefix) inside the line's kept pieces
    word: (sub, w, nth = 0) => {
      const i = row(sub);
      const hh = (heard.get(i) ?? []).filter((x) => x.w.startsWith(norm(w)));
      if (hh[nth]) return +Math.max(startOf(i), hh[nth].s).toFixed(2);
      const ps = rowPieces(i);
      const hits = words.filter((x) => norm(x.w).startsWith(norm(w)) && ps.some((p) => x.s >= p.s - 0.15 && x.s <= p.e));
      const uniq = hits.filter((x, k) => k === 0 || Math.abs(x.s - hits[k - 1].s) > 0.2);
      if (!uniq[nth]) throw new Error(`word "${w}" not in line "${sub}"`);
      return +Math.max(startOf(i), out(uniq[nth].s)).toFixed(2);
    },
  };
  return api;
}
