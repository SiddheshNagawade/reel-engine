// ELEMENTARY GRADE EXAM: the 20 plane-geometry constructions (book p.139-148), one function per question.
// EDITABLE: every question is a block of spoken lines (L.say) with the drawing they trigger; change a line, a
// number or the order here and the whole video re-times itself. After he records, voice.ts makes every line last
// exactly as long as his voice (see voice.ts). World layout: each block gets its own area of the one big sheet
// on a staircase (next block = 860 right, 1760 down); the finished figure's line runs into the next number.
import {Lesson, P, CM, type Pt, add, sub, mul, angOf, circleX, mid, dist, polar, lerpPt, type QText} from './engine';

// ---------------- geometry helpers ----------------
export const unit = (a: Pt, b: Pt) => mul(sub(b, a), 1 / dist(a, b));
export const near = (pts: [Pt, Pt], to: Pt) => (dist(pts[0], to) < dist(pts[1], to) ? pts[0] : pts[1]);
export const far = (pts: [Pt, Pt], to: Pt) => (dist(pts[0], to) < dist(pts[1], to) ? pts[1] : pts[0]);
/** where two rays (point + angle) cross */
export function rayX(p1: Pt, a1: number, p2: Pt, a2: number): Pt {
  const d1 = polar(P(0, 0), 1, a1), d2 = polar(P(0, 0), 1, a2);
  const den = d1.x * d2.y - d1.y * d2.x;
  const t = ((p2.x - p1.x) * d2.y - (p2.y - p1.y) * d2.x) / den;
  return add(p1, mul(d1, t));
}
/** sweep from a0 towards a1 the short way round */
export const short = (a0: number, a1: number) => {
  let b = a1;
  while (b - a0 > 180) b -= 360;
  while (b - a0 < -180) b += 360;
  return b;
};
/** a length label on the OUTSIDE of a figure */
export function dimOut(L: Lesson, a: Pt, b: Pt, text: string, inside: Pt) {
  const u = unit(a, b), n = {x: -u.y, y: u.x}, m = mid(a, b);
  L.dim(a, b, text, n.x * (m.x - inside.x) + n.y * (m.y - inside.y) > 0 ? 1 : -1);
}

/** perpendicular bisector of a-b with radius r (arcs both sides, join, label the middle) */
export function bisect(L: Lesson, a: Pt, b: Pt, r: number, o: {mid?: string; ext?: number; style?: 'main' | 'final' | 'build'} = {}) {
  const [c, d] = circleX(a, r, b, r);
  L.arcPair(a, r, angOf(a, c), angOf(a, d));
  L.arcPair(b, r, angOf(b, c), angOf(b, d));
  const ext = o.ext ?? 34;
  const u = unit(d, c);
  L.line(add(c, mul(u, ext)), add(d, mul(u, -ext)), {style: o.style ?? 'main'});
  const m = mid(a, b);
  if (o.mid) {
    L.burst(m, 26);
    L.label(o.mid, m, 22, 26);
  }
  return {c, d, m};
}
/** perpendicular at a point M on a line going at angle `ang` (towards the side ang - 90): arc P..Q, arcs meet N */
export function perpOn(L: Lesson, M: Pt, ang: number, r: number, R: number, names?: [string, string]) {
  const Pp = polar(M, r, ang + 180), Q = polar(M, r, ang);
  L.compassTo(M, r, ang + 180);
  L.arc(M, r, ang + 180 - 10, ang + 360 + 10);
  if (names) {
    L.label(names[0], Pp, -6, 28, undefined, 'main', 24);
    L.label(names[1], Q, 6, 28, undefined, 'main', 24);
  }
  const N = near(circleX(Pp, R, Q, R), polar(M, 600, ang - 90));
  L.arc(Pp, R, angOf(Pp, N) - 15, angOf(Pp, N) + 15);
  L.arc(Q, R, angOf(Q, N) - 15, angOf(Q, N) + 15);
  L.burst(N);
  return {Pp, Q, N};
}
/** perpendicular from a point Pp outside line A-B: arc cuts the line at X, Y; arcs from X, Y meet Q on the other side */
export function perpFrom(L: Lesson, Pp: Pt, A: Pt, B: Pt, r: number, R: number, names?: [string, string]) {
  const u = unit(A, B);
  const tt = (Pp.x - A.x) * u.x + (Pp.y - A.y) * u.y;
  const F = add(A, mul(u, tt));
  const h = Math.sqrt(Math.max(1, r * r - dist(Pp, F) ** 2));
  const X = add(F, mul(u, -h)), Y = add(F, mul(u, h));
  const a0 = angOf(Pp, X), a1 = short(a0, angOf(Pp, Y));
  const sg = Math.sign(a1 - a0);
  L.compassTo(Pp, r, a0 - sg * 9);
  L.arc(Pp, r, a0 - sg * 9, a1 + sg * 9);
  if (names) {
    L.label(names[0], X, -10, -26, undefined, 'main', 24);
    L.label(names[1], Y, 10, -26, undefined, 'main', 24);
  }
  const Q = far(circleX(X, R, Y, R), Pp);
  L.arc(X, R, angOf(X, Q) - 15, angOf(X, Q) + 15);
  L.arc(Y, R, angOf(Y, Q) - 15, angOf(Y, Q) + 15);
  L.burst(Q);
  return {X, Y, Q, F};
}
/** bisect the angle at B between arms at angles aA and aC: arc cuts arms at X, Y; arcs from X, Y meet P */
export function angleBisect(L: Lesson, B: Pt, aA: number, aC: number, r: number, R: number, names?: [string, string]) {
  const aC2 = short(aA, aC);
  const X = polar(B, r, aA), Y = polar(B, r, aC2);
  const sg = Math.sign(aC2 - aA);
  L.compassTo(B, r, aA - sg * 7);
  L.arc(B, r, aA - sg * 7, aC2 + sg * 7);
  if (names) {
    L.label(names[0], X, 0, -26, undefined, 'main', 24);
    L.label(names[1], Y, 0, 26, undefined, 'main', 24);
  }
  const Pm = far(circleX(X, R, Y, R), B);
  L.arc(X, R, angOf(X, Pm) - 15, angOf(X, Pm) + 15);
  L.arc(Y, R, angOf(Y, Pm) - 15, angOf(Y, Pm) + 15);
  L.burst(Pm);
  return {X, Y, P: Pm, ang: angOf(B, Pm)};
}
/** square on base a→b (drawn upwards), construction as in Q12; returns the corners [a, b, top over b, top over a] */
export function squareOn(L: Lesson, a: Pt, b: Pt, nm: [string, string, string, string], side: number, o: {finals?: boolean} = {}) {
  const s = dist(a, b);
  L.line(a, b, {measure: true, label: [nm[0], nm[1]], dim: `${side} cm`});
  L.line(a, polar(a, 80, 180));
  const r = Math.min(70, s * 0.3);
  perpOn(L, a, 0, r, r * 1.6);
  const M = polar(a, s + 70, -90);
  L.line(a, M);
  L.compassTo(a, s, -90);
  L.arc(a, s, -102, -78);
  const D = polar(a, s, -90), C = polar(b, s, -90);
  L.burst(D);
  L.label(nm[3], D, -26, -18);
  L.arc(D, s, -14, 14);
  L.arc(b, s, -104, -76);
  L.burst(C);
  L.label(nm[2], C, 26, -18);
  if (o.finals !== false) {
    L.line(a, b, {style: 'final'});
    L.line(b, C, {style: 'final'});
    L.line(C, D, {style: 'final'});
    L.line(D, a, {style: 'final'});
  }
  return [a, b, C, D];
}

// ---------------- question blocks ----------------
type Seg = QText['segs'][number];
export type Block = {n: number; sub?: string; O: Pt; lead?: string};
/** how a question refers to an earlier one ("Q8"); the Intermediate video points back at the Elementary numbers */
let REF: (n: number) => string = (n) => `Q${n}`;
export const setRef = (f: (n: number) => string) => (REF = f);
const DSTART: Record<string, [number, number]> = {'0': [50, 10], '1': [26, 34], '2': [14, 42], '3': [14, 28], '4': [70, 130], '5': [86, 10], '6': [80, 18], '7': [10, 10], '8': [50, 68], '9': [85, 50]};
const SMALL = 1.1;
export const glyphAt = (n: number, x: number, y: number): Pt => {
  const st = DSTART[String(n)[0]];
  return P(x + st[0] * SMALL, y + st[1] * SMALL);
};
/** open a question: the previous figure's line runs into the number (or the camera pans, for a part (2)/(3)), the
 *  question writes itself, the corner shows "Q n", the step pop-ups are set */
export function open(L: Lesson, b: Block, prev: Pt | null, segs: Seg[], steps: string[], title: string) {
  const {O, n} = b;
  const text = segs.map((s) => s.s).join('');
  const lines = Math.ceil(text.length / 36);
  const h = Math.max(160, lines * 84);
  if (!b.sub) {
    const G = glyphAt(n, O.x, O.y);
    if (!prev) {
      L.connect(P(O.x - 1700, G.y), G, n);
    } else {
      L.wait(0.4);
      L.connect(prev, G, n, {via: P(prev.x, G.y)});
    }
  } else {
    L.wait(0.3);
  }
  const zoom = Math.min(1.3, 860 / (h + 160));
  L.camTo({x: O.x + 660, y: O.y + h / 2 - 20, zoom, tilt: 2}, b.sub ? 1.8 : 1.2);
  if (b.sub) L.wait(1.2);
  const qt: QText = {glyph: !b.sub, n, x: O.x, y: O.y, t0: L.t, cps: 26, segs, title, chip: ''};
  L.question(qt);
  L.guide(b.sub ? `${n} ${b.sub}` : n, title, text, steps);
  return qt;
}
export function highlight(L: Lesson, q: QText, seg: number, at: number) {
  q.segs[seg].tMark = at;
  L.sfx.push({t: at, name: 'highlighter-stroke', vol: 0.22, dur: 0.6});
}
/** drag the camera down to the drawing area (never a zoom-out) */
export const toFigure = (L: Lesson, pts: Pt[]) => {
  L.frame(pts, {pad: 50, dur: 1.6, tilt: 5});
  L.wait(1.2);
};
/** end of a question: figure aside + the exam steps in easy English (screenshot), then on */
export function close(L: Lesson, fig: Pt[], steps: string[], result: string, line = 'Steps yeh rahe. Screenshot le lo.') {
  const xs = fig.map((p) => p.x), ys = fig.map((p) => p.y);
  const x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const h = 64 + (steps.length + 1.4) * 46;
  L.say(line, () => L.stepSheet(fig, P(x1 + 110, (y0 + y1) / 2 - h / 2), steps, result, 3.5));
  L.endGuide();
}
export const FIG = (O: Pt) => add(O, P(625, 1000));

export type Q = (L: Lesson, b: Block, prev: Pt | null) => Pt; // returns where the line to the next number leaves from

