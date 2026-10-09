# What ReelEngine can do, and when to use each skill

Pick by what the moment needs. Most reels need only 2–4 of these.

| Skill | How | Use when | Don't use when |
|---|---|---|---|
| Local Hinglish transcript (two-pass Whisper) | scripts/transcribe.py | always | n/a |
| Retake / filler / silence cutting | director + plan | always | keep natural pauses that carry emotion |
| Face tracking (Apple Vision) | scripts/facetrack.py | always for talking head: zooms grow from the face, camera follows the head | n/a |
| Camera push-in / pull-out | direction.sections → moves | new section/idea inside one continuous shot | as decoration on every line |
| Transitions (whip, zoom-blur, tilt, flash, light leak) | automatic at real clip changes | the picture actually changes (new clip, B-roll) | inside one continuous shot |
| Text BEHIND the person (Magnetic-Mask style) | scripts/personmask.py + hookBehind | hooks, big keywords, title moments: premium look | long durations (costs ~0.6s per frame to cut out) or when the head moves a lot |
| 3D hook keyword | hookText | frame 1 of every reel | n/a |
| Pinned open-loop headline | direction.banner | stories with a real reveal later | simple tips |
| Caption styles (6) | theme.captionStyle | always, style follows tone | n/a |
| Tracked props + stickers (motion graphics) | direction.attach + scripts/motiontrack.py, scripts/sticker.py; playbook .claude/skills/motion-graphics/SKILL.md | his emotion/idea/key point lands better visually: ? on confused, sweat on nervous, bulb on idea, note for key points, label to point at things, any object cut out as a sticker | as decoration; over a meme at the same moment; on his eyes/mouth (except glasses/tears/blush) |
| Meme stickers (transparent cats) | Library/stickers + direction.memes | HIS attitude at that moment clearly matches (huh on confused, sleepy on late night) | just because a keyword matches |
| Meme / comedy sounds | Library/sounds | reactions, landing a joke | over his words |
| Comedic beat (freeze + B&W + sound) | direction.beats | after a bad/useless line, for a laugh | serious moments |
| Rage (red burn + shake) | direction.effects type rage | clearly angry, raised voice | mild frustration |
| Film look (grain, grade, vignette, gate weave) | style.film | always (he loves it) | n/a |
| Soft ending (tail + fade) | style.edit endTail/endFade | always, unless the ending loops into the hook | n/a |
| Text cards: typewriter / wave / slam | direction.cards [{at, seconds, text, mode, bg: white/black/accent/blur, accentWord, glow}] | a key line deserves its own moment; long-form B-roll replacement | stacked with memes/moves at the same moment; more than 1–2 per reel |
| Premium grade (S-curve, sharpen, halation) | style.film scurve / sharpen / halation (baked at extraction) | always subtle S-curve + sharpen; halation only on night/practical-light footage | halation on bright walls (turns pink) |
| UI/text sounds | sfx tick / click / soft-whoosh | every text/UI appearance | over his voice at full volume |
| Motion templates: CardStage / CircleReveal / NumberRoll | src/templates/* (see brain/motion-design.md; preview T7 references/templates-gallery.mp4) | showing several clips/stages, before/after, progress numbers; long-form + drawing videos | as decoration; more than one big motion idea every ~2s |
| Colour check (scopes) | scripts/colorcheck.py: clipping, cast, skin vs skin-tone line, skin chroma/brightness | before showing ANY grade change; compare to v1 targets in brain/color.md | judging colour by eye alone |
| Per-reel look tweaks | direction.json → styleOverride (merged over style.json, e.g. {film:{warmth:0.3}}) | an existing look is ~80% right for this video | changing defaults he loves (edit style.json only if he asks) |
| Process / time-lapse reel (no voice) | scripts/sheet.mjs + scripts/process.mjs + _work/<name>/timeline.json (see brain/process-videos.md) | drawing, unboxing, making-of footage; hours → 30–45s with variable speed, 9:16 framing, VO guide | talking-head footage (use npm run reel) |
| Floating cards (practice montage) | process.mjs timeline "cards": clip in a white rounded frame + shadow + tilt, slides across over a running background | showing extra work/practice without cutting away from the main shot | more than 2 at once; over the main subject's key moment |
| Final Cut project export | output/<reel>/<reel>-vN.fcpxml | by default, so he can tweak cuts in FCP | n/a |

## Legibility & framing checklist (learned from v2)
- Every sticker fully inside the frame: no cut-off heads. Corner stickers sit above his head; if there's no room → side peek away from the face.
- Text readable on a phone in under a second: caption words ≥ 60px on 1080-wide, high contrast + shadow, never over his eyes/mouth.
- Instagram UI covers roughly the top 8% and bottom 20% plus the right edge (buttons): keep key text out of those zones.
- Script/thin fonts only for the ONE emphasised word, big; body words in a bold sans.
- After rendering, check stills at every text/sticker moment before calling it done.
