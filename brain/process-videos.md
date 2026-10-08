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

## To build (when the first footage arrives)
- `scripts/activity.mjs`: per-second change score via ffmpeg (frame difference) → idle vs active stretches.
- Speed-ramped extraction (setpts per piece) in the selects step; 16:9 or 9:16 output.
- Beat-synced cuts (music onset detection) and the long-form mode.