// ===================== 1 · bisect a line =====================
const q1: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const A = add(F, P(-125, 0)), B = add(F, P(125, 0));
  const r = 175;
  const [C, D] = circleX(A, r, B, r);
  const O = mid(A, B);
  const steps = ['Draw a line AB, 5 cm long.', 'Open the compass more than half of AB.', 'Needle on A. Draw arcs above and below AB.', 'Same opening, needle on B. Draw arcs to cut them at C and D.', 'Join C and D. CD cuts AB at O.'];
  const qt = open(L, b, prev, [{s: 'Bisect', mark: 'concept'}, {s: ' a line AB, '}, {s: '5 cm', mark: 'num'}, {s: ' long.'}], steps, 'Bisect a line');
  L.say('Pehla question.');
  L.say('Bisect a line AB, five centimetre long.');
  L.say('Isme main word kaunsa hai? Five cm nahi. Bisect. Bisect matlab line ko exactly beech se do barabar hisson mein kaatna.', () => highlight(L, qt, 0, L.t + 2.6));
  toFigure(L, [add(C, P(0, -40)), add(D, P(0, 40)), add(A, P(-40, 0)), add(B, P(40, 0))]);
  L.step(0);
  L.say('Pehle scale rakho. Zero A pe, aur five cm tak line khicho.', () => L.line(A, B, {measure: true, label: ['A', 'B'], dim: '5 cm'}));
  L.say('Ab socho: beech ka point milega kaise, bina naape?');
  L.say('Trick yeh hai: jo point A aur B, dono se same doori pe ho, woh hamesha beech wali line pe hi hota hai.', () => {
    L.wait(1.2);
    L.probe(A, B, add(O, P(0, 150)), add(O, P(0, -170)), 5.5);
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
  L.say('AO aur OB, bilkul barabar. Aur CD, AB pe ekdum ninety degree pe khadi hai.', () => {
    L.wait(0.6);
    L.ticks(A, O, 1);
    L.wait(0.5);
    L.ticks(O, B, 1);
    L.wait(1.6);
    L.right(O, -90, 0);
  });
  L.say('Isko kehte hain perpendicular bisector. Naam yaad rakhna, yeh trick aage bahut baar aayegi.', () => {
    L.wait(1.5);
    L.done([O]);
  });
  close(L, [A, B, C, D], steps, 'So, AO = OB.', 'Yeh rahe steps. Exam mein yahi likhne hain. Screenshot le lo.');
  return add(D, P(0, 36));
};

// ===================== 2 · four equal parts =====================
const q2: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const A = add(F, P(-175, 0)), B = add(F, P(175, 0));
  const O = mid(A, B);
  const R = 230, r = 120;
  const [Cu, Du] = circleX(A, R, B, R);
  const steps = ['Draw a line AB, 7 cm long.', 'Bisect AB (like Q1). Mark the middle O.', 'Bisect AO. Mark its middle C.', 'Bisect OB. Mark its middle D.', 'C, O and D cut AB into 4 equal parts.'];
  const qt = open(L, b, prev, [{s: 'Divide line AB, '}, {s: '7 cm', mark: 'num'}, {s: ' long, into '}, {s: 'four equal parts', mark: 'concept'}, {s: '.'}], steps, 'Four equal parts');
  L.say('Question two.');
  L.say('Divide line AB, seven cm long, into four equal parts.');
  L.say('Four equal parts. Aur do parts karna toh humein abhi aa gaya.', () => highlight(L, qt, 3, L.t + 0.3));
  L.say('Toh socho, chaar kaise?', () => {
    L.wait(0.3);
    L.frame([add(Cu, P(0, -40)), add(Du, P(0, 40)), add(A, P(-40, 0)), add(B, P(40, 0))], {pad: 50, dur: 1.6, tilt: 5});
  });
  L.wait(0.5);
  L.step(0);
  L.say('AB khicho, seven cm.', () => L.line(A, B, {measure: true, label: ['A', 'B'], dim: '7 cm'}));
  L.say('Simple: pehle do, phir har aadhe ko phir se do.');
  L.step(1);
  L.recapBadge('Same as Q1, so quickly this time', 3);
  L.say('Phir wahi Q1 wala bisect. O mil gaya.', () => L.fast(2.2, () => bisect(L, A, B, R, {mid: 'O'})));
  L.step(2);
  const C = mid(A, O), D = mid(O, B);
  L.say('Ab AO ko bisect karo. C.', () => {
    L.fast(1.7, () => bisect(L, A, O, r, {ext: 20}));
    L.burst(C, 26);
    L.label('C', C, -20, 26);
  });
  L.step(3);
  L.say('Aur OB ko. D.', () => {
    L.fast(1.9, () => bisect(L, O, B, r, {ext: 20}));
    L.burst(D, 26);
    L.label('D', D, 22, 26);
  });
  L.step(4);
  L.say('C, O, D. Chaar barabar parts.', () => {
    L.wait(0.4);
    [[A, C], [C, O], [O, D], [D, B]].forEach(([a, c]) => {
      L.ticks(a, c, 2);
      L.wait(0.35);
    });
    L.done([C, O, D]);
  });
  L.say('Aur kabhi eight parts aaye, toh bas ek baar aur.');
  close(L, [A, B, Cu, Du], steps, 'So, AC = CO = OD = DB.', 'Steps yeh rahe. Likh lo.');
  return add(Du, P(0, 40));
};

// ===================== 3 · any number of equal parts (the ladder) =====================
const q3: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const A = add(F, P(-200, 40)), B = add(F, P(200, 40));
  const RAY = 350, st = 55;
  const steps = ['Draw AB, 8 cm long.', 'At A, draw any angle BAC (here 30°).', 'At B, draw the same angle ABD, below AB.', 'Open the compass a little. Mark 6 equal steps on AC and on BD.', 'Join 1 to 5, 2 to 4, 3 to 3, 4 to 2, 5 to 1.'];
  const Cp = polar(A, RAY, -30), Dp = polar(B, RAY, 150);
  const qt = open(L, b, prev, [{s: 'Divide line AB, '}, {s: '8 cm', mark: 'num'}, {s: ' long, into '}, {s: 'six equal parts', mark: 'concept'}, {s: '.'}], steps, 'Any number of parts');
  L.say('Question three.');
  L.say('Divide line AB, eight cm long, into six equal parts.');
  L.say('Six equal parts. Ab Q2 wala tareeka nahi chalega, kyunki aadha-aadha karke six kabhi nahi banta.', () => highlight(L, qt, 3, L.t + 0.2));
  L.say('Iske liye ek naya jugaad hai: seedhi. Do tirchi lines pe barabar kadam, aur phir aamne saamne jodna.');
  toFigure(L, [add(Cp, P(20, -30)), add(Dp, P(-20, 30)), add(A, P(-40, 0)), add(B, P(40, 0))]);
  L.step(0);
  L.say('Pehle AB, eight cm.', () => L.line(A, B, {measure: true, label: ['A', 'B'], dim: '8 cm'}));
  L.step(1);
  L.say('Ab A pe ek angle banao. Koi bhi angle chalega, main thirty degree le raha hoon. Protractor ka centre A pe, aur zero wali line AB ke upar.', () => {
    L.wait(0.5);
    L.angleAt(A, 0, 30, -1);
  });
  L.say('Thirty pe nishaan lagaya, ab us nishaan se line. Yeh AC.', () => {
    L.line(A, Cp);
    L.label('C', Cp, 20, -20);
    L.angleText(A, -30, 0, '30°', 44);
  });
  L.step(2);
  L.say('B pe bhi bilkul same thirty degree, par doosri taraf, neeche. Yeh BD.', () => {
    L.angleAt(B, 180, 30, -1);
    L.line(B, Dp);
    L.label('D', Dp, -20, 22);
    L.angleText(B, 150, 180, '30°', 44);
  });
  L.step(3);
  let up: Pt[] = [], dn: Pt[] = [];
  L.say('Ab compass ko koi bhi chhota radius do. Yeh random hai, bas poore kaam mein same rehna chahiye.');
  L.say('A se shuru karke, AC pe six kadam. One, two, three, four, five, six.', () => {
    up = L.stepAlong(A, -30, st, 6);
  });
  L.say('Aur same radius se, B se BD pe bhi six kadam.', () => {
    L.fast(1.6, () => {
      dn = L.stepAlong(B, 150, st, 6);
    });
  });
  L.step(4);
  L.say('Ab aamne saamne jodo. One ko five se, two ko four se, three ko three se. Aise hi.', () => {
    for (let k = 1; k <= 5; k++) L.fast(k === 1 ? 1 : 1.8, () => L.line(up[k - 1], dn[5 - k]));
  });
  L.say('Yeh saari lines parallel hain, aur AB ko six barabar parts mein kaat deti hain.', () => {
    for (let k = 0; k < 6; k++) {
      L.ticks(lerpPt(A, B, k / 6), lerpPt(A, B, (k + 1) / 6), 1);
      L.wait(0.25);
    }
    L.done([mid(A, B)]);
  });
  L.say('Aur yahi trick three, five, seven, kitne bhi parts ke liye chalegi. Bas utne kadam lo.');
  close(L, [A, B, Cp, Dp], steps, 'The lines cut AB into 6 equal parts.');
  return add(Dp, P(0, 40));
};

// ===================== 4 · perpendicular from a point ON the line =====================
const q4: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const A = add(F, P(-200, 110)), B = add(F, P(200, 110));
  const M = add(A, P(5 * CM, 0));
  const r = 80, R = 130;
  const N = add(M, P(0, -Math.sqrt(R * R - r * r)));
  const top = add(N, P(0, -70));
  const steps = ['Draw AB, 8 cm long.', 'Mark M on AB, 5 cm from A.', 'Needle on M, any radius: an arc cuts AB at P and Q.', 'From P and Q, a bigger radius: arcs meet at N.', 'Join N and M.'];
  const qt = open(L, b, prev, [{s: 'Line AB is '}, {s: '8 cm', mark: 'num'}, {s: ' long. Point M is on line AB at a distance of 5 cm from A. Draw a '}, {s: 'perpendicular', mark: 'concept'}, {s: ' to the line AB from point M.'}], steps, 'Perpendicular from a point on the line');
  L.say('Question four. Ab perpendiculars.');
  L.say('Line AB is eight cm long. Point M is on line AB at a distance of five cm from A. Draw a perpendicular to the line AB from point M.');
  L.say('Perpendicular matlab ninety degree pe khadi line. Aur yahan woh line M se hi nikalni hai.', () => highlight(L, qt, 3, L.t + 0.2));
  L.say('Idea simple hai. Q1 mein dekha tha, bisector ninety degree pe hota hai. Toh hum M ko ek chhoti si line ka beech bana denge.');
  toFigure(L, [top, add(A, P(-40, 40)), add(B, P(40, 40))]);
  L.step(0);
  L.say('AB khicho, eight cm.', () => L.line(A, B, {measure: true, label: ['A', 'B'], dim: '8 cm'}));
  L.step(1);
  L.say('Ab scale se A se five cm naapo. Wahan M.', () => {
    L.rulerMark(A, 0, 5, 'M', 0, 30);
    L.dim(A, M, '5 cm', -1);
  });
  L.step(2);
  L.say('M pe needle. Radius random, koi bhi. Ek arc jo AB ko dono taraf kaate. P aur Q.', () => {
    L.wait(0.4);
    L.compassTo(M, r, 180);
    L.arc(M, r, 170, 370);
    L.label('P', add(M, P(-r, 0)), -8, 28, undefined, 'main', 26);
    L.label('Q', add(M, P(r, 0)), 8, 28, undefined, 'main', 26);
  });
  L.say('Ab M, P aur Q ke bilkul beech mein hai. Bas, aage Q1 wala kaam.');
  L.step(3);
  L.say('P aur Q se, thoda bada radius, upar do arcs. Jahan milein, woh N.', () => {
    const Pp = add(M, P(-r, 0)), Q = add(M, P(r, 0));
    L.compassTo(Pp, R, angOf(Pp, N) - 15);
    L.arc(Pp, R, angOf(Pp, N) - 15, angOf(Pp, N) + 15);
    L.arc(Q, R, angOf(Q, N) - 15, angOf(Q, N) + 15);
    L.burst(N);
    L.label('N', N, 26, -14);
  });
  L.step(4);
  L.say('N aur M jodo. Yeh rahi ninety degree wali line.', () => {
    L.line(M, top, {style: 'final'});
    L.wait(0.3);
    L.right(M, -90, 0);
    L.done([M]);
  });
  close(L, [A, B, top], steps, 'NM is perpendicular to AB.');
  return add(B, P(-60, 70));
};

