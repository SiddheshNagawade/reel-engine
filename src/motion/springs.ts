// Spring presets by WEIGHT: the same kind of thing always moves with the same physics, so a reel feels like one piece.
// Values from howseen-ai/claude-motion-design (MIT), "Spring presets" (stiffness k, damping d, mass 1):
//   snappy     320/30  small UI: labels, tags, pills, markers, ticks, counters landing (fast, almost no overshoot)
//   container  170/26  cards, boards, panels, the camera, whole charts flying in (smooth, no overshoot)
//   heavy      120/24  big type, logos, buildings rising, bars growing (slow, settles with weight)
//   playful    180/12  mascots, drawn objects popping in, pins, stickers (bouncy: use only where fun fits)
// Their anti-"AI motion" rule: damping ratio >= 0.72 for anything serious; only `playful` bounces.
// Closed-form step response (no simulation), so any frame can be computed on its own (Remotion renders out of order).
export const WEIGHTS = {
  snappy: {k: 320, d: 30},
  container: {k: 170, d: 26},
  heavy: {k: 120, d: 24},
  playful: {k: 180, d: 12},
} as const;
export type Weight = keyof typeof WEIGHTS;

// 0 → 1 after s seconds (overshoots for under-damped weights, then settles).
export const springAt = (s: number, w: Weight = 'container'): number => {
  if (s <= 0) return 0;
  const {k, d} = WEIGHTS[w];
  const om = Math.sqrt(k), z = d / (2 * om);
  if (z < 0.999) {
    const wd = om * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * om * s) * (Math.cos(wd * s) + ((z * om) / wd) * Math.sin(wd * s));
  }
  if (z <= 1.001) return 1 - Math.exp(-om * s) * (1 + om * s);
  const r = om * Math.sqrt(z * z - 1), a = -z * om + r, b = -z * om - r; // two real roots (over-damped)
  return 1 - (b * Math.exp(a * s) - a * Math.exp(b * s)) / (b - a);
};

// Seconds until the spring stays within 0.5 % of its target (how long the move "takes").
const settleCache: Partial<Record<Weight, number>> = {};
export const settleTime = (w: Weight): number => {
  if (settleCache[w] != null) return settleCache[w]!;
  let last = 0;
  for (let s = 0; s < 4; s += 1 / 240) if (Math.abs(1 - springAt(s, w)) > 0.005) last = s;
  return (settleCache[w] = last + 1 / 240);
};

// Spring by frames: springIn(t, fps, 'heavy') = progress of a move that started t frames ago.
export const springIn = (frames: number, fps: number, w: Weight = 'container') => springAt(frames / fps, w);

// The same spring as an easing for interpolate(): stretched so it lands exactly at the end of the given range
// (drop-in for Easing.* when a duration is already decided: interpolate(t, [a, b], [0, 1], {easing: ease.heavy})).
const easeOf = (w: Weight) => (p: number) => (p <= 0 ? 0 : p >= 1 ? 1 : springAt(p * settleTime(w), w) / springAt(settleTime(w), w));
export const ease: Record<Weight, (p: number) => number> = {
  snappy: easeOf('snappy'),
  container: easeOf('container'),
  heavy: easeOf('heavy'),
  playful: easeOf('playful'),
};
