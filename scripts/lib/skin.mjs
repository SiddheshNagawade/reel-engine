// Skin balance → per-shot white-balance gains (scripts/skinbalance.py measures, this decides).
// Per shot: median of the samples inside it. Then neighbouring shots with nearly the same light share one value
// (smoothing idea from AKMessi/vex: no colour flicker across jump cuts in one continuous shot). Tiny fixes are dropped.
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 1; };
const near = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 0.025);

export function skinBalanceSegments(segments, samples, {min = 0.015} = {}) {
  const per = segments.map((s) => {
    const inside = samples.filter((x) => x.f >= s.srcFrame && x.f < s.srcFrame + s.frames);
    return inside.length ? [0, 1, 2].map((c) => median(inside.map((x) => x.gains[c]))) : null;
  });
  // fill shots without a face sample from the nearest neighbour (same room, same light)
  for (let i = 0; i < per.length; i++) if (!per[i]) per[i] = per[i - 1] ?? per.slice(i + 1).find(Boolean) ?? [1, 1, 1];
  // group runs of similar light, give each run its median
  const out = [];
  let run = [0];
  const flush = () => {
    const g = [0, 1, 2].map((c) => median(run.map((i) => per[i][c])));
    for (const i of run) out[i] = g;
  };
  for (let i = 1; i < per.length; i++) {
    if (near(per[i], per[run[0]])) run.push(i);
    else { flush(); run = [i]; }
  }
  if (per.length) flush();
  return segments.map((s, i) => {
    const g = out[i];
    const {wb, ...rest} = s;
    return g && g.some((v) => Math.abs(v - 1) >= min) ? {...rest, wb: g.map((v) => +v.toFixed(4))} : rest;
  });
}