// ===================== 5 · perpendicular from a point OUTSIDE =====================
const q5: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const A = add(F, P(-200, 60)), B = add(F, P(200, 60));
  const Pp = add(F, P(-30, -170));
  const r = 270, R = 180;
  const steps = ['Draw AB, 8 cm long. Mark P above it.', 'Needle on P: an arc cuts AB at X and Y.', 'From X and Y: arcs below AB meet at Q.', 'Join P and Q.'];
  const qt = open(L, b, prev, [{s: 'Line AB is '}, {s: '8 cm', mark: 'num'}, {s: ' long. Point P is located at some distance above line AB. Draw a perpendicular to the line AB '}, {s: 'from point P', mark: 'concept'}, {s: '.'}], steps, 'Perpendicular from a point outside');
  L.say('Question five.');
  L.say('Line AB is eight cm long. Point P is located at some distance above line AB. Draw a perpendicular to the line AB from point P.');
  L.say('Ab point line ke upar nahi, bahar hai. P se seedha neeche, ninety degree pe aana hai.', () => highlight(L, qt, 3, L.t + 0.3));
  const foot = P(Pp.x, A.y);
  toFigure(L, [add(Pp, P(0, -50)), add(A, P(-40, 0)), add(B, P(40, 0)), add(foot, P(0, 150))]);
  L.step(0);
  L.say('AB, eight cm. Aur upar kahin bhi ek point P.', () => {
    L.line(A, B, {measure: true, label: ['A', 'B'], dim: '8 cm', dimSide: -1});
    L.label('P', Pp, 24, -18);
  });
  L.step(1);
  let res: ReturnType<typeof perpFrom> | undefined;
  L.say('P pe needle. Radius itna lo ki arc AB ko do jagah kaate. X aur Y.', () => {
    L.wait(0.3);
    const u = {x: 1, y: 0};
    const h = Math.sqrt(r * r - (foot.y - Pp.y) ** 2);
    const X = add(foot, mul(u, -h)), Y = add(foot, mul(u, h));
    L.compassTo(Pp, r, angOf(Pp, X) + 9);
    L.arc(Pp, r, angOf(Pp, X) + 9, angOf(Pp, Y) - 9);
    L.label('X', X, -12, -26, undefined, 'main', 26);
    L.label('Y', Y, 12, -26, undefined, 'main', 26);
    res = {X, Y, Q: far(circleX(X, R, Y, R), Pp), F: foot};
  });
  L.say('Dekho, X aur Y dono P se same doori pe hain. Matlab P already unke beech wali line pe baitha hai.');
  L.step(2);
  L.say('Ab X aur Y se, line ke neeche, do arcs. Jahan milein, woh Q.', () => {
    const {X, Y, Q} = res!;
    L.compassTo(X, R, angOf(X, Q) - 15);
    L.arc(X, R, angOf(X, Q) - 15, angOf(X, Q) + 15);
    L.arc(Y, R, angOf(Y, Q) - 15, angOf(Y, Q) + 15);
    L.burst(Q);
    L.label('Q', Q, 26, 10);
  });
  L.step(3);
  L.say('P aur Q jodo. Yeh line AB ko ekdum ninety degree pe kaatti hai.', () => {
    L.line(add(Pp, P(0, -30)), add(res!.Q, P(0, 30)), {style: 'final'});
    L.burst(foot, 26);
    L.label('O', foot, -24, 26);
    L.right(foot, -90, 0);
    L.done([foot]);
  });
  close(L, [A, B, Pp, res!.Q], steps, 'PQ is perpendicular to AB.');
  return add(res!.Q, P(0, 60));
};

// ===================== 6 · bisect an angle =====================
const q6: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const B = add(F, P(-220, 120));
  const C = add(B, P(420, 0)), A = polar(B, 420, -38);
  const steps = ['Draw angle ABC (any size).', 'Needle on B, big radius: an arc cuts BA at X and BC at Y.', 'From X and Y, same radius: arcs meet at P.', 'Join B and P.'];
  const qt = open(L, b, prev, [{s: 'Draw ∠ABC of any measure and '}, {s: 'bisect', mark: 'concept'}, {s: ' it.'}], steps, 'Bisect an angle');
  L.say(b.lead ?? 'Question six. Ab angles.');
  L.say('Draw angle ABC of any measure and bisect it.');
  L.say('Bisect, wahi Q1 wala shabd. Bas is baar line nahi, angle ko do barabar hisson mein baantna hai.', () => highlight(L, qt, 1, L.t + 0.2));
  toFigure(L, [A, C, add(B, P(-40, 30))]);
  L.step(0);
  L.say('Koi bhi angle banao. B corner hai, aur BA, BC uski do bhujayein.', () => {
    L.line(B, C, {label: ['B', 'C']});
    L.line(B, A);
    L.label('A', A, 18, -18);
  });
  L.step(1);
  let res: ReturnType<typeof angleBisect> | undefined;
  L.say('B pe needle. Radius bada rakho, jitna arms allow karein. Arc dono arms ko kaatega. X aur Y.', () => {
    L.wait(0.3);
    const X = polar(B, 250, -38), Y = polar(B, 250, 0);
    L.compassTo(B, 250, 5);
    L.arc(B, 250, 5, -43);
    L.label('X', X, -10, -26, undefined, 'main', 26);
    L.label('Y', Y, 10, 26, undefined, 'main', 26);
    res = {X, Y, P: far(circleX(X, 170, Y, 170), B), ang: -19};
  });
  L.step(2);
  L.say('Ab X aur Y se, same radius, andar ki taraf do arcs. Jahan milein, woh P.', () => {
    const {X, Y, P: Pm} = res!;
    L.compassTo(X, 170, angOf(X, Pm) - 15);
    L.arc(X, 170, angOf(X, Pm) - 15, angOf(X, Pm) + 15);
    L.arc(Y, 170, angOf(Y, Pm) - 15, angOf(Y, Pm) + 15);
    L.burst(Pm);
    L.label('P', Pm, 22, -20);
  });
  L.say('Kyun? Kyunki P, X aur Y dono se barabar door hai. Wahi Q1 wali trick, bas ab angle ke andar.');
  L.step(3);
  L.say('B aur P ko jodo. Angle ke do barabar hisse.', () => {
    L.line(B, polar(B, 450, angOf(B, res!.P)), {style: 'final'});
    L.angleText(B, -19, 0, '=', 70);
    L.angleText(B, -38, -19, '=', 70);
    L.done([res!.P]);
  });
  close(L, [A, C, B], steps, 'BP bisects ∠ABC.');
  return add(B, P(60, 60));
};

// ===================== 7 · trisect a right angle =====================
const q7: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const B = add(F, P(-190, 190));
  const C = add(B, P(400, 0)), A = add(B, P(0, -400));
  const rr = 300;
  const X = add(B, P(0, -rr)), Y = add(B, P(rr, 0));
  const M = polar(B, rr, -30), N = polar(B, rr, -60);
  const steps = ['Draw a right angle ABC (like Q4).', 'Needle on B, any radius: an arc cuts BA at X and BC at Y.', 'Same radius, needle on X: cut the arc at M.', 'Same radius, needle on Y: cut the arc at N.', 'Join BM and BN.'];
  const qt = open(L, b, prev, [{s: 'Draw a right angle ABC and '}, {s: 'trisect', mark: 'concept'}, {s: ' it.'}], steps, 'Trisect a right angle');
  L.say('Question seven.');
  L.say('Draw a right angle ABC and trisect it.');
  L.say('Trisect matlab teen barabar hisse. Ninety ke teen hisse, yaani thirty, thirty, thirty.', () => highlight(L, qt, 1, L.t + 0.2));
  toFigure(L, [A, C, add(B, P(-100, 40))]);
  L.step(0);
  L.recapBadge('Right angle: same as Q4, quickly', 3);
  L.say('Pehle right angle. Yeh Q4 wala hi hai, jaldi se.', () => {
    L.line(add(B, P(-90, 0)), C, {label: ['', 'C']});
    L.fast(2, () => perpOn(L, B, 0, 60, 95));
    L.line(B, A);
    L.label('B', B, -22, 26);
    L.label('A', A, -22, -10);
    L.right(B, -90, 0);
  });
  L.step(1);
  L.say('B pe needle, koi bhi radius. Arc dono arms ko kaate. X aur Y.', () => {
    L.compassTo(B, rr, 5);
    L.arc(B, rr, 5, -95);
    L.label('X', X, -22, -10, undefined, 'main', 26);
    L.label('Y', Y, 14, 26, undefined, 'main', 26);
  });
  L.say('Ab ek mazedaar baat. Compass ka radius agar usi arc pe ek kadam chalao, toh woh exact sixty degree ka kadam hota hai.');
  L.step(2);
  L.say('Same radius, needle X pe. Arc ko kaato. M.', () => {
    L.compassTo(X, rr, angOf(X, M) - 10);
    L.arc(X, rr, angOf(X, M) - 10, angOf(X, M) + 10);
    L.burst(M);
    L.label('M', M, 24, -10);
  });
  L.step(3);
  L.say('Same radius, needle Y pe. N.', () => {
    L.compassTo(Y, rr, angOf(Y, N) - 10);
    L.arc(Y, rr, angOf(Y, N) - 10, angOf(Y, N) + 10);
    L.burst(N);
    L.label('N', N, 20, -20);
  });
  L.step(4);
  L.say('BM aur BN jodo. Thirty, thirty, thirty.', () => {
    L.line(B, polar(B, 390, -30), {style: 'final'});
    L.line(B, polar(B, 390, -60), {style: 'final'});
    L.angleText(B, 0, -30, '30°', 70);
    L.angleText(B, -30, -60, '30°', 70);
    L.angleText(B, -60, -90, '30°', 70);
    L.done([B]);
  });
  L.say('Yaad rakhna, thirty aur sixty degree isi se bante hain, protractor ke bina bhi.');
  close(L, [A, C, B], steps, 'Each part is 30°.');
  return add(B, P(70, 60));
};

