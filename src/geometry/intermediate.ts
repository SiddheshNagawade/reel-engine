// INTERMEDIATE GRADE EXAM: the 20 plane-geometry constructions (book p.157-166). Same engine and helpers as the
// Elementary video (elementary.ts); 4(1), 14(1) and 14(2) are the Elementary Q6, Q19 and Q20 again, so those
// functions are reused with their own opening line. EDITABLE like elementary.ts: change a line or a number here
// and the video re-times itself; voice.ts fits it to his recording.
import {Lesson, P, CM, type Pt, add, angOf, circleX, mid, dist, polar} from './engine';
import {type Block, type Q, glyphAt, setRef, near, far, rayX, dimOut, perpOn, perpFrom, angleBisect, squareOn, open, highlight, toFigure, close, FIG, bisect, q6, q19, q20} from './elementary';

const semi = (L: Lesson, c: Pt, r: number, out: number) => L.arc(c, r, out - 90, out + 90, {style: 'final'});
const centroid = (...p: Pt[]) => P(p.reduce((s, q) => s + q.x, 0) / p.length, p.reduce((s, q) => s + q.y, 0) / p.length);
function circum(a: Pt, b: Pt, c: Pt): Pt {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  const a2 = a.x * a.x + a.y * a.y, b2 = b.x * b.x + b.y * b.y, c2 = c.x * c.x + c.y * c.y;
  return P((a2 * (b.y - c.y) + b2 * (c.y - a.y) + c2 * (a.y - b.y)) / d, (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / d);
}

// ===================== 1 · parallel through a point =====================
const i1: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const A = add(F, P(-100, 110)), B = add(F, P(100, 110));
  const Pp = add(A, P(50, -170)), Qp = add(Pp, P(200, 0));
  const AP = dist(A, Pp);
  const steps = ['Draw AB, 4 cm long. Mark P above it.', 'Needle on P, radius 4 cm (= AB): an arc on the B side.', 'Needle on B, radius AP: cut that arc at Q.', 'Join P and Q.'];
  const qt = open(L, b, prev, [{s: 'Point P is at some distance from line AB which is '}, {s: '4 cm', mark: 'num'}, {s: ' long. Draw a line '}, {s: 'parallel', mark: 'concept'}, {s: ' to line AB from point P.'}], steps, 'Parallel through a point');
  L.say('Pehla question. Parallel lines.');
  L.say('Point P is at some distance from line AB which is four cm long. Draw a line parallel to line AB from point P.');
  L.say('Parallel matlab do lines jo hamesha same doori pe chalti hain. Kabhi milti nahi, railway track jaisi.', () => highlight(L, qt, 3, L.t + 0.2));
  toFigure(L, [add(A, P(-40, 40)), add(B, P(40, 40)), add(Pp, P(-90, -40)), add(Qp, P(90, -40))]);
  L.step(0);
  L.say('AB, four cm. Aur upar kahin bhi ek point P.', () => {
    L.line(A, B, {measure: true, label: ['A', 'B'], dim: '4 cm'});
    L.label('P', Pp, -20, -20);
  });
  L.say('Idea yeh hai: hum ek chaar-kona banayenge jiski aamne saamne ki sides barabar hon. Aisi shape mein saamne wali sides parallel hi hoti hain.');
  L.step(1);
  L.say('Compass ko AB jitna kholo, four cm. P pe needle, aur B ki taraf ek arc.', () => {
    L.compassTo(A, 200, 0);
    L.compassTo(Pp, 200, -12);
    L.arc(Pp, 200, -12, 12);
  });
  L.step(2);
  L.say('Ab compass A se P tak kholo. Needle B pe, aur pehle wale arc ko kaato. Woh Q.', () => {
    L.compassTo(A, AP, angOf(A, Pp));
    const a = angOf(B, Qp);
    L.compassTo(B, AP, a - 12);
    L.arc(B, AP, a - 12, a + 12);
    L.burst(Qp);
    L.label('Q', Qp, 20, -20);
  });
  L.step(3);
  L.say('P aur Q jodo. Yeh rahi AB ki parallel line.', () => {
    L.line(add(Pp, P(-80, 0)), add(Qp, P(80, 0)), {style: 'final'});
    L.dim(Pp, Qp, '4 cm', -1);
    L.done([Qp]);
  });
  close(L, [add(Pp, P(-80, 0)), add(Qp, P(80, 0)), A, B], steps, 'PQ is parallel to AB.');
  return add(B, P(-40, 70));
};

// ===================== 2 · parallel at a distance =====================
const i2: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const A = add(F, P(-200, 120)), B = add(F, P(200, 120));
  const Pp = add(A, P(70, 0)), Qp = add(B, P(-70, 0));
  const C = add(Pp, P(0, -200)), D = add(Qp, P(0, -200));
  const steps = ['Draw AB, 8 cm long.', 'Mark two points P and Q on it.', 'Draw perpendiculars at P and Q (like elementary Q4).', 'Radius 4 cm: from P cut at C, from Q cut at D.', 'Join C and D.'];
  const qt = open(L, b, prev, [{s: 'Draw a line AB '}, {s: '8 cm', mark: 'num'}, {s: ' long. Draw a line parallel to AB '}, {s: 'at a distance of 4 cm', mark: 'concept'}, {s: ' from it.'}], steps, 'Parallel at a distance');
  L.say('Question two.');
  L.say('Draw a line AB eight cm long. Draw a line parallel to AB at a distance of four cm from it.');
  L.say('Ab point nahi diya, doori di hai. Aur doori hamesha seedhi, ninety degree pe naapi jaati hai.', () => highlight(L, qt, 3, L.t + 0.6));
  toFigure(L, [add(A, P(-40, 40)), add(B, P(40, 40)), add(C, P(-60, -60)), add(D, P(60, -60))]);
  L.step(0);
  L.say('AB, eight cm.', () => L.line(A, B, {measure: true, label: ['A', 'B'], dim: '8 cm'}));
  L.step(1);
  L.say('Is pe kahin bhi do points, P aur Q. Thoda door door.', () => {
    L.label('P', Pp, 0, 28);
    L.label('Q', Qp, 0, 28);
  });
  L.step(2);
  L.recapBadge('Perpendicular: elementary Q4, quickly', 3);
  L.say('Dono pe perpendicular. Elementary ka Q4 wala, jaldi se.', () => {
    L.fast(2.2, () => perpOn(L, Pp, 0, 50, 80));
    L.line(Pp, add(Pp, P(0, -270)));
    L.fast(2.4, () => perpOn(L, Qp, 0, 50, 80));
    L.line(Qp, add(Qp, P(0, -270)));
    L.right(Pp, -90, 0);
    L.right(Qp, -90, 180);
  });
  L.step(3);
  L.say('Compass scale pe four cm. P se upar kaato, C. Q se, D.', () => {
    L.compassMeasure(4, add(F, P(-90, 200)));
    L.compassTo(Pp, 200, -102);
    L.arc(Pp, 200, -102, -78);
    L.burst(C);
    L.label('C', C, -24, -16);
    L.arc(Qp, 200, -102, -78);
    L.burst(D);
    L.label('D', D, 24, -16);
  });
  L.step(4);
  L.say('C aur D jodo. Har jagah se ekdum four cm door.', () => {
    L.line(add(C, P(-90, 0)), add(D, P(90, 0)), {style: 'final'});
    L.dim(Pp, C, '4 cm', -1);
    L.done([C, D]);
  });
  close(L, [add(C, P(-90, 0)), add(D, P(90, 0)), A, B], steps, 'CD is parallel to AB, 4 cm away.');
  return add(B, P(-40, 70));
};

