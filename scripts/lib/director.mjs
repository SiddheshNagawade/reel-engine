// Local "AI director": decides retakes, emphasis, pop-ups, hook, section transitions and topic from the transcript.
// No internet. Claude Code can refine the result by editing work/<name>/direction.json and re-running.

const norm = (w) => w.toLowerCase().replace(/[^\p{L}\p{N}₹%]/gu, '');
const FILLERS = new Set(['um', 'umm', 'uh', 'uhh', 'uhm', 'hmm', 'erm', 'ah', 'aa', 'mm']);
const POWER = new Set(
  ('never always best worst free secret mistake mistakes stop biggest easiest fastest instantly ' +
    'only nobody everyone everything nothing money rich broke viral million billion lakh crore double triple ' +
    'sabse kabhi galti paisa paise mat bilkul zaroor asli sach jhooth bas free hack truth wrong right important')
    .split(' '),
);
const SECTION_START = new Set(
  'step first second third fourth fifth next number but lekin ab now finally so toh aur also tip point bonus reason'.split(' '),
);
const NUM_WORDS = {sau: 100, hazaar: 1000, hazar: 1000, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, ek: 1, do: 2, teen: 3, char: 4, paanch: 5};
const UNITS = /^(rupees?|rupaye|rupay|rupaiye|rs|₹|lakhs?|crores?|k|%|percent|steps?|days?|hours?|minutes?|mins?|seconds?|years?|months?|weeks?|x|times|tips?|ways?|things?|reasons?|mistakes?|apps?|people|followers|views|kg)$/i;

function sentences(words) {
  const out = [];
  let cur = [];
  words.forEach((w, i) => {
    cur.push(i);
    const next = words[i + 1];
    if (!next || /[.!?।]$/.test(w.w) || next.s - w.e > 0.45) {
      out.push(cur);
      cur = [];
    }
  });
  return out;
}

function popupText(words, i) {
  const t = words[i].w.replace(/[.,!?]$/, '');
  const n = /^\d[\d,.]*$/.test(t) ? t : NUM_WORDS[norm(t)];
  if (n === undefined) {
    if (/^₹\d/.test(t) || /^\d+(%|x|k)$/i.test(t)) return t.toUpperCase();
    return null;
  }
  const unit = words[i + 1] && norm(words[i + 1].w);
  const prev = words[i - 1] && norm(words[i - 1].w);
  if (unit && /^(rupees?|rupaye|rupay|rupaiye|rs)$/.test(unit)) return `₹${n}`;
  if (unit && UNITS.test(unit)) return `${n} ${words[i + 1].w.replace(/[.,!?]$/, '')}`.toUpperCase();
  if (prev && /^(step|tip|number|day|point|reason)$/.test(prev)) return `${prev} ${n}`.toUpperCase();
  return null;
}

const THEMES = {
  money: 'money paisa paise rupaye bachaye bachao bachana kharcha kamai kamao mahine salary rupees rupee save saving invest investment stock stocks market income salary business profit loan emi tax rich crore lakh budget spend spending earn sip mutual fund',
  tech: 'ai app apps software code coding tech phone iphone android laptop computer website tool tools chatgpt claude automation startup data internet',
  fitness: 'gym workout fitness protein diet weight fat muscle exercise health healthy body run running yoga sleep',
  motivation: 'success discipline mindset goal goals dream dreams life hustle habit habits motivation focus consistency hard work grow growth',
  lifestyle: 'skin skincare makeup fashion outfit style aesthetic travel cafe coffee home room decor beauty hair vlog morning routine',
  fun: 'funny joke prank meme lol bro yaar mazaa crazy wait what',
  food: 'food recipe cook cooking eat eating restaurant chai pizza burger taste spicy sweet',
};