// ===================== 8 · equilateral triangle =====================
const q8: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const B = add(F, P(-100, 90)), C = add(F, P(100, 90));
  const A = near(circleX(B, 200, C, 200), add(F, P(0, -400)));
  const G = mid(mid(B, C), A);
  const steps = ['Draw BC, 4 cm long.', 'Open the compass from B to C (4 cm).', 'Arcs from B and C meet at A.', 'Join AB and AC.'];
  const qt = open(L, b, prev, [{s: 'Construct an '}, {s: 'equilateral', mark: 'concept'}, {s: ' triangle on the given line, '}, {s: '4 cm', mark: 'num'}, {s: ' long.'}], steps, 'Equilateral triangle');
  L.say('Question eight. Ab triangles.');
  L.say('Construct an equilateral triangle on the given line, four cm long.');
  L.say('Equilateral matlab teeno sides barabar. Teeno four cm.', () => highlight(L, qt, 1, L.t + 0.2));
  toFigure(L, [add(A, P(0, -40)), add(B, P(-50, 30)), add(C, P(50, 30))]);
  L.step(0);
  L.say('BC khicho, four cm.', () => L.line(B, C, {measure: true, label: ['B', 'C'], dim: '4 cm'}));
  L.step(1);
  L.say('Compass ko B se C tak kholo. Ab radius exact four cm hai.', () => {
    L.compassTo(B, 60, 0, 0.7);
    L.compassTo(B, 200, 0, 0.9);
  });
  L.step(2);
  L.say('B se upar arc, aur same radius se C se bhi. Jahan cross ho, woh A.', () => {
    L.arc(B, 200, -75, -45);
    L.arc(C, 200, -135, -105);
    L.burst(A);
    L.label('A', A, 0, -30);
  });
  L.say('A, B se bhi four cm door hai, aur C se bhi. Bas, kaam ho gaya.');
  L.step(3);
  L.say('AB aur AC jodo.', () => {
    L.line(A, B, {style: 'final'});
    L.line(A, C, {style: 'final'});
    dimOut(L, A, B, '4 cm', G);
    dimOut(L, A, C, '4 cm', G);
    L.done([A]);
  });
  close(L, [A, B, C], steps, 'ABC is equilateral: all sides 4 cm.');
  return add(C, P(-40, 70));
};

// ===================== 9 · isosceles (protractor) =====================
const q9: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const B = add(F, P(-230, 130)), D = add(B, P(460, 0));
  const E = polar(B, 340, -65);
  const A = polar(B, 250, -65);
  const C = add(B, P(2 * 250 * Math.cos((65 * Math.PI) / 180), 0));
  const G = P((A.x + B.x + C.x) / 3, (A.y + B.y + C.y) / 3);
  const steps = ['Draw a long line BD.', 'At B, draw angle EBD = 65° (protractor).', 'Mark A on BE, so that BA = 5 cm.', 'Needle on A, radius 5 cm: an arc cuts BD at C.', 'Join AC.'];
  const qt = open(L, b, prev, [{s: 'Construct an '}, {s: 'isosceles', mark: 'concept'}, {s: ' triangle with one of the equal sides being 5 cm long and one of the equal angles being 65°.'}], steps, 'Isosceles triangle');
  L.say('Question nine.');
  L.say('Construct an isosceles triangle with one of the equal sides being five cm long and one of the equal angles being sixty-five degree.');
  L.say('Isosceles matlab do sides barabar, aur unke neeche wale do angles bhi barabar.', () => highlight(L, qt, 1, L.t + 0.2));
  L.say('Sixty-five degree compass se nahi banta. Toh yahan protractor kaam aayega.');
  toFigure(L, [E, add(B, P(-40, 40)), add(D, P(30, 40))]);
  L.step(0);
  L.say('Ek lambi line BD khicho.', () => L.line(B, D, {label: ['B', 'D']}));
  L.step(1);
  L.say('Protractor ka centre B pe, zero wali line BD pe. Sixty-five pe nishaan.', () => {
    L.wait(0.3);
    L.angleAt(B, 0, 65, -1);
  });
  L.say('Aur us nishaan se line BE.', () => {
    L.line(B, E);
    L.label('E', E, 18, -16);
    L.angleText(B, -65, 0, '65°', 46);
  });
  L.step(2);
  L.say('BE pe, scale se five cm naapo. Woh A.', () => {
    L.rulerMark(B, -65, 5, 'A', -28, -8);
    dimOut(L, B, A, '5 cm', G);
  });
  L.step(3);
  L.say('Ab compass ko scale pe exact five cm kholo.', () => L.compassMeasure(5, add(B, P(-40, 170))));
  L.say('Needle A pe, aur BD ko kaato. Woh C.', () => {
    L.compassTo(A, 250, angOf(A, C) - 12);
    L.arc(A, 250, angOf(A, C) - 12, angOf(A, C) + 12);
    L.burst(C);
    L.label('C', C, 14, 28);
  });
  L.step(4);
  L.say('AC jodo. AB aur AC, dono five cm.', () => {
    L.line(A, C, {style: 'final'});
    L.ticks(B, A, 1);
    L.ticks(A, C, 1);
    dimOut(L, A, C, '5 cm', G);
    L.done([A]);
  });
  close(L, [E, B, D], steps, 'ABC is isosceles: AB = AC = 5 cm.');
  return add(D, P(-60, 70));
};

// ===================== 10 · base + two base angles =====================
const q10: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const B = add(F, P(-125, 130)), C = add(F, P(125, 130));
  const A = rayX(B, -60, C, 250);
  const steps = ['Draw BC, 5 cm long.', 'At B, draw a 60° angle.', 'At C, draw a 70° angle.', 'The two arms meet at A.'];
  const qt = open(L, b, prev, [{s: 'Construct a triangle, with its base '}, {s: '5 cm', mark: 'num'}, {s: ' long and the '}, {s: 'angles at the base', mark: 'concept'}, {s: ' 60° and 70° respectively.'}], steps, 'Base and two angles');
  L.say('Question ten.');
  L.say('Construct a triangle, with its base five cm long and the angles at the base sixty degree and seventy degree respectively.');
  L.say('Base mil gaya, aur neeche ke dono angles bhi. Teesra corner apne aap mil jaayega.', () => highlight(L, qt, 3, L.t + 0.6));
  toFigure(L, [add(A, P(0, -60)), add(B, P(-60, 30)), add(C, P(60, 30))]);
  L.step(0);
  L.say('BC, five cm.', () => L.line(B, C, {measure: true, label: ['B', 'C'], dim: '5 cm'}));
  L.step(1);
  L.say('B pe protractor, sixty degree. Sixty compass se bhi ban sakta tha, Q7 yaad hai? Par yahan seedha protractor.', () => {
    L.angleAt(B, 0, 60, -1, 3.8 * CM);
    L.line(B, polar(B, dist(B, A) + 45, -60));
    L.angleText(B, -60, 0, '60°', 40);
  });
  L.step(2);
  L.say('C pe seventy degree. Dhyaan do, ab zero wali line C se B ki taraf rakhni hai.', () => {
    L.angleAt(C, 180, 70, 1, 3.8 * CM);
    L.line(C, polar(C, dist(C, A) + 45, 250));
    L.angleText(C, 180, 250, '70°', 40);
  });
  L.step(3);
  L.say('Dono lines jahan milti hain, woh A.', () => {
    L.burst(A);
    L.label('A', A, 0, -30);
    L.done([A]);
  });
  close(L, [add(A, P(0, -40)), B, C], steps, 'ABC is the triangle.');
  return add(C, P(-40, 70));
};

// ===================== 11 · three sides (SSS) =====================
export function sss(L: Lesson, B: Pt, C: Pt, ab: number, ac: number, bc: number, o: {quick?: boolean} = {}) {
  const A = near(circleX(B, ab * CM, C, ac * CM), add(mid(B, C), P(0, -600)));
  const G = P((A.x + B.x + C.x) / 3, (A.y + B.y + C.y) / 3);
  L.line(B, C, {measure: true, label: ['B', 'C'], dim: `${bc} cm`, style: o.quick ? 'final' : 'main'});
  const spot = add(B, P(-30, 150));
  L.compassMeasure(ab, spot);
  L.compassTo(B, ab * CM, angOf(B, A) - 14);
  L.arc(B, ab * CM, angOf(B, A) - 14, angOf(B, A) + 14);
  if (!o.quick) return {A, G};
  L.compassMeasure(ac, spot);
  L.compassTo(C, ac * CM, angOf(C, A) - 14);
  L.arc(C, ac * CM, angOf(C, A) - 14, angOf(C, A) + 14);
  L.burst(A);
  L.label('A', A, 0, -30);
  L.line(A, B, {style: 'final'});
  L.line(A, C, {style: 'final'});
  return {A, G};
}
const q11: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const B = add(F, P(-175, 110)), C = add(F, P(175, 110));
  const A = near(circleX(B, 250, C, 200), add(F, P(0, -500)));
  const G = P((A.x + B.x + C.x) / 3, (A.y + B.y + C.y) / 3);
  const steps = ['Draw BC, 7 cm long.', 'Needle on B, radius 5 cm: draw an arc.', 'Needle on C, radius 4 cm: cut that arc at A.', 'Join AB and AC.'];
  const qt = open(L, b, prev, [{s: 'Construct a triangle, with its '}, {s: 'three sides', mark: 'concept'}, {s: ', 5 cm, 7 cm and 4 cm long.'}], steps, 'Three sides');
  L.say('Question eleven.');
  L.say('Construct a triangle, with its three sides, five cm, seven cm and four cm long.');
  L.say('Teeno sides di hain. Sabse lambi, seven cm, ko base banao. Neeche baithne mein aasani.', () => highlight(L, qt, 1, L.t + 0.2));
  toFigure(L, [add(A, P(0, -50)), add(B, P(-50, 160)), add(C, P(50, 30))]);
  L.step(0);
  L.step(1);
  L.say('BC, seven cm. Phir compass ko scale pe five cm, B pe needle, aur upar ek arc.', () => sss(L, B, C, 5, 4, 7));
  L.say('Yeh arc kya hai? Is arc ka har point B se exact five cm door hai. Toh A isi arc pe kahin hai.');
  L.step(2);
  L.say('Ab compass four cm. C pe needle, arc. Dono arcs ka cross, woh A.', () => {
    L.compassMeasure(4, add(B, P(-30, 150)));
    L.compassTo(C, 200, angOf(C, A) - 14);
    L.arc(C, 200, angOf(C, A) - 14, angOf(C, A) + 14);
    L.burst(A);
    L.label('A', A, 0, -30);
  });
  L.step(3);
  L.say('AB aur AC jodo.', () => {
    L.line(A, B, {style: 'final'});
    L.line(A, C, {style: 'final'});
    dimOut(L, A, B, '5 cm', G);
    dimOut(L, A, C, '4 cm', G);
    L.done([A]);
  });
  close(L, [A, B, C], steps, 'ABC has sides 5, 7 and 4 cm.');
  return add(C, P(-40, 70));
};

