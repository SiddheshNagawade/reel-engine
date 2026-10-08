import {spawn} from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';

export const ffmpeg = (args) =>
  new Promise((resolve, reject) => {
    const p = spawn(ffmpegPath, ['-hide_banner', ...args]);
    let err = '';
    p.stderr.on('data', (d) => (err += d));
    p.on('close', (code) => (code === 0 ? resolve(err) : reject(new Error(`ffmpeg failed (${code}):\n${err.slice(-2000)}`))));
  });

export async function probe(file) {
  // ffmpeg -i always exits non-zero without an output; we only need its stderr.
  const err = await ffmpeg(['-i', file, '-f', 'null', '-t', '0', '-']).catch((e) => e.message);
  const d = err.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const v = err.match(/Video:.*?(\d{2,5})x(\d{2,5})/);
  const ct = err.match(/creation_time\s*:\s*(\S+)/);
  return {
    creationTime: ct ? ct[1] : null,
    duration: d ? +d[1] * 3600 + +d[2] * 60 + +d[3] : 0,
    width: v ? +v[1] : 0,
    height: v ? +v[2] : 0,
    hasAudio: /Audio:/.test(err),
    hdr: /arib-std-b67|smpte2084/.test(err), // iPhone HLG / HDR10 footage → needs tone-mapping to look right
  };
}

// Constant 30fps H.264, sized to cover 1080x1920, voice cleaned and loudness-normalised (-14 LUFS, the reels standard).
export async function normalize(input, output) {
  await ffmpeg([
    '-y', '-i', input,
    '-vf', "fps=30,scale='if(gt(a,9/16),-2,1080)':'if(gt(a,9/16),1920,-2)':flags=lanczos,format=yuv420p",
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', '-g', '30',
    '-af', 'highpass=f=80,afftdn=nf=-25,loudnorm=I=-14:TP=-1.5:LRA=11',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    '-movflags', '+faststart', output,
  ]);
}

export async function extractAudio(input, output) {
  await ffmpeg(['-y', '-i', input, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '48k', output]);
}

export async function detectSilences(input, noiseDb, minDur, duration) {
  const err = await ffmpeg(['-i', input, '-vn', '-af', `silencedetect=noise=${noiseDb}dB:d=${minDur}`, '-f', 'null', '-']);
  const out = [];
  let start = null;
  for (const line of err.split('\n')) {
    const s = line.match(/silence_start: (-?[\d.]+)/);
    const e = line.match(/silence_end: ([\d.]+)/);
    if (s) start = Math.max(0, +s[1]);
    if (e && start !== null) {
      out.push([start, +e[1]]);
      start = null;
    }
  }
  if (start !== null) out.push([start, duration]);
  return out;
}

// Frame-exact piece of a source clip, conformed to 1080x1920 @30fps, PCM audio (lossless for joining).
// Proper HDR → SDR conversion (otherwise iPhone HDR footage looks washed out and grey).
const TONEMAP = 'zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,';

export async function extractPiece(src, start, frames, out, fps = 30, freeze = false, hdr = false) {
  const dur = (frames / fps).toFixed(4);
  // freeze = hold one frame in silence (comedic beat)
  const hold = (freeze ? 'trim=end_frame=1,tpad=stop_mode=clone:stop=-1,' : '') + (hdr ? TONEMAP : '');
  await ffmpeg([
    '-y', '-ss', start.toFixed(4), '-i', src,
    '-vf', `${hold}fps=${fps},scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,setsar=1,format=yuv420p`,
    '-frames:v', String(frames),
    '-af', `aresample=48000,${freeze ? 'volume=0,' : ''}apad`, '-t', dur,
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', '-g', '30',
    '-c:a', 'pcm_s16le', '-ac', '2', out,
  ]);
}

// Join pieces, then clean + loudness-normalise the voice once over the whole reel.
export async function joinPieces(pieces, out, workDir) {
  const list = `${workDir}/pieces.txt`;
  const fs = await import('node:fs');
  fs.writeFileSync(list, pieces.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'));
  const raw = `${workDir}/joined.mov`;
  await ffmpeg(['-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', raw]);
  await ffmpeg([
    '-y', '-i', raw, '-c:v', 'copy',
    '-af', 'highpass=f=80,afftdn=nf=-25,loudnorm=I=-14:TP=-1.5:LRA=11',
    '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-movflags', '+faststart', out,
  ]);
  fs.rmSync(raw);
}

// Loudness (dB) of each word, from the clip's audio: lets the director hear raised voices.
export async function wordLoudness(audio, words) {
  const {spawn} = await import('node:child_process');
  const pcm = await new Promise((resolve) => {
    const p = spawn(ffmpegPath, ['-hide_banner', '-loglevel', 'error', '-i', audio, '-ac', '1', '-ar', '8000', '-f', 's16le', '-']);
    const chunks = [];
    p.stdout.on('data', (d) => chunks.push(d));
    p.on('close', () => resolve(Buffer.concat(chunks)));
  });
  const n = pcm.length / 2;
  return words.map((w) => {
    const a = Math.max(0, Math.floor(w.s * 8000)), b = Math.min(n, Math.ceil(w.e * 8000));
    let sum = 0;
    for (let i = a; i < b; i++) sum += (pcm.readInt16LE(i * 2) / 32768) ** 2;
    return b > a ? +(10 * Math.log10(sum / (b - a) + 1e-10)).toFixed(1) : -90;
  });
}
