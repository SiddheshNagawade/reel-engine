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
| Reference library (download IG/YouTube videos to study) | `node scripts/refs.mjs add <url…> [--cookies chrome]` → T7 `references/library/<site>-<id>/` (video, info, transcript, stills, notes.md); `refs.mjs list` | he shares a reel/video to learn from; after watching, write what you learned into the right brain/ playbook | footage to edit (use the edit-video skill) |
| Isometric 3D-look scene | `direction.iso` → src/layers/Iso.tsx; spec in brain/iso.md (board + objects that rise/drop/travel, orbiting camera) | showing a place/system in 3D (city, factory, supply chain) | numbers alone (2D charts), emotions, 1–2 s beats |
| Toolbox (open-source code to reuse) | `node scripts/toolbox.mjs find <word>` / `list` / `fetch`; map in brain/toolbox.md; repos on T7 toolbox/repos | a moment needs something we haven't built: find a ready component/recipe, port it into src/layers/vendor/ with credit | copying AGPL/unlicensed code |
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
| Meme cards (BANNED 2026-10-15: still-image memes) | `node scripts/memecard.mjs suggest "<moment>"` → `node scripts/memecard.mjs <template> --text … --id … --tags …` (meme-maker skill, 20 classic templates; image cache on the T7) → Library sticker.svg | a choice / comparison / irony beat in his story | instead of his current Indian memes; more than ~1 per video |
| Two-pass loudness (automatic) | scripts/lib/media.mjs `measuredLoudnorm`: measure once, one steady gain (reels -14, VO -14, vlog natural sound -16 LUFS) | always (no pumping in pauses) | n/a |
| Cut audit (automatic) | every reel plan: 25 ms each side of every cut vs his voice level → `_work/<name>/cut-audit.json`, shown by `editplan check` | a flagged cut = widen the gap in removeRanges or keep the word | n/a |
| Secrets sweep | `.venv/bin/python scripts/secretsweep.py <video> [--from --to --rotate] --out f.json` (Apple Vision OCR: emails, UPI, phones, OTPs, cards, Aadhaar, keys, + never.txt) · reel `direction.blurSecrets: true` (auto) or `blurs` · vlog: run on the rendered piece → segment `censor` | any screen visible on camera, screen recordings | n/a |
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

## Music ears (2026-10-14)
- `.venv/bin/python scripts/musicmood.py [--only ids]`: listens to every Library music track with Essentia models
  (models/essentia, free/local) → moods, moodScores, bpm, drop, energy in the catalog. Run after adding music.
- `.venv/bin/python scripts/voicefeel.py <name>`: his voice intensity per line (loudness + pitch + speed vs his own average) → _work/<name>/voicefeel.json. Run in the sound pass.

## Posting kit (2026-10-14)
`node scripts/postkit.mjs <name> [vN]` prints the facts of a version (hook, spoken lines, length, music credits; reel renders
save them as `<name>-vN.post.json`) + the template; I write `<name>-vN.post.md` (IG caption, YT title/description/tags,
cover, audio note, time) following brain/posting.md. Upload stays manual (IG music picker; unreviewed YT API = private only).

## Skin balance (2026-10-14)
`.venv/bin/python scripts/skinbalance.py <video> <out.json> [every_s]` measures skin hue per moment and gives white-balance
gains; reel renders run it automatically and apply per-shot gains (brain/color.md "Skin balance"). Measure anything with it.

## Find pictures (2026-10-15)
`node scripts/findimg.mjs search <reel> <id> "<exact words>" [--src wiki,openverse,giphy] [--n 8]` → free APIs (no
scraping): Wikimedia Commons (logos/brands/places/people, often transparent PNG/SVG), Openverse (CC photos/illustrations),
GIPHY (reaction GIFs; free beta key in gitignored secrets.local.json, 100 calls/hour = 1 per search, plenty). Makes ONE numbered contact sheet
(_work/<reel>/finds/<id>.jpg): I look once and choose for the moment. `pick <reel> <id> <n> --kind sticker|image|gif
--tags "…" --what "…"` downloads the original into Library/wanted/<id>/ (about.txt: source, licence, credit) and runs
assets.mjs import (catalog tag `found`). Needs the T7. Search words: exact names + "logo"/"png"/"transparent" for things
that float; GIFs: the reaction ("facepalm", "shocked"). Prefer what's free to use; credit CC-BY images in the post text.
Doesn't replace him for current Indian memes and inside jokes.