// ===================== 12 · square on a side (eraser introduced) =====================
const q12: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const A = add(F, P(-100, 120)), B = add(F, P(100, 120));
  const D = add(A, P(0, -200)), C = add(B, P(0, -200)), M = add(A, P(0, -270));
  const steps = ['Draw AB, 4 cm long. Extend it past A.', 'At A, draw a right angle (like Q4): line AM.', 'Radius AB, needle on A: cut AM at D.', 'Same radius, from D and B: arcs meet at C.', 'Join BC and CD.'];
  const qt = open(L, b, prev, [{s: 'Construct a '}, {s: 'square', mark: 'concept'}, {s: ', with side 4 cm long.'}], steps, 'Square on a side');
  L.say('Question twelve. Ab squares.');
  L.say('Construct a square, with side four cm long.');
  L.say('Square matlab chaaron sides barabar, aur chaaron corners ninety degree.', () => highlight(L, qt, 1, L.t + 0.2));
  toFigure(L, [add(M, P(0, -20)), add(A, P(-110, 40)), add(B, P(40, 40)), add(C, P(40, 0))]);
  L.step(0);
  L.say('AB, four cm. Aur A se line ko thoda left mein badha do.', () => {
    L.line(A, B, {measure: true, label: ['A', 'B'], dim: '4 cm'});
    L.line(A, add(A, P(-90, 0)));
  });
  L.step(1);
  L.recapBadge('Right angle: same as Q4, quickly', 3);
  L.say('A pe ninety degree, Q4 wala tareeka. Jaldi se.', () => {
    L.fast(2, () => perpOn(L, A, 0, 60, 95));
    L.line(A, M);
    L.label('M', M, -22, -6);
    L.right(A, -90, 0);
  });
  L.step(2);
  L.say('Compass ko AB jitna kholo. A pe needle, upar wali line ko kaato. D.', () => {
    L.compassTo(A, 200, 0);
    L.arc(A, 200, -102, -78);
    L.burst(D);
    L.label('D', D, -26, -14);
  });
  L.step(3);
  L.say('Same radius, D se aur B se arcs. Jahan milein, woh C.', () => {
    L.arc(D, 200, -14, 14);
    L.arc(B, 200, -104, -76);
    L.burst(C);
    L.label('C', C, 26, -14);
  });
  L.say('Ab ek kaam ki baat. Itni saari construction lines hain, final shape dikh hi nahi rahi.');
  L.say('Toh eraser se halka sa ragdo. Mitana nahi hai, bas halka karna hai. Exam mein construction lines dikhni chahiye.', () => {
    L.wait(0.4);
    L.lighten([add(A, P(-90, 30)), add(M, P(0, -10)), add(C, P(30, 0)), add(B, P(30, 30))]);
  });
  L.step(4);
  L.say('Ab square ko dark karo. AB, BC, CD, DA.', () => {
    L.fast(1.4, () => {
      L.line(A, B, {style: 'final'});
      L.line(B, C, {style: 'final'});
      L.line(C, D, {style: 'final'});
      L.line(D, A, {style: 'final'});
    });
    dimOut(L, B, C, '4 cm', mid(A, C));
    L.done([C]);
  });
  close(L, [M, add(A, P(-90, 0)), B], steps, 'ABCD is the square.');
  return add(B, P(-40, 70));
};

// ===================== 13 · square from its diagonal =====================
const q13: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const A = add(F, P(-225, 0)), C = add(F, P(225, 0)), O = F;
  const D = add(O, P(0, -225)), B = add(O, P(0, 225));
  const steps = ['Draw AC, 9 cm long.', 'Draw its perpendicular bisector (like Q1). Mark O.', 'Radius OA, needle on O: cut the bisector at D and B.', 'Join DA, AB, BC and CD.'];
  const qt = open(L, b, prev, [{s: 'Construct a square with its '}, {s: 'diagonal', mark: 'concept'}, {s: ' measuring 9 cm in length.'}], steps, 'Square from its diagonal');
  L.say('Question thirteen.');
  L.say('Construct a square with its diagonal measuring nine cm in length.');
  L.say('Diagonal matlab ek corner se saamne wale corner tak ki line.', () => highlight(L, qt, 1, L.t + 0.2));
  L.say('Square ke diagonals ki ek khaas baat hai. Dono barabar hote hain, aur ek doosre ko beech se, ninety degree pe kaatte hain.');
  toFigure(L, [add(D, P(0, -70)), add(B, P(0, 70)), add(A, P(-40, 0)), add(C, P(40, 0))]);
  L.step(0);
  L.say('Toh pehle diagonal AC, nine cm.', () => L.line(A, C, {measure: true, label: ['A', 'C'], dim: '9 cm'}));
  L.step(1);
  L.recapBadge('Same as Q1, quickly', 3);
  L.say('Iska perpendicular bisector. Q1, yaad hai na?', () => L.fast(2.2, () => bisect(L, A, C, 300, {mid: 'O', ext: 60})));
  L.step(2);
  L.say('Ab compass ko O se A tak kholo. O pe needle, upar aur neeche. D aur B.', () => {
    L.compassTo(O, 225, 180);
    L.arc(O, 225, -102, -78);
    L.burst(D);
    L.label('D', D, 24, -16);
    L.arc(O, 225, 78, 102);
    L.burst(B);
    L.label('B', B, 24, 18);
  });
  L.say('Kyunki doosra diagonal bhi utna hi lamba hai, aur O pe aadha aadha.');
  L.step(3);
  L.say('Halka karo, aur A, B, C, D jodo.', () => {
    L.lighten([add(D, P(0, -60)), add(B, P(0, 60)), add(A, P(-30, 0)), add(C, P(30, 0))]);
    L.fast(1.4, () => {
      L.line(D, A, {style: 'final'});
      L.line(A, B, {style: 'final'});
      L.line(B, C, {style: 'final'});
      L.line(C, D, {style: 'final'});
    });
    L.done([O]);
  });
  close(L, [add(D, P(0, -60)), add(B, P(0, 60)), A, C], steps, 'ABCD is the square.');
  return add(B, P(0, 80));
};

// ===================== 14 · rectangle =====================
const q14: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const A = add(F, P(-200, 125)), B = add(F, P(200, 125));
  const D = add(A, P(0, -250)), C = add(B, P(0, -250));
  const M = add(A, P(0, -320)), N = add(B, P(0, -320));
  const steps = ['Draw AB, 8 cm long. Extend it both ways.', 'At A and B, draw right angles: AM and BN.', 'Radius 5 cm: from A cut AM at D, from B cut BN at C.', 'Join CD.'];
  const qt = open(L, b, prev, [{s: 'Construct a '}, {s: 'rectangle', mark: 'concept'}, {s: ' with its two unequal sides measuring 5 cm and 8 cm in length.'}], steps, 'Rectangle');
  L.say('Question fourteen.');
  L.say('Construct a rectangle with its two unequal sides measuring five cm and eight cm in length.');
  L.say('Rectangle matlab aamne saamne ki sides barabar, aur chaaron corners ninety. Square jaisa hi, bas do lengths.', () => highlight(L, qt, 1, L.t + 0.2));
  toFigure(L, [add(M, P(-80, -20)), add(N, P(80, 0)), add(A, P(0, 40)), add(B, P(0, 40))]);
  L.step(0);
  L.say('Lambi side AB, eight cm. Aur dono taraf thoda badhao.', () => {
    L.line(A, B, {measure: true, label: ['A', 'B'], dim: '8 cm'});
    L.line(add(A, P(-80, 0)), add(B, P(80, 0)));
  });
  L.step(1);
  L.recapBadge('Right angles: same as Q4, twice', 3);
  L.say('A pe aur B pe, dono pe ninety degree. Q4 wala, do baar.', () => {
    L.fast(2.2, () => perpOn(L, A, 0, 60, 95));
    L.line(A, M);
    L.label('M', M, -22, -6);
    L.fast(2.4, () => perpOn(L, B, 0, 60, 95));
    L.line(B, N);
    L.label('N', N, 22, -6);
  });
  L.step(2);
  L.say('Compass scale pe five cm. A se upar kaato, D. B se, C.', () => {
    L.compassMeasure(5, add(A, P(-40, 160)));
    L.compassTo(A, 250, -102);
    L.arc(A, 250, -102, -78);
    L.burst(D);
    L.label('D', D, -26, -14);
    L.arc(B, 250, -102, -78);
    L.burst(C);
    L.label('C', C, 26, -14);
  });
  L.step(3);
  L.say('Halka karo, aur A, B, C, D jodo.', () => {
    L.lighten([add(M, P(-80, 0)), add(N, P(80, 0)), add(A, P(0, 30)), add(B, P(0, 30))]);
    L.fast(1.4, () => {
      L.line(A, B, {style: 'final'});
      L.line(B, C, {style: 'final'});
      L.line(C, D, {style: 'final'});
      L.line(D, A, {style: 'final'});
    });
    dimOut(L, B, C, '5 cm', F);
    L.done([C]);
  });
  close(L, [M, N, A, B], steps, 'ABCD is the 8 cm × 5 cm rectangle.');
  return add(B, P(-60, 70));
};

// ===================== 15 (1) circle into 4 =====================
const q15a: Q = (L, b, prev) => {
  const O = add(FIG(b.O), P(0, 40)), r = 100;
  const A = add(O, P(-r, 0)), C = add(O, P(r, 0)), D = add(O, P(0, -r)), B = add(O, P(0, r));
  const steps = ['Draw a circle, centre O, radius 2 cm.', 'Draw a diameter AC.', 'Draw diameter DB perpendicular to AC (like Q1).'];
  const qt = open(L, b, prev, [{s: '(1) Draw a circle of radius '}, {s: '2 cm', mark: 'num'}, {s: ' and divide it into '}, {s: 'four equal parts', mark: 'concept'}, {s: '.'}], steps, 'Circle into 4');
  L.say('Question fifteen. Ab circles. Isme teen chhote parts hain.');
  L.say('Part one. Draw a circle of radius two cm and divide it into four equal parts.', () => highlight(L, qt, 3, L.t + 3.6));
  toFigure(L, [add(O, P(-r - 30, -r - 50)), add(O, P(r + 30, r + 180))]);
  L.step(0);
  L.say('Centre O. Compass ko scale pe two cm, aur poora circle.', () => {
    L.label('O', O, 20, -20);
    L.compassMeasure(2, add(O, P(-60, r + 120)));
    L.circle(O, r, 180);
    L.dim(O, A, '2 cm', 1);
  });
  L.step(1);
  L.say('Ek diameter AC. O se hote hue, kinare se kinare tak.', () => L.line(A, C, {label: ['A', 'C']}));
  L.step(2);
  L.recapBadge('Same as Q1, quickly', 3);
  L.say('A aur C, O se barabar door hain. Toh Q1 wala bisector seedha. Yeh doosra diameter, DB.', () => {
    L.fast(2.2, () => bisect(L, A, C, 140, {ext: 20}));
    L.label('D', D, 18, -22);
    L.label('B', B, 18, 22);
  });
  L.say('A, B, C, D. Chaar barabar hisse.', () => L.done([O]));
  close(L, [add(O, P(-r - 20, -r - 40)), add(O, P(r, r + 40))], steps, 'A, B, C, D divide the circle into 4 equal parts.');
  return add(O, P(0, r + 60));
};

