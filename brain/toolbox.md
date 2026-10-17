# Toolbox: everything I can make, and where the code for it already exists (2026-10-17)

His ask: "your brain should know what tools you have, so you never miss something you could have built". The
brain (rules, playbooks) decides WHAT a moment needs; this file says what can make it. Three levels per idea:
- **HAVE**: built in our engine, switched on from direction.json (see brain/skills.md for how to call it).
- **PORT**: working open-source code is on the T7 in `toolbox/repos/<repo>` (licence allows reuse). Copy the component
  into `src/layers/vendor/<name>.tsx`, adapt it to our props/timing, credit the repo at the top, then register it in
  scripts/lib/techniques.mjs (built: true) so it becomes HAVE. Most PORTs are Remotion components = same engine as ours.
- **IDEA**: a method/recipe in a repo (markdown) to read when building it ourselves.
Search fast: `node scripts/toolbox.mjs find <word>` (component names in every repo + lines of this file).
Rule: a moment needs X → check HAVE → PORT → IDEA → only then build from scratch. Never "we can't do that".

## Captions & text {captions,connectors}
- HAVE: caption styles in style.json/theme (glow-grad…, ghost captions = whole phrase grey → ink, key word big),
  hero words, scatter text, designed titles (pablo), inverted title, text behind him, typewriter/wave/slam text card.
- PORT remocn (MIT, `remocn/registry/remocn/`): 30+ caption styles: caption-karaoke, -highlight-box, -marker,
  -underline, -word-pop, -bounce-in, -blur-in, -stamp, -split-flap, -slot, -scramble, -redact, -typewriter,
  -handwrite, -teleprompter, -speaker, -prosody (size follows voice), -dim-progress, -knockout, -cube, -emoji.
- PORT remocn text effects: kinetic-center-build, kinetic-morph-text, per-character-rise, per-word-crossfade,
  word-push, word-stream, zoom-words, rolling-number, number-wheel, slot-machine-roll, value-swap, marker-highlight,
  ink-underline, scribble-circle, strikethrough-replace, inline-pill-takeover, inline-word-roll, handwrite,
  shadow-sweep-text, shimmer-sweep, gradient-scale-cut-text, outline-fill-track-text, type-wall, type-repeater,
  rgb-glitch-text, matrix-decode, ring-text, rush-type, tracking-in, top-down-letters, bottom-up-letters.
- PORT snapcn (MIT, `snapcn/registry/snap-cn/`): karaoke-captions, word-captions, punch-lines, text-swap, text-swell,
  text-rewrite, text-select, text-highlight, word-flip, word-gather, word-wheel, type-morph, font-shuffle.
- IDEA video-shotcraft (Apache-2.0, `video-shotcraft/references/shots/typography/`): 24 recipes (lead-word zoom
  assemble, marker-underline title, outline word fill, word relay, title demotes to label, typewriter document…).

## Visuals: charts, numbers, data {visuals}
- HAVE: direction.charts (bar/line/pie, built one element at a time, hatched ranges), counters, real numbers, 3D bars (iso).
- PORT remocn: animated-bar-chart, animated-line-chart, hand-count, rolling-number. snapcn: count-grid.
- IDEA shotcraft `data/`: before-after slider scrub, gauge readout, timeline travel, chart live moves.
- IDEA motion-skills pack list (iart-ai, MIT; the packs are separate repos, clone when needed): data-animation-skills,
  map-animation-skills (Vox-style editorial maps), explainer-video-skills, b-roll-skills (b-roll drawn from what is said).

## Visuals: objects, illustrations, 3D {visuals,depth}
- HAVE: direction.illos (printer, globe, satellite, bulb, coins, beaker, clock, stamp, document, any SVG drawn on,
  routes, swarms, travel), direction.iso (isometric 3D-look scenes), vector character in footage (npm run char),
  props stuck to face/hands, stickers, bubbles, labels (motion-graphics skill).
- PORT anatomy-figures (MIT, `anatomy-figures/dist`): 52 detailed isometric machine figures as React components
  (Turbofan, PowerStation, Forge, Reactor, Watch, Computer, GlassFurnace, Tokamak, Seasons, Dns, HashMap…), themeable
  (light, paper, blueprint, sepia, dark). Good for "how a machine/system works".
- IDEA anatomy (MIT): the skill that draws those: invent a physical thing whose working IS the concept, built from
  many small shaded parts. isokit (MIT): isometric boxes/faces/keys kit + skill (true 30° projection, SVG).
- PORT lottie (diffusionstudio, MIT): text-to-Lottie skill; plus @remotion/lottie can play any free LottieFiles
  animation (icons, characters, loaders) inside our videos.
- IDEA anything2explainer (custom licence, read `LICENSE` before copying code): primitives + lighting library for
  black-canvas explainers, chapter progress bar.

## Visuals: screens, UI, evidence {visuals,asks}
- HAVE: ui-mockup (chat, notifications, button + cursor), float-card (page behind his head), photo-rise,
  findimg.mjs (Wikimedia, Openverse, GIPHY), secrets blur, card-stage. Evidence kit (direction.evidence):
  website capture + scroll recording (capture.mjs), article card with a yellow marker on one line, Source credit, SVG
  logos (logo.mjs), other creators' YouTube clips with a name tag (refs.mjs clip).
- PORT snapcn: phone-frame, laptop-frame, screen-recording, capture-reveal, cursor-track, search-typing,
  prompt-send, prompt-zoom, answer-stream, answer-highlight, agent-steps, terminal-simulator, channel-thread,
  status-cycle, check-cycle, card-rail, orbit-gallery, moodboard-reveal, reel-collage, logo-assemble/-collapse/-drift.
