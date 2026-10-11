# Editing layer by layer (his method, 2026-10-11). How I edit EVERY video of his

Why: I used to write one direction.json in a single go (cuts, hook, emphasis, memes all at once) and render. All the
decisions competed for attention, the easy ones (captions) won, and the layers that need real thought (graphics, layout,
depth, sound) never got their own moment. Result: "you just caption and leave everything".
His fix: work like a real editor's timeline. One layer per pass. In each pass, walk the whole video and ask for every
moment: is this needed here? is it too much? is there space? is it getting boring? Then the next layer.

These are passes and questions, not a template. Every video decides its own answers (RULE 1 in CLAUDE.md).

## Pass 0: story lock (before any layer)
- Cut, order, hook, ending (brain/hooks.md, craft.md). Timing must be locked first: every later layer hangs on it.
- Output: transcript with the final timing. Show him the cut/hook direction if it's a new kind of video.

## Pass 1: captions & typography
- One caption look per channel, kept consistent across his videos (decide once, save it, reuse; change only on purpose).
- Pick the HERO WORDS: the few words that carry the meaning (number, emotion, object, twist). Decide how each is
  exaggerated: font, size, colour, animation. Body words stay calm and readable.
- Output: caption style + hero-word list with their treatment.

## Pass 2: support visuals for the hero words
- For each hero word: does a visual make it land harder? What exactly? Vector/icon, animated chart, UI frame (phone,
  browser, chat, notification), number counter, real photo/b-roll, map, before/after, character.
- RULE: if he describes something visual, show it ("pie chart, 20% for this" → an animated pie chart).
- Mark each visual: fits over the shot, or NEEDS SPACE.
- If the asset doesn't exist, build it (SVG/vector in src/layers or src/templates), reusable, and add it to brain/skills.md.

## Pass 3: canvas & layout (the footage is a layer, not the canvas)
- The 1080×1920 canvas is the base. His footage is one layer on it that can shrink, move, tilt, go to a card, or split.
- When a visual needs space: animate the footage smaller/aside (eased, never a jump), fill the freed space (blurred or
  extended copy of the footage, a stage colour, a texture), place the visual, then animate back to full frame.
- Never cover his eyes/mouth. Keep Instagram's safe zones (top ~8%, bottom ~20%, right edge).

## Pass 4: caption placement & connectors
- Captions are not glued to one spot: when a visual takes the space, they move/scale aside with motion.
- Connectors: an arrow, curved or dotted line drawn (animated stroke) from the hero word in the caption to its visual.

## Pass 5: depth (things happening BEHIND him: magnetic mask)
- For story moments in the world behind him: a car driving past behind his head, a plane crashing, an explosion, big text
  behind his head. Person cut-out (scripts/personmask.py) on top of the effect.
- Costly (~0.6 s/frame) and the mask edge must be clean (no halo): save it for the moments that deserve it.

## Pass 6: motion & transitions
- Every element enters and leaves with motion (ease-out, blur-in, slight overshoot), never pops abruptly.
- Camera moves (push-in on a new idea, punch on a hero word); real transitions only where the picture really changes.
- Continuity: an object on screen can carry into the next layout instead of cutting (brain/motion-design.md).

## Pass 7: sound design
- His voice is always on top. Sounds follow motion, sparingly: something moves → soft whoosh/swoosh; fast slash-in →
  slash; whole frame changes → camera shutter/click; text/UI appears → tick/click; impact → hit; a joke/reaction → meme sound.
- Not every element gets a sound. Too many = noise. Level-matched below the voice, ducked if they overlap speech.
- Library (T7): Library/sounds has whooshes, camera shutters/clicks, cine impacts, risers, glitches, cartoon hits, meme sounds.

## Pass 8: density walk
- Go through the timeline in 2–3 s steps: is something new to see or hear? Too much at once? Boring stretch → add from any
  layer. Overloaded → remove. Restraint = one idea at a time, not zero ideas.

## Pass 9: viewer check
- Watch it through at 1x with sound like a stranger (hook in 1 s? would I keep watching at second 6?).
- Then stills at every layer event (hook, each visual, each layout change, ending).

## Keep the layers separate (editable like tracks)
- Each pass is its own part of the plan, so "change only the sounds" or "move that arrow" touches one layer and nothing else.

## What exists vs what still has to be built (2026-10-11)
- Exists: caption styles + emphasis words (Captions.tsx), hook text, text behind head (personmask), cards, CardStage (footage
  in cards on a stage), CircleReveal, NumberRoll, motion-graphics attach (props, bubbles, labels, notes), character overlay,
  big SFX library, camera push/punch moves.
- To build when the first video needs it: canvas layout keyframes for the main footage (shrink/move + blurred fill),
  caption position keyframes, word→visual connectors (animated arrows/curves/dotted lines), objects/effects behind the
  person (beyond text), a per-layer structure in direction.json.