// ===================== 15 (2) circle into 6 =====================
const q15b: Q = (L, b, prev) => {
  const O = add(FIG(b.O), P(0, 30)), r = 150;
  const at = (a: number) => polar(O, r, a);
  const order: [number, string][] = [[180, 'C'], [120, 'D'], [60, 'E'], [0, 'F'], [-60, 'A'], [-120, 'B']];
  const steps = ['Draw a circle, centre O, radius 3 cm.', 'Same radius: step round the circle. Mark A to F.', 'Join the points to O.'];
  const qt = open(L, b, prev, [{s: '(2) Draw a circle of radius '}, {s: '3 cm', mark: 'num'}, {s: ' and divide it into '}, {s: 'six equal parts', mark: 'concept'}, {s: '.'}], steps, 'Circle into 6');
  L.say('Part two. Draw a circle of radius three cm and divide it into six equal parts.', () => highlight(L, qt, 3, L.t + 3.4));
  L.say('Yahan ek jaadu hai. Circle ka radius uske kinare pe exact six baar fit hota hai. Na zyada, na kam.');
  toFigure(L, [add(O, P(-r - 40, -r - 40)), add(O, P(r + 40, r + 160))]);
  L.step(0);
  L.say('Circle, radius three cm.', () => {
    L.label('O', O, 20, -20);
    L.compassMeasure(3, add(O, P(-60, r + 110)));
    L.circle(O, r, 180);
  });
  L.step(1);
  L.say('Compass mat chhedna. Kinare pe kahin se shuru karo, aur kadam kadam kaato.', () => {
    L.label('C', at(180), -26, 0);
    order.forEach(([a, nm], i) => {
      const nxt = order[(i + 1) % 6][0];
      const p0 = at(a), p1 = at(nxt);
      L.fast(i === 0 ? 1 : 1.5, () => {
        L.compassTo(p0, r, angOf(p0, p1) - 10);
        L.arc(p0, r, angOf(p0, p1) - 10, angOf(p0, p1) + 10);
      });
      if (i < 5) L.label(order[i + 1][1], p1, Math.cos((nxt * Math.PI) / 180) * 30, Math.sin((nxt * Math.PI) / 180) * 30);
      void nm;
    });
  });
  L.say('Six kadam, aur wapas wahin. Dekha?');
  L.step(2);
  L.say('In points ko O se jodo.', () => {
    L.fast(1.6, () => {
      L.line(at(180), at(0), {style: 'final'});
      L.line(at(-120), at(60), {style: 'final'});
      L.line(at(-60), at(120), {style: 'final'});
    });
    L.done([O]);
  });
  close(L, [add(O, P(-r - 30, -r - 30)), add(O, P(r + 30, r + 30))], steps, 'The circle is in 6 equal parts.');
  return add(O, P(0, r + 50));
};

// ===================== 15 (3) circle into 8 =====================
const q15c: Q = (L, b, prev) => {
  const O = add(FIG(b.O), P(0, 30)), r = 150;
  const A = add(O, P(-r, 0)), B = add(O, P(r, 0)), C = add(O, P(0, -r)), D = add(O, P(0, r));
  const steps = ['Draw a circle, radius 3 cm. Divide it into 4 (part 1).', 'Bisect angle COA. Extend it both ways.', 'Bisect angle COB. Extend it both ways.'];
  const qt = open(L, b, prev, [{s: '(3) Divide a circle of radius '}, {s: '3 cm', mark: 'num'}, {s: ' into '}, {s: 'eight equal parts', mark: 'concept'}, {s: '.'}], steps, 'Circle into 8');
  L.say('Part three. Divide a circle of radius three cm into eight equal parts.', () => highlight(L, qt, 3, L.t + 3.2));
  L.say('Eight matlab, pehle four, phir har hisse ko aadha.');
  toFigure(L, [add(O, P(-r - 50, -r - 50)), add(O, P(r + 50, r + 160))]);
  L.step(0);
  L.recapBadge('Same as part 1, quickly', 3);
  L.say('Circle, three cm, aur part one jaise chaar hisse.', () => {
    L.label('O', O, 22, -22);
    L.compassMeasure(3, add(O, P(-60, r + 110)));
    L.circle(O, r, 180);
    L.fast(1.6, () => L.line(A, B, {label: ['A', 'B']}));
    L.fast(2.4, () => bisect(L, A, B, 200, {ext: 20}));
    L.label('C', C, 18, -22);
    L.label('D', D, 18, 22);
  });
  L.step(1);
  L.recapBadge('Bisect an angle: same as Q6', 3);
  L.say('Ab angle COA ko bisect karo, Q6 wala. C aur A se arcs, aur line ko dono taraf kinare tak le jao.', () => {
    const Pm = far(circleX(C, 180, A, 180), O);
    L.compassTo(C, 180, angOf(C, Pm) - 14);
    L.arc(C, 180, angOf(C, Pm) - 14, angOf(C, Pm) + 14);
    L.arc(A, 180, angOf(A, Pm) - 14, angOf(A, Pm) + 14);
    L.burst(Pm);
    L.line(polar(O, r + 40, -135), polar(O, r + 40, 45), {style: 'final'});
    L.label('R', polar(O, r, -135), -18, -22);
    L.label('S', polar(O, r, 45), 18, 22);
  });
  L.step(2);
  L.say('Aur angle COB ko bhi.', () => {
    const Pm = far(circleX(C, 180, B, 180), O);
    L.fast(1.5, () => {
      L.compassTo(C, 180, angOf(C, Pm) - 14);
      L.arc(C, 180, angOf(C, Pm) - 14, angOf(C, Pm) + 14);
      L.arc(B, 180, angOf(B, Pm) - 14, angOf(B, Pm) + 14);
      L.burst(Pm);
      L.line(polar(O, r + 40, -45), polar(O, r + 40, 135), {style: 'final'});
    });
    L.label('Q', polar(O, r, -45), 18, -22);
    L.label('P', polar(O, r, 135), -18, 22);
  });
  L.say('Aath barabar hisse.', () => L.done([O]));
  close(L, [add(O, P(-r - 40, -r - 40)), add(O, P(r + 40, r + 40))], steps, 'The circle is in 8 equal parts.');
  return add(O, P(0, r + 60));
};

// ===================== 16 · regular polygons with the 4-5-6 ladder =====================
function ladder(L: Lesson, A: Pt, B: Pt, top: number, quick = false) {
  const M = mid(A, B), s = dist(A, B);
  const p4 = add(M, P(0, -s / 2)), p6 = add(M, P(0, -s * Math.sqrt(3) / 2)), p5 = mid(p4, p6);
  // perpendicular bisector MN, long enough for the circle
  const R = s * 0.85;
  const [c] = circleX(A, R, B, R);
  const d = add(M, sub(M, c));
  L.arcPair(A, R, angOf(A, c), angOf(A, d), 18);
  L.arcPair(B, R, angOf(B, c), angOf(B, d), 18);
  L.line(add(d, P(0, 20)), add(M, P(0, -top)));
  L.label('M', M, 18, 24, undefined, 'main', 26);
  L.label('N', add(M, P(0, -top)), 18, -10, undefined, 'main', 26);
  if (!quick) L.wait(0.2);
  L.compassTo(M, s / 2, 180);
  L.arc(M, s / 2, 180, 360);
  L.label('4', p4, 16, 4, undefined, 'main', 22);
  L.compassTo(A, s, angOf(A, p6) - 12);
  L.arc(A, s, angOf(A, p6) - 12, angOf(A, p6) + 12);
  L.label('6', p6, 16, -4, undefined, 'main', 22);
  return {M, p4, p5, p6};
}
function polygonRound(L: Lesson, A: Pt, B: Pt, c: Pt, R: number, n: number, names: string[]) {
  const s = dist(A, B);
  const vs: Pt[] = [A, B];
  for (let i = 2; i < n; i++) {
    const cur = vs[i - 1], prv = vs[i - 2];
    const nx = far(circleX(cur, s, c, R), prv);
    vs.push(nx);
  }
  L.compassTo(B, s, angOf(B, vs[2]) - 10);
  for (let i = 2; i < n; i++) {
    L.fast(i === 2 ? 1 : 1.5, () => {
      L.compassTo(vs[i - 1], s, angOf(vs[i - 1], vs[i]) - 10);
      L.arc(vs[i - 1], s, angOf(vs[i - 1], vs[i]) - 10, angOf(vs[i - 1], vs[i]) + 10);
    });
    const out = unit(c, vs[i]);
    L.label(names[i - 2], vs[i], out.x * 30, out.y * 30);
  }
  return vs;
}
const q16a: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const A = add(F, P(-100, 190)), B = add(F, P(100, 190));
  const M = mid(A, B), s = 200;
  const p4 = add(M, P(0, -s / 2)), p6 = add(M, P(0, -s * Math.sqrt(3) / 2)), p5 = mid(p4, p6);
  const R5 = dist(p5, A);
  const top = dist(M, p5) + R5 + 40;
  const steps = ['Draw AB, 4 cm. Draw its perpendicular bisector MN.', 'Centre M, radius MA: a semicircle cuts MN at 4.', 'Centre A, radius AB: an arc cuts MN at 6.', 'Middle of 4 and 6 = point 5.', 'Centre 5, radius 5A: draw a circle.', 'Radius AB: step round from B (C, D, E). Join them.'];
  const qt = open(L, b, prev, [{s: '(1) Construct a '}, {s: 'regular pentagon', mark: 'concept'}, {s: ' with one side measuring 4 cm in length.'}], steps, 'Regular pentagon');
  L.say('Question sixteen. Ab polygons, pentagon aur heptagon.');
  L.say('Part one. Construct a regular pentagon with one side measuring four cm in length.', () => highlight(L, qt, 1, L.t + 2.4));
  L.say('Pentagon, paanch sides. Regular matlab saari sides aur saare angles barabar.');
  L.say('Isme ek pyaari trick hai jisse koi bhi polygon ban jaata hai. Main ise four, five, six wali seedhi bolta hoon.');
  toFigure(L, [add(M, P(0, -top)), add(A, P(-R5 + 40, 40)), add(B, P(R5 - 40, 110))]);
  L.step(0);
  let lad: ReturnType<typeof ladder> | undefined;
  L.say('AB, four cm. Aur uska perpendicular bisector, MN.', () => {
    L.line(A, B, {measure: true, label: ['A', 'B'], dim: '4 cm'});
    L.fast(1.8, () => {
      const RR = s * 0.85;
      const [c] = circleX(A, RR, B, RR);
      const d = add(M, sub(M, c));
      L.arcPair(A, RR, angOf(A, c), angOf(A, d), 18);
      L.arcPair(B, RR, angOf(B, c), angOf(B, d), 18);
      L.line(add(d, P(0, 20)), add(M, P(0, -top)));
    });
    L.label('M', M, 18, 24, undefined, 'main', 26);
    L.label('N', add(M, P(0, -top)), 18, -10, undefined, 'main', 26);
    lad = {M, p4, p5, p6};
  });
  L.step(1);
  L.say('M pe needle, A tak radius, ek semicircle. Bisector pe jahan kaate, woh point four.', () => {
    L.compassTo(M, s / 2, 180);
    L.arc(M, s / 2, 180, 360);
    L.burst(p4, 24);
    L.label('4', p4, 16, 4, undefined, 'main', 22);
  });
  L.step(2);
  L.say('A pe needle, radius AB. Bisector pe point six.', () => {
    L.compassTo(A, s, angOf(A, p6) - 12);
    L.arc(A, s, angOf(A, p6) - 12, angOf(A, p6) + 12);
    L.burst(p6, 24);
    L.label('6', p6, 16, -4, undefined, 'main', 22);
  });
  L.say('Six kyun? Kyunki yahan se hexagon ka circle banta hai. Four se square, six se hexagon.');
  L.step(3);
  L.say('Toh pentagon ke liye, four aur six ke bilkul beech ka point. Five.', () => {
    L.fast(2, () => bisect(L, p4, p6, 50, {ext: 12}));
    L.burst(p5, 22);
    L.label('5', p5, 16, 0, undefined, 'main', 22);
  });
  L.step(4);
  L.say('Five pe needle, A tak radius, aur poora circle.', () => {
    L.compassTo(p5, R5, angOf(p5, A));
    L.circle(p5, R5, angOf(p5, A));
  });
  L.step(5);
  let vs: Pt[] = [];
  L.say('Ab compass ko AB jitna, aur circle pe B se kadam. C, D, E.', () => {
    vs = polygonRound(L, A, B, p5, R5, 5, ['C', 'D', 'E']);
  });
  L.say('Construction halka karo, aur pentagon jodo.', () => {
    L.lighten([add(M, P(0, -top)), add(A, P(-R5 + 60, 40)), add(B, P(R5 - 60, 100))]);
    L.fast(1.6, () => vs.forEach((v, i) => L.line(v, vs[(i + 1) % 5], {style: 'final'})));
    L.done([p5]);
  });
  L.say('Yeh trick yaad rakhna. Abhi heptagon mein phir aayegi.');
  void lad;
  close(L, [add(M, P(0, -top)), add(A, P(-R5 + 60, 0)), add(B, P(R5 - 60, 40))], steps, 'ABCDE is the regular pentagon.');
  return add(M, P(0, 90));
};
const q16b: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const A = add(F, P(-100, 210)), B = add(F, P(100, 210));
  const M = mid(A, B), s = 200;
  const p4 = add(M, P(0, -s / 2)), p6 = add(M, P(0, -s * Math.sqrt(3) / 2)), p5 = mid(p4, p6);
  const step = dist(p4, p5);
  const p7 = add(p6, P(0, -step));
  const R7 = dist(p7, A);
  const top = dist(M, p7) + R7 + 40;
  const steps = ['Draw AB, 4 cm. Find points 4, 5, 6 (like the pentagon).', 'Step the distance 4-5 once above 6: point 7.', 'Centre 7, radius 7A: draw a circle.', 'Radius AB: step round from B. Join the 7 points.'];
  const qt = open(L, b, prev, [{s: '(2) Construct a regular '}, {s: 'heptagon', mark: 'concept'}, {s: ' with one of its side 4 cm long.'}], steps, 'Regular heptagon');
  L.say('Part two. Construct a regular heptagon with one of its side four cm long.', () => highlight(L, qt, 1, L.t + 2.2));
  L.say('Heptagon, saat sides. Wahi seedhi, bas thoda aage.');
  toFigure(L, [add(M, P(0, -top)), add(A, P(-R7 + 30, 40)), add(B, P(R7 - 30, 40))]);
  L.step(0);
  L.recapBadge('Points 4, 5, 6: same as the pentagon', 3);
  L.say('AB four cm, bisector, aur points four, five, six. Pentagon jaisa.', () => {
    L.line(A, B, {measure: true, label: ['A', 'B'], dim: '4 cm'});
    L.fast(2.4, () => {
      ladder(L, A, B, top, true);
      bisect(L, p4, p6, 50, {ext: 12});
    });
    L.label('5', p5, 16, 0, undefined, 'main', 22);
  });
  L.step(1);
  L.say('Four se five ki doori compass mein lo. Six ke upar ek kadam. Seven.', () => {
    L.compassTo(p4, step, -90);
    L.compassTo(p6, step, -90);
    L.arc(p6, step, -104, -76);
    L.burst(p7, 22);
    L.label('7', p7, 16, -2, undefined, 'main', 22);
  });
  L.say('Saat sides chahiye toh point seven. Aath sides, toh ek kadam aur, eight. Simple.');
  L.step(2);
  L.say('Seven pe needle, A tak radius, circle.', () => {
    L.compassTo(p7, R7, angOf(p7, A));
    L.circle(p7, R7, angOf(p7, A));
  });
  L.step(3);
  let vs: Pt[] = [];
  L.say('AB jitna radius, kinare pe kadam, aur saaton points jodo.', () => {
    vs = polygonRound(L, A, B, p7, R7, 7, ['C', 'D', 'E', 'F', 'G']);
    L.lighten([add(M, P(0, -top)), add(A, P(-R7 + 40, 40)), add(B, P(R7 - 40, 40))]);
    L.fast(2, () => vs.forEach((v, i) => L.line(v, vs[(i + 1) % 7], {style: 'final'})));
    L.done([p7]);
  });
  close(L, [add(M, P(0, -top)), add(A, P(-R7 + 40, 0)), add(B, P(R7 - 40, 40))], steps, 'ABCDEFG is the regular heptagon.');
  return add(M, P(0, 80));
};

