// Cut audit: does any cut land on sound instead of a pause? (a clipped word start or tail)
// From the AI-editing blueprint he shared: "every cut measured on the waveform". Our cuts sit in the gaps between
// Whisper's word times plus padding, but Whisper's times drift, so the only proof is the audio itself.
// Measures 25 ms on each side of every cut in the cut footage (selects = output timeline) against the voice level.
import {spawnSync} from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';

const RATE = 8000;

export function auditCuts(file, segments, fps, words = []) {
  const r = spawnSync(ffmpegPath, ['-v', 'error', '-i', file, '-vn', '-ac', '1', '-ar', String(RATE), '-f', 's16le', '-'], {maxBuffer: 1 << 30});
  if (r.status !== 0) return {cuts: 0, flagged: [], error: String(r.stderr).slice(-300)};
  const pcm = new Int16Array(r.stdout.buffer, r.stdout.byteOffset, Math.floor(r.stdout.length / 2));
  const db = (a, b) => {
    const i0 = Math.max(0, Math.round(a * RATE)), i1 = Math.min(pcm.length, Math.round(b * RATE));
    if (i1 <= i0) return -90;
    let sum = 0;
    for (let i = i0; i < i1; i++) sum += pcm[i] * pcm[i];
    return 20 * Math.log10(Math.sqrt(sum / (i1 - i0)) / 32768 + 1e-9);
  };
  // the voice level: 75th percentile of 50 ms windows; "sound" = within 12 dB of it
  const wins = [];
  for (let t = 0; t + 0.05 < pcm.length / RATE; t += 0.05) wins.push(db(t, t + 0.05));
  wins.sort((a, b) => a - b);
  const voice = wins[Math.floor(wins.length * 0.75)] ?? -30;
  const loud = voice - 12;
  const flagged = [];
  segments.forEach((s, k) => {
    if (k === 0 || s.freeze || segments[k - 1].freeze) return; // freezes are silent holds on purpose
    const t = s.outFrame / fps;
    const before = db(t - 0.025, t), after = db(t, t + 0.025); // the 25 ms touching the cut: a word ending just before is fine
    if (before < loud && after < loud) return;
    const near = words.filter((w) => w.f0 <= s.outFrame + fps * 0.6 && w.f1 >= s.outFrame - fps * 0.6).map((w) => w.w).join(' ');
    flagged.push({
      frame: s.outFrame, t: +t.toFixed(2), before: +before.toFixed(1), after: +after.toFixed(1),
      what: before >= loud && after >= loud ? 'cut inside sound (word may be clipped on both sides)' : before >= loud ? 'end of a word may be clipped' : 'start of a word may be clipped',
      near,
    });
  });
  return {cuts: segments.length - 1, voice: +voice.toFixed(1), flagged};
}
