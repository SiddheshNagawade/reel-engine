// Sound families: what a sound MEANS in a story, not just what it literally is.
// A glitch isn't only for glitches: it's also "my brain glitched", "I'm talking rubbish → next topic", "plan broke".
// tags = short keys used in direction.json (memes: [{at, tag}] or {at, id}); meanings = guidance for choosing.
// useSeconds = how long to normally use it; maxSeconds = max imported length; volume = default level under his voice.
export const FAMILIES = {
  glitch: {
    tags: ['glitch', 'zone-out', 'rubbish', 'topic-switch', 'broke', 'plot-twist', 'tech'],
    meanings: ['my brain glitched / I zoned out / lost my train of thought', 'I said something rubbish → snap to the next topic',
      'abrupt topic switch (better than a whoosh when the switch is awkward or funny)', 'a plan or expectation breaking',
      'plot twist / reality check', 'tech, AI, hacker, digital vibe', 'a corrupted memory / "wait, what was I saying"'],
    useSeconds: 1, volume: 0.6,
  },
  'whoosh-short': {
    tags: ['whoosh', 'motion', 'move-on', 'text-in'],
    meanings: ['something moving fast: text/sticker flying in, a quick camera move', '"moving on" / next point',
      'throwing an idea away', 'a quick time skip'],
    useSeconds: 0.8, volume: 0.45,
  },
  'whoosh-long': {
    tags: ['whoosh', 'transition', 'time-pass', 'scene-change'],
    meanings: ['a real scene/clip change or a big camera move', 'time passing / travelling somewhere', 'a dreamy, floaty moment'],
    useSeconds: 1.6, volume: 0.45,
  },
  riser: {
    tags: ['riser', 'build-up', 'suspense', 'wait-for-it'],
    meanings: ['building anticipation right before a reveal, result, number or punchline', '"wait for it…"',
      'tension rising as he gets to the point', 'lead-in to a hook slam (riser → impact)'],
    useSeconds: 3, maxSeconds: 16, volume: 0.5,
  },
  impact: {
    tags: ['impact', 'reveal', 'emphasis', 'slam', 'decision'],
    meanings: ['a reveal / result / big number landing', 'a hard truth or bold statement', 'title or text slam',
      'a decision made ("and that\'s when I decided…")', 'a punch-in on the key word'],
    useSeconds: 1.8, volume: 0.55,
  },
  'sub-drop': {
    tags: ['drop', 'dark', 'serious', 'realization', 'plot-twist'],
    meanings: ['the mood drops: a serious or dark realization', 'a heavy truth / consequence', 'plot twist',
      'right before a sad or honest line'],
    useSeconds: 2.5, volume: 0.6,
  },
  notify: {
    tags: ['notify', 'idea', 'thought', 'reminder', 'reality-call', 'list-point'],
    meanings: ['an idea pops into his head / a sudden thought', 'a reminder / reality calling ("ping: you have exams")',
      'a new point in a list arrives', 'a reply, comment or DM in the story', 'social proof (likes, followers, views)'],
    useSeconds: 1, volume: 0.6,
  },
  'join-leave': {
    tags: ['join', 'leave', 'enter', 'exit', 'ghost', 'give-up'],
    meanings: ['join: someone or a new idea enters the conversation / joining a trend',
      'leave: giving up on something, ghosting, leaving a topic, "and he left"', 'a character entering/exiting his story'],
    useSeconds: 1, volume: 0.6,
  },
  click: {
    tags: ['click', 'select', 'choose', 'ui', 'list-point', 'next'],
    meanings: ['choosing / selecting an option, a decision click', 'a list item or UI element appearing', '"next"',
      'subtle sound under text or sticker appearances'],
    useSeconds: 0.4, volume: 0.45,
  },
  pop: {
    tags: ['pop', 'appear', 'small-idea', 'cute', 'list-point'],
    meanings: ['text, sticker or bubble appearing', 'a small idea / tiny fact', 'something cute or small', 'a list item'],
    useSeconds: 0.5, volume: 0.5,
  },
  camera: {
    tags: ['camera', 'snapshot', 'noted', 'freeze', 'memory', 'fame'],
    meanings: ['capturing a moment / "screenshot this" / "noted"', 'a freeze frame or photo of the result',
      'a flash of memory', 'showing proof', 'fame / paparazzi / "main character" moment'],
    useSeconds: 0.8, volume: 0.55,
  },
  money: {
    tags: ['money', 'profit', 'price', 'value', 'win', 'greed'],
    meanings: ['money, profit, a price reveal, a sale', '"worth it" / that\'s valuable', 'cha-ching success',
      'greed or flexing (sarcastic)'],
    useSeconds: 1.5, volume: 0.6,
  },
  clock: {
    tags: ['clock', 'waiting', 'deadline', 'boring', 'late-night', 'countdown'],
    meanings: ['waiting / it took forever', 'deadline or time pressure', 'a boring stretch (ironic)', 'late night / time passing',
      'a countdown before something happens'],
    useSeconds: 3, maxSeconds: 20, volume: 0.4,
  },
  typing: {
    tags: ['typing', 'working', 'planning', 'writing', 'research', 'hacker', 'messaging'],
    meanings: ['working hard / grinding', 'writing a plan, script or list', 'researching / searching online', 'messaging someone',
      'hacker / "I figured it out" smart move'],
    useSeconds: 2, maxSeconds: 12, volume: 0.4,
  },
  paper: {
    tags: ['paper', 'drawing', 'notes', 'reject', 'start-over', 'next-chapter'],
    meanings: ['his drawing / sketching (process reels)', 'taking notes / a list', 'rip or crumple: rejecting an idea, starting over',
      'page flip: next chapter / next part of the story'],
    useSeconds: 1.5, maxSeconds: 10, volume: 0.5,
  },
  success: {
    tags: ['success', 'correct', 'achievement', 'approved', 'nailed-it', 'reward'],
    meanings: ['right answer / nailed it', 'a small win or achievement unlocked', 'approval / permission granted',
      'ticking a box on a list', 'a reward or level-up moment'],
    useSeconds: 1.2, volume: 0.55,
  },
  fail: {
    tags: ['fail', 'wrong', 'mistake', 'rejected', 'error', 'bad-idea'],
    meanings: ['wrong answer / a mistake / bad idea', 'rejection ("access denied", "nope")', 'something breaking or crashing',
      'brain error: "I don\'t understand" / system failure', 'self-own (funny)'],
    useSeconds: 1.2, volume: 0.55,
  },
  cartoon: {
    tags: ['cartoon', 'silly', 'self-own', 'dumb', 'cute', 'comic'],
    meanings: ['a silly or goofy moment', 'self-own / dumb mistake (bonk)', 'something small and cute (toy squeak, bloop)',
      'an embarrassing beat', 'a comic punctuation after a joke'],
    useSeconds: 1, volume: 0.55, beat: true,
  },
  crowd: {
    tags: ['crowd', 'reaction', 'celebrate', 'sympathy', 'sarcastic-applause'],
    meanings: ['a fake audience reacting to what he said', 'celebration / he did it', 'sympathy ("awww")',
      'sarcastic applause after a bad idea', 'shock from the "audience"'],
    useSeconds: 2, maxSeconds: 12, volume: 0.5,
  },
  tension: {
    tags: ['tension', 'nervous', 'scary', 'pressure', 'regret', 'lonely', 'suspense'],
    meanings: ['nervous / heart racing', 'scary or eerie', 'pressure / anxiety', 'regret or a low moment', 'lonely, empty feeling',
      'suspense under a story beat'],
    useSeconds: 3, maxSeconds: 25, volume: 0.45,
  },
  time: {
    tags: ['time', 'flashback', 'rewind', 'fast-forward', 'time-skip', 'story-time'],
    meanings: ['flashback / "back in first year…"', 'rewinding a mistake ("let me rewind")', 'fast-forwarding through a boring part',
      'time skip ("a few hours later")', 'story time / going into a memory', 'jumping to another place or topic (portal)'],
    useSeconds: 1.5, maxSeconds: 6, volume: 0.55, beat: true,
  },
  energy: {
    tags: ['energy', 'motivation', 'glow-up', 'shine', 'epic', 'transformation'],
    meanings: ['a motivation boost / power-up', 'a glow-up or transformation (before → after)', 'something shiny/premium',
      'an epic moment / trailer feel'],
    useSeconds: 2, maxSeconds: 12, volume: 0.5,
  },
  'tech-ui': {
    tags: ['tech', 'loading', 'processing', 'thinking', 'connect', 'disconnect', 'ui'],
    meanings: ['thinking / processing information ("loading…")', 'his brain connecting the dots (connect) or losing focus (disconnect)',
      'tech, apps, websites (CaptionKaro!)', 'downloading knowledge / learning', 'old-internet nostalgia (dial-up)'],
    useSeconds: 1.5, maxSeconds: 10, volume: 0.5,
  },
  'meme-voice': {
    tags: ['meme'],
    meanings: ['a voice meme: use it for its exact feeling (see the note); only when HIS attitude matches'],
    useSeconds: 2, maxSeconds: 10, volume: 0.7, beat: true,
  },
  censor: {
    tags: ['censor', 'swear', 'secret', 'spoiler', 'unsaid'],
    meanings: ['bleeping a swear word (his or a quoted one)', 'hiding a secret / "I won\'t say who"', 'spoiler',
      'the thing he almost said ("I was about to say…")'],
    useSeconds: 0.8, volume: 0.5,
  },
  ambience: {
    tags: ['ambience', 'bed', 'mood'],
    meanings: ['a quiet background bed for a mood (wind, drone), very low under his voice'],
    useSeconds: 5, maxSeconds: 40, volume: 0.3,
  },
};