// ===================== 17 · circle in a triangle =====================
const q17: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const B = add(F, P(-150, 140)), C = add(F, P(150, 140));
  const A = near(circleX(B, 200, C, 250), add(F, P(0, -500)));
  const a = dist(B, C), bb = dist(C, A), c = dist(A, B);
  const O = mul(add(add(mul(A, a), mul(B, bb)), mul(C, c)), 1 / (a + bb + c));
  const N = P(O.x, B.y);
  const rin = dist(O, N);
  const steps = ['Construct triangle ABC: BC 6 cm, AB 4 cm, AC 5 cm (like Q11).', 'Bisect angle B and angle C (like Q6). They meet at O.', 'From O, draw ON perpendicular to BC (like Q5).', 'Centre O, radius ON: draw the circle.'];
  const qt = open(L, b, prev, [{s: 'Construct a triangle with its three sides measuring 4 cm, 5 cm and 6 cm and '}, {s: 'inscribe a circle', mark: 'concept'}, {s: ' in it.'}], steps, 'Circle in a triangle');
  L.say('Question seventeen. Ab circles ko shapes ke andar fit karna hai.');
  L.say('Construct a triangle with its three sides measuring four cm, five cm and six cm and inscribe a circle in it.');
  L.say('Inscribe matlab andar aisa circle, jo teeno sides ko bas chhoo le.', () => highlight(L, qt, 1, L.t + 0.2));
  L.say('Uska centre kahan hoga? Aisa point jo teeno sides se barabar door ho. Aur angle ka bisector wahi line hai, jiska har point dono arms se barabar door hota hai.');
  toFigure(L, [add(A, P(0, -50)), add(B, P(-60, 160)), add(C, P(60, 90))]);
  L.step(0);
  L.recapBadge('Three sides: same as Q11, quickly', 3);
  L.say('Pehle triangle, three sides wala. Q11 jaisa.', () =>
    L.fast(2.2, () => {
      sss(L, B, C, 4, 5, 6, {quick: true});
    }),
  );
  L.step(1);
  L.recapBadge('Bisect an angle: same as Q6', 3);
  L.say('Angle B ko bisect karo, Q6 wala.', () => {
    L.fast(1.8, () => angleBisect(L, B, angOf(B, A), 0, 90, 80));
    L.line(B, polar(B, dist(B, O) + 50, angOf(B, O)));
  });
  L.step(2);
  L.say('Angle C ko bhi. Jahan dono milte hain, woh O. Circle ka centre.', () => {
    L.fast(2.2, () => angleBisect(L, C, angOf(C, A), 180, 90, 80));
    L.line(C, polar(C, dist(C, O) + 50, angOf(C, O)));
    L.burst(O, 24);
    L.label('O', O, 0, -26);
  });
  L.step(3);
  L.recapBadge('Perpendicular: same as Q5', 3);
  L.say('Radius kitna? O se BC tak ki seedhi doori. Toh O se BC pe perpendicular, Q5 wala. Point N.', () => {
    L.fast(2, () => {
      const res = perpFrom(L, O, B, C, rin + 30, 75);
      L.line(O, add(res.Q, P(0, 20)));
    });
    L.label('N', N, 18, 26);
  });
  L.step(4);
  L.say('Halka karo. O pe needle, N tak radius, aur circle.', () => {
    L.lighten([add(A, P(0, -20)), add(B, P(-40, 70)), add(C, P(40, 70))]);
    L.compassTo(O, rin, 90);
    L.circle(O, rin, 90, 365, 'final');
    L.done([O]);
  });
  L.say('Teeno sides ko chhoo raha hai. Perfect.');
  close(L, [add(A, P(0, -40)), add(B, P(-40, 80)), add(C, P(40, 0))], steps, 'The circle touches all three sides.');
  return add(N, P(0, 90));
};

// ===================== 18 · circle in a square =====================
const q18: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const A = add(F, P(-150, 150)), B = add(F, P(150, 150));
  const C = add(B, P(0, -300)), D = add(A, P(0, -300)), O = mid(A, C);
  const Pp = P(O.x, A.y);
  const steps = ['Construct square ABCD, side 6 cm (like Q12).', 'Draw diagonals AC and BD. They meet at O.', 'From O, draw OP perpendicular to AB (like Q5).', 'Centre O, radius OP: draw the circle.'];
  const qt = open(L, b, prev, [{s: 'Construct a square with side 6 cm in length, and '}, {s: 'inscribe a circle', mark: 'concept'}, {s: ', touching all its four sides.'}], steps, 'Circle in a square');
  L.say('Question eighteen.');
  L.say('Construct a square with side six cm in length, and inscribe a circle, touching all its four sides.', () => highlight(L, qt, 1, L.t + 3.4));
  toFigure(L, [add(D, P(0, -90)), add(A, P(-110, 60)), add(C, P(40, 0))]);
  L.step(0);
  L.recapBadge('Square: same as Q12, quickly', 3);
  L.say('Square, six cm. Q12 wala, jaldi se.', () => L.fast(2.6, () => squareOn(L, A, B, ['A', 'B', 'C', 'D'], 6)));
  L.step(1);
  L.say('Dono diagonals, AC aur BD. Jahan katein, woh O. Centre.', () => {
    L.line(A, C);
    L.line(B, D);
    L.burst(O, 24);
    L.label('O', O, 0, -26);
  });
  L.say('Square mein centre dhoondhna sabse aasaan hai. Diagonals ka cross.');
  L.step(2);
  L.recapBadge('Perpendicular: same as Q5', 3);
  L.say('O se AB pe perpendicular, Q5 jaisa. P.', () => {
    L.fast(2, () => {
      const res = perpFrom(L, O, A, B, 190, 120);
      L.line(O, add(res.Q, P(0, 20)));
    });
    L.label('P', Pp, 18, 26);
  });
  L.step(3);
  L.say('Halka karo. O pe needle, P tak radius, circle.', () => {
    L.lighten([add(D, P(-90, -80)), add(B, P(30, 90))]);
    L.compassTo(O, 150, 90);
    L.circle(O, 150, 90, 365, 'final');
    L.done([O]);
  });
  close(L, [add(D, P(0, -70)), add(A, P(-90, 40)), add(C, P(40, 0))], steps, 'The circle touches all four sides.');
  return add(Pp, P(0, 100));
};

