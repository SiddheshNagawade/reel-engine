# Animation system: how to invent the visuals for ANY topic (2026-10-17)

Learned frame by frame (10 frames per second, every animation) from the 4 Varun Mayya reels (luck, founder's time,
GPT spark, AI agents) and every animated graphic of the 3 Anurag Bansal videos (protein prices, WHOOP, Starlink vs
Ambani). The shot-by-shot notes (~190 lines, every timing) are on the T7: references/library/animation-study.md, and
the frame sheets I studied (10 frames per second, time-stamped) are in references/library/study-frames/ (open the
sheet for a moment before building that animation, so the build copies the real motion);
measured timings are also in brain/explainers.md "Animation vocabulary". This file is the METHOD: what they actually do, turned into steps I can follow for a topic nobody has
animated before.

His ask: "think in a way that how you can create things of your own for different new topics, that's the main system."
His fears: things that just appear and vanish; a graphic that sits still; several main things at once; boxes for no reason.

## 1. The one law: a picture changes STATE on a word
Nothing in the references is decoration. Every animation is a sentence being acted out: the noun is an object on
screen, the verb is what happens to it, and it happens ON the spoken word (not before, not "around").
- "bad stuff is luck" → a white clover pops. "all success is ALSO luck" → the same clover fills green.
- "if you increase your surface area" → rings grow out of the clover, one ring per beat.
- "these are all stupid ways of thinking" → the progress bar snaps in two and falls out of the frame.
- "they cut production" → the cheese wheel loses slices one by one, the butter block gets chopped.
- "8 out of 10 kg is imported" → scoops fly into a beaker, the counter steps 1…8, then an IMPORTED stamp slams on.
So a scene is never "a graphic for 4 seconds". It is a list of STATES, each one triggered by a word.

