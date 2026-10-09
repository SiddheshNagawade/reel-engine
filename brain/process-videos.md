# Drawing / process time-lapse videos (plan: build with his first real drawing footage)

What he'll give: many clips, often HOURS, of drawing (his drawing journey). The job: decide what matters, shrink hours into
a watchable story, keep the feeling of craft and progress.

## Editing approach
1. **Understand the footage first (cheap):** sample frames + an activity score per second (how much the image changes) and
   his voice if he talks. Never process hours at full quality before deciding.
2. **Find the story beats:** blank page → first strokes → structure → details → colour/shading → final reveal (+ any mistakes/fixes, which are good drama).
3. **Variable speed, not one speed:** idle/repetitive stretches at 8–30×, interesting moments at 2–4×, key moments real-time
   or slightly slowed. Cut dead time completely (hands off the page, adjusting the camera).
4. **Jump cuts between stages** (hidden by small zoom changes); speed ramps into/out of key moments.
5. **Structure:** hook (show the final for 1–2s first, or the most satisfying stroke) → journey → reveal → circle-reveal
   sketch vs final / CardStage of stages → end.
6. **Text:** few and calm: stage labels or a NumberRoll ("12 hours", "Day 1 → Day 30"). Music bed drives the pace; cuts on beats.
7. **Mood:** usually calm, satisfying, proud. No meme clutter unless HE is narrating something funny.

## Built (first used on `alcoholmarkers`, 2026-10-09)
- `scripts/sheet.mjs <video> <out.jpg> [--from --to --n --cols]`: contact sheet with timestamps. Look at sheets of EVERY clip
  first (cheap), then denser sheets of the key clips to find exact in/out points. Never decode hours at full quality to decide.
- `scripts/process.mjs <name>`: renders `_work/<name>/timeline.json` (segments: src, in/out, dur or speed, focus fx/fy + pan toFx,
  zoom/toZoom push, mode fill (9:16 crop) | fit (whole landscape frame as a card on a blurred copy), hold, audio, vo line).
  Writes `<name>-vN.mp4` + `-vN-vo-guide.mp4` (VO lines burned in with a timer = teleprompter for recording) + `-vN-vo-script.txt`.
  Speed ≥ 60× decodes keyframes only (an hour-long clip renders in minutes).
- Landscape footage → 9:16: pick the focus per segment from the sheets (paper/hands move between camera setups); use `fit`
  when the whole artwork must be seen (final reveal).
- No voice in the footage → cut the picture first, write the VO script to the picture, he records it over the guide video.

- v4 additions: `rampTo` (speed ramp into real time), `stabilize` (two-pass vidstab, handheld only), per-segment exposure
  (measured: paper white → shared target, no clipping), `endFade: 0` default (hard cut / loop). Mix styles on purpose:
  time-lapse for progress, ramps into real-time strokes for technique + sound, stage jump cuts for reveals.

## Still to build
- `scripts/activity.mjs`: per-second change score via ffmpeg (frame difference) → idle vs active stretches.
- Speed-ramped extraction (setpts per piece) in the selects step; 16:9 or 9:16 output.
- Beat-synced cuts (music onset detection) and the long-form mode.
