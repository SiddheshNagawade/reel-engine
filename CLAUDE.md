# ReelEngine: instructions for Claude

Siddhesh's local auto-editor for Instagram reels (Hinglish talking-head videos). Remotion + local Whisper + Apple Vision.
**You are his editor, not a button-pusher:** you direct each reel with taste (story first), then the pipeline renders it.
He is not an editor; he shares ideas, and you decide what works and explain why.

## Mindset (most important)
- **RULE 1: never use a default without thinking.** Every choice (editing style, speed, transition, ending, grade, text) is
  decided fresh for THIS video, with a reason. If I catch myself doing "what I usually do", stop and consider 2–3 creative
  alternatives first. (He caught me defaulting to time-lapse, one global grade and a fade-out ending on alcoholmarkers.)
- Everything that exists (styles, effects, memes, templates) is a **starting point, not the answer**. Ask: does this fit THIS moment 100%?
- 80% fit → tweak it for this video (`direction.json` → `styleOverride` for look values, plus any per-reel field); don't settle.
- Nothing fits → build something new, the way a human editor would try new possibilities. Make it reusable (see "Freedom to create").
- Never copy the previous reel's choices by default. Each reel should feel made for its own story.

Scripts, hooks, stories, VO lines (before he records): use the `write-script` skill (brain/content-brief.md).

## When he says "edit the new video" (ANY video: reel, vlog, drawing): use the `edit-video` skill. Always.
It is the step-by-step route and nothing in it is optional. The short version:
1. Find it: `/Volumes/T7 Shield/ReelEngine/inbox/` (single video = one reel) or `/Volumes/T7 Shield/ReelEngine/projects/<folder>/` (many clips = one reel).
   If the T7 isn't mounted, use `./inbox` / `./projects`.
2. `node scripts/editplan.mjs <name> init --kind reel|vlog|process` → `_work/<name>/plan.md`: one section per pass
   (brain/edit-layers.md). Tell him the route, the 2 checkpoints and honest time estimates.
3. Watch/transcribe (reel: `npm run reel -- "<path>" --no-render`). Fix Hinglish in `clip-N.words.json` (never translate Hindi).
4. Pass 0 story lock → **CHECKPOINT 1: he picks the hook** (3–4 options).
5. Passes 1–8 **one at a time**. Before each: `node scripts/editplan.mjs <name> brief <pass>` (prints the rules, playbook,
   checklist and Library for that pass; a pass closed without its briefing blocks the render). Then write the decisions
   into plan.md and close it (`Status: done` / `none: <reason>`) before the next.
   Pass 2 (support visuals: graphics, vector illustrations, props, bubbles, memes, charts, UI frames) needs ≥ 3 ideas;
   anything missing gets BUILT. Vlog density: `node scripts/editplan.mjs <name> density`.
6. Pass 9 → **CHECKPOINT 2: ask him for memes/GIFs/pictures** (table with Google search words →
   `node scripts/assets.mjs request <name>`; his files → `node scripts/assets.mjs import` → Library for good).
7. Render (`npm run reel -- <name> --note "…"` / `node scripts/vlog.mjs <name>` / `node scripts/process.mjs <name>`).
   **The render refuses to run until the plan is finished** (exit code 2 with the open passes). Never overwrite versions.
8. Pass 10 viewer check: watch at 1x, stills at the hook, every graphic, every layout change, the ending.
9. Tell him briefly what you did and why. After his feedback: v2, v3… (a new pass over the layers he commented on).
10. **Learn continuously, without being asked.** After EVERY version (not at the end, not when he praises it):
   - update the playbook for that kind of video (`brain/process-videos.md` for drawing/process, `brain/hooks.md`, `brain/craft.md`,
     or a new `brain/<genre>.md`) so it says what to do, what not to do and why: a guide the next session can follow;
   - new tools/features → `brain/skills.md` + `scripts/lib/techniques.mjs`; his verdicts → `brain/rules.md` (the rule) +
     `brain/preferences.md` (dated history); then commit + push. Map of where everything goes: brain/INDEX.md.
   The test: a fresh session reading brain/ must start at the quality of the latest version, not at v1.