// ===================== 3 · divide in proportion =====================
const i3: Q = (L, b, prev) => {
  const F = add(FIG(b.O), P(0, 180));
  const y1 = F.y - 40, y2 = F.y + 120;
  const A = P(F.x - 225, y1), B = P(F.x + 225, y1);
  const C = P(F.x - 300, y2), D = P(F.x + 300, y2);
  const O = P(F.x, y2 - 640);
  const k = 640 / 480;
  const on = (p: Pt) => P(O.x + (p.x - O.x) * k, y2);
  const E = add(A, P(75, 0)), Fp = add(A, P(200, 0)), G = add(A, P(375, 0));
  const [Pc, Qc, Rc] = [on(E), on(Fp), on(G)];
  const steps = ['On AB, 9 cm, mark E, F, G at 1.5, 4.0 and 7.5 cm from A.', 'Draw CD, 12 cm, parallel to AB, a little below it.', 'Join CA and DB and produce them to meet at O.', 'Draw OE, OF, OG and produce them to cut CD at P, Q, R.'];
  const qt = open(L, b, prev, [{s: 'On a line AB, '}, {s: '9 cm', mark: 'num'}, {s: ' long, mark points at the distances of 1.5, 4.0 and 7.5 cm respectively from point A. Divide line CD, 12 cm long '}, {s: 'in the same proportion', mark: 'concept'}, {s: ' as the divisions of line AB.'}], steps, 'Divide in proportion');
  L.say('Question three. Division of lines.');
  L.say('On a line AB, nine cm long, mark points at the distances of one point five, four point zero and seven point five cm respectively from point A. Divide line CD, twelve cm long in the same proportion as the divisions of line AB.');
  L.say('Lamba sawaal hai, par baat simple hai. AB ko jaise kaata, CD ko bhi bilkul waise hi, bas bade size mein.', () => highlight(L, qt, 3, L.t + 1.2));
  toFigure(L, [add(O, P(0, -40)), add(C, P(-40, 40)), add(D, P(40, 40))]);
  L.step(0);
  L.say('AB, nine cm. Aur scale se A se naapke, E, F, G.', () => {
    L.line(add(A, P(-60, 0)), add(B, P(60, 0)));
    L.line(A, B, {measure: true, label: ['A', 'B'], dim: '9 cm', dimSide: -1});
    L.fast(1.4, () => {
      L.rulerMark(A, 0, 1.5, 'E', 0, -28);
      L.rulerMark(A, 0, 4, 'F', 0, -28);
      L.rulerMark(A, 0, 7.5, 'G', 0, -28);
    });
  });
  L.step(1);
  L.recapBadge('Parallel: same as Q2, quickly', 3);
  L.say('Ab AB ke neeche ek parallel line, thodi doori pe. Q2 wala tareeka, jaldi se.', () => {
    L.fast(2.4, () => {
      perpOn(L, A, 180, 45, 70);
      L.line(A, P(A.x, y2 + 30));
      perpOn(L, B, 180, 45, 70);
      L.line(B, P(B.x, y2 + 30));
      L.compassTo(A, y2 - y1, 90);
      L.arc(A, y2 - y1, 80, 100);
      L.arc(B, y2 - y1, 80, 100);
    });
    L.line(P(F.x - 340, y2), P(F.x + 340, y2));
  });
  L.say('Is line pe C lagao, aur C se twelve cm pe D.', () => {
    L.label('C', C, -6, 28);
    L.rulerMark(C, 0, 12, 'D', 6, 28);
  });
  L.step(2);
  L.say('Ab C se A tak, aur D se B tak lines, aur unhe upar badhao. Jahan milein, woh O.', () => {
    L.line(C, O);
    L.line(D, O);
    L.burst(O);
    L.label('O', O, 0, -30);
  });
  L.step(3);
  L.say('O se E, F, G hote hue lines, neeche CD tak. P, Q, R.', () => {
    [[Pc, 'P'], [Qc, 'Q'], [Rc, 'R']].forEach(([p, n]) => {
      L.line(O, add(p as Pt, P(((p as Pt).x - O.x) * 0.04, 25)), {style: 'final'});
      L.burst(p as Pt, 24);
      L.label(n as string, p as Pt, 0, 28);
    });
    L.done([Pc, Qc, Rc]);
  });
  L.say('Check karo. AE tha one point five cm, aur CP ho gaya two cm. Har hissa usi hisaab se bada hua.', () => L.dim(C, Pc, '2 cm', 1));
  close(L, [O, C, D], steps, 'CD is divided at P, Q, R in the same proportion as AB.');
  return add(D, P(-40, 70));
};

// ===================== 4 (2) · angle into four =====================
const i4b: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const B = add(F, P(-230, 140));
  const C = add(B, P(450, 0)), A = polar(B, 450, -64);
  const steps = ['Draw angle ABC (any size).', 'Bisect angle ABC: line BP.', 'Bisect angle ABP and angle PBC.'];
  const qt = open(L, b, prev, [{s: '(2) Draw an angle of any measure and divide it into '}, {s: 'four equal parts', mark: 'concept'}, {s: '.'}], steps, 'Angle into four');
  L.say('Part two. Draw an angle of any measure and divide it into four equal parts.', () => highlight(L, qt, 1, L.t + 3));
  L.say('Four parts. Wahi purani trick: pehle aadha, phir har aadhe ka aadha.');
  toFigure(L, [A, C, add(B, P(-40, 30))]);
  L.step(0);
  L.say('Angle ABC. Main sixty-four degree le raha hoon, taaki har hissa saaf dikhe.', () => {
    L.line(B, C, {label: ['B', 'C']});
    L.line(B, A);
    L.label('A', A, 18, -18);
  });
  L.step(1);
  L.recapBadge('Bisect an angle: same as part 1', 3);
  L.say('Pehle bisect. BP.', () => {
    angleBisect(L, B, -64, 0, 300, 200);
    L.line(B, polar(B, 460, -32), {style: 'final'});
    L.label('P', polar(B, 460, -32), 20, -6);
  });
  L.step(2);
  L.say('Ab ABP ko bisect karo, aur PBC ko bhi. Same radius ka arc already hai, bas X, P aur P, Y se arcs.', () => {
    L.fast(1.6, () => angleBisect(L, B, -64, -32, 300, 120));
    L.line(B, polar(B, 460, -48), {style: 'final'});
    L.label('Q', polar(B, 460, -48), 18, -12);
    L.fast(1.6, () => angleBisect(L, B, -32, 0, 300, 120));
    L.line(B, polar(B, 460, -16), {style: 'final'});
    L.label('R', polar(B, 460, -16), 20, 0);
    L.done([B]);
  });
  L.say('Chaar barabar hisse, har ek sixteen degree.');
  close(L, [A, C, B], steps, 'BQ, BP and BR divide ∠ABC into 4 equal parts.');
  return add(B, P(60, 60));
};

// ===================== 5 · right triangle: hypotenuse + angle =====================
const i5: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const A = add(F, P(-175, 120)), B = add(F, P(175, 120));
  const M = mid(A, B), C = polar(M, 175, -80);
  const steps = ['Draw AB, 7 cm long.', 'Bisect AB at M.', 'Centre M, radius MA: draw a semicircle.', 'At A, draw a 40° angle, meeting the semicircle at C.', 'Join CB.'];
  const qt = open(L, b, prev, [{s: 'Draw a '}, {s: 'right angled triangle', mark: 'concept'}, {s: ' with its hypotenuse '}, {s: '7 cm', mark: 'num'}, {s: ' and one angle of 40°.'}], steps, 'Right triangle: hypotenuse + angle');
  L.say('Question five. Right angled triangles.');
  L.say('Draw a right angled triangle with its hypotenuse seven cm and one angle of forty degree.');
  L.say('Hypotenuse matlab ninety degree ke saamne wali side. Sabse lambi.', () => highlight(L, qt, 1, L.t + 0.2));
  L.say('Aur yahan ek pyaara fact kaam aata hai. Semicircle ke andar koi bhi triangle banao, uska top wala angle hamesha ninety degree hota hai.');
  toFigure(L, [add(M, P(0, -215)), add(A, P(-40, 40)), add(B, P(40, 40))]);
  L.step(0);
  L.say('Toh hypotenuse AB, seven cm.', () => L.line(A, B, {measure: true, label: ['A', 'B'], dim: '7 cm'}));
  L.step(1);
  L.recapBadge('Bisect: elementary Q1, quickly', 3);
  L.say('Iska beech, M. Elementary Q1 wala bisect.', () => L.fast(2.2, () => bisect(L, A, B, 230, {mid: 'M', ext: 10})));
  L.step(2);
  L.say('M pe needle, A tak radius, aur upar ek semicircle.', () => {
    L.compassTo(M, 175, 180);
    L.arc(M, 175, 180, 360);
  });
  L.step(3);
  L.say('A pe protractor, forty degree. Line ko semicircle tak le jao. Woh C.', () => {
    L.angleAt(A, 0, 40, -1, 3.6 * CM);
    L.line(A, polar(A, dist(A, C) + 40, -40));
    L.angleText(A, -40, 0, '40°', 44);
    L.burst(C);
    L.label('C', C, 0, -30);
  });
  L.step(4);
  L.say('CB jodo. Aur C pe angle, apne aap ninety.', () => {
    L.line(C, B, {style: 'final'});
    L.line(A, C, {style: 'final'});
    L.line(A, B, {style: 'final'});
    L.right(C, angOf(C, A), angOf(C, B));
    L.done([C]);
  });
  close(L, [add(M, P(0, -190)), A, B], steps, 'ABC is the right angled triangle (∠C = 90°).');
  return add(B, P(-40, 70));
};

