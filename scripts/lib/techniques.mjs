// Everything he taught me, in one list the system reads (his ask, 2026-10-12: "for every other thing which I gave you,
// you have to make it"). Each technique lands as a checklist line in the right pass of every plan.md, where it must be
// marked used (`- [x] … : where`) or not used (`- [-] … : why`) before a render. `built: false` = not in the engine yet:
// build it the first time a video needs it, then flip the flag. brain/coverage.md is generated from this file
// (`node scripts/editplan.mjs --coverage`).
//
// kinds: reel (talking head, 9:16) · vlog (long-form 16:9) · process (drawing / making-of)
const R = 'reel', V = 'vlog', P = 'process';
const ALL = [R, V, P];

export const TECHNIQUES = [
  // ── story: what stays, in which order, how it opens and ends ──
  {id: 'hook-options', pass: 'story', kinds: ALL, name: 'Hook options checkpoint', when: '3–4 English, title-like, slightly clickbait hooks + what the first 3 s look like; he picks', how: 'AskUserQuestion / show_design_options', src: 'hooks.md', built: true},
  {id: 'cold-open', pass: 'story', kinds: ALL, name: 'Cold open / result first', when: 'the most striking moment or the result goes first, then "how we got here"', how: 'reel: direction.coldOpen · vlog/process: segment order', src: 'hooks.md', built: true},
  {id: 'visual-hook', pass: 'story', kinds: ALL, name: '3-second visual hook', when: 'frame 1 has MOTION + CURIOSITY + CLARITY; heaviest editing of the video sits here (zoom, slam, sound)', how: 'hookText, zooms, text slam, impact sfx', src: 'hooks.md', built: true},
  {id: 'open-loop', pass: 'story', kinds: [R, V], name: 'Open loop / small loops', when: 'tease the payoff, re-hook mid-video, a counter (1/3, 2/3) so they wait for the rest', how: 'reel: direction.banner · vlog: tease line / counter gfx', src: 'hooks.md', built: true},
  {id: 'interval-twist', pass: 'story', kinds: [R], name: 'Interval twist', when: 'a line ~2 s in flips the opening premise', how: 'line order in the cut', src: 'craft.md', built: true},
  {id: 'tight-cut', pass: 'story', kinds: [R, V], name: 'Cut warm-ups, retakes, re-explaining, fillers', when: 'always: shortest version that keeps the payoff', how: 'removeRanges / segment in-out', src: 'principles.md', built: true},
  {id: 'relatable-story', pass: 'story', kinds: [P], name: 'His story + a common problem', when: 'first person ("main"), a problem most people share; not a tutorial', how: 'VO script, present tense', src: 'hooks.md', built: true},
  {id: 'ending', pass: 'story', kinds: ALL, name: 'Ending: loop or hard cut on the payoff, never a fade', when: 'loop the last line into the first, or cut on the payoff; a question people want to answer in comments', how: 'last segment / last line', src: 'preferences.md', built: true},
  {id: 'honesty', pass: 'story', kinds: ALL, name: 'Honest claims', when: 'clickbait only as far as the video delivers; references (Pinterest) said out loud; never name an unverified person', how: 'hook text, VO, name tags from people.json', src: 'preferences.md', built: true},

  // ── cuts: HOW each scene is cut ──
  {id: 'jump-cuts', pass: 'cuts', kinds: [V, P], name: 'Jump cuts to the best beats', when: 'action/chaos/long moments: keep the 3–5 liveliest beats at real speed with real sound', how: 'vlog: "jumps" + cutfinder.py beats · process: separate segments', src: 'craft.md', built: true},
  {id: 'speed-ramp', pass: 'cuts', kinds: [V, P], name: 'Speed ramp into a real-time moment', when: 'a build-up that lands on one moment (a stroke, a landing, a reveal)', how: '"speed" + "rampTo" + "dur"', src: 'process-videos.md', built: true},
  {id: 'time-lapse', pass: 'cuts', kinds: [V, P], name: 'Time-lapse only for slow progress', when: 'drawing progress, packing, travel; never people talking or playing', how: '"speed" / "dur"', src: 'preferences.md', built: true},
  {id: 'jl-cut', pass: 'cuts', kinds: [V], name: 'J-cut / L-cut', when: 'scene changes: next sound leads in (J) or the sound carries on under the next picture (L)', how: '"jcut": s · "lcut": s', src: 'craft.md', built: true},
  {id: 'match-cut', pass: 'cuts', kinds: [V, P], name: 'Match cut', when: 'two shots share a shape, position, movement or sound', how: 'cutfinder.py match → in point', src: 'craft.md', built: true},
  {id: 'cut-on-action', pass: 'cuts', kinds: [V, P], name: 'Cut on action', when: 'cut during a movement (punch, jump, turn) so the cut disappears', how: 'cutfinder.py actions → in/out points', src: 'craft.md', built: true},
  {id: 'smash-cut', pass: 'cuts', kinds: [R, V], name: 'Smash cut', when: 'punchline: loud/busy → instant silence and stillness', how: 'vlog: "smash": s · reel: direction.beats', src: 'craft.md', built: true},
  {id: 'cross-cut', pass: 'cuts', kinds: [V], name: 'Cross-cutting', when: 'two things happening at once, or expectation vs reality', how: 'interleave segments', src: 'craft.md', built: true},
  {id: 'dissolve', pass: 'cuts', kinds: [V, P], name: 'Dissolve / dip to white', when: 'only for time passing or memory, only where the picture really changes', how: '"transition": {type: dissolve|white|black, d}', src: 'craft.md', built: true},
  {id: 'readable-pace', pass: 'cuts', kinds: ALL, name: 'Readable pace (shots ≳ 1 s)', when: 'always: 0.45 s cuts confused him; energy comes from zoom, slam, sound', how: 'checked automatically', src: 'preferences.md', built: true},

  // ── captions & hero words ──
  {id: 'caption-look', pass: 'captions', kinds: [R, V], name: 'Caption look for this video', when: 'reel: one of 6 styles by tone · vlog: MrBeast karaoke on real word times, moved off faces', how: 'theme.captionStyle · vlog subs + word times', src: 'preferences.md', built: true},
  {id: 'hero-words', pass: 'captions', kinds: [R, V], name: 'Hero words exaggerated', when: 'numbers, emotions, objects, twists get colour/size/animation', how: 'direction.emphasis · *word* in subs', src: 'edit-layers.md', built: true},
  {id: 'hinglish', pass: 'captions', kinds: [R, V], name: 'Hinglish, never translated', when: 'always: check Hindi stretches, fix spellings', how: 'clip-N.words.json, hinglish.json', src: 'preferences.md', built: true},
  {id: 'inside-jokes', pass: 'captions', kinds: [V], name: "The friends' real inside jokes", when: 'text carries their jokes and real numbers, not bland lines', how: 'ask him; pop / caps text', src: 'preferences.md', built: true},
  {id: 'no-duplicate-text', pass: 'captions', kinds: ALL, name: 'Never the same text twice on screen', when: 'pop-ups/cards never repeat the caption words', how: 'captions hide under cards', src: 'preferences.md', built: true},

  // ── support visuals ──
  {id: 'show-it', pass: 'visuals', kinds: ALL, name: 'Show what he describes', when: '"pie chart, 20%…" → an animated chart; a product → its UI; an object → the object', how: 'chart / UI / image layers', src: 'preferences.md', built: true},
  {id: 'props', pass: 'visuals', kinds: [R, V], name: 'Props on face/hands (crown, sunglasses, sweat, anger, ?, bulb, tears, hearts)', when: 'his emotion or brag lands harder', how: 'reel: direction.attach · vlog: gfx {type: "attach", what, near}', src: 'motion-graphics skill', built: true},
  {id: 'bubbles-labels', pass: 'visuals', kinds: [R, V], name: 'Speech/thought bubbles, labels + arrows, sticky notes', when: 'what someone thinks/says, pointing at a thing, a key point', how: 'reel: attach bubble/thought/label/note · vlog: gfx {type: "attach", what: bubble|thought|label|note, text, near} / arrow', src: 'motion-graphics skill', built: true},
  {id: 'memes', pass: 'visuals', kinds: [R, V], name: 'Meme stickers / GIFs by HIS attitude', when: 'his feeling at that moment clearly matches (huh, sleepy, shocked…); never by keyword alone', how: 'direction.memes · vlog gfx sticker', src: 'preferences.md', built: true},
  {id: 'counter', pass: 'visuals', kinds: ALL, name: 'Number counter', when: 'a real number, progress, years, a score', how: 'reel: direction.counters (style full|overlay) · vlog: gfx counter / {type: "insert", kind: "counter"}', src: 'motion-design.md', built: true},
  {id: 'before-after', pass: 'visuals', kinds: [R, P], name: 'Before/after circle reveal', when: 'sketch → final, old → new', how: 'reel: direction.reveals (CircleReveal)', src: 'motion-design.md', built: true},
  {id: 'card-stage', pass: 'visuals', kinds: [R], name: 'Clips as cards on a stage (row, grid, stack, focus)', when: 'several clips/stages/options at once', how: 'direction.stages (CardStage)', src: 'motion-design.md', built: true},
  {id: 'ui-mockup', pass: 'visuals', kinds: [R, V], name: 'UI mockups: chat, notifications, button + cursor', when: 'messages, DMs, apps, websites, "they texted me"', how: 'reel: direction.ui [{kind: chat|notify|cursor}] · vlog: gfx {type: "insert", kind: chat|notify|cursor}', src: 'expensive.md', built: true},
  {id: 'text-card', pass: 'visuals', kinds: [R], name: 'Text card: typewriter / wave / slam', when: 'one key line deserves its own moment (1–2 per reel)', how: 'direction.cards', src: 'expensive.md', built: true},
  {id: 'vlog-cast', pass: 'visuals', kinds: [V], name: 'Hero intros, name tags, hanging photos, map, stamps', when: 'a friends trip: who is who, where, when', how: 'gfx hero / tag / hang / map / stamp', src: 'vlog.md', built: true},
  {id: 'real-numbers', pass: 'visuals', kinds: [R, V], name: 'Real numbers on screen', when: 'scores, counts, prices that really exist in the footage or his words', how: 'counter / pop', src: 'preferences.md', built: true},
  {id: 'character', pass: 'visuals', kinds: [R, V], name: 'Vector character in the footage', when: 'a little story with a cartoon (walks on walls, reacts)', how: 'npm run char (character-overlay skill)', src: 'preferences.md', built: true},
  {id: 'illustration', pass: 'visuals', kinds: [R, V], name: 'Vector illustration / icon', when: 'an idea with no footage: a drawn object, a concept, a diagram', how: 'Library/stickers *.svg/png (assets.mjs) · reel: attach {what: "image", src} · vlog: gfx sticker / attach image', src: 'preferences.md', built: true},

  // ── canvas & layout ──
  {id: 'make-room', pass: 'layout', kinds: [R], name: 'Footage makes room (shrinks/moves, blurred fill)', when: 'a visual needs space; eased out and back', how: 'direction.layouts {at, until, scale, x, y, fill: blur|color}', src: 'edit-layers.md', built: true},
  {id: 'vlog-layouts', pass: 'layout', kinds: [V], name: 'card / split / rotate → full', when: 'vertical clips as cards, same moment from several phones side by side', how: 'segment layout', src: 'vlog.md', built: true},
  {id: 'floating-cards', pass: 'layout', kinds: [P], name: 'Floating practice cards over a running shot', when: '"lots of work done" without cutting away', how: 'timeline cards', src: 'process-videos.md', built: true},
  {id: 'safe-zones', pass: 'layout', kinds: [R], name: 'Instagram safe zones', when: 'always: top ~8 %, bottom ~20 %, right edge stay clear of key text', how: 'positions', src: 'skills.md', built: true},

  // ── caption placement & connectors ──
  {id: 'caption-moves', pass: 'connectors', kinds: [R, V], name: 'Captions move aside for a visual', when: 'a visual takes the caption spot', how: 'reel: direction.captionMoves {at, until, top} · vlog: auto off faces / capPos', src: 'edit-layers.md', built: true},
  {id: 'connector', pass: 'connectors', kinds: [R, V], name: 'Arrow / line from the hero word to its visual', when: 'linking a word to what it means on screen', how: 'reel: direction.connectors {from, to, label} · vlog: gfx arrow / insert connector', src: 'edit-layers.md', built: true},

  // ── depth ──
  {id: 'text-behind', pass: 'depth', kinds: [R], name: 'Text behind him (magnetic mask)', when: 'hook / title moments', how: 'hookBehind (personmask)', src: 'skills.md', built: true},
  {id: 'object-behind', pass: 'depth', kinds: [R], name: 'Objects/effects behind him', when: 'something happens in the world behind his head', how: 'attach {behind: true}', src: 'edit-layers.md', built: true},
  {id: 'hero-cutout', pass: 'depth', kinds: [V], name: 'Person cut-outs (hero intros)', when: 'introducing someone', how: 'scripts/herocut.py + gfx hero', src: 'vlog.md', built: true},

  // ── motion & transitions ──
  {id: 'camera-moves', pass: 'motion', kinds: ALL, name: 'Camera push on a new idea, punch on a hero word', when: 'inside one shot, movement comes from the camera', how: 'reel: direction.sections · vlog/process: zoom/toZoom, gfx zoom', src: 'preferences.md', built: true},
  {id: 'real-transitions', pass: 'motion', kinds: ALL, name: 'Transitions only where the picture really changes', when: 'never a slide/whip inside one continuous shot', how: 'checked automatically', src: 'preferences.md', built: true},
  {id: 'entrances', pass: 'motion', kinds: ALL, name: 'Every element enters and leaves with motion', when: 'blur-in, ease-out, slight overshoot; nothing pops in stiffly', how: 'built into the layers', src: 'motion-design.md', built: true},
  {id: 'scatter-text', pass: 'motion', kinds: [R, V], name: 'Scatter text', when: 'playful emphasis: words land at different spots/sizes, then settle', how: 'reel: direction.cards mode "scatter" · vlog: gfx {type: "insert", kind: "scatter"}', src: 'motion-design.md', built: true},
  {id: 'light-burst', pass: 'motion', kinds: [R, V], name: 'Light burst / glitch flash accent', when: 'one big moment per section at most', how: 'reel: direction.bursts · vlog: gfx zoom flash / insert burst', src: 'motion-design.md', built: true},
  {id: 'push-through', pass: 'motion', kinds: [R, V], name: 'Push-through / 3D tilted plane / layout morph / cascade', when: 'an accent between ideas, at most one per section', how: 'reel: direction.pushes / planes / stages (morphs) / ui notify (cascade, stack: true) · vlog: insert push / plane', src: 'motion-design.md', built: true},

  // ── look ──
  {id: 'original-colours', pass: 'look', kinds: [R, V], name: 'His original colours + grain (v1 look)', when: 'default; a touch more contrast/vibrance for vlogs; no vignette on vlogs', how: 'style.film / vlog look', src: 'color.md', built: true},
  {id: 'grade-per-clip', pass: 'look', kinds: [P, V], name: 'Grade per clip, then one shared look', when: 'clips differ in exposure (paper white, bright walls)', how: 'process: exposure per segment', src: 'preferences.md', built: true},
  {id: 'colour-check', pass: 'look', kinds: ALL, name: 'Scopes before any grade change', when: 'skin on the line, nothing clipped, compared with v1', how: 'scripts/colorcheck.py', src: 'color.md', built: true},
  {id: 'orientation', pass: 'look', kinds: [V, P], name: 'Orientation of every range', when: 'he rotates the phone mid-recording', how: 'contact sheets → rotate', src: 'preferences.md', built: true},

  // ── sound ──
  {id: 'sound-meaning', pass: 'sound', kinds: ALL, name: 'Sound by meaning', when: 'zone-out → glitch, gives up → Discord leave, idea → notify… (brain/sounds.md)', how: 'direction.memes tags / vlog sfx', src: 'sounds.md', built: true},
  {id: 'motion-sounds', pass: 'sound', kinds: ALL, name: 'Soft whoosh for real movement, tick/click for text/UI', when: 'quiet, not on everything', how: 'sfx', src: 'expensive.md', built: true},
  {id: 'meme-voices', pass: 'sound', kinds: [R, V], name: 'Meme voices after the line, never over his words', when: 'his attitude matches; variety, never the same one twice in a row', how: 'memes / sfx (checked automatically)', src: 'preferences.md', built: true},
  {id: 'music-sections', pass: 'sound', kinds: [V], name: 'Music in beat-synced sections, out under conversations', when: 'his song is the backbone; drops land on chapters', how: 'vlog music runs', src: 'vlog.md', built: true},
  {id: 'tension-bed', pass: 'sound', kinds: [R, V], name: 'Tension / riser under a build-up', when: 'cold opens, before a reveal', how: 'sfx tension-*, riser → impact', src: 'preferences.md', built: true},

  // ── density ──
  {id: 'density', pass: 'density', kinds: ALL, name: 'Something new every 2–3 s; one idea at a time', when: 'walk the timeline; fill boring stretches, thin overloaded ones', how: 'node scripts/editplan.mjs <name> check', src: 'preferences.md', built: true},
];

// Rules the computer can check on the edit itself (scripts/lib/lint.mjs). error = blocks the render.
export const passTechniques = (pass, kind) => TECHNIQUES.filter((t) => t.pass === pass && t.kinds.includes(kind));
