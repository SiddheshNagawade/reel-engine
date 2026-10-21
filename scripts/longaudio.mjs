// Scripted long-form: build the cut's audio EXACTLY in piece order (sample-accurate copy from a 48 kHz 16-bit WAV),
// then apply the speed. ffmpeg's select filter keeps source order, so a cold open moved to the front would stay in
// place and every graphic would drift; this never reorders or drops a sample.
//   node scripts/longaudio.mjs <name> <source.wav> <out.wav>
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import {workRoot} from './lib/paths.mjs';

const [name, srcWav, outWav] = process.argv.slice(2);
const W = path.join(workRoot(), name);
const {pieces, speed = 1} = JSON.parse(fs.readFileSync(path.join(W, 'pieces.json'), 'utf8'));
const fd = fs.openSync(srcWav, 'r');
const head = Buffer.alloc(65536); fs.readSync(fd, head, 0, 65536, 0);
let off = 12, fmt = null, dataAt = -1, dataLen = 0;
while (off < 65536 - 8) { const id = head.toString('ascii', off, off + 4), len = head.readUInt32LE(off + 4); if (id === 'fmt ') fmt = {ch: head.readUInt16LE(off + 10), rate: head.readUInt32LE(off + 12), bits: head.readUInt16LE(off + 22)}; if (id === 'data') { dataAt = off + 8; dataLen = len; break; } off += 8 + len; }
if (dataAt < 0) throw new Error('no data chunk in ' + srcWav);
const bps = fmt.ch * fmt.bits / 8;
const chunks = [];
for (const p of pieces) {
  const a = Math.max(0, Math.round(Math.max(0, p.s) * fmt.rate)), b = Math.round(p.e * fmt.rate);
  const buf = Buffer.alloc((b - a) * bps);
  fs.readSync(fd, buf, 0, buf.length, dataAt + a * bps);
  // 3 ms fades at every join so no cut clicks
  const f = Math.min(144, (b - a) >> 2);
  for (let i = 0; i < f; i++) for (let c = 0; c < fmt.ch; c++) {
    for (const j of [i, b - a - 1 - i]) { const o = (j * fmt.ch + c) * 2; buf.writeInt16LE(Math.round(buf.readInt16LE(o) * (i / f)), o); }
  }
  chunks.push(buf);
}
const data = Buffer.concat(chunks);
const hdr = Buffer.alloc(44);
hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + data.length, 4); hdr.write('WAVEfmt ', 8); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20);
hdr.writeUInt16LE(fmt.ch, 22); hdr.writeUInt32LE(fmt.rate, 24); hdr.writeUInt32LE(fmt.rate * bps, 28); hdr.writeUInt16LE(bps, 32); hdr.writeUInt16LE(fmt.bits, 34); hdr.write('data', 36); hdr.writeUInt32LE(data.length, 40);
const raw = outWav + '.raw.wav';
fs.writeFileSync(raw, Buffer.concat([hdr, data]));
const r = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', raw, '-af', `atempo=${speed},loudnorm=I=-14:TP=-1.5:LRA=9`, '-ar', '48000', outWav]);
fs.rmSync(raw, {force: true});
if (r.status !== 0) throw new Error(String(r.stderr));
console.log(`audio ${((data.length / bps / fmt.rate) / speed / 60).toFixed(2)} min → ${outWav}`);