## HD upscale (2026-10-15)
`node scripts/upscale.mjs <in> <out> [--anime]`: Real-ESRGAN (trained model, Mac GPU) for small pictures/GIFs, capped at
1080 px. realesrgan-x4plus for real people/photos (natural skin; ~8 s per frame, a 3 s GIF ≈ 6 min, done once per Library
item); --anime = realesr-animevideov3 (fast, but waxy on real faces: cartoons only). NOT automatic: he wants memes/GIFs exactly as they come
(2026-10-15); only for a picture he asks to sharpen. SVG logos are vector = already perfect. Library webms now keep up to 1080 px.
Models: models/esrgan/ (gitignored; github.com/xinntao/Real-ESRGAN releases, macos zip).

## Explainer kit: ghost captions + animated charts (2026-10-16, brain/explainers.md)
- **Ghost-text captions** (`captionStyle: "ghost"` via direction.themeOverride; `ghostInk` "dark"|"light", auto from
  canvas.bg): the whole phrase (≤ 8 words) sits in light grey, each word goes to full ink on its spoken time, the ONE
  key word (direction.emphasis) fades up big in the accent on its own line; lines (~18 chars) arrive one by one as
  they're reached (2026-10-17, measured on the references); the phrase leaves with blur + drift up.
  Use: calm explaining reels on a canvas. NOT for funny/hype reels (use bold-pop/bubble). Sizes derive from
  style.captions.size. Code: src/layers/Captions.tsx `Ghost`.
- **Animated charts** (`direction.charts`, src/layers/Charts.tsx): bar (each bar rises on its `word`, `from` = start
  value for equal-then-grow/shrink bars (counts down too), `to` = range top drawn as a hatched band; bars rise one by one, values count up ease-out,
  `display` range resolves after, multiplier tag + bracket pops last), line (draws itself, end dot + `endLabel`),
  pie (slice sweeps, the `cut` slice slides out, `big` number counts up). Build order: thin line → card opens → axes →
  data → tag. Colours per chart (brand world): bg, color, accent, ink. `style: "card"` floats over footage/canvas
  (x, y, w) and keeps captions; full boards hide captions. No box by default (`frame: "none"`): the chart lives on the canvas like stickers, flies in from below the frame and out through the top with motion blur; `frame: "box"` only when a card really helps (his verdict 2026-10-16: "no need to fit them in a box, whole frame is yours"). Move his footage card out of the way (canvas.footage) so it never overlaps. Use ONLY with real numbers + a `source`. Not for a single
  number (use counter). Sound: soft whoosh in, pop on the tag.

## Illustrated objects that act out his words (2026-10-17, src/layers/Illos.tsx)
`direction.illos [{at, until|seconds, style, bg, palette, hideCaptions, zoom, items: […]}]` → inserts kind 'illo'.
One insert = a small board of objects; each item starts at its own word (`word` / `s`), so they build in the order he
says them. Every object is DRAWN ON (outlines trace in part by part ~0.9 s, then the flat colours flood in), floats
gently, reacts on words (`acts`), and drifts up + blurs out at the end (or `out` / an `out` act).
- Objects: printer (`lines`, `total`; auto-prints line by line; `tear`), globe (`lon`, `spin`, `tilt`, real
  projected continents; `pins [{word, lon, lat, label}]`), satellite (`orbit {around: item index | [x,y], rx, ry,
  period, phase, tilt}` goes behind/in front of what it circles; `signal`), phone (`text`, `title`, auto `ping`),
  laptop (`text`, `lines` type in), bulb (auto `on`), coins (`value` count; `add {n}`), cash (`text`), beaker
  (`value` %, auto `fill`, `fill {to}`), clock (`spin {seconds, n}`), box (`open`, `text`), document (`text`,
  `lines`; `stamp {text, color}`), svg (`src`: ANY vector file, e.g. Library/illustrations/<name>/x.svg or an icon
  found online, drawn on the same way; `outline: false` drops the outline after the fill).