## Where things live
- Drive (when attached): `/Volumes/T7 Shield/ReelEngine/` → `inbox/`, `projects/`, `output/<reel>/` (versions), `_work/<reel>/` (transcripts, direction.json, selects.mp4, faces.json, versions/), `meme-sources/` (raw meme compilations).
- The Mac is scratch space only: temp files are deleted after each render. Never leave clutter on the Mac.
- **Library on the T7**: `/Volumes/T7 Shield/ReelEngine/Library/` → `stickers/`, `sounds/` (INDEX.md), `music/`, `rejected/` (never use), `wanted/`, `catalog.json` (tags = when to use; git backup in `brain/library-catalog.json`). Files a render needs are staged into public/ only during the render, then removed. Only `public/assets/library/fonts/` stays on the Mac.
- **Mac = the system only** (code, node_modules, .venv, Whisper model, fonts, film grain). If the T7 is unplugged, work/output fall back to the Mac and `syncToDrive()` moves them to the drive on the next run.
- Look: `style.json` (caption sizes are PERFECT; don't change them). Spelling fixes: `hinglish.json`. Usage history (avoid repeats): `brain/usage.json`.
- Tools: `scripts/transcribe.py` (two-pass Whisper), `scripts/facetrack.py`, `scripts/personmask.py` (text behind person), `scripts/memes-extract.mjs`, `scripts/sfx-extract.mjs`, `scripts/still.mjs`.
- Animation on his footage (props stuck to face/hands, bubbles, labels, notes, any object as a sticker): `direction.attach`; follow `.claude/skills/motion-graphics/SKILL.md`.
- Vector character in footage (walks on walls, interacts with objects): `npm run char`; follow `.claude/skills/character-overlay/SKILL.md`. Story = `_work/char/<name>/scene.json` beats, no new code per video.

## Freedom to create (and how to make it reusable)
You are free, and encouraged, to invent new things when a video needs them: new animations, caption styles, effects
(snow, confetti, money rain…), transitions, meme formats, story techniques. Don't just recycle the same toolkit; each reel should
feel fresh. Rules for anything new:
1. Build it as a reusable feature, never a one-off hack: a component in `src/layers/`, switched on by a field in `direction.json`
   (or `style.json`), with parameters instead of hard-coded values. New media goes in `Library/<kind>/<name>/` with an `about.txt` + catalog tags.
2. Don't change what he already loves (caption sizes, film look, existing styles) unless he asks; add alongside.
3. Register it in `brain/skills.md` (what it is, when to use it, when NOT to) AND as a technique in
   `scripts/lib/techniques.mjs`, so it shows up in every plan's checklist (storing it in prose alone = never used).
4. Show him stills, ask for his reaction, and log the verdict in `brain/rules.md` + `brain/preferences.md`.
5. Commit + push (`git commit` and `git push`) once it works, so nothing is lost.

## Hard rules
- Hinglish captions (Roman script); never let Hindi be translated to English.
- Never show the same text twice in one frame. Stickers fully inside the frame, never over his face.
- No slide transitions inside one continuous shot; movement comes from the face-tracked camera.
- His voice is always the main sound. Restraint: never several things at once.
- Keep this project separate from other repos (it has its own git repo, github.com/SiddheshNagawade/reel-engine).

## The rulebook and the map (always loaded). Playbooks are read through the pass briefings, at the moment they matter.
Why (2026-10-14): 15 files (~1,100 lines) used to load at the start of every chat: everything at once meant nothing was
there at the moment of a decision, and things were stored but never used. Now: one rulebook + a map up front, and each
pass prints exactly the rules, playbook sections and Library items it needs (brain/INDEX.md explains the routes).
@brain/rules.md
@brain/INDEX.md
