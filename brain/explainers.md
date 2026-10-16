# Explainer videos: what I learned from studied references (2026-10-16)

He wants to make design/brand explainers (YouTube, like Anurag Bansal's "decoding brands" series) and idea reels
(like Varun Mayya's motion-explainer reels). He shared 4 reels + 3 YouTube videos to learn from. The downloads and
study files (frames, transcripts, notes) are on the T7 in `references/library/` (`node scripts/refs.mjs list`).
**Learn the thinking, not the look.** These are starting points: each video gets its own metaphor, colours and devices
(RULE 1). Copying their exact visuals (the clover, the player card) would just make him a copy.

## Style A: idea reel on a designed canvas (Varun Mayya type, 24–46 s)

### What they do
- **The canvas is the base, footage is a card.** Flat light-grey "paper" (or one dark section), the speaker sits in a
  small rounded card (top third) or vanishes completely for long stretches. Text in the middle, the graphic below.
  This is our canvas mode (brain/canvas.md), pushed further: up to 70 % of the reel has no face at all.
- **Ghost-text captions.** The whole phrase is on screen early in very light grey; each word turns dark as it's spoken,
  and the ONE key word of the phrase drops in big in the accent colour ("three years", "opportunities", "China",
  "hire.", "smart", "convinced"). The reader sees where the sentence is going, which pulls them through it.
- **One metaphor, one visual system per reel.** Every beat is the SAME object evolving, not a new picture each time:
  luck = a clover → a radar of people around it → a globe with pins → a road the clover drives along → a game
  character's stat card where the "LUCK" bar fills → back to the clover, now surrounded by people with "you." in it.
  A business explainer used one system too: calendar → lock-screen notifications counting up → "pods" of avatars.
  That's why it feels designed and calm even at a fast pace: the viewer never has to decode a new picture.
- **One accent colour per reel** (green / purple / pink), everything else black, white and grey. The accent is used
  for the key word AND the graphic, so the eye links them.
- **Numbers move.** Counters (5 → 7 → 69, 60 → 100 clients), bars that fill, "+1,000 followers" chips popping in.
- **Simple flat vector UI built for the idea**, not screenshots: a calendar, a phone lock screen with notifications, a
  browser agent window on a blue gradient, a code/JSON window, a booking widget showing "no times available".
- **Hook = full-frame footage with a colour treatment** (green duotone) + bold text, then it collapses into the card
  layout at ~3 s. The big change in look at 3 s is the "pattern interrupt" that keeps people watching.
- **Section changes = a world change**: light → dark background with a whip/blur smear, for a new frame ("let's say
  you're a game character"). Transitions only between ideas, never inside one.
- **Podcast/interview clips as source**: cut tight to one thought, put in a card, small name tag, the rest is graphics.
- **Ending = the metaphor's payoff turned to the viewer** ("you." inside the clover), no fade, no outro.

### Story shape (all four reels)
claim in one line (hook) → why I believe it (personal proof: "over 3 years", "I tried it, it was sort of…") →
the metaphor, explained step by step with the visual growing each step → a concrete number (stat 5 → 7) →
the reframe that lands on the viewer. One idea per reel, 25–45 s.

### How I'd use it for him
- Explaining reels (tools, AI, design ideas, money/luck/mindset takes): use canvas mode + ghost-text captions + one
  invented metaphor system. Pass 0: before anything visual, pick the ONE object that can carry the whole idea and
  write how it changes per beat (a sketchbook filling, a phone storage bar, a plant growing…).
- Keep his face more than they do: his reels are personal stories, so the face is the trust. Card layout for the
  explaining middle, full frame for the emotional line and the hook.
- His captions stay Hinglish and his sizes stay as they are; ghost-text is a NEW caption style to offer, not a replacement.

## Style B: brand-decoding YouTube (Anurag Bansal type, 13–21 min)

### What they do
- **Cold open with the main characters, not with himself**: 15–20 s of real archival clips (a famous speech, an
  interview) that set up a conflict ("X vs Y", "why is Z getting so expensive?"), THEN him at the desk. The title is a
  question; the video is the answer.
- **The A-roll is a fixed, warm, branded set** (desk, mic, lamp, slatted wood). He's on screen roughly a third of the
  time; it's the "home base" the video returns to between evidence.
- **B-roll is EVIDENCE, changing every 2–4 s**: animated bar charts on a brand-coloured background (₹ values growing,
  a "3–4×" multiplier tag), line charts that draw themselves with a red end label (+70 %), product-page screenshots
  side by side with year labels and price tags, news headlines, other creators' clips with a name lower-third and a
  "Source:" credit, the brand's own ads, product shots, the logo on white.
- **Brand look borrowed per segment**: the chart takes the brand's colour (green for one company), the logo reveal uses
  the brand's typography. Each brand gets its own colour world inside the video.
- **Typography moments**: a big word-mark title with the product cut out in front of it ("CODA" with the pack between
  the letters); editorial serif quote cards on black for a key statement from an article.
- **Credit every source on screen** (small, corner). It makes the claims believable, and it's honest (our rule).
- **A series design system, not one-off graphics**: cream paper background with a subtle pattern, dark-green rounded
  cards, one condensed heavy font, photo cut-outs with soft shadows. Every graphic in every episode uses it, so the
  channel is recognisable from any frame. (For him: design ONE system for his series once, then every episode reuses it.)
- **Chapter cards** "01 02 03": all three shown at the start (the promise), then "02" alone at each chapter, and
  "01 | 03" near the end. The viewer always knows where they are in a 15-min video, which keeps them watching.
- **Explaining a process = a diagram that builds**: sticky-photo cards joined by arrows (whey → milk → country),
  "10 L milk → 1 kg cheese + 9 L whey" splits, a pie that cuts, a pictogram row (bottles vs cheese = supply > demand),
  a glass/beaker filling with %, real stock footage of the process in between.
- **Breather text**: the key sentence typed in thin white text over his A-roll dimmed to near black, or over dark
  stock. Used every ~1–2 min on the turning-point lines; it makes a line feel important without a cut.
- **Article screenshots with ONE line highlighted** (yellow marker sweep), never a whole page to read.
- **Sponsor/workflow segment** uses the same design system (round face cam on green, the script doc, a QR in the corner).
- **Rhythm**: his face ~30–40 % of the time, never more than ~20 s of face without a visual; the end is a lower-third
  subscribe bar, no outro.

### How I'd use it for him (design YouTube series)
- Script: question title → cold open on the conflict (real clips/pictures) → home base → 3–5 chapters, each ending
  on a mini-reveal → the answer → his take as a designer. Use the `write-script` skill; content-brief §10 for the spine.
- Every claim gets a visual: a chart (from real numbers), a screenshot, a clip with credit, or a built UI frame.
  Pictures/logos: `scripts/findimg.mjs`; anything missing is built, not skipped.
- As a designer he can go further than them: redesign moments (before/after of a logo, a grid overlay on a pack),
  which they don't do. That's his edge.

## Face vs graphics: when his face is on screen, and why (measured 2026-10-17)
Measured on youtube-vw4L5sbC7LY (Anurag Bansal, protein prices, 14 min; one still every 2 s, A-roll found by matching
the desk set) and the 4 Varun Mayya reels (Apple Vision face detection, 4 fps). **The face is the trust, graphics are
the facts.** Whenever he says a fact (number, name, place, product, a process step, a quote), the viewer sees it;
the face comes back only for what a picture can't carry: the question, the reaction, the opinion.

### YouTube explainer (Anurag Bansal)
- **Face 31 % of the video, + 5 % "breather" text over his dimmed face, graphics/B-roll 64 %.**
- **Face shots are short: median 4 s, longest 12 s.** Never more than ~12 s of face without a visual.
- **Graphic stretches are long: median 8 s, up to 40 s** (the price evidence at 0:22, the cheese → whey process at
  7:00, the "milk becomes paneer" demo at 10:26). A process or a chain of evidence stays in graphics until it's done.
- **Face share grows through the video**: 13 % in the first minute (cold open + price evidence), ~20 % while
  explaining how whey is made, 40–60 % in the last 3 minutes (his verdict, the future, the ending). Facts first,
  opinion last, so the face takes over as the video turns from "what" to "what I think".
- When the face is on, the context is always one of these:
  1. **Hook line** (0:00–0:05): the question in his own words, 4–6 s, then evidence by 0:06 at the latest.
  2. **Bridge / turn between two evidence blocks** (2–4 s): "but here's the thing", "so why…?". A short face shot
     is how the video changes topic; the graphics never change topic on their own.
  3. **Reaction after a big number** (4–8 s): after "100 L of milk → 1 kg protein" he's on screen saying what it means.
  4. **Opinion / reframe / verdict** (6–12 s): the chapters "India's struggle" and "the future" are mostly face.
  5. **Personal / trust moments**: the intro with his name tag, the sponsor read (47 % face there), the sign-off.
- **Breather text** = the rhetorical questions ("Why on earth is the protein that is made from milk getting so
  expensive?") typed in thin white over his A-roll dimmed to ~10 %. It is a third state between face and graphic:
  his voice and presence stay, but the line becomes the picture.
- Cuts from graphic back to face are plain hard cuts; the graphics are "evidence inserts" into a conversation.

### Reels (Varun Mayya)
- Face is on screen 10–18 s of 38–46 s in the idea reels (Ded5sx 24 %, Def2q 47 %), always in a SMALL card, never
  full frame after the hook. The podcast-clip reel (Dehka) keeps the face 87 % but in a card beside graphics.
- **Where the face is**: the hook claim (first 5–9 s: "all success is also luck", "the founder never sells his
  time") and ONE proof/reframe line later ("today I'm standing here with so many channels", "your job is a
  recruitment job"). Everything in between (the metaphor, the example, the numbers) is graphics only.
- The middle of an idea reel is face-free for 15–20 s: the metaphor carries it.

### Rules for his explainers (apply in the layout pass; mark FACE / GRAPHIC / BREATHER per line in plan.md)
- Before building visuals, label every line: FACT (a thing, number, name, place, process) → graphic; QUESTION /
  TURN → face 2–4 s or breather text; OPINION / FEELING / JOKE / PROOF → face.
- YouTube: aim for 30–40 % face (his personal edge: allow up to ~45 % in opinion-heavy videos), never > 12 s of face
  without a visual, front-load facts and let the face grow toward the end. Breather text every ~1–2 min.
- Reels: face for the hook claim and ONE proof/reframe line; the middle is graphics on the canvas. His reels are
  personal, so the face can stay a little more than Varun's (in a card), but the facts are never just his face.
- Every thing he names gets a drawn object (direction.illos) or a chart/picture; when he names the thing again
  later, the SAME object returns and acts (one visual system per video, see Style A).

## Animation vocabulary: how things MOVE (measured frame by frame at 10 fps, 2026-10-16)
The motion matters more than the look. Timings are from the references; use them as a feel, adapt per video.

### Text
- **Ghost → ink, word by word.** The phrase sits at ~15 % grey; each word goes dark in ~0.1 s exactly on its spoken
  time. The key word appears on its own line, big, in the accent colour, with a quick fade-up (≈0.15 s), no bounce.
- **Phrase exit = blur + drift up + fade together (≈0.2 s)**, and the next phrase starts on the very next frame. Never
  an empty screen between phrases.
- **Key word smear on a scene change**: the big word gets a vertical motion blur as the scene whips away.

### Objects (the metaphor)
- **Drawn on, not popped in.** The clover is constructed by a (photo cut-out) compass tracing it: ~0.8 s from line to
  full shape. Showing HOW a thing is made is more interesting than a fade.
- **Fill/progress as feedback**: an icon fills like a clock wipe (white → green, ~0.4 s) as the line says the key word.
- **Breathing rings**: concentric dashed rings scale out with a soft overshoot and settle (≈0.5 s) on an "increase" word.
- **Staggered pop-ins**: people icons appear one by one around the object (~0.05–0.1 s apart), a counter style for crowds.
- **Objects react to the meaning**: when he calls an idea stupid, the progress bar snaps, tilts and falls out of frame
  (gravity, ~0.8 s). The graphic acts out the line, it doesn't just illustrate it.
- **Counters roll**: 5 → 6 → 7 one step at a time, each new digit popping in slightly small then scaling to full
  (≈0.2 s per step); chart labels count up smoothly (₹0 → ₹700 over ~1.5 s, ease-out so it slows at the end), then a
  range ("₹700–800") resolves after.
- **UI acts like UI**: notifications slide down and stack, older ones push down and dim; a heart taps with burst lines;
  a cursor clicks; the calendar fills day by day with small avatars (~1.5 s for a month, staggered by row).

### Camera & transitions (between ideas only)
- **Collapse to card**: the full-frame hook flashes light (one frame of washed-out tint) then shrinks into a small
  rounded card in ~0.2–0.3 s; a little badge (the metaphor icon) is pinned on the card's corner.
- **3D card fly-in**: a blank white card swings in with perspective (rotated → flat in ~0.4 s), THEN its contents
  appear (~0.1 s later). Shape first, content second.
- **Zoom-through**: the camera dives into one detail of the current graphic (the luck number) with heavy motion blur
  (~0.6 s) and lands on that detail as the next scene. The next scene is "inside" the last one.
- **Whip with motion blur** (≈0.2–0.3 s), horizontal or vertical, to the next scene; the new elements slide in from
  the whip direction.
- **Light → dark world switch**: a soft black gradient wipes up from the bottom over ~0.2 s for a new frame of thinking.
- **Footage card swap**: the old clip blurs out as the new clip card fades in at the same spot (≈0.2 s), so the
  layout never jumps.

### YouTube (brand explainers)
- **Chart build order**: a thin line draws across (0.3 s) → it opens into the chart card (0.3 s) → axes and labels
  (0.5 s) → the bar rises while its value counts up (~1.5 s, ease-out) → the second bar → the multiplier tag pops last.
  One element at a time; the viewer reads each before the next appears.
- **Logo built from pieces**: the base word sets first, the brand's accent word and mark drop in after (~0.4 s each).
- **Grid assemble**: product cards slide in from the side one by one with a quick stagger (~0.1 s) until the grid is full.
- **Product + giant word**: the product cut-out tumbles in rotating and settles (~0.8 s); the huge brand word fades up
  BEHIND it (depth: product in front of the type).
- **Chapter cards as physical cards**: they fall/tumble in from the top with rotation, stack, then straighten into a
  row (~3 s); later the others fly away leaving only the current chapter. Playful physics on a serious video.
- **Diagram grows leftward with the story**: "1 kg" first, then "100 L →" slides in before it, then "10 kg" before
  that, each new object fading up from black (~0.4 s). The chain builds in the order he says it.
- **Cut back to A-roll is a plain hard cut** (no transition), which keeps the graphics feeling like "evidence inserts".

### What this means for our engine
Our motion (brain/motion-design.md) already has ease-out entrances, push-ins, counters, ui-mockup and card-stage.
Missing and worth building, in order of use: ghost-text captions, chart build (bar/line/pie with this build order),
zoom-through transition, 3D card fly-in, draw-on reveal for vector objects, object physics reactions (fall/snap),
stacked-notification UI, collapse-to-card hook transition, tumbling chapter cards.

## Gaps in our toolkit (not built yet, 2026-10-16)
- BUILT 2026-10-16: ghost-text captions (captionStyle "ghost") and animated charts (direction.charts: bar/line/pie);
  see brain/skills.md "Explainer kit". Still missing: pictogram row.
- Source credit + lower-third name tag for YouTube (vlog name tags exist; not a YouTube lower-third).
- Metaphor-system scenes: one vector object evolving across beats. Base BUILT 2026-10-17: direction.illos (drawn-on
  objects that act on his words: print, fill, stamp, orbit, fall…); a multi-state object library still grows per video.
- Chapter cards (01/02/03 progress), breather text over dimmed A-roll, article screenshot with a highlighter sweep,
  process diagrams (cards + arrows, splits, pie, pictograms) in one series design system.
Already have: canvas mode, counter, ui-mockup, card-stage, designed title, photo-rise, float-card.
