// The lessons (one per video / pilot). Each question = its spoken lines + the actions they trigger.
// World layout: every question gets its own area on the one big sheet (Q1 at x 0, Q2 at x 1900, ...), so the
// camera travels between them and can look back at an earlier one when a question builds on it.
import {Lesson, P, CM, type Pt, add, angOf, circleX, mid, dist, type QText} from './engine';

/** perpendicular bisector of a-b with radius r (arcs both sides, join, label the middle) */
export function bisect(L: Lesson, a: Pt, b: Pt, r: number, o: {mid?: string; ends?: [string, string]; ext?: number; style?: 'main' | 'final'} = {}) {
  const [c, d] = circleX(a, r, b, r);
  const up = angOf(a, c), down = angOf(a, d);
  L.arcPair(a, r, up, down);
  L.arcPair(b, r, angOf(b, c), angOf(b, d));
  if (o.ends) {
    L.label(o.ends[0], c, 22, -22);
    L.label(o.ends[1], d, 22, 24);
  }
  const ext = o.ext ?? 34;
  const u = {x: (c.x - d.x) / dist(c, d), y: (c.y - d.y) / dist(c, d)};
  L.line(add(c, {x: u.x * ext, y: u.y * ext}), add(d, {x: -u.x * ext, y: -u.y * ext}), {style: o.style ?? 'main'});
  const m = mid(a, b);
  if (o.mid) {
    L.burst(m, 26);
    L.label(o.mid, m, 22, 26);
  }
  return {c, d, m};
}

// pen-start of each digit (box 100×140) at the title's small size, so the question block lines up with the drawn number
const DSTART: Record<string, [number, number]> = {'0': [50, 10], '1': [26, 34], '2': [14, 42], '3': [14, 28], '4': [70, 130], '5': [86, 10], '6': [80, 18], '7': [10, 10], '8': [50, 68], '9': [85, 50]};
const SMALL = 1.1;
/** where the number's pen-start must be for a question block whose top-left is (x, y) */
export const glyphAt = (n: number, x: number, y: number): Pt => {
  const st = DSTART[String(n)[0]];
  return P(x + st[0] * SMALL, y + st[1] * SMALL);
};
function q(L: Lesson, n: number, x: number, y: number, chip: string, title: string, segs: QText['segs']): QText {
  const qt: QText = {glyph: true, n, x, y, t0: L.t, cps: 24, segs, title, chip};
  L.question(qt);
  return qt;
}

/** mark the concept word with the highlighter at time `at` (with its stroke sound) */
function highlight(L: Lesson, q: QText, seg: number, at: number) {
  q.segs[seg].tMark = at;
  L.sfx.push({t: at, name: 'highlighter-stroke', vol: 0.22, dur: 0.6});
}