// ===================== 19 · three circles in an equilateral triangle =====================
const q19: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const B = add(F, P(-225, 200)), C = add(F, P(225, 200));
  const A = add(mid(B, C), P(0, -450 * Math.sqrt(3) / 2));
  const M = mid(B, C), N = mid(A, C), Lp = mid(A, B);
  const O = P(M.x, M.y - 225 / Math.sqrt(3));
  const Pp = P(M.x, M.y - 225 * Math.tan(Math.PI / 12));
  const OP = dist(O, Pp), PM = dist(Pp, M);
  const Q = polar(O, OP, angOf(O, N)), R = polar(O, OP, angOf(O, Lp));
  const steps = ['Construct equilateral triangle ABC, side 9 cm (like Q8).', 'Bisect all three angles: AM, BN, CL. They meet at O.', 'Bisect angle OBC: it cuts OM at P.', 'Radius OP, centre O: cut ON at Q and OL at R.', 'Centres P, Q, R, radius PM: draw three circles.'];
  const qt = open(L, b, prev, [{s: 'Inscribe '}, {s: 'three equal circles', mark: 'concept'}, {s: ' in an equilateral triangle, with one side 9 cm long, such that each circle touches one side of the triangle and two other circles.'}], steps, 'Three circles in a triangle');
  L.say(b.lead ?? 'Question nineteen. Yeh thoda bada hai, par iski har cheez humein aati hai.');
  L.say('Inscribe three equal circles in an equilateral triangle, with one side nine cm long, such that each circle touches one side of the triangle and two other circles.');
  L.say('Teen circles. Har ek ek side ko chhoota hai, aur baaki do circles ko.', () => highlight(L, qt, 1, L.t + 0.2));
  toFigure(L, [add(A, P(0, -50)), add(B, P(-60, 40)), add(C, P(60, 40))]);
  L.step(0);
  L.recapBadge(`Equilateral triangle: same as ${REF(8)}`, 3);
  L.say(`Equilateral triangle, nine cm. ${REF(8)} wala.`, () =>
    L.fast(2.4, () => {
      L.line(B, C, {measure: true, label: ['B', 'C'], dim: '9 cm', style: 'final'});
      L.compassTo(B, 450, 0);
      L.arc(B, 450, -72, -48);
      L.arc(C, 450, -132, -108);
      L.burst(A);
      L.label('A', A, 0, -30);
      L.line(A, B, {style: 'final'});
      L.line(A, C, {style: 'final'});
    }),
  );
  L.step(1);
  L.recapBadge(`Bisect an angle: same as ${REF(6)}, three times`, 3);
  L.say(`Teeno angles ke bisectors. AM, BN, CL. ${REF(6)}, teen baar. Yeh O pe milte hain.`, () => {
    L.fast(2.2, () => angleBisect(L, A, angOf(A, B), angOf(A, C), 110, 90));
    L.line(A, M);
    L.label('M', M, 0, 28);
    L.fast(2.8, () => angleBisect(L, B, angOf(B, A), 0, 110, 90));
    L.line(B, N);
    L.label('N', N, 24, -10);
    L.fast(2.8, () => angleBisect(L, C, angOf(C, A), 180, 110, 90));
    L.line(C, Lp);
    L.label('L', Lp, -24, -10);
    L.burst(O, 24);
    L.label('O', O, 22, -16);
  });
  L.say('Ab triangle teen chhote triangles mein bat gaya, aur har ek mein ek circle aayega.');
  L.step(2);
  L.say('Neeche wale chhote triangle OBC mein, angle OBC ko bisect karo. Yeh OM ko P pe kaatega. P, pehle circle ka centre.', () => {
    L.fast(2, () => angleBisect(L, B, angOf(B, O), 0, 130, 70));
    L.line(B, polar(B, dist(B, Pp) + 40, angOf(B, Pp)));
    L.burst(Pp, 22);
    L.label('P', Pp, 20, 6);
  });
  L.step(3);
  L.say('O pe needle, P tak radius. ON aur OL ko kaato. Q aur R, baaki do centres.', () => {
    L.compassTo(O, OP, angOf(O, Q) - 10);
    L.arc(O, OP, angOf(O, Q) - 10, angOf(O, Q) + 10);
    L.burst(Q, 22);
    L.label('Q', Q, 20, -10);
    L.arc(O, OP, angOf(O, R) - 10, angOf(O, R) + 10);
    L.burst(R, 22);
    L.label('R', R, -20, -10);
  });
  L.step(4);
  L.say('Halka karo. P, Q, R pe needle, radius PM, teen circles.', () => {
    L.lighten([add(A, P(0, -20)), add(B, P(-20, 30)), add(C, P(20, 30))]);
    L.compassTo(Pp, PM, 90);
    [Pp, Q, R].forEach((c) => L.circle(c, PM, 90, 365, 'final'));
    L.done([O]);
  });
  L.say('Dekho. Har circle ek side ko chhoo raha hai, aur doosre do circles ko.');
  close(L, [add(A, P(0, -40)), add(B, P(-40, 30)), add(C, P(40, 30))], steps, 'Each circle touches one side and the other two circles.');
  return add(M, P(0, 90));
};

// ===================== 20 · four circles in a square =====================
const q20: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const Bc = add(F, P(-200, 200)), Cc = add(F, P(200, 200));
  const Dc = add(Cc, P(0, -400)), Ac = add(Bc, P(0, -400));
  const O = mid(Ac, Cc), M = mid(Bc, Cc);
  const Pp = P(M.x, M.y - 200 * Math.tan(Math.PI / 8));
  const OP = dist(O, Pp), PM = dist(Pp, M);
  const Q = add(O, P(OP, 0)), R = add(O, P(0, -OP)), S = add(O, P(-OP, 0));
  const steps = ['Construct square ABCD, side 8 cm (like Q12).', 'Draw diagonals AC and BD. They meet at O.', 'Bisect the angles at O (lines through O).', 'Bisect angle OBC: it cuts OM at P (like Q19).', 'Radius OP, centre O: mark Q, R, S on the other bisectors.', 'Centres P, Q, R, S, radius PM: draw four circles.'];
  const qt = open(L, b, prev, [{s: 'Inscribe '}, {s: 'four equal circles', mark: 'concept'}, {s: ' in a square, with side 8 cm long, so that each circle touches one side of the square and two other circles.'}], steps, 'Four circles in a square');
  L.say(b.lead ?? 'Aur aakhri, question twenty.');
  L.say('Inscribe four equal circles in a square, with side eight cm long, so that each circle touches one side of the square and two other circles.');
  L.say(`Yeh bilkul ${REF(19)} jaisa hai. Bas triangle ki jagah square.`, () => highlight(L, qt, 1, L.t + 0.2));
  toFigure(L, [add(Ac, P(-110, -90)), add(Cc, P(40, 60))]);
  L.step(0);
  L.recapBadge(`Square: same as ${REF(12)}, quickly`, 3);
  L.say(`Square, eight cm. ${REF(12)} wala.`, () => L.fast(2.8, () => squareOn(L, Bc, Cc, ['B', 'C', 'D', 'A'], 8)));
  L.step(1);
  L.say('Dono diagonals. Centre O. Ab square chaar chhote triangles mein bat gaya.', () => {
    L.line(Ac, Cc);
    L.line(Bc, Dc);
    L.burst(O, 24);
    L.label('O', O, 22, -16);
  });
  L.step(2);
  L.recapBadge(`Bisect an angle: same as ${REF(6)}`, 3);
  L.say('O pe bane angles ko bisect karo. Yeh lines square ke beech se seedhi jaati hain.', () => {
    L.fast(2.2, () => angleBisect(L, O, angOf(O, Bc), angOf(O, Cc), 90, 80));
    L.line(add(O, P(0, -200)), M);
    L.label('M', M, 0, 28);
    L.fast(2.8, () => angleBisect(L, O, angOf(O, Bc), angOf(O, Ac), 90, 80));
    L.line(add(O, P(-200, 0)), add(O, P(200, 0)));
  });
  L.step(3);
  L.recapBadge(`Same as ${REF(19)}`, 3);
  L.say(`Neeche wale triangle OBC mein, angle OBC ka bisector. Yeh OM ko P pe kaatega. ${REF(19)} wala hi.`, () => {
    L.fast(2, () => angleBisect(L, Bc, angOf(Bc, O), 0, 130, 75));
    L.line(Bc, polar(Bc, dist(Bc, Pp) + 40, angOf(Bc, Pp)));
    L.burst(Pp, 22);
    L.label('P', Pp, 20, 6);
  });
  L.step(4);
  L.say('O pe needle, P tak radius. Baaki teen bisectors pe Q, R, S.', () => {
    L.compassTo(O, OP, 0);
    [[Q, 'Q'], [R, 'R'], [S, 'S']].forEach(([p, nm]) => {
      const a = angOf(O, p as Pt);
      L.arc(O, OP, a - 10, a + 10);
      L.burst(p as Pt, 22);
      L.label(nm as string, p as Pt, 18, -18);
    });
  });
  L.step(5);
  L.say('Halka karo, aur chaaron pe, radius PM se circles.', () => {
    L.lighten([add(Ac, P(-90, -20)), add(Cc, P(20, 30))]);
    L.compassTo(Pp, PM, 90);
    [Pp, Q, R, S].forEach((c) => L.circle(c, PM, 90, 365, 'final'));
    L.done([O]);
  });
  L.say('Chaar circles. Har ek ek side ko chhoo raha hai, aur apne do padosiyon ko.');
  close(L, [add(Ac, P(-90, -40)), add(Cc, P(30, 40))], steps, 'Each circle touches one side and two other circles.');
  return add(M, P(0, 100));
};

// ---------------- the videos ----------------
const ALL: [number, string | undefined, Q][] = [
  [1, undefined, q1], [2, undefined, q2], [3, undefined, q3], [4, undefined, q4], [5, undefined, q5], [6, undefined, q6], [7, undefined, q7],
  [8, undefined, q8], [9, undefined, q9], [10, undefined, q10], [11, undefined, q11], [12, undefined, q12], [13, undefined, q13], [14, undefined, q14],
  [15, '(1)', q15a], [15, '(2)', q15b], [15, '(3)', q15c], [16, '(1)', q16a], [16, '(2)', q16b], [17, undefined, q17], [18, undefined, q18],
  [19, undefined, q19], [20, undefined, q20],
];
function build(name: string, which: typeof ALL, intro: boolean) {
  const L = new Lesson(name);
  const O0 = P(0, 0);
  const G1 = glyphAt(1, 0, 0);
  L.cam.to(0, 0.01, {x: -1300, y: G1.y, zoom: 0.85, tilt: 3});
  L.t = 0.4;
  if (intro) {
    L.say('Elementary drawing exam ke geometry paper mein yeh twenty constructions aate hain. Aaj hum saare banayenge, exam wale tareeke se.');
    L.say('Chahiye bas pencil, scale, compass, protractor, aur ek eraser.');
    L.say('Aur ek rule pehle hi. Arc lagate waqt, beech mein compass ka radius kabhi mat chhedna.');
  }
  let prev: Pt | null = null;
  which.forEach(([n, sub, fn], i) => {
    // part (1) of a question keeps its number; parts (2)/(3) are blocks without a number
    const O = add(O0, P(i * 860, i * 1760));
    prev = fn(L, {n, sub: sub && sub !== '(1)' ? sub : undefined, O}, prev);
  });
  if (intro) {
    L.say('Bas! Yeh the elementary ke saare twenty constructions.');
    L.say('Ab inhe ek baar khud, pencil aur compass se banao. Steps ke screenshots revision ke kaam aayenge.');
    L.say('Intermediate wala video bhi aa raha hai. Milte hain.');
  }
  return L.finish();
}
export const elementary = () => build('elementary', ALL, true);
export const pilot = () => build('pilot', ALL.slice(0, 2), false);
export {q6, q19, q20};
