# Map of brain/: what each file is for, and WHEN it's read

Always loaded: CLAUDE.md, brain/rules.md (every current rule, by topic), this map.
Everything else is read at the moment it matters, through a briefing or a skill, never "somewhere at the start":
- editing → `edit-video` skill → `node scripts/editplan.mjs <name> brief <pass>` before EVERY pass prints that pass's rules,
  playbook sections, technique checklist and Library inventory (scripts/lib/brief.mjs decides which sections). The render
  gate refuses a pass that was closed without its briefing.
- scripts / hooks / VO → `write-script` skill (reads content-brief.md, hooks.md, content-plan.md).
- animation on his footage → `motion-graphics` skill · cartoon characters → `character-overlay` skill.

| File | What it holds | Read by |
|---|---|---|
| rules.md | the rulebook: every current rule, tagged by pass; newest verdict wins | always loaded + every briefing |
| preferences.md | HISTORY: his verdicts with dates and the story behind each rule | when a rule needs its why; add every new verdict here AND in rules.md |
| edit-layers.md | the editing method, one section per pass | briefings (every pass) |
| coverage.md | every technique he taught → built? → how (generated from scripts/lib/techniques.mjs) | when looking for "can we do X?" |
| skills.md | every tool/feature: how to call it, when to use it, when not | when building or calling a tool |
| hooks.md | hook rules, 3-second formula, cold open, loops | story briefing, write-script |
| content-brief.md | positioning, 5 beats, hook patterns, series rules, §10 story craft | story briefing (reels), write-script |
| content-plan.md | pointer to the live planner docs + brand decisions | write-script, content planning |
| craft.md | cut vocabulary, editing styles, what works in India | cuts briefing |
| principles.md | retention principles, pre-export checklist | captions / density / viewer briefings |
| motion-design.md | frame grammar, motion vocabulary, templates, mood first | visuals / motion briefings |
| expensive.md | "expensive" editing levers | visuals briefing |
| color.md | colour lessons, v1 targets, scopes | look briefing |
| sounds.md | moment → sound by meaning | sound briefing |
| memes.md | the video-meme library and how to present a meme (card / half / full / zoom) | visuals + sound briefings |
| canvas.md | canvas mode: footage as one layer on a canvas, one camera over all | layout + motion briefings |
| pablo.md | the designed-reel style (titles, inverted title, full-screen scenes, sound map) learned from a course | visuals + motion briefings |
| posting.md | how to write the IG caption / YT title etc. for each video (posting kit) + analytics verdicts | viewer briefing, edit-video step 5 |
| vlog.md | long-form vlog playbook | briefings when the video is a vlog |
| process-videos.md | drawing / making-of playbook | briefings when the video is a process video |
| clipping.md | ARCHIVE: Whop clipping (he stopped, 2026-10-11); the pipeline notes stay for podcast clips | only if he clips again |
| library-catalog.json, usage.json | git backup of the Library catalog; what recent reels used | tools |
| genres/, templates/ | older genre notes and templates | from the files above when they link there |

Adding something new: a rule → rules.md (+ the dated story in preferences.md); a technique → scripts/lib/techniques.mjs
(it then appears in every plan's checklist); a tool → skills.md; a playbook section a pass should read → READS in
scripts/lib/brief.mjs. If it isn't wired into one of those, no future chat will see it.