function pilot(): Lesson {
  const L = new Lesson();
  // ===================== Q1: bisect a line =====================
  const A = P(500, 1000), B = P(750, 1000); // 5 cm
  const r = 175;
  const [C, D] = circleX(A, r, B, r);
  const O = mid(A, B);
  const G1 = glyphAt(1, 0, 0);
  const steps1 = [
    'Draw a line AB, 5 cm long.',
    'Open the compass more than half of AB.',
    'Needle on A. Draw arcs above and below AB.',
    'Same opening, needle on B. Draw arcs to cut them at C and D.',
    'Join C and D. CD cuts AB at O.',
  ];
  L.cam.to(0, 0.01, {x: -1300, y: G1.y, zoom: 0.85, tilt: 3});
  L.t = 0.2;
  L.connect(P(-1700, G1.y), G1, 1);
  L.camTo({x: 660, y: 90, zoom: 1.2, tilt: 2}, 1.2);
  L.camTo({x: 680, y: 95, zoom: 1.28, tilt: 3}, 7, 'lin');
  const q1 = q(L, 1, 0, 0, 'Division of lines', 'Bisect a line', [{s: 'Bisect', mark: 'concept'}, {s: ' a line AB, '}, {s: '5 cm', mark: 'num'}, {s: ' long.'}]);
  L.guide(1, 'Division of lines', 'Bisect a line AB, 5 cm long.', steps1);
  L.say('Pehla question.');
  L.say('Bisect a line AB, five centimetre long.');
  L.say('Isme main word kaunsa hai? Five cm nahi. Bisect. Bisect matlab line ko exactly beech se do barabar hisson mein kaatna.', () => {
    highlight(L, q1, 0, L.t + 2.6);
  });
  // the camera drags down to the empty part of the sheet where we draw
  L.frame([A, B, C, D], {pad: 70, dur: 1.6, tilt: 5});
  L.wait(1.2);
  L.step(0);
  L.say('Pehle scale rakho. Zero A pe, aur five cm tak line khicho.', () => L.line(A, B, {measure: true, label: ['A', 'B']}));
  L.say('Ab socho: beech ka point milega kaise, bina naape?');
  // the idea, shown once and then gone (no lines left behind): a point slides along the middle, equally far from A and B
  L.say('Trick yeh hai: jo point A aur B, dono se same doori pe ho, woh hamesha beech wali line pe hi hota hai.', () => {
    L.wait(1.2);
    L.probe(A, B, P(625, 1150), P(625, 830), 5.5);
  });
  L.say('Toh hum aise do points dhoondhenge, aur unhe jod denge.');
  L.step(1);
  L.say('Ab compass. Radius kitna? AB ke aadhe se thoda zyada. Yahan exact naap nahi chahiye, koi bhi radius chalega, bas aadhe se zyada ho.', () => {
    L.wait(0.6);
    L.compassTo(A, 125, 0, 1);
    L.wait(0.7);
    L.compassTo(A, r, 0, 0.8);
  });
  L.say('Kyun zyada? Kyunki aadha ya usse kam liya, toh dono taraf ke arcs ek doosre ko kaatenge hi nahi.');
  L.step(2);
  L.say('A pe needle rakho, aur line ke upar aur neeche, dono taraf arc lagao.', () => {
    L.wait(0.6);
    L.arcPair(A, r, angOf(A, C), angOf(A, D));
  });
  L.step(3);
  L.say('Ab dhyaan se. Compass ko chhedna mat. Same radius, needle B pe, phir dono taraf.', () => {
    L.wait(1.4);
    L.arcPair(B, r, angOf(B, C), angOf(B, D));
    L.burst(C);
    L.label('C', C, 26, -20);
    L.burst(D);
    L.label('D', D, 26, 24);
  });
  L.step(4);
  L.say('C aur D ko jod do. Jahan yeh AB ko kaat rahi hai, woh O hai.', () => {
    L.line(add(C, P(0, -36)), add(D, P(0, 36)), {style: 'final'});
    L.burst(O, 28);
    L.label('O', O, 24, 26);
  });
  L.step(5);
  L.say('AO aur OB, bilkul barabar. Aur CD, AB pe ekdum ninety degree pe khadi hai.', () => {
    L.frame([A, B, C, D], {pad: 110, dur: 1, tilt: 4});
    L.wait(0.6);
    L.ticks(A, O, 1);
    L.wait(0.5);
    L.ticks(O, B, 1);
    L.wait(1.6);
    L.right(O, -90, 0);
  });
  L.say('Isko kehte hain perpendicular bisector. Naam yaad rakhna, yeh trick aage bahut baar aayegi.', () => {
    L.wait(1.5);
    L.done([O, C, D]);
  });
  // exam steps beside the figure: copy them or take a screenshot
  L.say('Yeh rahe steps. Exam mein yahi likhne hain. Screenshot le lo.', () => {
    L.stepSheet([A, B, C, D], P(860, 845), steps1, 'So, AO = OB.');
  });
  L.endGuide();

  // ===================== Q2: four equal parts =====================
  // Q2 sits BELOW Q1: the final line runs down, turns, and curls into the 2
  const X0 = 860, Y2 = 1760;
  const G2 = glyphAt(2, X0, Y2);
  const A2 = P(X0 + 520, Y2 + 760), B2 = P(X0 + 870, Y2 + 760); // 7 cm
  const O2 = mid(A2, B2);
  const steps2 = [
    'Draw a line AB, 7 cm long.',
    'Bisect AB (like Q1). Mark the middle O.',
    'Bisect AO. Mark its middle C.',
    'Bisect OB. Mark its middle D.',
    'C, O and D cut AB into 4 equal parts.',
  ];
  L.wait(0.4);
  L.connect(add(D, P(0, 36)), G2, 2, {via: P(D.x, G2.y)});
  L.camTo({x: X0 + 680, y: Y2 + 95, zoom: 1.28, tilt: 2}, 1.2);
  const q2 = q(L, 2, X0, Y2, 'Division of lines', 'Four equal parts', [{s: 'Divide line AB, '}, {s: '7 cm', mark: 'num'}, {s: ' long, into '}, {s: 'four equal parts', mark: 'concept'}, {s: '.'}]);
  L.guide(2, 'Division of lines', 'Divide AB, 7 cm, into 4 equal parts.', steps2);
  L.say('Question two.');
  L.say('Divide line AB, seven cm long, into four equal parts.');
  L.say('Four equal parts. Aur do parts karna toh humein abhi aa gaya.', () => {
    highlight(L, q2, 3, L.t + 0.3);
  });
  const R2 = 230, r2 = 120;
  const [C2u, D2u] = circleX(A2, R2, B2, R2);
  L.say('Toh socho, chaar kaise?', () => {
    L.wait(0.3);
    L.frame([A2, B2, C2u, D2u], {pad: 70, dur: 1.6, tilt: 5});
  });
  L.wait(0.5);
  L.step(0);
  L.say('AB khicho, seven cm.', () => L.line(A2, B2, {measure: true, label: ['A', 'B']}));
  L.say('Simple: pehle do, phir har aadhe ko phir se do.');
  L.step(1);
  L.recapBadge('Same as Q1, so quickly this time', 3);
  L.say('Phir wahi Q1 wala bisect. O mil gaya.', () => {
    L.fast(2.2, () => bisect(L, A2, B2, R2, {mid: 'O'}));
  });
  L.step(2);
  L.say('Ab AO ko bisect karo. C.', () => {
    L.fast(1.7, () => bisect(L, A2, O2, r2, {ext: 20}));
    L.burst(mid(A2, O2), 26);
    L.label('C', mid(A2, O2), -20, 26);
  });
  L.step(3);
  L.say('Aur OB ko. D.', () => {
    L.fast(1.9, () => bisect(L, O2, B2, r2, {ext: 20}));
    L.burst(mid(O2, B2), 26);
    L.label('D', mid(O2, B2), 22, 26);
  });
  L.step(4);
  const C2 = mid(A2, O2), D2 = mid(O2, B2);
  L.say('C, O, D. Chaar barabar parts.', () => {
    L.frame([A2, B2, C2u, D2u], {pad: 110, dur: 1, tilt: 4});
    L.wait(0.4);
    [[A2, C2], [C2, O2], [O2, D2], [D2, B2]].forEach(([a, b]) => {
      L.ticks(a, b, 2);
      L.wait(0.35);
    });
    L.done([C2, O2, D2]);
  });
  L.say('Aur kabhi eight parts aaye, toh bas ek baar aur.');
  L.say('Steps yeh rahe. Likh lo.', () => {
    L.stepSheet([A2, B2, C2u, D2u], P(B2.x + 140, A2.y - 175), steps2, 'So, AC = CO = OD = DB.');
  });
  L.endGuide();
  return L.finish();
}

const cache: Record<string, Lesson> = {};
export const LESSONS: Record<string, () => Lesson> = {
  pilot: () => (cache.pilot ??= pilot()),
};
export {CM};
