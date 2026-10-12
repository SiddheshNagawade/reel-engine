---
name: edit-video
description: The step-by-step way to edit ANY video of Siddhesh's (talking-head reel, vlog, drawing/process video), from footage to finished version. Use whenever he says "edit the new video", "edit this", "make the vlog", "v2/v3", "continue the edit", or gives footage to turn into a reel or vlog. Runs the editing passes one at a time in _work/<name>/plan.md, with two checkpoints where you ask him (hook choice, and memes/GIFs/pictures he can find for you). Final renders refuse to run until the plan is finished.
---

# Edit a video, step by step

Why this exists (his words, 2026-10-12): "it should be one by one, step by step, so that you don't miss anything."
The Chandigarh vlog was decided in one go: it got 37 pop texts and 18 hanging photos, but 7 meme stickers in 11 minutes,
no vector illustrations, no props or bubbles, and 66% of it sat in 6 s+ stretches where nothing new was added. Nobody
asked him for a single meme. This skill is the fix: **one pass at a time, written down, checked by code.**

Read before starting: `brain/preferences.md` (his verdicts, newest at the bottom), `brain/edit-layers.md` (the passes),
and the playbook for the kind of video (`brain/vlog.md`, `brain/process-videos.md`, `brain/hooks.md`).

## Step 0: set up and tell him the route
1. Find the footage (CLAUDE.md "When he says edit the new video"). Decide the kind: `reel` · `vlog` · `process`.
2. `node scripts/editplan.mjs <name> init --kind <kind>` → `_work/<name>/plan.md`, one section per pass.
3. Tell him in 3–5 lines: the steps ahead, where you'll stop to ask him (the 2 checkpoints), and an honest time
   estimate for each render. Never vanish for hours.

## Step 1: watch and understand (no decisions yet)
- reel: `npm run reel -- "<path>" --no-render` → read `_work/<name>/transcript.md`; fix Hinglish in `clip-N.words.json`.
- vlog: catalogue, contact sheets of every clip, transcribe only the talk (brain/vlog.md "Process that works").
- process: contact sheets (`scripts/sheet.mjs`), orientation check on every range (brain/process-videos.md).

## Step 2: pass 0, story lock → CHECKPOINT 1 (ask him)
Cut, order, hook, ending. Give him 3–4 hook options (English text + what the first 3 s look like) and the cut direction.
Use AskUserQuestion, or `show_design_options` (design-picker mod) when the choice is visual. Write his pick into the
plan, close the pass with `Status: done`.

## Step 2b: cut style per scene (pass "cuts")
Chandigarh had 19 scenes (206 of 612 s) simply played 1.5–2.8× faster. Never again: each long scene gets a chosen
cut style with a reason (jump cuts to the best beats at real speed is the default for action). The density command
flags plain fast-forward. Missing in the vlog engine (build on the next vlog): `jumps` (several in/out ranges of one
clip with alternating punch-in), `rampTo` (exists in process.mjs), J/L-cut audio lead at scene changes.

## Step 3: passes 1–8, ONE AT A TIME
For each pass, in order:
1. Re-read that pass's question in plan.md.
2. Walk the WHOLE timeline for that one layer only. Write bullets under the pass: `time / beat → what → why`.
3. Close it: `Status: done`, or `Status: none: <real reason>`. Then `node scripts/editplan.mjs <name>` shows the next one.
4. Only then start the next pass. Never fill several passes in one go: that is exactly how layers got skipped.

### Pass 2 (support visuals) is where the edit is made: think like a motion designer
For every beat ask: what does the viewer SEE besides the footage? At least 3 ideas, usually far more (vlog: several a
minute). Reach across the whole toolbox, not only text:
- **Reel** (`direction.json`): `attach` = props on face/hands (sunglasses, crown, sweat, anger mark, ?, bulb, tears,
  hearts), speech/thought bubbles, labels + arrows, sticky notes, any object as a cut-out sticker
  (`.claude/skills/motion-graphics/SKILL.md`); `memes` (stickers + sounds), `cards` (typewriter/wave/slam), `banner`,
  `hookBehind` (text behind him), CardStage / CircleReveal / NumberRoll (`src/templates`), character overlay
  (`.claude/skills/character-overlay/SKILL.md`).
- **Vlog** (`vlog.json` gfx): sticker (memes, his imported PNG/GIF too), pop, hang (photos), hero intro, counter, arrow,
  circle, tag/name, map, stamp, chapter, zoom (punch + flash), censor.
- **Missing?** Vector illustrations, props or bubbles in the vlog, an animated chart, a UI frame: BUILD it as a reusable
  layer (CLAUDE.md "Freedom to create": component + data field + brain/skills.md row). "We don't have it" is never the
  reason to leave a beat empty.
- **Needs an asset the Library lacks** (an expression meme, a reaction GIF, a logo, a photo) → it goes in the Asset
  requests table (pass 9), with the beat it's for.

### Pass 8: density walk
Vlog: `node scripts/editplan.mjs <name> density` lists every stretch over 6 s with no new graphic/sticker/sound.
Fill each one from any layer, or write why that stretch stays calm (a real conversation that carries itself).
Reel: walk the transcript in 2–3 s steps by hand.

## Step 4: pass 9, asset requests → CHECKPOINT 2 (ask him)
He is happy to Google memes and pictures for you; that's how the Library grows. So ASK, every video:
1. Fill the table in plan.md: `id | for (time · moment) | what I need | kind | Google search words | tags | asked`.
   Kinds: sticker (cut out) · image (keep whole) · gif · sound · photo · illustration. Search words he can paste
   straight into Google ("shocked indian uncle meme png", "bhai kya kar raha hai tu gif"). Tags = when to reuse it.
2. `node scripts/assets.mjs request <name>` makes `Library/wanted/<id>/` folders and prints the list → send it to him.
3. Keep working meanwhile (preview renders are allowed). When he says they're in: `node scripts/assets.mjs import`
   (cut-outs, GIF → transparent webm, sounds levelled, catalog + plan rows marked received). Rows he skips → `declined`.
4. Close the pass. `Status: none: <reason>` only if nothing in this video would gain from an asset.

## Step 5: render, then pass 10 (viewer check)
- Final render (`npm run reel -- <name> --note …`, `node scripts/vlog.mjs <name> --note …`, `node scripts/process.mjs …`).
  It exits with the list of open passes if the plan isn't finished. `--no-plan` is for tests only and is written into
  the CHANGELOG.
- Viewer check: watch it at 1x like a stranger; stills (ffmpeg frame grabs) at the hook, every graphic, every layout
  change, the ending. Write what you found under pass 10.

## Step 6: tell him, then learn
Brief and plain: what you made, why (one line per big choice), what's waiting on him. After his feedback: v2 = a new
pass over only the layers he commented on (the plan keeps the rest). Log his verdicts in `brain/preferences.md`, update
the playbook, commit + push (only your own files).
