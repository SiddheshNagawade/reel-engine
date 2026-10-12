// Cut styles for the vlog (brain/craft.md), turned into plain pieces the renderer already knows.
// Why: in the Chandigarh vlog 19 scenes were just played 1.5–2.8× faster. Editors cut to the best beats instead.
//
// On a segment of vlog.json:
//   "jumps": [[12.0, 14.5], [19.2, 21.0], [33.4, 36.0]]   jump cuts: only these beats of the clip, real speed + real sound,
//            "jumpZoom": 1.12                            every other beat punches in a little so the cut reads as intended
//   "speed": 8, "rampTo": 1, "dur": 3                    speed ramp: starts fast, eases to real time (a stroke, a landing)
//   "jcut": 0.4                                          J-cut: this scene's sound starts 0.4 s before its picture
//   "lcut": 0.5                                          L-cut: this scene's sound carries 0.5 s into the next picture
//   "transition": {"type": "dissolve", "d": 0.6}         dissolve / dip to white|black INTO this segment (time passing,
//                                                        memory). Only where the picture really changes, never inside a shot.
//   "smash": 0.8                                         smash cut: music and effects drop to dead silence for 0.8 s at
//                                                        this cut (loud → silent contrast for a punchline)
// Parts made from one segment get ids "<id>~1", "<id>~2"…; sfx/music/subs that point at "<id>" still work.

const RAMP_STEPS = 6;
const smooth = (x) => x * x * (3 - 2 * x);

// Seconds a plain segment lasts on screen (no expansion).
export function segLength(s) {
  const span = (s.out ?? 0) - (s.in ?? 0);
  const speed = s.speed ?? (s.dur && span ? span / s.dur : 1);
  return (s.dur ?? span / speed) + (s.hold ?? 0);
}

// gfx/censor keys/sfx inside a segment are in segment seconds; give each part the ones that start inside it.
function splitTimed(list, start, len, key = 'at') {
  return (list ?? []).filter((g) => (g[key] ?? 0) >= start - 1e-6 && (g[key] ?? 0) < start + len)
    .map((g) => ({...g, [key]: (g[key] ?? 0) - start}));
}

function zoomAt(s, x) {
  const z0 = s.zoom ?? 1, z1 = s.toZoom ?? z0;
  return +(z0 + (z1 - z0) * smooth(Math.min(1, Math.max(0, x)))).toFixed(4);
}

function partsOf(s) {
  if (s.jumps?.length) {
    const jz = s.jumpZoom ?? 1.12;
    let clock = 0;
    return s.jumps.map(([a, b], k) => {
      const len = b - a;
      // the punch-in: full-frame scenes zoom the frame; card scenes zoom INSIDE the card (zooming the whole frame
      // would push the card's edges out of the picture)
      const punch = k % 2 ? jz : 1;
      const inCard = (s.layout ?? 'full') !== 'full';
      const zoom = (s.zoom ?? 1) * (inCard ? 1 : punch);
      const part = {
        ...s, id: `${s.id}~${k + 1}`, parent: s.id, in: a, out: b, dur: undefined, speed: 1, jumps: undefined,
        ...(inCard ? {crop: (s.crop ?? 1) * punch} : {}),
        zoom, toZoom: zoom * (s.toZoom && s.zoom ? s.toZoom / s.zoom : 1.02), hold: k === s.jumps.length - 1 ? s.hold : undefined,
        gfx: splitTimed(s.gfx, clock, len), chapter: k === 0 ? s.chapter : undefined,
        jcut: k === 0 ? s.jcut : undefined, lcut: k === s.jumps.length - 1 ? s.lcut : undefined,
        transition: k === 0 ? s.transition : undefined, smash: k === 0 ? s.smash : undefined,
        censor: s.censor?.map((c) => ({...c, keys: c.keys.filter((kk) => kk[0] >= clock && kk[0] < clock + len).map((kk) => [kk[0] - clock, ...kk.slice(1)])}))
          .filter((c) => c.keys.length),
      };
      clock += len;
      return part;
    });
  }
  if (s.rampTo != null && s.speed != null && s.dur) {
    // equal-length steps with geometrically changing speed: reads as one smooth ramp
    const d = s.dur / RAMP_STEPS, v0 = s.speed, v1 = s.rampTo;
    let t = s.in, clock = 0;
    return Array.from({length: RAMP_STEPS}, (_, k) => {
      const v = v0 * Math.pow(v1 / v0, (k + 0.5) / RAMP_STEPS);
      const part = {
        ...s, id: `${s.id}~${k + 1}`, parent: s.id, in: +t.toFixed(3), out: +(t + v * d).toFixed(3), speed: v, dur: undefined, rampTo: undefined,
        zoom: zoomAt(s, k / RAMP_STEPS), toZoom: zoomAt(s, (k + 1) / RAMP_STEPS), linearZoom: true,
        hold: k === RAMP_STEPS - 1 ? s.hold : undefined, gfx: splitTimed(s.gfx, clock, d), chapter: k === 0 ? s.chapter : undefined,
        jcut: undefined, lcut: k === RAMP_STEPS - 1 ? s.lcut : undefined, transition: k === 0 ? s.transition : undefined,
        smash: k === 0 ? s.smash : undefined, censor: undefined,
        // natural sound only on the near-real-time end of the ramp
        audio: v <= 2 ? s.audio : 0,
      };
      t += v * d;
      clock += d;
      return part;
    });
  }
  return [s];
}

// The whole edit with cut styles expanded into plain segments.
export function expandSegments(segments) {
  return segments.flatMap(partsOf);
}

// Total on-screen seconds of an edit, after expansion and dissolve overlaps.
export function editLength(segments) {
  return expandSegments(segments).reduce((a, s) => a + segLength(s) - (s.transition?.d ?? 0), 0);
}
