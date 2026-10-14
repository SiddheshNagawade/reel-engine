# Coverage: everything he taught → built? → where it's checked

Generated from scripts/lib/techniques.mjs (`node scripts/editplan.mjs --coverage`); edit that file, not this one.
Every technique appears as a checklist line in its pass of every plan.md and must be marked used / not used (with a
reason) before a render. Rules a computer can measure are also checked on the edit itself (scripts/lib/lint.mjs).

88 techniques · 87 built · 0 still to build · 1 parked on purpose (Subject/background separation grade)

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
| story | Private info on screens blurred | reel, vlog, process | ✅ | reel: direction.blurSecrets (auto sweep) / blurs · vlog: scripts/secrets.py on the piece → censor | AI-editing blueprint (Jason Cooperson) |
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
| captions | Hero words exaggerated | reel, vlog | ✅ | direction.emphasis · *word* in subs | edit-layers.md |
| captions | Hinglish, never translated | reel, vlog | ✅ | clip-N.words.json, hinglish.json | preferences.md |
| captions | The friends' real inside jokes | vlog | ✅ | ask him; pop / caps text | preferences.md |
| captions | Never the same text twice on screen | reel, vlog, process | ✅ | captions hide under cards | preferences.md |
| visuals | Show what he describes | reel, vlog, process | ✅ | chart / UI / image layers | preferences.md |
| visuals | Props on face/hands (crown, sunglasses, sweat, anger, ?, bulb, tears, hearts) | reel, vlog | ✅ | reel: direction.attach · vlog: gfx {type: "attach", what, near} | motion-graphics skill |
| visuals | Speech/thought bubbles, labels + arrows, sticky notes | reel, vlog | ✅ | reel: attach bubble/thought/label/note · vlog: gfx {type: "attach", what: bubble/thought/label/note, text, near} / arrow | motion-graphics skill |
| visuals | Meme stickers / GIFs by HIS attitude | reel, vlog | ✅ | direction.memes · vlog gfx sticker | preferences.md |
| visuals | Designed title: mixed fonts on the beat (heavy rise, script typed, brush highlight) | reel | ✅ | direction.titles [{kind: "words", lines: [[{word, text, font, enter, highlight}]]}] | pablo.md |
| visuals | Inverted stacked title (exclusion blend) | reel | ✅ | direction.titles [{kind: "stack", lines, words}] | pablo.md |
| visuals | Full-screen designed scene with a moving camera (mind-map, journey counter, steps on a path) | reel | ✅ | direction.scenes [{bg, cam, items}] (templates/Scene.tsx) | pablo.md |
| visuals | Picture of who/what he names rises in beside him (halftone dots option) | reel | ✅ | direction.photos [{at, media: {file}, from, dots}] | pablo.md |
| visuals | Number counter | reel, vlog, process | ✅ | reel: direction.counters (style full/overlay) · vlog: gfx counter / {type: "insert", kind: "counter"} | motion-design.md |
| visuals | Before/after circle reveal | reel, process | ✅ | reel: direction.reveals (CircleReveal) | motion-design.md |
| visuals | Clips as cards on a stage (row, grid, stack, focus) | reel | ✅ | direction.stages (CardStage) | motion-design.md |
| visuals | UI mockups: chat, notifications, button + cursor | reel, vlog | ✅ | reel: direction.ui [{kind: chat/notify/cursor}] · vlog: gfx {type: "insert", kind: chat/notify/cursor} | expensive.md |
| visuals | Video meme, shown as card / half / full / zoom | reel, vlog | ✅ | reel: direction.memes {at, id: "vm-…", show} · vlog: gfx {type: "meme", clip, show} + sfx {clip} · brain/memes.md | brain/memes.md |
| visuals | Meme card (captioned classic template) | reel, vlog | ✅ | node scripts/memecard.mjs suggest/<template> → Library sticker.svg → attach image / gfx sticker | meme-maker skill |
| visuals | Text card: typewriter / wave / slam | reel | ✅ | direction.cards | expensive.md |
| visuals | Hero intros, name tags, hanging photos, map, stamps | vlog | ✅ | gfx hero / tag / hang / map / stamp | vlog.md |
| visuals | Real numbers on screen | reel, vlog | ✅ | counter / pop | preferences.md |
| visuals | Vector character in the footage | reel, vlog | ✅ | npm run char (character-overlay skill) | preferences.md |
| visuals | Vector illustration / icon | reel, vlog | ✅ | Library/stickers *.svg/png (assets.mjs) · reel: attach {what: "image", src} · vlog: gfx sticker / attach image | preferences.md |
| visuals | Title card: serif caps + glowing script word | reel | ✅ | direction.cards mode "title" + accentWord | expensive.md |
| layout | Canvas mode: canvas is the base, his footage one layer (card / circle / just him cut out), one camera over all | reel | ✅ | direction.canvas {bg, cam, footage, items} (brain/canvas.md) | canvas.md |
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
| sound | Music follows his voice: intensity per line (loud/high/fast vs his average) | reel, vlog | ✅ | .venv/bin/python scripts/voicefeel.py <name> + read the transcript for the words' emotion | sounds.md |
| sound | Music changes by story section (mood per part, cross-faded), never one bed | reel, vlog | ✅ | direction.music [{at, until, mood/id, from}] (brain/sounds.md); tracks are listened to by scripts/musicmood.py (moods, bpm, drop, energy) | sounds.md |
| sound | Sound by meaning | reel, vlog, process | ✅ | direction.memes tags / vlog sfx | sounds.md |
| sound | Soft whoosh for real movement, tick/click for text/UI | reel, vlog, process | ✅ | sfx | expensive.md |
| sound | Meme voices after the line, never over his words | reel, vlog | ✅ | memes / sfx (checked automatically) | preferences.md |
| sound | Music in beat-synced sections, out under conversations | vlog | ✅ | vlog music runs | vlog.md |
| sound | Tension / riser under a build-up | reel, vlog | ✅ | sfx tension-*, riser → impact | preferences.md |
| density | Something new every 2–3 s; one idea at a time | reel, vlog, process | ✅ | node scripts/editplan.mjs <name> check | preferences.md |
| viewer | Cover / thumbnail from the best frame | reel, vlog, process | ✅ | .venv/bin/python scripts/heroframe.py <video> <dir> (+ herocut.py for a thumbnail cut-out) | AI-editing blueprint (Jason Cooperson) |
| viewer | Posting kit: IG caption + YT title/description/tags, cover, audio note, credit, time | reel, vlog, process | ✅ | node scripts/postkit.mjs <name> → output/<name>/<name>-vN.post.md (brain/posting.md) | posting.md |
| viewer | YouTube upload in 4K | vlog | ✅ | node scripts/vlog.mjs <name> --yt4k | AI-editing blueprint (Jason Cooperson) |
