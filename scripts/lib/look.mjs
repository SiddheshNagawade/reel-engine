// The film look ("our earlier look", his pick 2026-10-15) applied as LOGIC, not fixed numbers (brain/color.md
// "The look = logic"). style.json film values are the look on his reference scene (img-1391: indoor, white wall, warm
// bulb). For every video we measure the footage and move each knob by WHY it exists:
//   contrast  → gives depth: flat footage gets more, already punchy footage less
//   saturate  → gives life: grey/washed footage gets more, already vivid footage less (no neon skin)
//   warmth    → a warm, friendly skin glow: a scene already warm (orange light = HIS mood) gets less so it isn't
//               doubled, a cool/blue scene a bit more; big bright white walls keep it low (they turn yellow first)
//   vignette  → pulls the eye to the centre: dark scenes get less (no crushed corners)
//   grain     → film texture: dark/noisy footage already has texture, gets less
// Measured on the kept footage by ffmpeg (tiny frames, ~1 s, no tokens). Manual styleOverride.film values always win.
import {spawn} from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';

// Reference scene stats (img-1391 selects, measured 2026-10-15): the scene the base numbers were tuned on.
export const REF = {spread: 0.855, sat: 0.312, warm: 0.17, bright: 0.59, whiteWall: 0.35};

const HLG = 'zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=mobius:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,';

export function measureLook(video, {hlg = false} = {}) {
  return new Promise((resolve) => {
    const p = spawn(ffmpegPath, ['-nostdin', '-loglevel', 'error', '-skip_frame', 'nokey', '-i', video, '-vf', `${hlg ? HLG : ''}scale=36:64`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], {stdio: ['ignore', 'pipe', 'ignore']});
    const chunks = [];
    p.stdout.on('data', (d) => chunks.push(d));
    p.on('close', () => {
      const buf = Buffer.concat(chunks);
      const lum = [];
      let sat = 0, warm = 0, wn = 0, white = 0, n = 0;
      for (let i = 0; i + 2 < buf.length; i += 3) {
        const r = buf[i] / 255, g = buf[i + 1] / 255, b = buf[i + 2] / 255;
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        lum.push(y);
        sat += mx ? (mx - mn) / mx : 0;
        if (y > 0.25 && y < 0.95) { warm += r - b; wn++; } // colour of the light, from mid/bright areas
        if (y > 0.75 && mx - mn < 0.12) white++;
        n++;
      }
      if (!n) return resolve(null);
      lum.sort((a, b) => a - b);
      const q = (x) => lum[Math.floor(x * (lum.length - 1))];
      resolve({spread: q(0.95) - q(0.05), sat: sat / n, warm: wn ? warm / wn : 0, bright: lum.reduce((a, b) => a + b, 0) / n, whiteWall: white / n});
    });
  });
}

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// base = style.json film; m = measureLook(); returns film values for THIS footage + one line per decision (the why).
export function adaptFilm(base, m) {
  if (!m) return {film: {}, why: ['look: no measurement, base values']};
  const film = {}, why = [];
  const set = (k, v, reason) => { film[k] = +v.toFixed(3); if (Math.abs(v - base[k]) > 0.005) why.push(`${k} ${base[k]} → ${film[k]} (${reason})`); };
  set('contrast', clamp(base.contrast + (REF.spread - m.spread) * 0.35, 1.0, 1.2), m.spread < REF.spread ? 'flatter than the reference' : 'already punchy');
  set('saturate', clamp(base.saturate + (REF.sat - m.sat) * 0.6, 0.98, 1.25), m.sat < REF.sat ? 'greyer than the reference' : 'already colourful');
  let w = base.warmth - (m.warm - REF.warm) * 1.6; // warmer light → less added warmth (keep his mood, don't double it)
  if (m.whiteWall > REF.whiteWall) w -= (m.whiteWall - REF.whiteWall) * 0.4; // big white walls yellow first
  set('warmth', clamp(w, 0.03, 0.24), w > base.warmth ? 'cooler light than the reference' : m.warm > REF.warm ? 'scene light already warm, keep his mood' : 'lots of white wall');
  set('vignette', clamp(base.vignette - Math.max(0, REF.bright - m.bright - 0.05) * 1.5, 0.25, base.vignette), 'dark scene, keep corners alive');
  set('grain', clamp(base.grain - Math.max(0, REF.bright - m.bright - 0.05) * 0.15, 0.06, base.grain), 'dark footage already has texture');
  return {film, why: why.length ? why : ['look: scene close to the reference, base values']};
}