// ===================== 6 · right triangle: hypotenuse + side =====================
const i6: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const A = add(F, P(-195, 120)), B = add(F, P(195, 120));
  const M = mid(A, B);
  const C = near(circleX(A, 310, M, 195), add(M, P(0, -400)));
  const G = centroid(A, B, C);
  const steps = ['Draw AB, 7.8 cm long.', 'Bisect AB at M.', 'Centre M, radius MA: draw a semicircle.', 'Centre A, radius 6.2 cm: cut the semicircle at C. Join CA and CB.'];
  const qt = open(L, b, prev, [{s: 'Construct a right angled triangle, with its '}, {s: 'hypotenuse', mark: 'concept'}, {s: ' being 7.8 cm long and '}, {s: 'one side', mark: 'concept'}, {s: ' measuring 6.2 cm.'}], steps, 'Right triangle: hypotenuse + side');
  L.say('Question six.');
  L.say('Construct a right angled triangle, with its hypotenuse being seven point eight cm long and one side measuring six point two cm.');
  L.say('Same semicircle wala jaadu. Bas is baar angle nahi, ek side di hai.', () => highlight(L, qt, 1, L.t + 0.2));
  toFigure(L, [add(M, P(0, -235)), add(A, P(-40, 40)), add(B, P(40, 40))]);
  L.step(0);
  L.say('AB, seven point eight cm.', () => L.line(A, B, {measure: true, label: ['A', 'B'], dim: '7.8 cm'}));
  L.step(1);
  L.recapBadge('Bisect: elementary Q1, quickly', 3);
  L.say('Beech ka point M.', () => L.fast(2.2, () => bisect(L, A, B, 250, {mid: 'M', ext: 10})));
  L.step(2);
  L.say('M se semicircle.', () => {
    L.compassTo(M, 195, 180);
    L.arc(M, 195, 180, 360);
  });
  L.step(3);
  L.say('Ab compass scale pe six point two cm. A pe needle, semicircle ko kaato. C.', () => {
    L.compassMeasure(6.2, add(F, P(-120, 210)));
    const a = angOf(A, C);
    L.compassTo(A, 310, a - 12);
    L.arc(A, 310, a - 12, a + 12);
    L.burst(C);
    L.label('C', C, 0, -30);
  });
  L.say('CA aur CB jodo.', () => {
    L.line(A, C, {style: 'final'});
    L.line(C, B, {style: 'final'});
    L.line(A, B, {style: 'final'});
    dimOut(L, A, C, '6.2 cm', G);
    L.right(C, angOf(C, A), angOf(C, B));
    L.done([C]);
  });
  close(L, [add(M, P(0, -210)), A, B], steps, 'ABC is the right angled triangle.');
  return add(B, P(-40, 70));
};

// ===================== 7 · rhombus: base + angle =====================
const i7: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const A = add(F, P(-200, 120)), B = add(A, P(250, 0));
  const D = polar(A, 250, -70), C = add(D, P(250, 0)), E = polar(A, 340, -70);
  const G = mid(A, C);
  const steps = ['Draw AB, 5 cm long.', 'At A, draw line AE at 70° to AB.', 'Centre A, radius 5 cm: cut AE at D.', 'Same radius, from D and B: arcs meet at C.', 'Join DC and BC.'];
  const qt = open(L, b, prev, [{s: 'Draw a '}, {s: 'rhombus', mark: 'concept'}, {s: ', with its base '}, {s: '5 cm', mark: 'num'}, {s: ' long and one angle being of 70°.'}], steps, 'Rhombus: base + angle');
  L.say('Question seven. Quadrilaterals.');
  L.say('Draw a rhombus, with its base five cm long and one angle being of seventy degree.');
  L.say('Rhombus matlab chaaron sides barabar, bas thoda tircha. Jaise square ko side se dhakka de diya ho.', () => highlight(L, qt, 1, L.t + 0.2));
  toFigure(L, [E, add(A, P(-40, 40)), add(C, P(60, 0)), add(B, P(40, 40))]);
  L.step(0);
  L.say('AB, five cm.', () => L.line(A, B, {measure: true, label: ['A', 'B'], dim: '5 cm'}));
  L.step(1);
  L.say('A pe protractor, seventy degree. Line AE.', () => {
    L.angleAt(A, 0, 70, -1);
    L.line(A, E);
    L.label('E', E, 16, -16);
    L.angleText(A, -70, 0, '70°', 40);
  });
  L.step(2);
  L.say('Compass five cm. A pe needle, AE ko kaato. D.', () => {
    L.compassTo(A, 250, -82);
    L.arc(A, 250, -82, -58);
    L.burst(D);
    L.label('D', D, -26, -10);
  });
  L.step(3);
  L.say('Same radius. D se aur B se arcs. Jahan milein, C.', () => {
    L.arc(D, 250, -12, 12);
    L.arc(B, 250, -82, -58);
    L.burst(C);
    L.label('C', C, 24, -14);
  });
  L.step(4);
  L.say('DC aur BC jodo. Chaaron sides five cm.', () => {
    L.line(A, B, {style: 'final'});
    L.line(B, C, {style: 'final'});
    L.line(C, D, {style: 'final'});
    L.line(D, A, {style: 'final'});
    dimOut(L, B, C, '5 cm', G);
    L.done([C]);
  });
  close(L, [E, A, B, C], steps, 'ABCD is the rhombus.');
  return add(B, P(-40, 70));
};

// ===================== 8 · rhombus: diagonal + side =====================
const i8: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const A = add(F, P(-175, 0)), C = add(F, P(175, 0));
  const [p1, p2] = circleX(A, 200, C, 200);
  const D = p1.y < p2.y ? p1 : p2, B = p1.y < p2.y ? p2 : p1;
  const steps = ['Draw AC, 7 cm long.', 'Radius 4 cm, from A and C: arcs on both sides meet at B and D.', 'Join AB, BC, CD and DA.'];
  const qt = open(L, b, prev, [{s: 'Construct a rhombus, with its '}, {s: 'diagonal', mark: 'concept'}, {s: ' 7 cm long and one of its sides 4 cm long.'}], steps, 'Rhombus: diagonal + side');
  L.say('Question eight.');
  L.say('Construct a rhombus, with its diagonal seven cm long and one of its sides four cm long.');
  L.say('Diagonal pehle khicho. Phir rhombus do triangles ban jaata hai, upar aur neeche.', () => highlight(L, qt, 1, L.t + 0.2));
  toFigure(L, [add(D, P(0, -50)), add(B, P(0, 50)), add(A, P(-50, 0)), add(C, P(50, 0))]);
  L.step(0);
  L.say('AC, seven cm.', () => L.line(A, C, {measure: true, label: ['A', 'C'], dim: '7 cm'}));
  L.step(1);
  L.say('Compass four cm. A se upar neeche arcs, aur C se bhi. Upar D, neeche B.', () => {
    L.compassMeasure(4, add(F, P(-150, 190)));
    L.compassTo(A, 200, angOf(A, D));
    L.arcPair(A, 200, angOf(A, D), angOf(A, B));
    L.arcPair(C, 200, angOf(C, D), angOf(C, B));
    L.burst(D);
    L.label('D', D, 0, -30);
    L.burst(B);
    L.label('B', B, 0, 30);
  });
  L.step(2);
  L.say('Chaaron sides jodo.', () => {
    L.line(A, B, {style: 'final'});
    L.line(B, C, {style: 'final'});
    L.line(C, D, {style: 'final'});
    L.line(D, A, {style: 'final'});
    dimOut(L, D, A, '4 cm', F);
    L.done([F]);
  });
  close(L, [add(D, P(0, -40)), add(B, P(0, 40)), A, C], steps, 'ABCD is the rhombus.');
  return add(B, P(0, 70));
};

// ===================== 9 · rhombus: two diagonals =====================
const i9: Q = (L, b, prev) => {
  const F = add(FIG(b.O), P(0, 140));
  const O = add(F, P(0, 60));
  const A = add(O, P(-225, 0)), C = add(O, P(225, 0));
  const M = add(O, P(0, -365)), D = add(O, P(0, -182.5)), B = add(O, P(0, 182.5));
  const steps = ['Draw AC, 9 cm long.', 'Draw its perpendicular bisector (elementary Q1). Mark O.', 'Mark OM = 7.3 cm on the bisector.', 'Bisect OM at D.', 'Centre O, radius OD: cut the bisector below AC at B.', 'Join AB, BC, CD and DA.'];
  const qt = open(L, b, prev, [{s: 'Construct a rhombus, with its '}, {s: 'two diagonals', mark: 'concept'}, {s: ' being 9 cm and 7.3 cm long.'}], steps, 'Rhombus: two diagonals');
  L.say('Question nine.');
  L.say('Construct a rhombus, with its two diagonals being nine cm and seven point three cm long.');
  L.say('Rhombus ke diagonals ek doosre ko beech se, ninety degree pe kaatte hain. Bas yahi use karna hai.', () => highlight(L, qt, 1, L.t + 0.2));
  toFigure(L, [add(M, P(0, -30)), add(O, P(0, 240)), add(A, P(-40, 0)), add(C, P(40, 0))]);
  L.step(0);
  L.say('Pehla diagonal AC, nine cm.', () => L.line(A, C, {measure: true, label: ['A', 'C'], dim: '9 cm'}));
  L.step(1);
  L.recapBadge('Bisect: elementary Q1, quickly', 3);
  L.say('Iska perpendicular bisector, aur upar lamba badha do. Beech mein O.', () => {
    L.fast(2.2, () => bisect(L, A, C, 300, {mid: 'O', ext: 20}));
    L.line(add(O, P(0, -218)), add(M, P(0, -35)));
  });
  L.step(2);
  L.say('Ab doosra diagonal seven point three cm. Scale se O se upar naapo. M.', () => {
    L.rulerMark(O, -90, 7.3, 'M', 24, 0);
    L.dim(O, M, '7.3 cm', -1);
  });
  L.say('Par yeh poora diagonal aadha upar, aadha neeche jaayega. Toh OM ka aadha chahiye.');
  L.step(3);
  L.recapBadge('Bisect: elementary Q1, quickly', 3);
  L.say('OM ko bisect karo. Woh D.', () => {
    L.fast(2, () => bisect(L, O, M, 230, {ext: 10}));
    L.burst(D);
    L.label('D', D, 22, -16);
  });
  L.step(4);
  L.say('O pe needle, D tak radius, neeche kaato. B.', () => {
    L.compassTo(O, 182.5, 90);
    L.arc(O, 182.5, 78, 102);
    L.burst(B);
    L.label('B', B, 22, 18);
  });
  L.step(5);
  L.say('Halka karo, aur chaaron sides jodo.', () => {
    L.lighten([add(M, P(0, -30)), add(O, P(0, 240)), add(A, P(-30, 0)), add(C, P(30, 0))]);
    L.fast(1.4, () => {
      L.line(A, B, {style: 'final'});
      L.line(B, C, {style: 'final'});
      L.line(C, D, {style: 'final'});
      L.line(D, A, {style: 'final'});
    });
    L.done([O]);
  });
  close(L, [M, add(O, P(0, 230)), A, C], steps, 'ABCD is the rhombus.');
  return add(B, P(0, 90));
};

