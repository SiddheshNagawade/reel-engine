// Scripted long-form: turn a take-by-take cut list into exact source ranges with natural pauses.
//   node scripts/longcut.mjs <name>
// Reads _work/<name>/: words.json (+ words-gaps.json, audio16.wav.win.jsonl = extra passes over spots Whisper skipped),
// cut.txt, silences.tsv (ffmpeg silencedetect on audio16.wav). Writes pieces.json + cut-map.txt (output time → words).
// cut.txt rows: "<line> [a-b] [sep]" = a line of lines.txt (word slice a..b), "T <s> <e> [sep]" = a raw source window,
// "P <chapter>" = a chapter marker. sep: none = 0.15 s pause, "|" = end of sentence 0.4 s, "||" = end of paragraph 0.8 s.
// Pauses are real room tone (the source keeps running), and any silence INSIDE a kept range longer than 0.45 s is
// shortened to 0.25 s, so a sentence never stops dead but the edit never feels glued together.
import fs from 'node:fs';
import path from 'node:path';
import {workRoot} from './lib/paths.mjs';

const name = process.argv[2];
const W = path.join(workRoot(), name);
const main = JSON.parse(fs.readFileSync(path.join(W, 'words.json'), 'utf8')).words;
// lines exactly as lines.txt was built (gap > 0.7 s starts a new line)
const lines = [];
{ let cur = [], prev = null;
  for (const w of main) { if (prev !== null && w.s - prev > 0.7 && cur.length) { lines.push(cur); cur = []; } cur.push(w); prev = w.e; }
  if (cur.length) lines.push(cur); }
let extra = [];
const gp = path.join(W, 'words-gaps.json'); if (fs.existsSync(gp)) extra = JSON.parse(fs.readFileSync(gp, 'utf8'));
const wp = path.join(W, 'audio16.wav.win.jsonl');
if (fs.existsSync(wp)) for (const l of fs.readFileSync(wp, 'utf8').split('\n').filter(Boolean)) extra.push(...JSON.parse(l));
const all = [...main, ...extra].sort((a, b) => a.s - b.s);
const sil = fs.readFileSync(path.join(W, 'silences.tsv'), 'utf8').trim().split('\n').map((l) => l.split('\t').map(Number)).filter((x) => x.length === 2);
const nextSpeech = (t) => { const s = sil.find(([a, b]) => a <= t + 0.02 && b > t); return s ? s[1] : t; }; // end of the silence we're in

const PAUSE = {'': 0.15, '|': 0.4, '||': 0.8};
const rows = [];
let chapter = 'intro';
for (const raw of fs.readFileSync(path.join(W, 'cut.txt'), 'utf8').split('\n')) {
  const l = raw.trim();
  if (!l || l.startsWith('#')) continue;
  const p = l.split(/\s+/);
  if (p[0] === 'P') { chapter = p[1]; continue; }
  const sep = ['|', '||'].includes(p[p.length - 1]) ? p.pop() : '';
  let s, e, text;
  if (p[0] === 'T') {
    s = Number(p[1]); e = Number(p[2]);
    const ws = all.filter((w) => w.s >= s - 0.05 && w.s < e);
    text = [...new Set(ws.map((w) => `${w.s.toFixed(1)}:${w.w}`))].map((x) => x.split(':').slice(1).join(':')).join(' ');
  } else {
    const ln = lines[Number(p[0]) - 1];
    const [a, b] = p[1] ? p[1].split('-').map(Number) : [0, ln.length];
    const ws = ln.slice(a, Math.min(b, ln.length));
    s = ws[0].s - 0.06; e = ws[ws.length - 1].e;
    text = ws.map((w) => w.w).join(' ');
  }
  // snap to the real edges of his speech (Whisper's word times drift): start just before the silence ends,
  // end just after the next silence starts, so no first/last word is clipped
  const before = sil.find(([a, b]) => b >= s - 0.5 && b <= s + 0.3);
  if (before) s = Math.max(before[0], before[1] - 0.1);
  const after = sil.find(([a]) => a >= e - 0.3 && a <= e + 0.6);
  if (after) e = after[0] + 0.08;
  rows.push({s, e, sep, text, chapter});
}
// a range → pieces with long inner silences shortened; the row's end gets its pause from the real room tone
const pieces = [];
for (const [i, r] of rows.entries()) {
  const inner = sil.filter(([a, b]) => a > r.s + 0.1 && b < r.e - 0.1 && b - a > 0.45);
  let cur = r.s;
  for (const [a, b] of inner) { pieces.push({s: cur, e: a + 0.13, row: i}); cur = b - 0.12; }
  const want = PAUSE[r.sep];
  // if he keeps talking right after (a retake starts), don't eat into it
  const room = Math.max(0.08, nextSpeech(r.e) - r.e - 0.05);
  pieces.push({s: cur, e: r.e + Math.min(want, room) + 0.05, row: i});
}
let t = 0;
const map = [];
for (const pc of pieces) { pc.at = +t.toFixed(3); t += pc.e - pc.s; }
for (const [i, r] of rows.entries()) { const first = pieces.find((pc) => pc.row === i); map.push(`${first.at.toFixed(1)}\t[${r.chapter}] ${r.text}`); r.at = first.at; }
fs.writeFileSync(path.join(W, 'pieces.json'), JSON.stringify({total: +t.toFixed(3), pieces, rows}, null, 0));
fs.writeFileSync(path.join(W, 'cut-map.txt'), map.join('\n'));
console.log(`${rows.length} rows → ${pieces.length} pieces, ${(t / 60).toFixed(2)} min`);
