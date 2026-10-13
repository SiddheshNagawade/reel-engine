# The "designed reel" style (learned 2026-10-14 from Pablo Quesada's 8-hour Premiere/After Effects reel course)

His ask: learn it by heart, then treat it as ONE MORE way to edit, to mix and reuse, never "the pattern everywhere".
The source video is deleted; full raw notes + frames of the finished reel stay on the T7:
`references/pablo-quesada-reels-tutorial/study/` (notes.md, reelfull/ = the 43 s result at 3 fps).

## When it fits (and when it doesn't)
- Fits: an explaining / opinion talking-head reel with a clear idea chain (problem → what works → proof → CTA), numbers,
  a journey ($0 → 1K), a system with steps. Clean, "high-authority" look; a reel where graphics carry the meaning.
- Mix in pieces: one designed hook, ONE full-screen scene, the inverted stacked title for the key phrase — inside an
  otherwise casual meme-y reel is fine. Never stack the full style onto a chaotic friends vlog.
- Doesn't fit: pure fun/meme moments, vlogs' conversations, drawing process videos (their own playbooks win).

## The method (what makes it look expensive)
1. **Plan one visual per segment before animating** (every cut = a segment). Menu: captions only · designed text ·
   on-screen graphic (he stays, a photo/graphic joins him) · FULL-SCREEN scene (a designed board replaces him) ·
   plain speaker (a breather). Alternate them; never two full-screens in a row; leave plain stretches.
2. **Every element means something.** A photo because he names the person; red background because it's the problem,
   blue because it's the solution/growth; an XP badge for "experience", a gem for "insight". Nothing decorative.
3. **Tiny palette:** white text only; 2 background colours by meaning; 3 fonts (heavy condensed caps = Anton;
   brush script = Yellowtail; bold grotesk/sans = Inter 900 / Poppins). Icons from one family (3D, black/white).
4. **Timing to the frame:** each word/element lands exactly when he says it (typing speed = speaking speed).
5. **Always in motion:** eased with a long soft settle; scenes already moving on their first frame; the camera pans
   from element to element, pushes in on the payoff, pulls out to reveal. A full-screen scene never sits still.
6. **Push-in on the key line, pull-out after a scene** on the speaker (eyes stay at the same height during zooms).
7. **Text treatment:** soft white glow + a subtle living wobble; bottom SHADE (darkened lower frame) under text;
   key words behind his head where possible.
8. **Entrances everywhere; exits too** unless a white light-leak covers the change. Only ~3 light-leaks per 45 s.
9. **Captions off when graphics carry the words** (designed text, scenes); captions fade before a title, not cut.
10. **Sound for every movement**, different each time: long whoosh into the hook, keyboard/camera-click for typing,
    a "negative" blip for a red highlight, digital ticks for a line drawing or a counter, cash on the landing number,
    two different chimes for two rewards, small whoosh on a push-in, whoosh on camera travels. Music low, its dramatic
    part placed on the problem section.

## How to build it here (direction.json)
- Designed title over him: `direction.titles: [{at, until, kind: "words", y, lines: [[{word, text, font:
  heavy|script|grotesk|sans, enter: rise|type|blur|cut, highlight: "#c8102e"}]]}]` — e.g. hook: heavy "STOP POSTING"
  rises, script "random videos" types on with a red brush bar drawn under it; "When They / truly connect / with you"
  mixes script + heavy with blur-cascade, cut and type entrances. Shade on by default.
- Inverted title: `{kind: "stack", lines: ["The", "Online", "Ecosystem"], words: [i, j, k]}` — heavy grotesk block,
  blend EXCLUSION (letters invert what's behind them), lines rise one after another.
- Full-screen scene: `direction.scenes: [{at, until, bg: {color, style: radial|grid|blinds}, cam: [{word|s, x, y, zoom}],
  items: [{word|s, type: text|box|image|line|num|badge|counter|follow, x, y, …}]}]` (x, y = fractions of the frame;
  beyond 0..1 is space the camera can travel to). Recipes:
  * mind-map: script title + gradient boxes ("Quick Tips" → "How To's" → "ChatGPT") joined by dashed lines drawn on,
    camera pans box to box, final script line types on ("Doesn't work anymore.");
  * journey: "$0" … counter rolling to $1,000 (start mid-way, e.g. 145, so it doesn't spin), a dashed line with his
    circle photo riding it (`follow`), icons dropping in one by one, then the camera pushes in on the result + badge;
  * steps: numbered circles 1-2-3 on a dashed S-path, a badge travels the path while the camera pulls out, the word
    ("Original") types on at the end; blinds background.
- Scene change: `transitions: [{f, type: "leakwhite"}]` (white light-leak bloom; covers the cut, so no exits needed).
- Sounds are added automatically from his map (plan.mjs designSounds); `sound: null` on an insert silences it.
- Still missing (do by hand / build when needed): a cut-out photo rising from the bottom while he stays (use
  `attach` image or a scene `image`), text behind him for any title (hookBehind covers the hook only), a screen-
  recording card floating behind him.