- Generic for all: `enter` draw|pop|drop|none, `build` s, `size` (0.5 = half the frame width), `x`, `y`, `rot`,
  `flip`, `color`, `accent`, `label` (tag under it), `idle` float|none, acts `pop`, `shake`, `fall` (gravity, "that
  idea died"), `out`.
- style "full" = its own canvas colour (`bg`) with a slow push-in; "over" = floats over the footage/canvas (keep
  off his face). Captions stay unless `hideCaptions`. Sounds are automatic (soft whoosh in; stamp = hit, bulb/pin/
  open = pop, ping/add = tick, fall = whoosh). Palette `{ink, paper, light, mid, dark, accent, blue, green, red, gold}`:
  choose it for THIS video (brand colours, the reel's accent), never just the default.
- Use: he names a thing the viewer should picture (bill, country, device, money, time, idea, a document). One idea
  per board, 1–3 objects. NOT for people (photos), not for real numbers alone (chart/counter), not for a joke
  (meme). New object needed → add it to OBJS in Illos.tsx (parts drawn with <D o={order}>), not a one-off.
- Demo: src/edits/zz-illo-demo.json (needs a dummy public/input/zz-illo-demo.mp4; stills via scripts/still.mjs).

## Animation system (2026-10-17, brain/animation-system.md)
The method for inventing visuals for ANY topic (frame-by-frame study of all 7 references): state change on a word,
hero object, noun → object / verb → motion dictionary, scenes born from the last one, timing. Read in the visuals and
motion briefings; storyboard table in plan.md (technique 'state-storyboard'). Shot-by-shot notes: T7
references/library/animation-study.md.

## Path-follow + many-into-one (2026-10-17, src/layers/Illos.tsx, brain/animation-system.md §3)
- **Travel**: `{obj: "route", points, bend, line: "road"|"dotted"|"line"|"trail", follow}` draws a path across the
  board; any item travels with an act `{word, do: "travel", route: i | path: [[x,y]…] | target: i, bend, seconds, turn}`
  and pops on landing (lands on the last word). Use for journeys, "drive luck your way", money/goods/data going A → B,
  a signal travelling (trail). Not for decoration: only when his sentence moves something.
- **Swarm into one**: `{obj: "swarm", of, n, grid, counter, into, result, acts: [{word, do: "pour"}]}` = many copies
  (bottles, coins, people) pop in with a counter, then pour in arcs into the container item, which pops; the result
  label lands ("100 L → 1 KG"). Use for concentration, effort → result, "it takes X to make Y".
- New icons for both: bottle, person, drop, coin, jar (label text), car.

## Animation batches 1–3 (2026-10-17): every studied animation is now buildable
Illos items (src/layers/Illos.tsx): `morph` act (analogy → real thing), `crowd` (people grid that spells a number / marks
a share / focuses one), `share` (block splits to people), `journey` (legs + running-total bar), `stream` (copies flow
into a target), `flashlight` icon. Boards (direction.boards → src/layers/Boards.tsx): list (split / cards), chain (sticky
notes), wheel (cycle), chapters (strip / flip / tumble), pile (posts). Moves (src/layers/Moves.tsx): any insert takes
`enter` / `exit` = dive · dot · fly3d · whip-up/down/left/right · sheet; direction.breathers (his line over dimmed
footage), direction.credits (name tag + source); canvas.footage keys take dur / flash / badge (collapse to card).
When to use each: brain/animation-system.md §3 (meaning → motion) and §5 (scene → scene). Never decoration: each one
only when his sentence says that thing.

## Shape-morph transition (direction.morphs → src/layers/Morph.tsx), 2026-10-17
From cth9191/animate kit/morph.js (MIT). The old scene closes into a window shaped like one object, the outline morphs
into the next scene's object on plain paper, the new scene opens out of it (default 1.2 s, `seconds` to change).
`{at: wordIndex, from: {shape: circle|square|star|spark|heart|drop|bubble|pin|phone|hex|diamond|triangle|cloud|bolt|coin
or d: "<svg path>", x, y, size (radius / frame width), color}, to: {...}, paper}`. Put x/y/size exactly on the object in
both scenes (check stills). Use where two objects MEAN the same thing (his face → the globe); not on every cut. Tested on
footage → illo globe → chart → footage. Captions stay above it.

## Spring presets by weight (src/motion/springs.ts), 2026-10-17
From howseen-ai/claude-motion-design (MIT): snappy 320/30 (labels, tags, markers), container 170/26 (cards, camera,
charts flying in), heavy 120/24 (big type, bars, buildings), playful 180/12 (pops, pins; the only bouncy one).
`springAt(seconds, weight)` or `interpolate(..., {easing: ease.heavy})`. Charts, Illos (pops) and Iso use them.

## Evidence kit for brand explainers (2026-10-17)
The proof behind a claim, shown the way brand-decoding YouTubers do (brain/explainers.md Style B). All data on the T7;
every tool refuses to run with the T7 unplugged (`--out <dir>` = a scratch test).
| Tool | How | Use when | Don't use when |
|---|---|---|---|
| Website / article capture | `node scripts/capture.mjs <reel> <url> --find "exact sentence" [--find …] [--mobile] [--seconds 8] [--library]` → `_work/<reel>/captures/<id>.jpg` (full page, 2× sharp) + `.json` (size + exact line boxes of each --find) + `.mp4` (smooth eased scroll). Remotion's own Chrome; cookie/sign-up pop-ups removed (never accepted); private info blurred into the picture (secretsweep.py --image) | a news line, a product page, a price, a policy: anything he quotes from the web | a page behind a login (his private accounts); a whole page "to read" (always ONE line) |
| Article card + highlighter | `direction.evidence [{at, until, look: "page", page: "captures/<id>", mark: 0 \| [0,1], zoomWord, markWord}]` → src/layers/Evidence.tsx: card flies in, browser bar with the site, camera goes from the top of the page to the line at READABLE size (glides along with the marker on long lines), yellow marker sweeps on markWord, "Source: <site>" bottom-right, footage blurred behind | his sentence quotes or summarises the article ("they renamed the company to Eternal") | more than one line per card; text too long to read in ~3 s |
| Brand logo (SVG) | `node scripts/logo.mjs <brand> [--dark] [--wordmark] [--slug x]` → svgl.app, else simple-icons (brand colour painted) → Library/stickers/logo-<brand>/sticker.svg. Show: `direction.evidence {look: "logo", logo: "stickers/logo-zomato/sticker.svg", title, bg, brandBg: true}` or illos obj "svg". Idea from howseen-ai/claude-motion-design svgl_logos.py (MIT) | he names a brand, a chapter about one company, a logo before/after | brands not in either set (findimg.mjs "<brand> logo svg") |
| Evidence clip from YouTube | `node scripts/refs.mjs clip <reel> <url> --from 1:23 --to 1:28 [--id x] [--cookies chrome]` → only those seconds (yt-dlp --download-sections) → `_work/<reel>/clips/<id>.mp4` + `.json` (title, channel). Show: `direction.evidence {look: "clip", clip: "clips/<id>", volume: 1, from?}`: video card + creator name tag + "Source: <channel> / YouTube" | a real quote, ad, interview or speech that proves the point (cold opens) | more than ~8 s of someone else's video; without the credit |
| Source credit only | `direction.credits [{at, seconds, name, role, source}]` (Moves.tsx) | over his footage / a chart / a picture whose facts come from somewhere | (evidence cards already carry their credit) |
