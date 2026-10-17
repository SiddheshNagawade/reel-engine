# Coverage: everything he taught → built? → where it's checked

Generated from scripts/lib/techniques.mjs (`node scripts/editplan.mjs --coverage`); edit that file, not this one.
Every technique appears as a checklist line in its pass of every plan.md and must be marked used / not used (with a
reason) before a render. Rules a computer can measure are also checked on the edit itself (scripts/lib/lint.mjs).

127 techniques · 125 built · 1 still to build: Auto grade with a trained model (Image-Adaptive 3D LUT): PARKED, lost to raw on his footage · 1 parked on purpose (Subject/background separation grade)

| pass | technique | kinds | status | how | from |
|---|---|---|---|---|---|
| story | Hook options checkpoint | reel, vlog, process | ✅ | AskUserQuestion / show_design_options | hooks.md |
| story | Cold open / result first | reel, vlog, process | ✅ | reel: direction.coldOpen · vlog/process: segment order | hooks.md |
| story | 3-second visual hook | reel, vlog, process | ✅ | hookText, zooms, text slam, impact sfx | hooks.md |
| story | Hook passes the 4 checks: no delay, no confusion, relevant to the viewer, contrast/curiosity | reel, vlog | ✅ | brain/hooks.md "The 4 hook mistakes check"; write the verdict per option in plan.md | hooks.md |
| story | Open loop / small loops | reel, vlog | ✅ | reel: direction.banner · vlog: tease line / counter gfx | hooks.md |
| story | Interval twist | reel | ✅ | line order in the cut | craft.md |
| story | Cut warm-ups, retakes, re-explaining, fillers | reel, vlog | ✅ | removeRanges / segment in-out | principles.md |
| story | His story + a common problem | process | ✅ | VO script, present tense | hooks.md |
| story | Visual-first beats | reel, vlog, process | ✅ | content-brief.md §10 → seeds the visuals pass | scriptwriter skill (adapted) |
| story | 3-act spine, ~9 beats on real clips | vlog | ✅ | content-brief.md §10 | scriptwriter skill (adapted) |
| story | Series continuity | reel | ✅ | content-brief.md §5 + §10, series log in the planner | content-brief.md + scriptwriter skill |
| story | Private info on screens blurred | reel, vlog, process | ✅ | reel: direction.blurSecrets (auto sweep) / blurs · vlog: scripts/secretsweep.py on the piece → censor | AI-editing blueprint (Jason Cooperson) |
| story | Ending: loop or hard cut on the payoff, never a fade | reel, vlog, process | ✅ | last segment / last line | preferences.md |
| story | Honest claims | reel, vlog, process | ✅ | hook text, VO, name tags from people.json | preferences.md |
| story | Find active vs idle stretches in hours of footage | process, vlog | ✅ | cutfinder.py activity <clip> | process-videos.md |
| story | Final stage: his VO + captions, hook, sound, graphics | process | ✅ | timeline "voice" → npm run reel -- <output> with direction.keepTimeline | process-videos.md |
| cuts | Jump cuts to the best beats | vlog, process | ✅ | vlog: "jumps" + cutfinder.py beats · process: separate segments | craft.md |
| cuts | Speed ramp into a real-time moment | vlog, process | ✅ | "speed" + "rampTo" + "dur" | process-videos.md |
| cuts | Time-lapse only for slow progress | vlog, process | ✅ | "speed" / "dur" | preferences.md |
| cuts | J-cut / L-cut | vlog | ✅ | "jcut": s · "lcut": s | craft.md |
| cuts | Match cut | vlog, process | ✅ | cutfinder.py match → in point | craft.md |
| cuts | Cut on action | vlog, process | ✅ | cutfinder.py actions → in/out points | craft.md |
| cuts | Smash cut | reel, vlog | ✅ | vlog: "smash": s · reel: direction.beats | craft.md |
| cuts | Cross-cutting | vlog | ✅ | interleave segments | craft.md |
| cuts | Dissolve / dip to white | vlog, process | ✅ | "transition": {type: dissolve/white/black, d} | craft.md |
| cuts | No clipped words at cuts | reel | ✅ | automatic (cut-audit.json) → editplan check | AI-editing blueprint (Jason Cooperson) |
| cuts | Readable pace (shots ≳ 1 s) | reel, vlog, process | ✅ | checked automatically | preferences.md |
| captions | Caption look for this video | reel, vlog | ✅ | theme.captionStyle · vlog subs + word times | preferences.md |
| captions | Ghost-text captions: phrase builds line by line in light grey, words darken as spoken, key word big in the accent colour | reel | ✅ | direction.themeOverride.captionStyle = "ghost" (+ ghostInk "dark"/"light"; default dark ink on a light canvas.bg, white over footage). Phrases up to 8 words; the ONE key word per phrase = direction.emphasis (word index), drops in big in theme.accent on its own line. Pair with canvas mode + styleOverride.captions.top. src/layers/Captions.tsx Ghost | explainers.md (Varun Mayya reels) |
| captions | Hero words exaggerated | reel, vlog | ✅ | direction.emphasis · *word* in subs | edit-layers.md |
| captions | Hinglish, never translated | reel, vlog | ✅ | clip-N.words.json, hinglish.json | preferences.md |
| captions | The friends' real inside jokes | vlog | ✅ | ask him; pop / caps text | preferences.md |
| captions | Never the same text twice on screen | reel, vlog, process | ✅ | captions hide under cards | preferences.md |
| visuals | Show what he describes | reel, vlog, process | ✅ | chart / UI / image layers | preferences.md |
| visuals | Props on face/hands (crown, sunglasses, sweat, anger, ?, bulb, tears, hearts) | reel, vlog | ✅ | reel: direction.attach · vlog: gfx {type: "attach", what, near} | motion-graphics skill |
| visuals | Speech/thought bubbles, labels + arrows, sticky notes | reel, vlog | ✅ | reel: attach bubble/thought/label/note · vlog: gfx {type: "attach", what: bubble/thought/label/note, text, near} / arrow | motion-graphics skill |
| visuals | Find real pictures myself: logos, brands, places, objects, people, reaction GIFs | reel, vlog, process | ✅ | node scripts/findimg.mjs search <name> <id> "<words>" → look at the ONE sheet (prefer SVG / big sizes) → pick <name> <id> <n> --kind --tags (small ones are AI-upscaled to HD automatically) | skills.md |
| visuals | Meme GIFs / video memes by HIS attitude (moving only, sound: own or a Library sound by meaning) | reel, vlog | ✅ | direction.memes · vlog gfx sticker | preferences.md |
| visuals | Designed title: mixed fonts on the beat (heavy rise, script typed, brush highlight) | reel | ✅ | direction.titles [{kind: "words", lines: [[{word, text, font, enter, highlight}]]}] | pablo.md |
| visuals | Inverted stacked title (exclusion blend) | reel | ✅ | direction.titles [{kind: "stack", lines, words}] | pablo.md |
| visuals | Full-screen designed scene with a moving camera (mind-map, journey counter, steps on a path) | reel | ✅ | direction.scenes [{bg, cam, items}] (templates/Scene.tsx) | pablo.md |
| visuals | Picture of who/what he names rises in beside him (halftone dots option) | reel | ✅ | direction.photos [{at, media: {file}, from, dots}] | pablo.md |
| visuals | One metaphor object that evolves across every beat | reel, vlog | ✅ | brain/animation-system.md §2 (hero object) + direction.illos: the SAME item index returns with acts (fill, morph, travel, pop, fall) instead of new pictures | explainers.md (Varun Mayya reels) |
| visuals | Illustrated objects that act out his words (printer prints his bill, globe turns + pins drop, satellite orbits, bulb lights, coins stack, beaker fills, clock spins, stamp slams, any SVG) | reel, vlog | ✅ | direction.illos [{at, until/seconds, style: "full" (own canvas, bg) / "over" (floats over footage/canvas), palette, hideCaptions, items: [{obj: printer/globe/satellite/phone/laptop/bulb/coins/cash/beaker/clock/box/document/svg, word/s, x, y, size, text, title, lines, total, value, label, color, accent, src (svg), orbit {around, rx, ry, period}, pins [{word, lon, lat, label}], acts [{word, do, to, n, text, color}]}]}] (src/layers/Illos.tsx). Palette per video (RULE 1). Vlog: gfx {type: "insert", kind: "illo", items with s} | explainers.md (Anurag Bansal / Varun Mayya objects) |
| visuals | Animated chart from real numbers (bar grows + value counts, line draws itself + end label, pie cuts, pictogram row) | reel, vlog | ✅ | direction.charts [{at, seconds, type: "bar"/"line"/"pie", title, source, bg, color, accent, ink, style: "full"/"card" (x,y,w), prefix/suffix; bar: bars [{label, value, word (index it rises on), from (start value: equal bars then grow/shrink, counts down), to (range top: hatched band + 700–800 label), display?, hi?}], multiplier {text, from, to, word}; line: points [], xLabels, endLabel, area; pie: slices [{value, label}], cut, big "24%", bigLabel}]. Builds line → card → axes → data → tag (src/layers/Charts.tsx); full charts hide captions. Pictogram row not built yet | explainers.md (Anurag Bansal) |
| visuals | Storyboard as STATES: every noun = an object, every verb = a motion ON its word, each scene born from the last | reel, vlog | ✅ | plan.md table: time / words / object + state / motion / enter/leave; motion verbs from the dictionary in brain/animation-system.md §3 | animation-system.md (frame-by-frame study) |
| visuals | Object travels along a drawn path (road, arc, dotted trajectory) and lands on the last word | reel, vlog | ✅ | direction.illos item {obj: "route", points: [[x,y]…] (frame fractions; 2 points + bend = arc), line: road/dotted/line/trail (trail + follow: i grows behind a traveller)} + on any item act {word, do: "travel", route: i / path: [[x,y]…] / target: i (arc, bend), seconds, turn}; lands with a pop. Icons: coin, car, person, drop, bottle, jar (src/layers/Illos.tsx) | animation-system.md (luck road, beaker scoops) |
| visuals | Many small copies stream along paths into a target (opportunities/money/users flowing in) | reel, vlog | ✅ | direction.illos item {obj: "stream", of: coin/drop/person/…, ring: [x, y, r, n] or sources: [[x,y]…], into: item index, rate, speed} | animation-system.md (clovers to the centre) |
| visuals | Cycle/flywheel: a big wheel of nodes, the camera sees one, each step the whole wheel rotates | reel, vlog | ✅ | direction.boards {type: "wheel", items: [{word, text, sub}]}: the whole wheel rotates to the next node on its word (src/layers/Boards.tsx) | animation-system.md (WHOOP flywheel) |
| visuals | List where everything stays visible and a highlight slides to the current item (picture beside it swaps) | reel, vlog | ✅ | direction.boards {type: "list", layout: "split" (pills + swapping picture; stacks on tall frames) / "cards" (current card lifts), items: [{word, text, obj/img}]} | animation-system.md (WHOOP lists, chapter strip) |
| visuals | Process chain on sticky notes: a hand-drawn arrow draws itself, the next note slides in at its end, picture after | reel, vlog | ✅ | direction.boards {type: "chain", title, items: [{word, text, obj/img, via: "comes from"}]}: arrow draws, note slides in, picture after (column on tall frames) | animation-system.md (whey → milk → India) |
| visuals | Pile of real posts/tweets flying in from different sides, overlapping, camera drifts with the pile | reel, vlog | ✅ | direction.boards {type: "pile", items: [{word, name, handle, text, img?}]} (real posts only; blur private info) | animation-system.md (WHOOP tweets) |
| visuals | Everyday analogy first (flashlight), then it MORPHS into the real thing (satellite) in the same spot | reel, vlog | ✅ | direction.illos item act {word, do: "morph", into: "satellite", color?, text?}: the old object shrinks away as the new one pops in the same spot (flashlight icon exists) | animation-system.md (Starlink flashlight) |
| visuals | Crowd pictogram: a grid of tiny people/houses; the crowd spells the number; same icon in different amounts for A vs B | reel, vlog | ✅ | direction.illos item {obj: "crowd", n, grid, spell: "20 LAKH" (act spell), mark: k (act mark), act focus {index}} | animation-system.md (Starlink 20 LAKH, Jio vs Starlink) |
| visuals | One block splits into pieces that travel to each person (sharing, congestion), then focus on one person | reel, vlog | ✅ | direction.illos item {obj: "share", x, y, size, label: "100 Mbps", n, grid, each: "~6 Mbps each", acts: [{word, do: "split"}, {word, do: "focus", index}]} | animation-system.md (Starlink bandwidth) |
| visuals | Many items fly in an arc into one container and the small result appears (100 L of milk → 1 kg) | reel, vlog | ✅ | direction.illos item {obj: "swarm", of: bottle/coin/drop/person/any object, n, grid: [x,y,w,h], counter: {to, suffix}, into: item index (the container), result: "1 KG", acts: [{word, do: "pour"}]}: copies pop into the grid while the counter counts, then fly in arcs into the container (it pops), result lands under it | animation-system.md (protein bottles → tub) |
| visuals | Journey diagram: a signal/dot travels A → B → C, each leg adds a segment to a running-total bar | reel, vlog | ✅ | direction.illos item {obj: "journey", stops: [{x, y, label}], legs: [{from, to, value, label, dashed, color, word?}], bar: [x, y, w], result: "1,44,000 km", speed} | animation-system.md (Starlink 1,44,000 km) |
| visuals | Chapter cards 01/02/03 (promise at start, progress later) | vlog | ✅ | direction.boards {type: "chapters", mode: "strip" (current darkens, title types) / "flip" / "tumble", current, items: [{word, num, text, obj/img}]} | explainers.md (Anurag Bansal) |
| visuals | Breather text: key line in thin type over A-roll dimmed to near black | reel, vlog | ✅ | direction.breathers [{at, until, dim?, text?}]: his words from at..until light up one by one over the footage dimmed to ~86 % black; captions step aside | explainers.md (Anurag Bansal) |
| visuals | Source credit + highlighted line on article screenshots | reel, vlog | ✅ | direction.credits [{at, seconds, name, role, source}]: green name tag slides in bottom-left, "Source: …" bottom-right (above the reel safe zone on tall frames) | explainers.md |
| visuals | Article / website capture as a card: camera goes to ONE line, yellow marker sweeps it on his word | reel, vlog | ✅ | node scripts/capture.mjs <reel> <url> --find "exact sentence" → direction.evidence [{at, until, look: "page", page: "captures/<id>", mark: 0, zoomWord, markWord}] (src/layers/Evidence.tsx; source credit automatic, footage blurred behind). Several parts of ONE page = a tour: one --find per part + stops [{word, mark, markWord}] (fast scroll, slow arrival, mark each as he says it) | explainers.md (Anurag Bansal); his ask 2026-10-17 |
| visuals | A few seconds of another creator's / brand's video as proof, in a card with name tag + source | reel, vlog | ✅ | node scripts/refs.mjs clip <reel> <url> --from m:ss --to m:ss → direction.evidence [{at, until, look: "clip", clip: "clips/<id>", volume: 1}] | explainers.md (Anurag Bansal) |
| visuals | Brand logo as a sharp SVG that pops on its colour (svgl.app / simple-icons) | reel, vlog | ✅ | node scripts/logo.mjs <brand> → direction.evidence [{at, look: "logo", logo: "stickers/logo-<brand>/sticker.svg", title, brandBg: true}] or illos obj "svg" | howseen-ai/claude-motion-design svgl_logos.py (MIT) |
| visuals | Isometric 3D-look scene on a floating board (buildings rise, turbines spin, cars travel, camera orbits) | reel, vlog | ✅ | direction.iso (brain/iso.md): board + items [{obj, word, x, y, h, color, acts}], repeat for forests/crowds | iso.md (his isometric references, 2026-10-17) |
| visuals | Number counter | reel, vlog, process | ✅ | reel: direction.counters (style full/overlay) · vlog: gfx counter / {type: "insert", kind: "counter"} | motion-design.md |
| visuals | Before/after circle reveal | reel, process | ✅ | reel: direction.reveals (CircleReveal) | motion-design.md |
| visuals | Clips as cards on a stage (row, grid, stack, focus) | reel | ✅ | direction.stages (CardStage) | motion-design.md |
| visuals | UI mockups: chat, notifications, button + cursor | reel, vlog | ✅ | reel: direction.ui [{kind: chat/notify/cursor}] · vlog: gfx {type: "insert", kind: chat/notify/cursor} | expensive.md |
| visuals | Video meme, shown as card / half / full / zoom | reel, vlog | ✅ | reel: direction.memes {at, id: "vm-…", show} · vlog: gfx {type: "meme", clip, show} + sfx {clip} · brain/memes.md | brain/memes.md |
| visuals | BANNED 2026-10-15 (still-image meme): Meme card (captioned classic template) |  | ✅ | node scripts/memecard.mjs suggest/<template> → Library sticker.svg → attach image / gfx sticker | meme-maker skill |
| visuals | Text card: typewriter / wave / slam | reel | ✅ | direction.cards | expensive.md |
| visuals | Hero intros, name tags, hanging photos, map, stamps | vlog | ✅ | gfx hero / tag / hang / map / stamp | vlog.md |
| visuals | Real numbers on screen | reel, vlog | ✅ | counter / pop | preferences.md |
| visuals | Vector character in the footage | reel, vlog | ✅ | npm run char (character-overlay skill) | preferences.md |
| visuals | Vector illustration / icon | reel, vlog | ✅ | Library/stickers *.svg/png (assets.mjs) · reel: attach {what: "image", src} · vlog: gfx sticker / attach image | preferences.md |
| visuals | Title card: serif caps + glowing script word | reel | ✅ | direction.cards mode "title" + accentWord | expensive.md |
| layout | Canvas mode: canvas is the base, his footage one layer (card / circle / just him cut out), one camera over all | reel | ✅ | direction.canvas {bg, cam, footage, items} (brain/canvas.md) | canvas.md |
| layout | Face budget for explainers: face for trust + turning points, graphics for facts (YouTube ~30 % face, max ~12 s; reels: hook + 1 proof line) | reel, vlog | ✅ | brain/explainers.md "Face vs graphics": write the face/graphic map per line in plan.md (layout pass) | explainers.md (measured on youtube-vw4L5sbC7LY + 4 reels) |
| layout | Footage makes room (shrinks/moves, blurred fill) | reel | ✅ | direction.layouts {at, until, scale, x, y, fill: blur/color} | edit-layers.md |
| layout | card / split / rotate → full | vlog | ✅ | segment layout | vlog.md |
| layout | Floating practice cards over a running shot | process | ✅ | timeline cards | process-videos.md |
| layout | Instagram safe zones | reel | ✅ | positions | skills.md |
| connectors | Captions move aside for a visual | reel, vlog | ✅ | reel: direction.captionMoves {at, until, top} · vlog: auto off faces / capPos | edit-layers.md |
| connectors | Arrow / line from the hero word to its visual | reel, vlog | ✅ | reel: direction.connectors {from, to, label} · vlog: gfx arrow / insert connector | edit-layers.md |
| depth | Screen recording / page floating behind his head | reel | ✅ | direction.floats [{at, media, crop, behind: true}] | pablo.md |
| depth | Key word / title behind his head (any title) | reel | ✅ | direction.titles [... behind: true] (cut-out made automatically) | pablo.md |
| depth | Text behind him (magnetic mask) | reel | ✅ | hookBehind (personmask) | skills.md |
| depth | Objects/effects behind him | reel | ✅ | attach {behind: true} | edit-layers.md |
| depth | Person cut-outs (hero intros) | vlog | ✅ | scripts/herocut.py + gfx hero | vlog.md |
| motion | Intro zoom-out from tight, eyes locked; key-word push-in | reel | ✅ | direction.camera [{at, type: zoomout/keypush}] | pablo.md |
| motion | White light-leak between speaker and a full-screen scene | reel | ✅ | direction.leaks [wordIndex / {at, end: true}] | pablo.md |
| motion | Shape-morph bridge: the scene closes in on one object, it morphs into the next scene's object, the new scene opens out of it | reel | ✅ | direction.morphs [{at, from: {shape/d, x, y, size, color}, to: {...}, seconds}] → layers/Morph.tsx | cth9191/animate kit/morph.js (MIT) |
| motion | Springs by weight: snappy (labels, tags), container (cards, camera, charts), heavy (big type, bars, buildings), playful (pops) | reel | ✅ | src/motion/springs.ts (springAt / ease.<weight>), used by Charts, Illos, Iso | howseen-ai/claude-motion-design (MIT) |
| motion | Motion blur on fast full-screen graphics (sub-frames blended on a 180° shutter, like a film camera) | reel | ✅ | direction.motionBlur true / {kinds, samples (6; 8 for very fast exits), shutter}; --no-blur for quick drafts | howseen-ai/claude-motion-design (MIT), @remotion/motion-blur |
| motion | The whole scene shrinks into one dot/pin of the next, bigger world (or the camera pulls back from one place) | reel, vlog | ✅ | any insert: exit {type: "dot", x, y} (scene shrinks into a point) and the next one enter {type: "dot", x, y} (grows out of it); src/layers/Moves.tsx | animation-system.md (radar → globe, map zoom-out) |
| motion | Zoom-through: camera dives into one detail of the graphic (motion blur ~0.6 s) and lands on it as the next scene | reel, vlog | ✅ | any insert: exit {type: "dive", x, y} (camera dives into that point, blur) and the next enter {type: "dive", x, y} (lands from the dive); the scene colour stays still behind | explainers.md |
| motion | 3D card fly-in: blank card swings in with perspective, contents appear after | reel, vlog | ✅ | any insert: enter {type: "fly3d"} (perspective swing-in with overshoot); also whip-up/down/left/right and exit "sheet" (slides up revealing what is under) | explainers.md |
| motion | Draw-on / constructed reveal of a vector object (traced, filled like a clock wipe) | reel, vlog, process | ✅ | every direction.illos item draws on by default (enter "draw", build seconds); any SVG file too (obj "svg", src) | explainers.md |
| motion | Object acts out the line (snaps, falls with gravity, fills, breathes) | reel, vlog | ✅ | direction.illos item acts [{word, do: fall/shake/pop/out}] + per-object acts (print, tear, on, fill, spin, stamp, open, add, ping, signal). Snap-in-half not built | explainers.md |
| motion | Hook collapses into a card: light flash, full frame shrinks to a corner-badged card (~0.25 s) | reel | ✅ | canvas.footage key {at, x, y, w, shape: "round", dur: 0.25, flash: true, badge: "coin"/any Illos object}: hook → card with a pale flash and the hero object pinned on its corner | explainers.md |
| motion | Chapter cards tumble in, stack, straighten; others fly off leaving the current one | vlog | ✅ | direction.boards {type: "chapters", mode: "tumble"}: cards fall rotating into a pile, then straighten into a row | explainers.md |
| motion | Camera push on a new idea, punch on a hero word | reel, vlog, process | ✅ | reel: direction.sections · vlog/process: zoom/toZoom, gfx zoom | preferences.md |
| motion | Transitions only where the picture really changes | reel, vlog, process | ✅ | checked automatically | preferences.md |
| motion | Every element enters and leaves with motion | reel, vlog, process | ✅ | built into the layers | motion-design.md |
| motion | Scatter text | reel, vlog | ✅ | reel: direction.cards mode "scatter" · vlog: gfx {type: "insert", kind: "scatter"} | motion-design.md |
| motion | Light burst / glitch flash accent | reel, vlog | ✅ | reel: direction.bursts · vlog: gfx zoom flash / insert burst | motion-design.md |
| motion | Push-through / 3D tilted plane / layout morph / cascade | reel, vlog | ✅ | reel: direction.pushes / planes / stages (morphs) / ui notify (cascade, stack: true) · vlog: insert push / plane | motion-design.md |
| look | His original colours + grain (v1 look) | reel, vlog | ✅ | style.film / vlog look | color.md |
| look | Grade per clip, then one shared look | process, vlog | ✅ | process: exposure per segment | preferences.md |
| look | Scopes before any grade change | reel, vlog, process | ✅ | scripts/colorcheck.py | color.md |
| look | Orientation of every range | vlog, process | ✅ | contact sheets → rotate | preferences.md |
| look | Subject/background separation grade | reel | ⏸ parked: he chose the v1 look ("just perfect"); his rule is not to improve it unasked. Build only if he asks. | scripts/personmask.py (mask edge must be shrunk + feathered: the first try left a halo) | color.md |
| look | Skin balance: per-shot white balance anchored on his skin | reel | ✅ | styleOverride.film.skinBalance=true → scripts/skinbalance.py → segments[].wb | color.md |
| look | Film look adapted to the scene (contrast/colour/warmth/vignette/grain by their reasons) | reel | ✅ | scripts/lib/look.mjs (measureLook + adaptFilm); manual styleOverride.film wins | color.md |
| look | Auto grade with a trained model (Image-Adaptive 3D LUT): PARKED, lost to raw on his footage | reel, vlog, process | ❌ to build | .venv/bin/python scripts/autograde.py <video> <out.cube> [--strength 0.8] [--apply out.mp4] | color.md |
| sound | Music follows his voice: intensity per line (loud/high/fast vs his average) | reel, vlog | ✅ | .venv/bin/python scripts/voicefeel.py <name> + read the transcript for the words' emotion | sounds.md |
| sound | Music changes by story section (mood per part, cross-faded), never one bed | reel, vlog | ✅ | direction.music [{at, until, mood/id, from}] (brain/sounds.md); tracks are listened to by scripts/musicmood.py (moods, bpm, drop, energy) | sounds.md |
| sound | Sound by meaning | reel, vlog, process | ✅ | direction.memes tags / vlog sfx | sounds.md |
| sound | Soft whoosh for real movement, tick/click for text/UI | reel, vlog, process | ✅ | sfx | expensive.md |
| sound | Meme voices after the line, never over his words | reel, vlog | ✅ | memes / sfx (checked automatically) | preferences.md |
| sound | Music in beat-synced sections, out under conversations | vlog | ✅ | vlog music runs | vlog.md |
| sound | Tension / riser under a build-up | reel, vlog | ✅ | sfx tension-*, riser → impact | preferences.md |
| density | Something new every 2–3 s; one idea at a time | reel, vlog, process | ✅ | node scripts/editplan.mjs <name> check | preferences.md |
| viewer | Automatic frame review before he sees a version: contact sheet + measured checks (text cut off / overlapping / twice, something over his face, loudness, dead stretches) | reel, vlog, process | ✅ | scripts/lib/review.mjs (reel.mjs/vlog.mjs/process.mjs call it); rerun: node scripts/review.mjs <name> vN | cth9191/animate tools/review.mjs + textcheck.mjs (MIT) |
| viewer | Cover / thumbnail from the best frame | reel, vlog, process | ✅ | .venv/bin/python scripts/heroframe.py <video> <dir> (+ herocut.py for a thumbnail cut-out) | AI-editing blueprint (Jason Cooperson) |
| viewer | Posting kit: IG caption + YT title/description/tags, cover, audio note, credit, time | reel, vlog, process | ✅ | node scripts/postkit.mjs <name> → output/<name>/<name>-vN.post.md (brain/posting.md) | posting.md |
| viewer | YouTube upload in 4K | vlog | ✅ | node scripts/vlog.mjs <name> --yt4k | AI-editing blueprint (Jason Cooperson) |