- PORT remocn-ui (`remocn/registry/remocn-ui/`): 48 animated UI pieces (imessage/telegram chat flows, checkout,
  signup, onboarding stepper, command menu, toast, typing indicator, settings toggle). remocn: claude-chat, chat-gpt,
  claude-code, glass-code-block, live-code-compilation, search-reveal, simulated-cursor, x-follow-card, github-stars.
- IDEA claude-code-video-toolkit (MIT): playwright-recording skill (record a website demo), NarratorPiP,
  SplitScreen, PointingHand, LogoWatermark components (Remotion).

## Layout & camera {layout,motion}
- HAVE: canvas mode, make-room layouts, collapse to card, enter/exit moves on any insert (dive zoom-through, shrink to a dot, 3D fly-in, whips, sheet), camera push/punch, intro zoom-out, push-through,
  3D tilted plane, iso camera orbit.
- PORT remocn: canvas-presentation, infinite-bento-pan, stage, scene-motion, camera-lens, lens-zoom, focus-pull,
  focus-blur-resolve, perspective-marquee, path-ride, polaroid, paper-sticker, mondrian-split, echo-stack.
- IDEA shotcraft `camera/`: crash-zoom punch, cursor flyover, depth-layer moves, overhead moves, steep tilt glide,
  tension camera moves; `ui-entrance/`: card stack, 3D carousel, deck deal fly-in, page waterfall wall, list reveal.
- IDEA motion-video-kit (MIT) mechanism catalog: foreground fly-through, logo-as-portal, selection → expansion,
  materializing result, persistent rails, continuous canvas, artifact ring, card fan, perspective fold, exploded
  layers, wall → one actor, carousel emphasis (references/motion-grammar.md).

## Transitions {motion,cuts}
- HAVE: whip, tilt3d, zoomblur, white light-leak, push, blur; shape-morph transition (direction.morphs), motion blur on fast graphics (direction.motionBlur).
- PORT remocn: whip-pan, zoom-blur, wave-wipe, warp-dissolve, swirl-dissolve, smoke-dissolve, grain-dissolve,
  pixelate-region, page-turn, glitch-cut, push-through, shared-axis-y/-z, slide-swap, mask-reveal-up, tv-power-off,
  crumple-toss, fade-through, dither-dissolve, perlin-dissolve, particle-dissolve, ember-burn, ripple-zoom.
- PORT claude-code-video-toolkit `lib/transitions`: glitch, rgbSplit, zoomBlur, lightLeak, clockWipe, pixelate, checkerboard.
- IDEA shotcraft `transition/`: circle match iris, line-carry transition, card flip reveal, card flock tumble,
  tear streak, hidden cut, white-flash logo cut, mosaic reframe, transition travel.

## Backgrounds, effects, look {look,visuals}
- HAVE: film look (grain, glow, vignette), light burst/glitch flash, confetti-style effects, subject separation (not built).
- PORT remocn shaders (WebGL, check render cost first): mesh gradients (dusk, ember, ink, lagoon, mint, peach,
  synthwave…), grain gradients, liquid metal, god rays, light tunnel, smoke ring, water, caustics, voronoi; and
  confetti, speed-lines, radial-burst, volumetric-rays, vhs-filter, crt-screen, halftone-print, hologram,
  security-cam, fog-rise, chromatic-wave, grid-wave, sheen-slide-in.
- PORT claude-code-video-toolkit components: AnimatedBackground, FilmGrain, Vignette.

## Sound & music {sound}
- HAVE: Library sounds by meaning, music by mood, voice-feel, meme sounds, two-pass loudness.
- IDEA motion-video-kit scripts: sfx-candidates, solve-sfx-gains (balance every effect under the voice), soften-sfx,
  backtime-music (a track's own ending lands on the end), loudness check. claude-motion-design: SFX on measured peak,
  find the real drop by band energy. claude-code-video-toolkit tools: sfx.py, music_gen (ACE-Step, needs a cloud GPU).

## Checking quality {viewer,density}
- HAVE: cut audit (clipped words), colour scopes, density count, render gate, viewer pass.
- IDEA motion-video-kit: the "Gauntlet" (fresh critic on the actual render, item-by-item, ledger; critic prompts),
  frozen-time check (no still stretch > ~0.6 s), contact sheets. animate: review.mjs (text cut off/overlapping,
  loudness): HAVE as scripts/lib/review.mjs, runs after every render, read in Pass 10. claude-code-video-toolkit: tools/qc.py.

## AI generation (needs a cloud GPU or a paid API; only when nothing real fits, and say so)
- IDEA claude-code-video-toolkit tools: flux2 / ideogram4 (images), ltx2 (video clips), qwen3_tts (voice),
  upscale, dewatermark (only on footage he owns), sadtalker (talking photo). vox-explainer-skill: keyframes + AI
  animation pipeline. Prefer real pictures and code-drawn graphics; never pass AI images off as real.

## Whole-video workflows worth reading (methods, not code to run)
- video-shotcraft (Apache-2.0): 150 shot recipes + storyboard with recipe cards + beat sync + frame QA (Remotion).
- explainroo (MIT): narrated explainers, a camera that follows the narration.
- bang-motion (MIT): "one continuous world, a camera that moves, a subject that persists" + a concept menu so
  projects don't look the same.
- AIEV (MIT): Claude directs HyperFrames scenes + Remotion assembly from a dropped clip (closest to our own pipeline).
- animate, claude-motion-design, motion-video-kit, animation-principles: see brain/iso.md for what was taken.
- Not copied: OpenMontage (AGPL: code can't be mixed into ours), herk-edit-kit and remotion-bits (no licence).