// ===================== 10 · parallelogram =====================
const i10: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const A = add(F, P(-230, 110)), B = add(A, P(300, 0));
  const D = polar(A, 200, -55), C = add(D, P(300, 0)), Mm = polar(A, 290, -55);
  const G = mid(A, C);
  const steps = ['Draw AB, 6 cm long.', 'At A, draw angle MAB = 55°.', 'Centre A, radius 4 cm: cut AM at D.', 'Same radius, centre B: an arc.', 'Centre D, radius AB: cut that arc at C. Join BC and DC.'];
  const qt = open(L, b, prev, [{s: 'Construct a '}, {s: 'parallelogram', mark: 'concept'}, {s: ', with its two adjacent sides being 6 cm and 4 cm long and the angle contained by them being 55°.'}], steps, 'Parallelogram');
  L.say('Question ten.');
  L.say('Construct a parallelogram, with its two adjacent sides being six cm and four cm long and the angle contained by them being fifty-five degree.');
  L.say('Parallelogram, aamne saamne ki sides barabar aur parallel. Rhombus jaisa, bas do alag lengths.', () => highlight(L, qt, 1, L.t + 0.2));
  toFigure(L, [Mm, add(A, P(-40, 40)), add(C, P(60, 0)), add(B, P(40, 40))]);
  L.step(0);
  L.say('AB, six cm.', () => L.line(A, B, {measure: true, label: ['A', 'B'], dim: '6 cm'}));
  L.step(1);
  L.say('A pe fifty-five degree. Line AM.', () => {
    L.angleAt(A, 0, 55, -1);
    L.line(A, Mm);
    L.label('M', Mm, 16, -16);
    L.angleText(A, -55, 0, '55°', 40);
  });
  L.step(2);
  L.say('Compass four cm. A se AM ko kaato. D.', () => {
    L.compassMeasure(4, add(F, P(-160, 200)));
    L.compassTo(A, 200, -67);
    L.arc(A, 200, -67, -43);
    L.burst(D);
    L.label('D', D, -26, -10);
  });
  L.step(3);
  L.say('Same four cm, B pe needle, ek arc.', () => {
    L.compassTo(B, 200, -67);
    L.arc(B, 200, -67, -43);
  });
  L.step(4);
  L.say('Ab compass AB jitna, six cm. D pe needle, us arc ko kaato. C.', () => {
    L.compassTo(A, 300, 0);
    L.compassTo(D, 300, -12);
    L.arc(D, 300, -12, 12);
    L.burst(C);
    L.label('C', C, 24, -14);
  });
  L.say('BC aur DC jodo.', () => {
    L.line(A, B, {style: 'final'});
    L.line(B, C, {style: 'final'});
    L.line(C, D, {style: 'final'});
    L.line(D, A, {style: 'final'});
    dimOut(L, B, C, '4 cm', G);
    L.done([C]);
  });
  close(L, [Mm, A, B, C], steps, 'ABCD is the parallelogram.');
  return add(B, P(-40, 70));
};

// ===================== kite (11, and 13 builds on it) =====================
function kite(L: Lesson, A: Pt, ang: number, quick = false) {
  const B = add(A, P(250, 0));
  const Lp = polar(B, 250, 180 + ang), C = polar(B, 150, 180 + ang);
  const D = far(circleX(A, 250, C, 150), B);
  L.line(A, B, {measure: true, label: ['A', 'B'], dim: '5 cm', style: quick ? 'final' : 'main'});
  if (!quick) L.step(1);
  L.angleAt(B, 180, ang, 1);
  L.line(B, Lp);
  L.label('L', Lp, 16, -14);
  L.angleText(B, 180, 180 + ang, `${ang}°`, 38);
  if (!quick) L.step(2);
  L.compassMeasure(3, add(A, P(-60, 170)));
  const aC = angOf(B, C);
  L.compassTo(B, 150, aC - 12);
  L.arc(B, 150, aC - 12, aC + 12);
  L.burst(C);
  L.label('C', C, 24, -6);
  return {B, C, D};
}
const i11: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const A = add(F, P(-180, 150));
  const B = add(A, P(250, 0)), C = polar(B, 150, -80), D = far(circleX(A, 250, C, 150), B);
  const G = centroid(A, B, C, D);
  const steps = ['Draw AB, 5 cm long.', 'At B, make angle ABL = 100°.', 'Centre B, radius 3 cm: cut BL at C.', 'Centre A, radius AB, and centre C, radius BC: arcs meet at D.', 'Join AD and CD.'];
  const qt = open(L, b, prev, [{s: 'Construct a '}, {s: 'kite', mark: 'concept'}, {s: ', with two of its unequal sides being 5 cm and 3 cm long respectively and the angle contained by these sides being of 100°.'}], steps, 'Kite');
  L.say('Question eleven.');
  L.say('Construct a kite, with two of its unequal sides being five cm and three cm long respectively and the angle contained by these sides being of hundred degree.');
  L.say('Kite, yaani patang. Do lambi sides barabar, do chhoti sides barabar.', () => highlight(L, qt, 1, L.t + 0.2));
  toFigure(L, [add(A, P(-40, 40)), add(B, P(40, 40)), polar(B, 260, -80), add(D, P(0, -40))]);
  L.step(0);
  L.say('AB, five cm. Phir B pe hundred degree, protractor se. Phir compass three cm, aur BL pe C.', () => kite(L, A, 100));
  L.step(3);
  L.say('Ab D. Patang mein AD bhi AB jitni, five cm. Aur CD, BC jitni, three cm.');
  L.say('Toh A se five cm ka arc, C se three cm ka arc. Jahan milein, D.', () => {
    L.compassTo(A, 250, angOf(A, D) - 12);
    L.arc(A, 250, angOf(A, D) - 12, angOf(A, D) + 12);
    L.compassTo(C, 150, angOf(C, D) - 12);
    L.arc(C, 150, angOf(C, D) - 12, angOf(C, D) + 12);
    L.burst(D);
    L.label('D', D, -10, -28);
  });
  L.step(4);
  L.say('AD aur CD jodo.', () => {
    L.line(A, B, {style: 'final'});
    L.line(B, C, {style: 'final'});
    L.line(C, D, {style: 'final'});
    L.line(D, A, {style: 'final'});
    dimOut(L, B, C, '3 cm', G);
    L.done([D]);
  });
  close(L, [polar(B, 250, -80), A, B, D], steps, 'ABCD is the kite.');
  return add(B, P(-40, 70));
};

