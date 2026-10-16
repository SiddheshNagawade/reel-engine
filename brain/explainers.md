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

## Gaps in our toolkit (not built yet, 2026-10-16)
- Ghost-text captions (whole phrase light grey, words darken as spoken, key word big in accent).
- Animated charts: bar (grow + value counter + multiplier tag), line (self-drawing + end label), from real numbers.
- Source credit + lower-third name tag for YouTube (vlog name tags exist; not a YouTube lower-third).
- Metaphor-system scenes: one vector object evolving across beats (today: separate illustrations per beat).
- Chapter cards (01/02/03 progress), breather text over dimmed A-roll, article screenshot with a highlighter sweep,
  process diagrams (cards + arrows, splits, pie, pictograms) in one series design system.
Already have: canvas mode, counter, ui-mockup, card-stage, designed title, photo-rise, float-card.
