---
name: write-script
description: Write or improve a script / story for one of Siddhesh's videos (reel, two-part series episode, vlog voice-over, drawing-video VO, YouTube). Use whenever he asks for a script, hooks, "what should I say", a story for footage, VO lines, or when planning a video in the content planner, before he records.
---

# Write a script (his rules, then the story craft)

Read first, in this order:
1. `brain/content-brief.md`: positioning, the 5-beat reel structure, six hook patterns, carrying a story across videos,
   agent rules (never invent an event/number/reaction he didn't report), the pre-record checklist, and §10 story craft.
2. `brain/hooks.md` (his hook rules: English title-like hook text, 3–4 options, he picks; every option passes
   "The 4 hook mistakes check": no delay, no confusion, relevant to the viewer, contrast).
3. `brain/content-plan.md` → the live planner docs (current series, pillars, what's already posted).
4. Long-form YouTube (Designomics or any 6–15 min explainer): `brain/longform-scripts.md` in full (topic test, title
   formula, the 9-beat anatomy, writing devices, overlap list, what flops). The 66 Anurag Bansal transcripts it was
   built from are on the T7 in `references/decoding brands/` (INDEX.md by views) when a beat needs a closer model.
   Idea bank: Claude Doc "Designomics Episode Ideas" (https://claude.ai/artifact/H6jRB9nynFRHAuejHEh4Vh, read with the
   docs connector); series identity: "Designomics Series Bible" (https://claude.ai/artifact/56MNF1JZyqXTEzGuBd7gVY).

## Long-form output (Designomics): one final file, nothing left for him to write
- Research first: open every page a number comes from (a search snippet is not a source); check the topic is still
  current and that no deep video already exists (`yt-dlp ytsearch8:`).
- Two files in `/Volumes/T7 Shield/ReelEngine/projects/<slug>/` (T7 missing → `./projects/<slug>/`):
  `script.md` from brain/templates/longform-script.md (only what he says, "My take" included in his voice) and
  `editor-brief.md` from brain/templates/longform-editor-brief.md (the editor's whole context).
- Sound human: find this story's own shape (don't run the same beat order every episode), plain words a 15-year-old
  gets first time, no stock phrases reused across episodes, terms explained in the same breath.
- The STORY → SCRIPT → HOOKS → CHECK steps below still apply; the CHECK adds: read the script aloud in your head as a
  first-time viewer (anything confusing → rewrite), every paragraph has a row in the editor brief, every number has a
  checked source, no filler words, word count fits the length.
- Thumbnails: 3 options per episode from `brain/thumbnails.md` (types + face data; reference sheets in T7
  `references/thumbnails/`), written in the editor brief's posting section; never repeat the title's words.
- Tell him the file path, the title you recommend, the read-aloud length, and anything still unconfirmed.

## Steps — ONE AT A TIME, each written down before the next (never all at once)
Each step is its own piece of thinking with its own output: STORY (facts + shape + beats, no wording yet) → SCRIPT
(the spoken lines + "we see", for the locked story) → HOOKS (3–4 options for the locked script, each through the
4 checks) → CHECK. Write each step's result under its own heading before starting the next; don't draft hooks while
building the story or wording while choosing beats. If a later step shows the story is wrong, go back and redo that
step on its own, then continue.
1. **Facts first.** List what he actually did/said (from his message, the planner, the footage transcript). Missing a
   fact a beat needs → ask him; never fill it in.
2. **Pick the shape by length:** reel 30–45 s = 5 beats (content-brief §3) · two-part series = part 1 ends on the moment it
   broke, part 2 pays it (§10) · vlog / long-form = 3-act spine, ~9 beats, each tied to a real clip (§10) · drawing video =
   his story + a common problem, present-tense VO (brain/process-videos.md).
3. **Series continuity** (episodes only): read the previous episode's script; pay its open loop in the first 10 s;
   same running-number phrasing; stranger rule.
4. **Write visual-first:** every beat = spoken line (his voice, Hinglish as he talks) + "we see" line (filmable shot,
   screen recording, or a named graphic from brain/skills.md). Subtext over stated lessons.
5. **Hooks:** 3–4 options, pattern labelled, sharpest first, + frame-one text that ADDS to the spoken hook.
6. **Check:** pre-record checklist (content-brief §7) + every beat has a visual + nothing invented.
7. **Hand-off to the edit:** the "we see" column becomes the visuals pass of `_work/<name>/plan.md` (edit-video skill);
   the graphics it names go to the asset-request table if the Library lacks them.

Output (reels/vlogs): a short table per script (time · beat · he says · we see), the hook options, the open loop. Points, not essays.

Note: the uploaded `scriptwriter-skill` (mcpmarket) is for fictional TV series in Chinese screenplay format. Its useful
ideas (visual-first, 3-act spine, continuity, subtext) are adapted above; don't use its scene-heading format.