// ===================== 12 · circle through three points =====================
const i12: Q = (L, b, prev) => {
  const F = add(FIG(b.O), P(0, 60));
  const A = add(F, P(-150, 110)), B = add(F, P(150, 110));
  const C = near(circleX(A, 250, B, 200), add(F, P(0, -500)));
  const O = circum(A, B, C), R = dist(O, A);
  const steps = ['Construct triangle ABC: AB 6 cm, BC 4 cm, CA 5 cm.', 'Draw the perpendicular bisectors of AB and AC.', 'They meet at O.', 'Centre O, radius OA: draw the circle.'];
  const qt = open(L, b, prev, [{s: 'Construct a triangle ABC with AB=6 cm, BC=4 cm and CA=5 cm. Describe a circle (or an arc) '}, {s: 'passing through the three points', mark: 'concept'}, {s: ' A, B and C.'}], steps, 'Circle through three points');
  L.say('Question twelve. Circles.');
  L.say('Construct a triangle ABC with AB six cm, BC four cm and CA five cm. Describe a circle passing through the three points A, B and C.');
  L.say('Circle teeno corners se guzrega. Matlab uska centre teeno se barabar door hoga.', () => highlight(L, qt, 1, L.t + 0.2));
  L.say('Aur do points se barabar door wale points kahan hote hain? Bisector pe. Elementary Q1 yaad hai?');
  toFigure(L, [add(O, P(-R - 30, -R - 30)), add(O, P(R + 30, R + 30))]);
  L.step(0);
  L.recapBadge('Three sides: elementary Q11', 3);
  L.say('Pehle triangle. AB six cm, phir A se five cm aur B se four cm ke arcs. C.', () =>
    L.fast(1.6, () => {
      L.line(A, B, {measure: true, label: ['A', 'B'], dim: '6 cm', style: 'final'});
      L.compassMeasure(5, add(F, P(-130, 230)));
      L.compassTo(A, 250, angOf(A, C) - 12);
      L.arc(A, 250, angOf(A, C) - 12, angOf(A, C) + 12);
      L.compassMeasure(4, add(F, P(-130, 230)));
      L.compassTo(B, 200, angOf(B, C) - 12);
      L.arc(B, 200, angOf(B, C) - 12, angOf(B, C) + 12);
      L.burst(C);
      L.label('C', C, 0, -30);
      L.line(A, C, {style: 'final'});
      L.line(B, C, {style: 'final'});
    }),
  );
  L.step(1);
  L.recapBadge('Bisect: elementary Q1', 3);
  L.say('Ab AB ka perpendicular bisector. Aur AC ka bhi.', () => {
    L.fast(2, () => bisect(L, A, B, 200, {ext: 40}));
    L.fast(2, () => bisect(L, A, C, 170, {ext: 40}));
  });
  L.step(2);
  L.say('Dono jahan katte hain, woh O. Yeh A, B, C teeno se same doori pe hai.', () => {
    L.burst(O, 24);
    L.label('O', O, 18, -20);
  });
  L.step(3);
  L.say('O pe needle, A tak radius, aur poora circle.', () => {
    L.compassTo(O, R, angOf(O, A));
    L.circle(O, R, angOf(O, A), 365, 'final');
    L.done([A, B, C]);
  });
  L.say('Teeno points circle pe. Teesra bisector banane ki zaroorat hi nahi.');
  close(L, [add(O, P(-R - 20, -R - 20)), add(O, P(R + 20, R + 20))], steps, 'The circle passes through A, B and C.');
  return add(O, P(0, R + 60));
};

// ===================== 13 · circle in a kite =====================
const i13: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const A = add(F, P(-200, 120));
  const B = add(A, P(250, 0)), C = polar(B, 150, -60), D = far(circleX(A, 250, C, 150), B);
  const O = rayX(B, 240, A, angOf(A, C));
  const Pp = P(O.x, A.y), r = dist(O, Pp);
  const steps = ['Construct the kite ABCD (like Q11), angle B = 120°.', 'Draw its diagonal AC.', 'Bisect angle B. It cuts AC at O.', 'Draw OP perpendicular to AB.', 'Centre O, radius OP: draw the circle.'];
  const qt = open(L, b, prev, [{s: 'Construct a rhomboid (kite), with its unequal sides 5 cm and 3 cm long and the angle contained by them being 120°. '}, {s: 'Inscribe a circle', mark: 'concept'}, {s: ' in it.'}], steps, 'Circle in a kite');
  L.say('Question thirteen.');
  L.say('Construct a rhomboid, kite, with its unequal sides five cm and three cm long and the angle contained by them being one twenty degree. Inscribe a circle in it.');
  L.say('Inscribe matlab andar fit, chaaron sides ko chhoota hua circle.', () => highlight(L, qt, 1, L.t + 0.2));
  toFigure(L, [add(A, P(-40, 40)), add(B, P(40, 40)), polar(B, 250, -60), add(D, P(0, -40))]);
  L.step(0);
  L.recapBadge('Kite: same as Q11, quickly', 3);
  L.say('Pehle kite, Q11 jaisa, bas angle one twenty.', () =>
    L.fast(2.4, () => {
      kite(L, A, 120, true);
      L.compassTo(A, 250, angOf(A, D) - 12);
      L.arc(A, 250, angOf(A, D) - 12, angOf(A, D) + 12);
      L.compassTo(C, 150, angOf(C, D) - 12);
      L.arc(C, 150, angOf(C, D) - 12, angOf(C, D) + 12);
      L.burst(D);
      L.label('D', D, -10, -28);
      L.line(B, C, {style: 'final'});
      L.line(C, D, {style: 'final'});
      L.line(D, A, {style: 'final'});
    }),
  );
  L.step(1);
  L.say('Ab diagonal AC. Patang isi line ke dono taraf bilkul same hai, toh centre isi pe hoga.', () => L.line(A, C));
  L.step(2);
  L.recapBadge('Bisect an angle: elementary Q6', 3);
  L.say('Angle B ko bisect karo. AC ko jahan kaate, woh O.', () => {
    L.fast(1.8, () => angleBisect(L, B, 180, -60, 90, 100));
    L.line(B, polar(B, dist(B, O) + 40, 240));
    L.burst(O, 24);
    L.label('O', O, 0, -26);
  });
  L.step(3);
  L.recapBadge('Perpendicular: elementary Q5', 3);
  L.say('O se AB pe perpendicular. P.', () => {
    L.fast(2, () => {
      const res = perpFrom(L, O, A, B, r + 40, 80);
      L.line(O, add(res.Q, P(0, 20)));
    });
    L.label('P', Pp, 18, 26);
  });
  L.step(4);
  L.say('Halka karo. O pe needle, P tak radius, circle.', () => {
    L.lighten([add(A, P(-20, 40)), add(B, P(30, 60)), add(C, P(20, 0)), add(D, P(0, -20))]);
    L.compassTo(O, r, 90);
    L.circle(O, r, 90, 365, 'final');
    L.done([O]);
  });
  close(L, [add(A, P(0, 40)), add(C, P(30, 0)), add(D, P(0, -30)), B], steps, 'The circle touches all four sides.');
  return add(Pp, P(0, 100));
};

// ===================== 15 · circle in a sector =====================
const i15: Q = (L, b, prev) => {
  const F = add(FIG(b.O), P(0, 80));
  const A = add(F, P(0, -210)), R = 250;
  const E = polar(A, R, 90);
  const Bp = polar(A, R, 108), Cp = polar(A, R, 72);
  const Fp = rayX(E, 180, A, 108), H = rayX(E, 0, A, 72);
  const bis = (angOf(Fp, A) + 0) / 2;
  const G = rayX(Fp, bis, A, 90), r = dist(G, E);
  const steps = ['Draw the sector: angle 36° at A, radius 5 cm (arc BC).', 'Bisect angle A. It cuts arc BC at E.', 'Through E, draw FH perpendicular to AE.', 'Bisect angle AFE. It cuts AE at G.', 'Centre G, radius GE: draw the circle.'];
  const qt = open(L, b, prev, [{s: 'Inscribe a circle '}, {s: 'in a sector', mark: 'concept'}, {s: ' with an angle of 36° and a radius 5 cm, to touch both its arms and the arc.'}], steps, 'Circle in a sector');
  L.say('Question fifteen.');
  L.say('Inscribe a circle in a sector with an angle of thirty-six degree and a radius five cm, to touch both its arms and the arc.');
  L.say('Sector matlab pizza ka ek slice. Do seedhi sides, aur upar ek curve.', () => highlight(L, qt, 1, L.t + 0.2));
  toFigure(L, [add(A, P(0, -40)), polar(A, 350, 72), polar(A, 350, 108), add(E, P(0, 70))]);
  L.step(0);
  L.say('A se ek arm. Phir protractor se thirty-six degree pe doosra arm.', () => {
    L.line(A, polar(A, 340, 72));
    L.angleAt(A, 72, 36, 1);
    L.line(A, polar(A, 340, 108));
    L.label('A', A, 0, -28);
    L.angleText(A, 72, 108, '36°', 46);
  });
  L.say('Compass five cm, A pe needle, aur slice ka curve. B aur C.', () => {
    L.compassMeasure(5, add(A, P(-170, 130)));
    L.compassTo(A, R, 66);
    L.arc(A, R, 64, 116);
    L.label('B', Bp, -34, -26);
    L.label('C', Cp, 34, -26);
  });
  L.step(1);
  L.recapBadge('Bisect an angle: elementary Q6', 3);
  L.say('Angle A ko bisect karo, aur line ko curve ke paar le jao. Curve pe E.', () => {
    L.fast(1.8, () => angleBisect(L, A, 108, 72, 180, 100));
    L.line(A, polar(A, R + 80, 90));
    L.burst(E, 24);
    L.label('E', E, 18, -22);
  });
  L.step(2);
  L.recapBadge('Perpendicular: elementary Q4', 3);
  L.say('E pe, AE ka perpendicular. Yeh dono arms ko F aur H pe milega.', () => {
    L.fast(2, () => perpOn(L, E, 90, 35, 55));
    L.line(add(Fp, P(-40, 0)), add(H, P(40, 0)));
    L.label('F', Fp, -26, 26);
    L.label('H', H, 26, 26);
  });
  L.say('Ab dekho, A, F, H ek triangle ban gaya. Aur hamara circle bas iske andar wala circle hai.');
  L.step(3);
  L.say('Toh angle AFE ko bisect karo. AE ko jahan kaate, woh G. Centre.', () => {
    L.fast(1.6, () => angleBisect(L, Fp, angOf(Fp, A), 0, 50, 45));
    L.line(Fp, polar(Fp, dist(Fp, G) + 30, bis));
    L.burst(G, 22);
    L.label('G', G, 18, -6);
  });
  L.step(4);
  L.say('Halka karo. G pe needle, E tak radius, circle.', () => {
    L.lighten([add(A, P(0, -10)), add(Fp, P(-30, 40)), add(H, P(30, 40))]);
    L.compassTo(G, r, 90);
    L.circle(G, r, 90, 365, 'final');
    L.done([G]);
  });
  L.say('Dono arms aur curve, teeno ko chhoo raha hai.');
  close(L, [add(A, P(0, -30)), add(Fp, P(-40, 40)), add(H, P(40, 40))], steps, 'The circle touches both arms and the arc.');
  return add(E, P(0, 110));
};