## 2. The method for a new topic (do this in plan.md, pass 2 + pass 6, before building anything)
1. **Label every line**: FACT (a thing, number, place, process, comparison) → graphic. TALK (opinion, joke, feeling,
   question to the viewer, a guest's reaction) → his face in a card / full frame, captions only. Never decorate talk:
   the AI-agents reel runs 20 s with no graphic because it's a conversation.
2. **Find the hero object** = the whole idea as ONE physical thing. Ask: "if this idea were an object on a table, what
   would it be?" luck → a clover; selling time → a booking calendar; a team for each client → a "pod" pill of avatars;
   protein supply → a measuring beaker; a brand's flywheel → a wheel. It appears early (often in the hook), comes back
   in new states, and is the LAST image (clover with "you." inside it, the pod pill flying to the centre).
   **Abstract or technical idea? Start from an everyday object, then MORPH it into the real thing**: satellite coverage
   = a flashlight whose spot widens as it rises, which then turns into the satellite in the same spot (Starlink).
   **Show the PROBLEM as a picture before the solution fills it**: two coverage spots with a "Gap" label, then a third
   satellite slides in and closes it.
3. **Noun → object, verb → motion**: underline every noun and verb. Each noun gets a drawn object/icon/UI frame; each
   verb gets a motion verb from the dictionary below. If a verb has no entry, act it out literally (engineer → drawn
   with a compass; drive → travels along a road; import → a stamp).
4. **Decide how each scene is BORN from the previous one** (section 5). No scene starts from nothing: it grows out of,
   zooms into, shrinks into, or morphs from what was on screen.
5. **Write the storyboard as a table** in plan.md: `time | his words | object + state | motion | how it enters/leaves`.
   One row per state change. If two rows happen at once with two different objects, cut one (one main element).
6. **Build** with what exists (Illos objects, charts, counters, UI mockups, canvas camera, ghost captions); anything
   missing gets built as a reusable layer (CLAUDE.md "Freedom to create") and added to this dictionary.

## 3. Motion dictionary: what the word MEANS → how it moves (all seen in the references)
| meaning in his sentence | motion |
|---|---|
| appears, introduces a thing | DRAWN ON (outline traces, colour floods in) or shape first then content; never just a fade |
| grows, increases, more | rings expand with a slight overshoot; bar rises while its number counts; blocks fill one by one; a stack grows |
| more people / popular / buzz | icons pop in around the object one by one, then more rings of them (density multiplies); real tweets fly in and pile up overlapping |
| spreads, global, expands to | the whole scene shrinks into ONE dot on a globe/map; pins pop one by one; the camera pulls back from one country while more fill in |
| comes to you, flows, earns | many small copies of the hero object stream inward along paths to the centre / to the person |
| travels, drives, journey | the object follows a drawn path (road, arc, dotted trajectory) and lands exactly on the last word |
| adds up, fills, accumulates | items fly in on an arc and each landing raises a level; the number beside it steps once per landing |
| reduces, cuts, loses | pieces disappear one by one (slices, chunks); a bar SHRINKS while its counter counts DOWN; arrow with "-25%" draws |
| compare, then vs now | two things side by side starting EQUAL, then one changes; one number tag each; years as labels on top |
| range, roughly, uncertain | the number resolves into a range after the count; a hatched band on top of the bar |
| filters, high bar, selective | a line rises through a group; everything it passes goes pale, only the best stay coloured |
| wrong, stupid, dead idea | the object snaps, tilts and falls out of the frame with gravity; a strike-through draws across a word |
| waiting, slow, time passes | a loading bar fills slowly with a spinner; a calendar fills day by day; clock hands spin |
| full, busy, no time | a day calendar fills with meetings sliding in one per word; time slots grey out one by one in a wave; "No times available" pops |
| official, verdict, origin | a rubber stamp slams (huge and faint → small and sharp, tilted) |
| it does things (AI, apps) | the UI WORKS: cursor moves and clicks, text types letter by letter, a checkbox ticks |
| evidence, a quote, a source | the source text as clean type on black; a highlighter sweeps ONLY the key phrase, word by word as he reads it |
| process, comes from, chain | sticky notes in a row; a hand-drawn arrow draws itself, the next note slides in at its end, its picture after |
| cycle, loop, flywheel | a big wheel of nodes; the camera sees one node; each step the WHOLE WHEEL ROTATES to the next |
| list of reasons / chapters | all items visible; the current one lifts / darkens / gets the sliding highlight, the picture beside it swaps |
| a number that matters | it counts (ease-out: fast then crawling, 1.2–2 s); a NEW count step pops slightly small then full |
| achievement, reached it | a dashed sparkle ring bursts around the number; a flag pops at the end of a bar |
| focus on one part | that part gets an outline highlight / lifts; the rest stays but goes quiet. The camera dives INTO it for the next scene |
| payoff, the twist | text appears INSIDE the hero object ("you."), the object scales up; or the old line dims and the new one shines |
| concentrated, X becomes Y | many items (100 bottles) fly in an arc INTO one container, the small result appears ("100 L → 1 kg") |
| shared, divided, congestion | one block SPLITS into pieces that travel to each person; more people = smaller crumbs; then focus on one person |
| how many / a crowd number | a grid of tiny people/houses; the crowd itself SPELLS the number (dots turn accent); same icon, different amounts for A vs B |
| tiny vs huge (ratio) | both on ONE line/bar: the big one runs full width, the small one is a sliver, a bracket says "<1%" |
| distance, it travels far | a line draws A → B with a leader-line label; a dot travels it leaving a trail; each leg adds a segment to a running-total bar |
| share of a whole | a donut ring fills to the %; or the REAL object is the pie (a cheese wheel loses its wedge) |
| money's value changes | a stack of notes grows/shrinks while the number counts; coins row; a % tag pops |
| a power game, rivals | the brands become game pieces (chess); one knocks the other off the board |
| old times, history | taped black-and-white photos pile up on paper, a typewriter caption types under them |
| how it's made, technical | a thin technical drawing draws itself line by line on a desk of documents |
| a title / chapter | the story's object morphs into a letter of the title (a milk drop → ₹ → the R of "P₹OTEIN") |
| a brand / name | the logo BUILT from its pieces in the brand's own way (word, then the accent word writes itself, then the mark) |
| a product | the product cut-out tumbles in and settles; its giant name fades up BEHIND it (product in front of type) |

## 4. How things enter, live and leave (every element, every time)
- **Enter**: shape first, content second (blank card swings in, THEN its content; empty pill, THEN avatars). Pop from
  zero with a stagger (0.03 s for slots, 0.05–0.1 s for icons, 0.1–0.2 s for pins/tweets). Lines DRAW. Objects tumble
  in with physics or rise from a frame edge with overshoot. A text line fades up 0.1–0.15 s, no bounce.
- **Live**: nothing is frozen. The globe keeps spinning, opportunities keep streaming, notifications keep cascading,
  the hero object breathes (float). A finished chart HOLDS 2–3 s, but something small still moves (a spinner, a drift).
- **React**: when a new word lands, the EXISTING object answers (fills, cracks, gets a badge, a row lights up), instead
  of a new object arriving. New objects only when a new noun arrives.
- **Leave**: through a frame edge with motion blur (whip up/down/left), falling with gravity, blur + drift up (text),
  or by turning into the next scene (section 5). Hard cuts are kept for going back to the A-roll face.

## 5. Scene-to-scene: the next scene is born from the last one (pick per moment, never the same one twice in a row)
- **Shrink into a dot**: the whole radar becomes a pin on a globe (zoom-out = "bigger world").
- **Dive into a detail**: the camera zooms into the LUCK number and lands on it as the next scene (zoom-through).
- **Morph**: the stat bar shrinks while the clover grows from its place; a card changes shape between clips.
- **Portal**: a placeholder avatar circle fills with his real footage and opens to full frame (iris).
- **Collapse to card**: the full-frame hook flashes pale for a frame and shrinks into a rounded card; its colour grade
  becomes the canvas colour; the hero object travels to the card's corner as a badge.
- **Sheet slide**: light page slides up and away revealing the dark world (new frame of thinking), and back.
- **Whip**: everything smears in one direction (0.2 s); the new scene's elements arrive from that side.
- **Replicate**: one finished unit shrinks to a corner and copies of it fill the grid (one pod → four clients).
- **Analogy morph**: the everyday object is swapped for the real one in the same place with the same effect (flashlight → satellite).
- **Match cut footage → illustration**: real cheese footage cross-fades into an illustrated cheese wheel at the same spot.
- **Zoom out to the truth / zoom in to the simple**: the flat ground bends into Earth's curve as the camera pulls back; later dives back to the surface.
- **Into a photo**: the camera pushes into one picture of a pinned set until it becomes the next scene.
- **Wash**: a 0.2 s light flash between two charts/boards of the same kind.

## 6. Timing (from the frames)
- Every state change sits on its WORD (real word times from clip-N.words.json). Charts wait for the next sentence.
- Counters 1.2–2 s ease-out; ranges resolve 0.7 s after; tags/annotations pop last (~0.25 s, slight overshoot).
- Staggers: UI slots 0.03 s · icons 0.05–0.1 s · pins/tweets/cards 0.1–0.5 s · list items on their words.
- Transitions 0.2–0.3 s (whip, collapse, sheet); zoom-through ~0.6 s; draw-on ~0.8–0.9 s.
- After a completed graphic: hold 2–3 s or cut to his face for the reaction; never leave an empty screen.

## 7. One main element (his rule, 2026-10-16)
One hero on screen at a time; everything else supports it (a small badge, a caption, a quiet ring). When a chart or
object is the point, his footage leaves (it wipes away or becomes a small card in a corner); when HE is the point,
graphics step out. If the storyboard row has two main things, split it into two beats.

## 8. A worked example for a new topic (so I can do it without a reference)
Topic: "Why my design client paid ₹40,000 for a logo that took 2 hours."
- Hero object: a **price tag** (the idea = what is design worth). Labels: FACT lines → graphics, opinion → face card.
- "2 hours" → a clock draws on, its hands spin 2 turns fast (time passes) and stop. "₹40,000" → the price tag drops
  from the top and swings on its string, the number counts up and resolves.
- "but it took me 8 years to learn that" → the camera dives into the tag's hole and lands on a timeline: 8 ticks pop
  one per beat (like "three years"), each tick a tiny sketchbook icon stacking higher (accumulates).
- "they're not paying for 2 hours" → the clock gets a strike-through and falls out of the frame (wrong idea).
- "they're paying for the 8 years" → the timeline shrinks back INTO the price tag, which turns the accent colour.
- Ending: his line "price the years, not the hours" with the tag swinging gently = the last image is the hero object.
Every row = noun → object, verb → motion, born from the previous scene. That's the system.

## 9. What our engine has (all of §3 and §5 is built, 2026-10-17)
Illos objects (printer, globe, satellite, phone, laptop, bulb, coins, cash, beaker, clock, box, document, bottle, person,
drop, coin, jar, car, flashlight + any SVG drawn on) with acts (print, fill, stamp, orbit, pins, fall, shake, travel,
morph, pop) and board items (route, swarm, crowd, share, journey, stream); boards (list, chain, wheel, chapters, pile);
charts (bar/line/pie, word-timed, ranges, shrink); counters; UI mockups; ghost captions; moves on any insert (dive,
dot, fly3d, whips, sheet); breathers; credits; collapse to card (canvas footage keys). How to call each: brain/skills.md.
Still worth adding when a video needs it: real 3D (brain/iso.md has the isometric 3D look), maps of specific countries
(only the world globe exists), and hand-drawn marker annotations on charts.
