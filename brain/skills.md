# What ReelEngine can do, and when to use each skill

Pick by what the moment needs. Most reels need only 2–4 of these.

| Skill | How | Use when | Don't use when |
|---|---|---|---|
| Local Hinglish transcript (two-pass Whisper) | scripts/transcribe.py | always | n/a |
| Retake / filler / silence cutting | director + plan | always | keep natural pauses that carry emotion |
| Face tracking (Apple Vision) | scripts/facetrack.py | always for talking head: zooms grow from the face, camera follows the head | n/a |
| Camera push-in / pull-out | direction.sections → moves | new section/idea inside one continuous shot | as decoration on every line |
| Transitions (whip, zoom-blur, tilt, flash, light leak) | automatic at real clip changes | the picture actually changes (new clip, B-roll) | inside one continuous shot |
| Text BEHIND the person (Magnetic-Mask style) | scripts/personmask.py + hookBehind | hooks, big keywords, title moments: premium look | long durations (costs ~0.6s per frame to cut out) or when the head moves a lot |
| 3D hook keyword | hookText | frame 1 of every reel | n/a |
| Pinned open-loop headline | direction.banner | stories with a real reveal later | simple tips |
| Caption styles (6) | theme.captionStyle | always, style follows tone | n/a |
| Tracked props + stickers (motion graphics) | direction.attach + scripts/motiontrack.py, scripts/sticker.py; playbook .claude/skills/motion-graphics/SKILL.md | his emotion/idea/key point lands better visually: ? on confused, sweat on nervous, bulb on idea, note for key points, label to point at things, any object cut out as a sticker | as decoration; over a meme at the same moment; on his eyes/mouth (except glasses/tears/blush) |
| Meme stickers (transparent cats) | Library/stickers + direction.memes | HIS attitude at that moment clearly matches (huh on confused, sleepy on late night) | just because a keyword matches |
| Meme / comedy sounds | Library/sounds | reactions, landing a joke | over his words |
| Comedic beat (freeze + B&W + sound) | direction.beats | after a bad/useless line, for a laugh | serious moments |
| Rage (red burn + shake) | direction.effects type rage | clearly angry, raised voice | mild frustration |
| Film look (grain, grade, vignette, gate weave) | style.film | always (he loves it) | n/a |
| Clean ending (short tail, NO fade) | style.edit endTail (endFade stays 0) | always: hard cut on the payoff or loop into the hook | never fade to black at the end (his rule) |
| Text cards: typewriter / wave / slam | direction.cards [{at, seconds, text, mode, bg: white/black/accent/blur, accentWord, glow}] | a key line deserves its own moment; long-form B-roll replacement | stacked with memes/moves at the same moment; more than 1–2 per reel |
| Premium grade (S-curve, sharpen, halation) | style.film scurve / sharpen / halation (baked at extraction) | always subtle S-curve + sharpen; halation only on night/practical-light footage | halation on bright walls (turns pink) |
| UI/text sounds | sfx tick / click / soft-whoosh | every text/UI appearance | over his voice at full volume |
| Motion templates: CardStage / CircleReveal / NumberRoll | src/templates/* (see brain/motion-design.md; preview T7 references/templates-gallery.mp4) | showing several clips/stages, before/after, progress numbers; long-form + drawing videos | as decoration; more than one big motion idea every ~2s |
| Colour check (scopes) | scripts/colorcheck.py: clipping, cast, skin vs skin-tone line, skin chroma/brightness | before showing ANY grade change; compare to v1 targets in brain/color.md | judging colour by eye alone |
| Per-reel look tweaks | direction.json → styleOverride (merged over style.json, e.g. {film:{warmth:0.3}}) | an existing look is ~80% right for this video | changing defaults he loves (edit style.json only if he asks) |
| Process / time-lapse reel (no voice) | scripts/sheet.mjs + scripts/process.mjs + _work/<name>/timeline.json (see brain/process-videos.md) | drawing, unboxing, making-of footage; hours → 30–45s with variable speed, 9:16 framing, VO guide | talking-head footage (use npm run reel) |
| Floating cards (practice montage) | process.mjs timeline "cards": clip in a white rounded frame + shadow + tilt, slides across over a running background | showing extra work/practice without cutting away from the main shot | more than 2 at once; over the main subject's key moment |
| Clip mode (Whop clipping) | scripts/clip.mjs + scripts/subocr.py; playbook brain/clipping.md | cutting OTHER creators' 16:9 footage into 9:16 posts with original picture/audio, logo, title, captions | his own reels (use npm run reel / process.mjs) |
| Sound design by meaning | Library/sounds (387 from his pack, INDEX.md) + scripts/lib/sound-families.mjs; choose via brain/sounds.md; import new packs with scripts/sfx-scan.mjs + sfx-import.mjs | a moment's meaning matches (zone-out → glitch, gives up → Discord leave, idea → notify…) | over his words; two sounds at once; same sound as the last reel |
| Podcast clip pipeline (16:9 interview → 9:16) | yt-dlp sections + scripts/avsync.py + scripts/vcrop.py + npm run reel with REEL_VOICE_AF=anull; steps in brain/clipping.md | clipping podcasts / interviews / any landscape talking footage | his own vertical phone footage (use npm run reel directly) |
| Long-form vlog (YouTube 16:9) | scripts/vlog.mjs + _work/<name>/vlog.json (written by make_vlog.py); graphics src/vlog/VlogPiece.tsx; playbook brain/vlog.md | trip/day vlogs from many phone clips + photos: card / split / rotate→full layouts, stamps, chapters, route map, photo wall, name tags, ducked music, hand-written subtitles, YouTube chapters file | reels (npm run reel) or no-voice process videos (process.mjs) |
| Edit plan + render gate | `node scripts/editplan.mjs <name> init --kind reel/vlog/process` → `_work/<name>/plan.md`; `node scripts/editplan.mjs <name>` = status; the edit-video skill drives it | EVERY video: passes one at a time, final renders refuse until closed | `--no-plan` only for tests (logged in CHANGELOG) |
| Automatic checks + density walk | `node scripts/editplan.mjs <name> check [--edit vlog.json]` (lint.mjs) | pass 8 and before every render: fast-forward, emoji, repeated meme sounds, transitions inside a shot, short shots, end fades + every 6 s+ stretch with nothing new; errors block the render | n/a |
| Technique checklists | scripts/lib/techniques.mjs → a checklist per pass in every plan.md; `node scripts/editplan.mjs --coverage` → brain/coverage.md | every video: each technique he taught marked used / not used with a reason | adding a technique only in prose: add it to techniques.mjs |
| Vlog cut styles | vlog.json segment: `jumps` (+`jumpZoom`), `speed`+`rampTo`+`dur`, `jcut`, `lcut`, `transition` {dissolve/white/black, d}, `smash` (scripts/lib/vlog-cuts.mjs) | long or lively scenes: jump cuts to the best beats, ramps into real time, J/L at scene changes, dissolve for time passing, smash on punchlines | plain fast-forward (blocked); dissolves inside one shot (blocked) |
| Cut finder | `.venv/bin/python scripts/cutfinder.py beats|actions|match …` | best beats for jump cuts (movement + loudness), movement peaks for cut-on-action, matching frames for match cuts | n/a |
| His memes/GIFs → Library | `node scripts/assets.mjs request <name>` (wanted folders + search words for him) → `node scripts/assets.mjs import` | pass 9 checkpoint every video; picture → cut-out sticker.png, gif/video → sticker.webm (+sound), audio → sound.mp3, catalog tags | n/a |
| Graphics on a word (reel) | direction.json: `counters` [{at, values, label, prefix, suffix, style: full/overlay}], `reveals` [{at, before, after}], `stages` [{at, items, beats}], `ui` [{at, kind: chat/notify/cursor, …}], `connectors` [{at, from, to, label}], `bursts`, `planes` [{at, media}], `pushes` [{at, text/media}], cards mode `title` / `scatter`; media = {word: i} (his footage there) or {file} (staged for the render) | the moment says a number, a message, a website, a before/after, a list of options; every one gets a quiet UI sound | two at once; repeating the caption words |
| Footage makes room + captions move (reel) | direction.json `layouts` [{at, until, scale, x, y, fill: blur/color}] + `captionMoves` [{at, until, top}] | a visual needs space next to his face | over his eyes/mouth |
| Cold open (reel) | direction.json `coldOpen` {from, to} (word indices): that line plays first, flash, then the story | the strongest line is in the middle | when the opening already hooks |
| Props + inserts in vlogs | vlog gfx `{type: "attach", what, text, near: [x, y]}` (face boxes → anchors) and `{type: "insert", kind, …}` (same kinds as the reel) | friends' reactions, inside jokes, messages, scores in the vlog | on a person you can't name/see clearly |
| Process final stage | timeline `"voice"` + `npm run reel -- <output.mp4>` with direction `keepTimeline` | after he records the VO of a drawing video | before the picture is locked |
| Active/idle finder | `cutfinder.py activity <clip> [--min 20]` | hours of drawing footage | n/a |
| Script / story writing | `write-script` skill → brain/content-brief.md (5 beats for reels, §10: visual-first beats, 3-act spine for vlogs, two-part series continuity) | before he records; story lock of every edit | inventing facts he didn't report |
| Video memes (73, Library/clips) | reel `direction.memes: [{at, id: "vm-…", show: card/half/full/zoom}]` · vlog gfx `{type: "meme", clip, show}` + sfx `{clip}` · import more: `node scripts/memeclips.mjs <picks.json>` · playbook brain/memes.md | his attitude right after a line; slam/whoosh entry sounds added automatically | over his words; two reactions at once; same meme or mode twice in a row |
| Meme cards | `node scripts/memecard.mjs suggest "<moment>"` → `node scripts/memecard.mjs <template> --text … --id … --tags …` (meme-maker skill, 20 classic templates; image cache on the T7) → Library sticker.svg | a choice / comparison / irony beat in his story | instead of his current Indian memes; more than ~1 per video |
| Two-pass loudness (automatic) | scripts/lib/media.mjs `measuredLoudnorm`: measure once, one steady gain (reels -14, VO -14, vlog natural sound -16 LUFS) | always (no pumping in pauses) | n/a |
| Cut audit (automatic) | every reel plan: 25 ms each side of every cut vs his voice level → `_work/<name>/cut-audit.json`, shown by `editplan check` | a flagged cut = widen the gap in removeRanges or keep the word | n/a |
| Secrets sweep | `.venv/bin/python scripts/secrets.py <video> [--from --to --rotate] --out f.json` (Apple Vision OCR: emails, UPI, phones, OTPs, cards, Aadhaar, keys, + never.txt) · reel `direction.blurSecrets: true` (auto) or `blurs` · vlog: run on the rendered piece → segment `censor` | any screen visible on camera, screen recordings | n/a |
| Hero frame (cover / thumbnail) | `.venv/bin/python scripts/heroframe.py <video> <dir> [--n 4]` → hero-1.jpg… (sharp, eyes open, expression; blinks and blur never picked) | every post's cover; YouTube thumbnail base (+ herocut.py) | n/a |
| YouTube 4K upload | `node scripts/vlog.mjs <name> --yt4k` (3840×2160, 50 Mbps) | every YouTube upload | reels (Instagram is 1080×1920 anyway) |
| Final Cut project export | output/<reel>/<reel>-vN.fcpxml | by default, so he can tweak cuts in FCP | n/a |

## Legibility & framing checklist (learned from v2)
- Every sticker fully inside the frame: no cut-off heads. Corner stickers sit above his head; if there's no room → side peek away from the face.
- Text readable on a phone in under a second: caption words ≥ 60px on 1080-wide, high contrast + shadow, never over his eyes/mouth.
- Instagram UI covers roughly the top 8% and bottom 20% plus the right edge (buttons): keep key text out of those zones.
- Script/thin fonts only for the ONE emphasised word, big; body words in a bold sans.
- After rendering, check stills at every text/sticker moment before calling it done.

## Designed-reel kit (2026-10-14, brain/pablo.md)
- `direction.titles` kind words (mixed-font tokens with rise/type/blur/cut + brush highlight + bottom shade) and kind
  stack (inverted exclusion title) → src/layers/TitleText.tsx. `direction.scenes` → src/templates/Scene.tsx (bg radial/
  grid/blinds + vignette + edge grain, camera keys, items text/box/image/line/num/badge/counter/follow, living wobble).
  `transitions` type leakwhite. Sounds auto from plan.mjs designSounds. Times inside: {word: i} or {s: seconds}.
- Use: one designed hook / one scene / one inverted title where they help; NOT on every reel. Captions hide under them.

## Canvas mode (2026-10-14, brain/canvas.md)
- `direction.canvas` {bg, cam, footage keys (x, y, w, rot, shape, cut), items} → src/layers/Canvas.tsx: the canvas is the
  base, his footage one layer, one camera over all. cut: true = just him (person cut-out made by reel.mjs).