// ===================== 16 · circle of given radius touching two lines =====================
const i16: Q = (L, b, prev) => {
  const F = FIG(b.O);
  const B = add(F, P(-290, 130)), C = add(B, P(600, 0)), A = polar(B, 620, -30);
  const x1 = B.x + 170, x2 = B.x + 500, y = B.y - 100;
  const M = P(x1, y), Lp = P(x2, y);
  const D = P(B.x + 100 / Math.tan(Math.PI / 12), y), Pp = P(D.x, B.y);
  const steps = ['Draw angle ABC = 30° and bisect it.', 'Draw ML parallel to BC, 2 cm away (like Q2). It cuts the bisector at D.', 'From D, draw DP perpendicular to BC.', 'Centre D, radius DP: draw the circle.'];
  const qt = open(L, b, prev, [{s: 'Draw a circle of '}, {s: 'radius 2 cm', mark: 'concept'}, {s: ', touching both the arms of an angle of 30°.'}], steps, 'Circle touching two lines');
  L.say('Question sixteen.');
  L.say('Draw a circle of radius two cm, touching both the arms of an angle of thirty degree.');
  L.say('Radius pehle se pata hai, two cm. Bas centre dhoondhna hai.', () => highlight(L, qt, 1, L.t + 0.2));
  L.say('Centre ki do shartein. Dono arms se barabar door, toh bisector pe. Aur neeche wali line se exact two cm door.');
  toFigure(L, [add(B, P(-40, 30)), A, add(C, P(40, 30)), add(Pp, P(0, 60))]);
  L.step(0);
  L.say('BC, phir B pe thirty degree, BA.', () => {
    L.line(B, C, {label: ['B', 'C']});
    L.angleAt(B, 0, 30, -1);
    L.line(B, A);
    L.label('A', A, 16, -16);
    L.angleText(B, -30, 0, '30°', 60);
  });
  L.recapBadge('Bisect an angle: elementary Q6', 3);
  L.say('Aur iska bisector.', () => {
    L.fast(1.8, () => angleBisect(L, B, -30, 0, 230, 130));
    L.line(B, polar(B, 600, -15));
  });
  L.step(1);
  L.recapBadge('Parallel at a distance: same as Q2', 3);
  L.say('Ab BC se two cm upar ek parallel line, Q2 wala. Do jagah perpendicular, two cm ke nishaan, aur jod do. ML.', () => {
    L.fast(2.4, () => {
      perpOn(L, P(x1, B.y), 0, 40, 65);
      L.line(P(x1, B.y), P(x1, y - 40));
      perpOn(L, P(x2, B.y), 0, 40, 65);
      L.line(P(x2, B.y), P(x2, y - 40));
    });
    L.compassMeasure(2, add(B, P(60, 130)));
    L.compassTo(P(x1, B.y), 100, -102);
    L.arc(P(x1, B.y), 100, -102, -78);
    L.arc(P(x2, B.y), 100, -102, -78);
    L.line(add(M, P(-40, 0)), add(Lp, P(60, 0)));
    L.label('M', M, -24, -6);
    L.label('L', Lp, 24, -16);
    L.dim(P(x1, B.y), M, '2 cm', -1);
  });
  L.say('Yeh line bisector ko jahan kaatti hai, woh D. Centre.', () => {
    L.burst(D);
    L.label('D', D, 0, -26);
  });
  L.step(2);
  L.recapBadge('Perpendicular: elementary Q5', 3);
  L.say('D se BC pe perpendicular. P.', () => {
    L.fast(2, () => {
      const res = perpFrom(L, D, B, C, 140, 90);
      L.line(D, add(res.Q, P(0, 20)));
    });
    L.label('P', Pp, 18, 26);
  });
  L.step(3);
  L.say('Halka karo. D pe needle, P tak radius, circle.', () => {
    L.lighten([add(B, P(-20, 40)), A, add(C, P(20, 40))]);
    L.compassTo(D, 100, 90);
    L.circle(D, 100, 90, 365, 'final');
    L.done([D]);
  });
  close(L, [add(B, P(-30, 40)), A, add(C, P(30, 40))], steps, 'The circle (radius 2 cm) touches both arms.');
  return add(Pp, P(0, 100));
};

// ===================== 17 · three semicircles in an equilateral triangle =====================
const i17: Q = (L, b, prev) => {
  const F = add(FIG(b.O), P(0, 40));
  const D = add(F, P(0, 120));
  const B = add(D, P(-125, 0)), C = add(D, P(125, 0)), A = add(D, P(0, -125 * Math.sqrt(3)));
  const O = add(D, P(0, -125 / Math.sqrt(3)));
  const Pp = mid(A, C), Qq = mid(A, B);
  const E1 = rayX(D, -45, O, angOf(O, C)), oe = dist(O, E1);
  const E2 = polar(O, oe, -90), E3 = polar(O, oe, angOf(O, B));
  const F1 = mid(E3, E1), F2 = mid(E1, E2), F3 = mid(E2, E3), rr = dist(F1, D);
  const steps = ['Construct equilateral triangle ABC, side 5 cm.', 'Bisect its three angles (AD, BP, CQ). They meet at O.', 'Bisect the right angle ODC. It cuts OC at E1.', 'Centre O, radius OE1: cut OA at E2 and OB at E3.', 'Join E3E1, E1E2, E2E3. They cut OD, OP, OQ at F1, F2, F3.', 'Centres F1, F2, F3, radius F1D: draw the semicircles.'];
  const qt = open(L, b, prev, [{s: 'Draw an equilateral triangle with one side 5 cm long. Inscribe in it '}, {s: 'three equal semicircles', mark: 'concept'}, {s: ', each to touch one side of the triangle and their diameters to be adjacent.'}], steps, 'Three semicircles in a triangle');
  L.say('Question seventeen. Ab semicircles.');
  L.say('Draw an equilateral triangle with one side five cm long. Inscribe in it three equal semicircles, each to touch one side of the triangle and their diameters to be adjacent.');
  L.say('Teen semicircles. Unke seedhe hisse, yaani diameters, beech mein milke ek chhota triangle banate hain.', () => highlight(L, qt, 1, L.t + 0.2));
  toFigure(L, [add(A, P(0, -40)), add(B, P(-40, 30)), add(C, P(40, 30))]);
  L.step(0);
  L.recapBadge('Equilateral triangle: elementary Q8', 3);
  L.say('Equilateral triangle, five cm.', () =>
    L.fast(2.4, () => {
      L.line(B, C, {measure: true, label: ['B', 'C'], dim: '5 cm', style: 'final'});
      L.compassTo(B, 250, 0);
      L.arc(B, 250, -72, -48);
      L.arc(C, 250, -132, -108);
      L.burst(A);
      L.label('A', A, 0, -30);
      L.line(A, B, {style: 'final'});
      L.line(A, C, {style: 'final'});
    }),
  );
  L.step(1);
  L.recapBadge('Bisect an angle: elementary Q6, three times', 3);
  L.say('Teeno angles ke bisectors. AD, BP, CQ. Yeh triangle ko chhe barabar hisson mein baant dete hain. Beech mein O.', () => {
    L.fast(2.4, () => angleBisect(L, A, angOf(A, B), angOf(A, C), 70, 50));
    L.line(A, D);
    L.label('D', D, 0, 26, undefined, 'main', 24);
    L.fast(2.8, () => angleBisect(L, B, angOf(B, A), 0, 70, 50));
    L.line(B, Pp);
    L.label('P', Pp, 18, -8, undefined, 'main', 24);
    L.fast(2.8, () => angleBisect(L, C, angOf(C, A), 180, 70, 50));
    L.line(C, Qq);
    L.label('Q', Qq, -18, -8, undefined, 'main', 24);
    L.burst(O, 20);
    L.right(D, -90, 0);
  });
  L.step(2);
  L.say('Neeche D pe ninety degree hai. Ise bisect karo. OC ko jahan kaate, woh E one.', () => {
    L.fast(1.6, () => angleBisect(L, D, -90, 0, 30, 28));
    L.line(D, polar(D, dist(D, E1) + 18, -45));
    L.burst(E1, 18);
    L.label('E1', E1, 18, 4, undefined, 'main', 20);
  });
  L.step(3);
  L.say('O pe needle, E one tak radius. OA pe E two, OB pe E three.', () => {
    L.compassTo(O, oe, -100);
    L.arc(O, oe, -100, -80);
    L.label('E2', E2, 16, -10, undefined, 'main', 20);
    L.arc(O, oe, angOf(O, E3) - 10, angOf(O, E3) + 10);
    L.label('E3', E3, -18, 4, undefined, 'main', 20);
  });
  L.step(4);
  L.say('Teeno E jodo. Yeh hi teeno diameters hain. Inke beech ke points F one, F two, F three, centres.', () => {
    L.line(E3, E1);
    L.line(E1, E2);
    L.line(E2, E3);
    [F1, F2, F3].forEach((p) => L.burst(p, 14));
  });
  L.step(5);
  L.say('Halka karo. Har F pe needle, radius F one se D tak, aur bahar ki taraf semicircles.', () => {
    L.lighten([add(A, P(0, -10)), add(B, P(-10, 20)), add(C, P(10, 20))]);
    L.compassTo(F1, rr, 0);
    [F1, F2, F3].forEach((c) => semi(L, c, rr, angOf(O, c)));
    L.line(E3, E1, {style: 'final'});
    L.line(E1, E2, {style: 'final'});
    L.line(E2, E3, {style: 'final'});
    L.done([O]);
  });
  close(L, [add(A, P(0, -30)), add(B, P(-30, 20)), add(C, P(30, 20))], steps, 'Each semicircle touches one side; the diameters meet.');
  return add(D, P(0, 90));
};

