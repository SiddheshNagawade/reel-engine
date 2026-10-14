---
name: edit-video
description: The step-by-step way to edit ANY video of Siddhesh's (talking-head reel, vlog, drawing/process video), from footage to finished version. Use whenever he says "edit the new video", "edit this", "make the vlog", "v2/v3", "continue the edit", or gives footage to turn into a reel or vlog. Runs the editing passes one at a time in _work/<name>/plan.md, with two checkpoints where you ask him (hook choice, and memes/GIFs/pictures he can find for you). Final renders refuse to run until the plan is finished.
---

# Edit a video, step by step

Why this exists (his words, 2026-10-12): "it should be one by one, step by step, so that you don't miss anything."
The Chandigarh vlog was decided in one go: it got 37 pop texts and 18 hanging photos, but 7 meme stickers in 11 minutes,
no vector illustrations, no props or bubbles, and 66% of it sat in 6 s+ stretches where nothing new was added. Nobody
asked him for a single meme. This skill is the fix: **one pass at a time, written down, checked by code.**

Read before starting: `brain/rules.md` (every current rule) is already loaded. Then run
`node scripts/editplan.mjs <name> brief start` once, and `… brief <pass>` before EVERY pass: it prints that pass's rules,
the playbook sections that matter (hooks, craft, sounds, vlog/process…), the technique checklist and what the Library
holds. That is how nothing in brain/ is skipped; a pass closed without its briefing blocks the render, and a pass's
briefing refuses to open until every earlier pass is closed (one step at a time, never everything at once).

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
Cut, order, hook, ending. Shape it with the story craft in `brain/content-brief.md` §10 (write-script skill): a reel =
5 beats; a vlog = the 3-act spine with ~9 beats, each tied to a real clip; a series episode = continuity with the last
part (pay its open loop early, end part 1 on the moment it broke). Write a "we see" line per beat: it seeds the visuals
pass. Give him 3–4 hook options (English text + what the first 3 s look like) and the cut direction.
Use AskUserQuestion, or `show_design_options` (design-picker mod) when the choice is visual. Write his pick into the
plan, close the pass with `Status: done`.

## Step 2b: cut style per scene (pass "cuts")
Chandigarh had 19 scenes (206 of 612 s) simply played 1.5–2.8× faster. That is now a blocking check. Each long scene
gets a chosen cut style with a reason, from the checklist in plan.md:
- jump cuts to the best beats: `.venv/bin/python scripts/cutfinder.py beats <clip> --from a --to b --n 4` → `"jumps"`
- speed ramp into a real-time moment: `"speed": 8, "rampTo": 1, "dur": 3`
- time-lapse only for slow progress: `"timelapse": "<why>"`
- J/L-cut at scene changes (`"jcut"`, `"lcut"`), match cut (`cutfinder.py match`), cut on action (`cutfinder.py actions`),
  smash cut (`"smash"`), dissolve for time passing (`"transition"`), cross-cutting (segment order).

## Every pass has a technique checklist
Each pass in plan.md lists the techniques he taught for it (scripts/lib/techniques.mjs). Mark each one
`- [x] name: where it's used` or `- [-] name: why it doesn't fit here`; unmarked lines block the render. A technique
marked "NOT BUILT YET" that this video needs gets built (reusable), then its `built` flag flips in techniques.mjs.
brain/coverage.md shows the whole map.

## Step 3: passes 1–8, ONE AT A TIME
For each pass, in order:
1. `node scripts/editplan.mjs <name> brief <pass>`: read all of it (rules, playbook, checklist, Library).
2. Walk the WHOLE timeline for that one layer only. Write bullets under the pass: `time / beat → what → why`.
3. Close it: `Status: done`, or `Status: none: <real reason>`. Then `node scripts/editplan.mjs <name>` shows the next one.
4. Only then start the next pass. Never fill several passes in one go: that is exactly how layers got skipped.

### Pass 2 (support visuals) is where the edit is made: think like a motion designer
For every beat ask: what does the viewer SEE besides the footage? At least 3 ideas, usually far more (vlog: several a
minute). Reach across the whole toolbox, not only text:
- **Reel** (`direction.json`, all keyed to a word index `at`): `attach` = props on face/hands (sunglasses, crown, sweat,
  anger mark, ?, bulb, tears, hearts), speech/thought bubbles, labels + arrows, sticky notes, any picture/illustration
  (`.claude/skills/motion-graphics/SKILL.md`); `memes`; `cards` (typewriter / wave / slam / title / scatter); `counters`;
  `reveals` (before/after); `stages` (clips as cards); `ui` (chat / notifications / button + cursor); `planes` (3D tilted
  screen); `pushes` (push-through); `connectors`; `bursts`; `layouts` (footage makes room) + `captionMoves`; `coldOpen`;
  `banner`; `hookBehind`; character overlay (`.claude/skills/character-overlay/SKILL.md`). Fields: brain/skills.md.
- **Vlog** (`vlog.json` gfx): sticker (memes, his imported PNG/GIF/SVG), pop, hang (photos), hero intro, counter, arrow,
  circle, tag/name, map, stamp, chapter, zoom (punch + flash), censor, `attach` (the reel's props/bubbles/labels/notes
  stuck to a face: `near: [x, y]` picks the person) and `insert` (chat, notify, cursor, counter, connector, burst,
  scatter, plane, push).
- **Missing?** Anything still not in that list: BUILD it as a reusable layer (CLAUDE.md "Freedom to create": component +
  data field + brain/skills.md row + a line in scripts/lib/techniques.mjs). "We don't have it" is never the reason to
  leave a beat empty.
- **Meme card** (classic captioned template for a choice/comparison/irony beat): `node scripts/memecard.mjs suggest
  "<moment>"`, then render it into the Library. His current Indian memes (asset requests) come first.
- **Screens on camera** (phone, laptop, screen recording): reel `direction.blurSecrets: true`; vlog `scripts/secrets.py`
  on the piece → `censor`. Never publish a number, email, UPI ID, OTP or key.
- **Needs an asset the Library lacks** (an expression meme, a reaction GIF, a logo, a photo) → it goes in the Asset
  requests table (pass 9), with the beat it's for.

### Pass 8: density walk
`node scripts/editplan.mjs <name> check` runs the automatic rules (fast-forward, emoji, repeated meme sounds,
transitions inside a shot, short shots, end fades; errors block the render) and, for a vlog, lists every stretch over
6 s with no new graphic/sticker/sound.
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
- Cover / thumbnail: `.venv/bin/python scripts/heroframe.py <final.mp4> <output dir>` picks the best frames (sharp,
  eyes open); YouTube uploads render with `--yt4k`.
- Posting kit (every final version): `node scripts/postkit.mjs <name>` → write `<name>-vN.post.md` next to the mp4
  with brain/posting.md (IG caption, YT title/description/tags, cover, audio note, credit, time). Mention it in the hand-off.

## Step 6: tell him, then learn
Brief and plain: what you made, why (one line per big choice), what's waiting on him. After his feedback: v2 = a new
pass over only the layers he commented on (the plan keeps the rest). Log his verdicts in `brain/preferences.md`, update
the playbook, commit + push (only your own files).
