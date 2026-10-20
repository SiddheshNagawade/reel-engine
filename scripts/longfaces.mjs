// Scripted long-form: where his face is in every kept line of base.mp4 → faces-pieces.json [{at, d, fx, fy}]
// (fx = face centre, fy = eye line, fractions of the frame). Episode.tsx uses it so the eye level stays the same in
// every shot and across jump cuts.   node scripts/longfaces.mjs <name>   (needs faces.json from faceboxes.py on base.mp4)
import fs from 'node:fs';
import path from 'node:path';
import {workRoot} from './lib/paths.mjs';

const W = path.join(workRoot(), process.argv[2]);
const {pieces, rows, speed = 1} = JSON.parse(fs.readFileSync(path.join(W, 'pieces.json'), 'utf8'));
const faces = JSON.parse(fs.readFileSync(path.join(W, 'faces.json'), 'utf8'));
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
let last = {fx: 0.53, fy: 0.36};
const out = rows.map((r, i) => {
  const ps = pieces.filter((p) => p.row === i);
  const at = ps[0].at, d = ps.reduce((a, p) => a + (p.e - p.s) / speed, 0);
  // biggest face in each sample inside this line
  const hits = faces.filter((f) => f.t >= at && f.t < at + d && f.b.length).map((f) => f.b.reduce((m, b) => (b[2] * b[3] > m[2] * m[3] ? b : m)));
  if (hits.length) last = {fx: +med(hits.map((b) => b[0] + b[2] / 2)).toFixed(4), fy: +med(hits.map((b) => b[1] + b[3] * 0.42)).toFixed(4)};
  return {at, d: +d.toFixed(3), ...last};
});
fs.writeFileSync(path.join(W, 'faces-pieces.json'), JSON.stringify(out));
console.log(`${out.length} lines; eye line ${Math.min(...out.map((o) => o.fy)).toFixed(2)}–${Math.max(...out.map((o) => o.fy)).toFixed(2)}, centre ${Math.min(...out.map((o) => o.fx)).toFixed(2)}–${Math.max(...out.map((o) => o.fx)).toFixed(2)}`);