// ===================== 18 · four semicircles in a square =====================
const i18: Q = (L, b, prev) => {
  const O = add(FIG(b.O), P(0, 40)), h = 125;
  const A = add(O, P(-h, h)), B = add(O, P(h, h)), C = add(O, P(h, -h)), D = add(O, P(-h, -h));
  const E = rayX(A, -22.5, O, 45);
  const Y = rayX(E, 135, O, 90), N = rayX(E, -45, O, 0), oy = dist(O, Y);
  const M = add(O, P(-oy, 0)), X = add(O, P(0, -oy));
  const rr = dist(N, Y) / 2;
  const steps = ['Construct square ABCD, side 5 cm.', 'Divide it into 8 parts: both diagonals and both middle lines.', 'Bisect angle OAB. It cuts OB at E.', 'At E, draw a perpendicular to OB. It cuts OS at Y and OQ at N.', 'Centre O, radius OY: mark M and X on the other middle line.', 'On NY, YM, MX and XN as diameters, draw the semicircles.'];
  const qt = open(L, b, prev, [{s: 'In a square with one side 5 cm long, inscribe '}, {s: 'four equal semicircles', mark: 'concept'}, {s: ', each one touching two sides of the square and their diameters to be adjacent.'}], steps, 'Four semicircles in a square');
  L.say('Question eighteen.');
  L.say('In a square with one side five cm long, inscribe four equal semicircles, each one touching two sides of the square and their diameters to be adjacent.');
  L.say('Chaar semicircles, har ek ek kone mein ghusa hua. Unke diameters beech mein ek tircha square banate hain.', () => highlight(L, qt, 1, L.t + 0.2));
  toFigure(L, [add(D, P(-110, -40)), add(B, P(40, 40))]);
  L.step(0);
  L.recapBadge('Square: elementary Q12, quickly', 3);
  L.say('Square, five cm.', () => L.fast(2.8, () => squareOn(L, A, B, ['A', 'B', 'C', 'D'], 5)));
  L.step(1);
  L.say('Aath hisse: dono diagonals, aur beech ki dono lines.', () => {
    L.line(A, C);
    L.line(B, D);
    L.fast(2.4, () => bisect(L, A, B, 170, {ext: 10}));
    L.line(add(O, P(0, -h)), add(O, P(0, h)));
    L.fast(2.4, () => bisect(L, B, C, 170, {ext: 10}));
    L.line(add(O, P(-h, 0)), add(O, P(h, 0)));
    L.burst(O, 18);
  });
  L.step(2);
  L.recapBadge('Bisect an angle: elementary Q6', 3);
  L.say('Ab A pe, angle OAB ko bisect karo. Diagonal OB ko jahan kaate, woh E.', () => {
    L.fast(1.8, () => angleBisect(L, A, -45, 0, 80, 60));
    L.line(A, polar(A, dist(A, E) + 20, -22.5));
    L.burst(E, 18);
    L.label('E', E, 20, 6, undefined, 'main', 22);
  });
  L.step(3);
  L.recapBadge('Perpendicular: elementary Q4', 3);
  L.say('E pe, OB ka perpendicular. Yeh neeche wali line ko Y pe, aur right wali line ko N pe kaatega.', () => {
    L.fast(2, () => perpOn(L, E, 45, 30, 48));
    L.line(add(Y, polar(P(0, 0), 20, 135)), add(N, polar(P(0, 0), 20, -45)));
    L.label('Y', Y, -16, 18, undefined, 'main', 22);
    L.label('N', N, 18, -14, undefined, 'main', 22);
  });
  L.step(4);
  L.say('O pe needle, Y tak radius. Left mein M, upar X.', () => {
    L.compassTo(O, oy, 180);
    L.arc(O, oy, 170, 190);
    L.label('M', M, -18, -14, undefined, 'main', 22);
    L.arc(O, oy, -100, -80);
    L.label('X', X, 16, -16, undefined, 'main', 22);
  });
  L.step(5);
  L.say('Halka karo. Ab NY, YM, MX, XN, har ek pe semicircle, kone ki taraf.', () => {
    L.lighten([add(D, P(-90, -20)), add(B, P(20, 20))]);
    const pairs: [Pt, Pt, number][] = [[N, Y, 45], [Y, M, 135], [M, X, 225], [X, N, -45]];
    L.compassTo(mid(N, Y), rr, 45);
    pairs.forEach(([p, q, out]) => {
      semi(L, mid(p, q), rr, out);
      L.line(p, q, {style: 'final'});
    });
    L.done([O]);
  });
  L.say('Har semicircle do sides ko chhoo raha hai.');
  close(L, [add(D, P(-90, -20)), add(B, P(20, 30)), add(O, P(h + 150, 0))], steps, 'Each semicircle touches two sides; the diameters meet.');
  return add(O, P(0, h + 80));
};

// ===================== 19 · semicircle in a sector =====================
const i19: Q = (L, b, prev) => {
  const F = add(FIG(b.O), P(0, 80));
  const A = add(F, P(0, -210)), R = 250;
  const D = polar(A, R, 90);
  const Bp = polar(A, R, 107.5), Cp = polar(A, R, 72.5);
  const E = rayX(D, 180, A, 107.5), Fq = rayX(D, 0, A, 72.5);
  const G2 = rayX(D, -45, A, 72.5), O = P(A.x, G2.y), G1 = rayX(G2, 180, A, 107.5), r = dist(O, D);
  const steps = ['Draw the sector BAC: angle 35°, radius 5 cm.', 'Bisect angle BAC. It cuts the arc at D.', 'Through D, draw EF perpendicular to AD (E on AB produced, F on AC produced).', 'Bisect angle ADF. It cuts AC at G2.', 'Through G2, draw G2O perpendicular to AD, produced to G1 on AB.', 'Centre O, radius OD: draw the semicircle.'];
  const qt = open(L, b, prev, [{s: 'Inscribe a '}, {s: 'semicircle in a sector', mark: 'concept'}, {s: ', with an angle of 35° and a radius 5 cm.'}], steps, 'Semicircle in a sector');
  L.say('Question nineteen.');
  L.say('Inscribe a semicircle in a sector, with an angle of thirty-five degree and a radius five cm.');
  L.say('Q15 jaisa slice, par is baar andar poora circle nahi, semicircle. Uska diameter dono arms ko chhoota hai.', () => highlight(L, qt, 1, L.t + 0.2));
  toFigure(L, [add(A, P(0, -40)), add(E, P(-40, 30)), add(Fq, P(40, 30))]);
  L.step(0);
  L.recapBadge('Sector: same as Q15', 3);
  L.say('Slice banao. Thirty-five degree, five cm.', () =>
    L.fast(1.8, () => {
      L.line(A, polar(A, 330, 72.5));
      L.angleAt(A, 72.5, 35, 1);
      L.line(A, polar(A, 330, 107.5));
      L.label('A', A, 0, -28);
      L.angleText(A, 72.5, 107.5, '35°', 46);
      L.compassMeasure(5, add(A, P(-170, 130)));
      L.compassTo(A, R, 66);
      L.arc(A, R, 64, 116);
      L.label('B', Bp, -34, -26);
      L.label('C', Cp, 34, -26);
    }),
  );
  L.step(1);
  L.recapBadge('Bisect an angle: elementary Q6', 3);
  L.say('Angle A ka bisector. Curve pe D.', () => {
    L.fast(1.8, () => angleBisect(L, A, 107.5, 72.5, 180, 100));
    L.line(A, polar(A, R + 70, 90));
    L.burst(D, 22);
    L.label('D', D, 18, 22);
  });
  L.step(2);
  L.recapBadge('Perpendicular: elementary Q4', 3);
  L.say('D pe, AD ka perpendicular. Arms pe E aur F.', () => {
    L.fast(2, () => perpOn(L, D, 90, 35, 55));
    L.line(add(E, P(-40, 0)), add(Fq, P(40, 0)));
    L.label('E', E, -26, 26);
    L.label('F', Fq, 26, 26);
  });
  L.step(3);
  L.say('Ab D pe angle ADF ko bisect karo. AC ko jahan kaate, woh G two.', () => {
    L.fast(1.6, () => angleBisect(L, D, -90, 0, 40, 36));
    L.line(D, polar(D, dist(D, G2) + 25, -45));
    L.burst(G2, 20);
    L.label('G2', G2, 22, -4, undefined, 'main', 22);
  });
  L.step(4);
  L.recapBadge('Perpendicular: elementary Q5', 3);
  L.say('G two se AD pe perpendicular, aur AB tak badhao. AD pe O, AB pe G one.', () => {
    L.fast(2, () => perpFrom(L, G2, A, D, 90, 70));
    L.line(add(G1, P(-20, 0)), add(G2, P(20, 0)));
    L.burst(O, 18);
    L.label('O', O, 14, -20, undefined, 'main', 24);
    L.label('G1', G1, -24, -4, undefined, 'main', 22);
  });
  L.step(5);
  L.say('Halka karo. O pe needle, D tak radius, neeche ki taraf semicircle.', () => {
    L.lighten([add(A, P(0, -10)), add(E, P(-30, 30)), add(Fq, P(30, 30))]);
    L.compassTo(O, r, 0);
    semi(L, O, r, 90);
    L.line(G1, G2, {style: 'final'});
    L.done([O]);
  });
  close(L, [add(A, P(0, -30)), add(E, P(-40, 30)), add(Fq, P(40, 30))], steps, 'The semicircle touches the arc; its diameter ends on both arms.');
  return add(D, P(0, 100));
};