export function detectTopic(words) {
  const counts = Object.fromEntries(Object.keys(THEMES).map((k) => [k, 0]));
  const sets = Object.fromEntries(Object.entries(THEMES).map(([k, v]) => [k, new Set(v.split(' '))]));
  for (const w of words) for (const k in sets) if (sets[k].has(norm(w.w))) counts[k]++;
  const [best, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return n >= 2 ? best : 'general';
}

export function directLocal(words, {brollTags = [], silences = []} = {}) {
  const sents = sentences(words);
  const tok = (s) => s.map((i) => norm(words[i].w)).filter(Boolean);
  const removeRanges = [];
  const removed = new Set();

  // Retakes: if a sentence restarts the same way as one of the next two, the earlier one was a bad take.
  sents.forEach((A, k) => {
    const a = tok(A);
    if (a.length < 2) return;
    for (const B of sents.slice(k + 1, k + 3)) {
      const b = tok(B);
      const head = Math.min(3, a.length);
      const sameStart = a.slice(0, head).every((t, j) => b[j] === t);
      const covered = a.filter((t) => b.includes(t)).length / a.length;
      if (sameStart && (a.length <= 4 || covered >= 0.6)) {
        removeRanges.push({from: A[0], to: A[A.length - 1], reason: `retake (said again: "${B.slice(0, 5).map((i) => words[i].w).join(' ')}…")`});
        A.forEach((i) => removed.add(i));
        return;
      }
    }
  });

  // Isolated fillers.
  words.forEach((w, i) => {
    if (!removed.has(i) && FILLERS.has(norm(w.w))) {
      removeRanges.push({from: i, to: i, reason: 'filler'});
      removed.add(i);
    }
  });

  const kept = words.map((w, i) => i).filter((i) => !removed.has(i));

  // Pop-ups: numbers and money.
  const popups = [];
  for (const i of kept) {
    const t = popupText(words, i);
    if (t && !popups.some((p) => p.text === t)) popups.push({at: i, text: t});
  }

  // Emphasis: numbers + power words, at most one every ~3s.
  const emphasis = [];
  let lastT = -10;
  for (const i of kept.slice(1)) {
    const n = norm(words[i].w);
    const score = POWER.has(n) ? 2 : /\d/.test(n) ? 1 : 0;
    if (score && words[i].s - lastT > 3) {
      emphasis.push(i);
      lastT = words[i].s;
    }
  }

  // Sections: a new idea after a pause → creative transition.
  const sections = [];
  let lastSec = -10;
  for (const S of sents) {
    const i = S.find((x) => !removed.has(x));
    if (i === undefined || words[i].s < 2) continue;
    const prev = words[i - 1];
    const pause = prev ? words[i].s - prev.e : 0;
    if (SECTION_START.has(norm(words[i].w)) && pause > 0.4 && words[i].s - lastSec > 4) {
      sections.push(i);
      lastSec = words[i].s;
    }
  }

  // B-roll: a spoken word/phrase that matches an asset filename.
  const broll = [];
  const tags = brollTags.map((t) => ({t, parts: t.toLowerCase().split(/[-_ ]+/)}));
  for (const i of kept) {
    for (const {t, parts} of tags) {
      const match = parts.every((p, j) => words[i + j] && norm(words[i + j].w) === p);
      if (match && !broll.some((b) => b.tag === t)) broll.push({tag: t, at: i, duration: 2.2});
    }
  }

  // Hook: the first real sentence, trimmed to a punchy length.
  const first = sents.find((S) => S.some((i) => !removed.has(i))) ?? [];
  let hw = first.filter((i) => !removed.has(i)).map((i) => words[i].w.replace(/[.,!?]$/, ''));
  hw = hw.flatMap((w, j) => (/^(rupees?|rupaye|rupay|rs)$/i.test(w) && /^\d/.test(hw[j - 1] ?? '') ? [] : /^\d/.test(w) && /^(rupees?|rupaye|rupay|rs)$/i.test(hw[j + 1] ?? '') ? [`₹${w}`] : [w]));
  if (hw.length > 6) {
    // Keep the punchiest window: up to the first number/power word, plus a little lead-in.
    const k = hw.findIndex((w) => /[\d₹]/.test(w) || POWER.has(norm(w)));
    hw = k >= 0 ? hw.slice(Math.max(0, k - 3), k + 1) : hw.slice(0, 6);
  }
  while (hw.length > 2 && /^(ki|ke|ka|toh|to|and|so|that|jo|aur|ye|but|lekin)$/i.test(hw[0])) hw.shift();
  const hookText = hw.join(' ');

  // Meme cues: the mood of a moment → a meme tag (matched against public/assets/memes/catalog.json).
  const MEME_CUES = [
    ['confused', /^(confused|confuse|samajh|samjh|huh|kya|kyu|kyun|kaise|kaun|why|what|how)$/],
    ['wtf', /^(wtf|seriously|sach|pagal|crazy|insane|bakwas)$/],
    ['pain', /^(pain|dard|dukh|hurt|tough|struggle|thak|thaka|tired)$/],
    ['sus', /^(secretly|chupke|caught|pakda|sus|suspicious|chori)$/],
    ['happy', /^(happy|khush|finally|success|jeet|celebrate|party)$/],
    ['soft', /^(cute|aww|pyaar|pyara|soft|sweet)$/],
    ['disgust', /^(chhi|chi|yuck|gross|ganda|disgusting|eww)$/],
    ['sarcastic', /^(obviously|bilkul|sure|wah)$/],
  ];

  const memes = [];
  for (const i of kept) {
    const n = norm(words[i].w);
    const isQuestion = /\?$/.test(words[i].w);
    const cue = isQuestion ? ['confused'] : MEME_CUES.find(([, re]) => re.test(n));
    if (!cue) continue;
    if (memes.length && words[i].s - words[memes[memes.length - 1].at].s < 6) continue;
    memes.push({at: i, tag: cue[0]});
  }

  // Anger → red burn: ONLY when an angry word AND a clearly raised voice (+5 dB over his median) coincide.
  const dbs = kept.map((i) => words[i].db).filter((x) => x > -80).sort((a, b) => a - b);
  const median = dbs.length ? dbs[Math.floor(dbs.length / 2)] : -30;
  const ANGRY = /^(gussa|bakwas|pagal|irritate|irritating|hate|angry|nonsense|ghatiya|chup|bhaad|stop|bas|enough|frustrat\w*)$/;
  const effects = [];
  for (const S of sents) {
    const ks = S.filter((i) => !removed.has(i));
    if (ks.length < 2) continue;
    const loud = ks.reduce((n, i) => n + (words[i].db ?? -90), 0) / ks.length;
    if (ks.some((i) => ANGRY.test(norm(words[i].w))) && loud >= median + 5) effects.push({from: ks[0], to: ks[ks.length - 1], type: 'rage', end: 'fade'});
  }

  // Bad take → silent freeze + B&W + fart/bruh in the pause. Strict: a 'bad' word ends the sentence AND he pauses. Max one.
  const BAD = /^(bakwas|useless|bekaar|faltu|ghatiya|cringe|worst|pathetic|lame|dumb)$/;
  const beats = [];
  for (const S of sents) {
    const ks = S.filter((i) => !removed.has(i));
    const last = ks[ks.length - 1];
    const next = words[last + 1];
    if (last !== undefined && BAD.test(norm(words[last].w)) && (!next || next.s - words[last].e > 0.35) && !beats.length)
      beats.push({after: last, tag: 'bad-take', seconds: 1.1, effect: 'mono'});
  }

  const keptWords = kept.map((i) => words[i]);
  const talkSecs = keptWords.reduce((n, w) => n + (w.e - w.s), 0) || 1;
  const pace = keptWords.length / talkSecs > 3.2 ? 'energetic' : 'calm';

  return {
    removeRanges,
    emphasis,
    popups,
    broll,
    sections,
    memes,
    effects,
    beats,
    hookText,
    topic: detectTopic(keptWords),
    pace,
    notes: [
      `${removeRanges.length} cuts (retakes/fillers), ${popups.length} pop-ups, ${emphasis.length} emphasis, ${sections.length} section transitions`,
    ],
  };
}
