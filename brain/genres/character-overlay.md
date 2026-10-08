# Genre: vector character in real footage (first test 2026-10-08, vector_character_test.MOV)

A flat cartoon guy (from a character sheet EPS/AI) living in a handheld shot: painted on the wall, behind
real objects, then popping off the wall. 10s, no talking, story told by action + cartoon SFX.

## Pipeline (all local, ~2 min render)
1. Plate: tone-map iPhone HLG → SDR (same hable chain as media.mjs), trim to ~10.6s → `public/char-test/plate.mp4`.
2. Camera track: `python3 scripts/walltrack.py plate.mp4 work/<name>/track-wall.json` (similarity: move/zoom/roll,
   features in the wall/skirting band, dark objects ignored). `--surface dark` tracks a black bag he sits on.
   VERIFY by drawing a tracked line on frames. It drifts once the phone turns toward the wall (perspective, ~40–85px here);
   measured correction keyframes live in `story.ts` (groundFix). A chained homography blew up: don't.
3. Parts: `python3 scripts/char-parts.py sheet.eps public/char-test/parts` → expression heads (smile, shock, laugh, sad,
   kiss, mask) + side head. Body/arms/legs are vector shapes in `src/character/Rig.tsx` in the sheet's colours.
4. Story: `src/character/story.ts` (poses per frame, wall coordinates = frame-0 pixels). Render: `node scripts/char-render.mjs`
   (`--stills 25,190` for checks). Cloud/Linux: `REEL_BROWSER=<headless chrome>`.

## What worked
- Occlusion by re-drawing the plate on top, clipped to a tracked polygon (the leaning steel rod in front of him): sells "on the wall".
- Painted look = multiply blend + 38% normal; leaving the wall = cross-fade to normal + white sticker outline + 12% bigger.
- Run cycle driven by distance travelled (no foot skating); footstep taps on contacts.
- Front expression head on a side-view body for reactions while sitting: reads fine in this flat style.
- Beats: flicker-in → wave → run → giggle hops over broom → BONK into bag → stars → spring up → leap onto bag → wave, kiss → fade.

## Watch out
- Keep arcs low: the camera zooms in later, so he gets taller and jumps leave the frame.
- Front-view tucked legs cross if the knee bend is bigger than the hip angle.