// ===================== 20 · four semicircles in a circle =====================
const i20: Q = (L, b, prev) => {
  const A = add(FIG(b.O), P(0, 40)), R = 200;
  const D = add(A, P(0, R)), Fq = add(A, P(R, R));
  const G1 = add(A, P(100, 100)), G4 = add(A, P(-100, 100));
  const O1 = add(A, P(0, 100)), O2 = add(A, P(-100, 0)), O3 = add(A, P(0, -100)), O4 = add(A, P(100, 0));
  const steps = ['Draw a circle, centre A, radius 4 cm. Divide it into 8 equal parts.', 'In the sector BAC, draw a semicircle as in Q19 (centre O1).', 'Centre A, radius AO1: mark O2, O3, O4 on the other lines.', 'Radius O1D, centres O2, O3, O4: draw the other semicircles.'];
  const qt = open(L, b, prev, [{s: 'In a circle of radius '}, {s: '4 cm', mark: 'num'}, {s: ', inscribe '}, {s: 'four equal semicircles', mark: 'concept'}, {s: ', each to touch the circumference of the given circle and their diameters to be adjacent.'}], steps, 'Four semicircles in a circle');
  L.say('Aur aakhri, question twenty.');
  L.say('In a circle of radius four cm, inscribe four equal semicircles, each to touch the circumference of the given circle and their diameters to be adjacent.');
  L.say('Book mein yahan ek jagah six likha hai, par heading aur diagram dono four bolte hain. Toh four.', () => highlight(L, qt, 3, L.t + 0.2));
  L.say('Aur trick? Circle ke chaar slices, aur har slice mein Q19 wala semicircle.');
  toFigure(L, [add(A, P(-R - 50, -R - 50)), add(A, P(R + 60, R + 60))]);
  L.step(0);
  L.say('Centre A, compass four cm, circle.', () => {
    L.label('A', A, 18, -18, undefined, 'main', 26);
    L.compassMeasure(4, add(A, P(-90, R + 110)));
    L.circle(A, R, 180);
  });
  L.recapBadge('Eight parts: elementary Q15 (3)', 3);
  L.say('Aur elementary Q15 jaisa, aath barabar hisse.', () => {
    L.fast(2, () => L.line(add(A, P(-R - 30, 0)), add(A, P(R + 30, 0))));
    L.fast(2.4, () => bisect(L, add(A, P(-R, 0)), add(A, P(R, 0)), 280, {ext: 60}));
    L.fast(2, () => angleBisect(L, A, 0, 90, 120, 100));
    L.fast(2.4, () => {
      L.line(polar(A, R + 30, -135), polar(A, R + 30, 45));
      L.line(polar(A, R + 30, -45), polar(A, R + 30, 135));
    });
    L.label('B', polar(A, R, 135), -20, 16, undefined, 'main', 26);
    L.label('C', polar(A, R, 45), 20, 16, undefined, 'main', 26);
    L.label('D', D, 16, 22, undefined, 'main', 26);
  });
  L.step(1);
  L.recapBadge('Semicircle in a sector: same as Q19', 3);
  L.say('Ab neeche wala slice BAC. Isme Q19 wala semicircle. D pe perpendicular, angle ka bisector, G one, aur centre O one.', () => {
    L.fast(2.2, () => perpOn(L, D, 90, 35, 55));
    L.line(add(D, P(-60, 0)), add(Fq, P(30, 0)));
    L.fast(1.8, () => angleBisect(L, D, -90, 0, 40, 36));
    L.line(D, polar(D, dist(D, G1) + 25, -45));
    L.burst(G1, 18);
    L.label('G1', G1, 22, 0, undefined, 'main', 22);
    L.fast(2, () => perpFrom(L, G1, A, D, 140, 90));
    L.line(add(G4, P(-20, 0)), add(G1, P(20, 0)));
    L.burst(O1, 18);
    L.label('O1', O1, 14, -18, undefined, 'main', 22);
  });
  L.step(2);
  L.say('A pe needle, O one tak radius. Baaki teen lines pe O two, O three, O four.', () => {
    L.compassTo(A, 100, 180);
    [[O2, 180, 'O2'], [O3, -90, 'O3'], [O4, 0, 'O4']].forEach(([p, a, n]) => {
      L.arc(A, 100, (a as number) - 10, (a as number) + 10);
      L.burst(p as Pt, 16);
      L.label(n as string, p as Pt, 14, -18, undefined, 'main', 22);
    });
  });
  L.step(3);
  L.say('Halka karo. Radius O one se D tak, aur chaaron semicircles.', () => {
    L.lighten([add(A, P(-R - 30, -R - 30)), add(A, P(R + 30, R + 30))]);
    L.compassTo(O1, 100, 0);
    const halves: [Pt, number][] = [[O1, 90], [O2, 180], [O3, -90], [O4, 0]];
    halves.forEach(([c, out]) => {
      semi(L, c, 100, out);
      L.line(polar(c, 100, out - 90), polar(c, 100, out + 90), {style: 'final'});
    });
    L.done([A]);
  });
  L.say('Har semicircle bade circle ko chhoo raha hai, aur diameters milke ek square.');
  close(L, [add(A, P(-R - 30, -R - 30)), add(A, P(R + 30, R + 30))], steps, 'Each semicircle touches the circle; the diameters meet.');
  return add(A, P(0, R + 70));
};

// ---------------- the video ----------------
const ALL: [number, string | undefined, Q, string?][] = [
  [1, undefined, i1], [2, undefined, i2], [3, undefined, i3],
  [4, '(1)', q6, 'Question four. Angles. Part one, elementary ka Q6 hi hai, par ek baar phir dekh lete hain.'], [4, '(2)', i4b],
  [5, undefined, i5], [6, undefined, i6], [7, undefined, i7], [8, undefined, i8], [9, undefined, i9], [10, undefined, i10],
  [11, undefined, i11], [12, undefined, i12], [13, undefined, i13],
  [14, '(1)', q19, 'Question fourteen. Iske dono parts elementary mein ho chuke hain, Q19 aur Q20. Phir bhi, poora banate hain. Part one.'],
  [14, '(2)', q20, 'Part two.'],
  [15, undefined, i15], [16, undefined, i16], [17, undefined, i17], [18, undefined, i18], [19, undefined, i19], [20, undefined, i20],
];
export function intermediate() {
  setRef((n) => (n === 19 ? 'Q14 (1)' : `elementary Q${n}`));
  const L = new Lesson('intermediate');
  const G1 = glyphAt(1, 0, 0);
  L.cam.to(0, 0.01, {x: -1300, y: G1.y, zoom: 0.85, tilt: 3});
  L.t = 0.4;
  L.say('Intermediate drawing exam ke geometry paper ke yeh twenty constructions hain. Aaj sab banayenge.');
  L.say('Bahut saare elementary wale tricks pe hi bane hain. Jab main bolun elementary ka Q4, matlab pichhle video wala.');
  L.say('Saaman wahi: pencil, scale, compass, protractor, aur eraser.');
  let prev: Pt | null = null;
  ALL.forEach(([n, sub, fn, lead], i) => {
    const O = P(i * 860, i * 1760);
    prev = fn(L, {n, sub: sub && sub !== '(1)' ? sub : undefined, O, lead}, prev);
  });
  L.say('Bas! Intermediate ke saare twenty constructions ho gaye.');
  L.say('Steps ke screenshots le lo, aur ek baar khud banao. Haath se banaoge tabhi yaad rahega.');
  L.say('All the best for the exam. Milte hain.');
  setRef((n) => `Q${n}`);
  return L.finish();
}
