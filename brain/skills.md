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
| Meme stickers (transparent cats) | Library/stickers + direction.memes | HIS attitude at that moment clearly matches (huh on confused, sleepy on late night) | just because a keyword matches |
| Meme / comedy sounds | Library/sounds | reactions, landing a joke | over his words |
| Comedic beat (freeze + B&W + sound) | direction.beats | after a bad/useless line, for a laugh | serious moments |
| Rage (red burn + shake) | direction.effects type rage | clearly angry, raised voice | mild frustration |
| Film look (grain, grade, vignette, gate weave) | style.film | always (he loves it) | n/a |
| Soft ending (tail + fade) | style.edit endTail/endFade | always, unless the ending loops into the hook | n/a |
| Final Cut project export | output/<reel>/<reel>-vN.fcpxml | by default, so he can tweak cuts in FCP | n/a |

## Legibility & framing checklist (learned from v2)
- Every sticker fully inside the frame: no cut-off heads. Corner stickers sit above his head; if there's no room → side peek away from the face.
- Text readable on a phone in under a second: caption words ≥ 60px on 1080-wide, high contrast + shadow, never over his eyes/mouth.
- Instagram UI covers roughly the top 8% and bottom 20% plus the right edge (buttons): keep key text out of those zones.
- Script/thin fonts only for the ONE emphasised word, big; body words in a bold sans.
- After rendering, check stills at every text/sticker moment before calling it done.
