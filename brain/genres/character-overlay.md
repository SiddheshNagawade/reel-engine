# Genre: vector character in real footage

A flat cartoon guy (from a character sheet EPS/AI) living in a handheld shot: painted on the wall, behind real
objects, then popping off the wall. ~10s, no talking, story told by action + cartoon SFX.
How to make one: `.claude/skills/character-overlay/SKILL.md` (`npm run char`). Template: `brain/templates/character/`.

## First test (2026-10-08, vector_character_test.MOV + 2021flat_27.eps): output/char/vector-character-test
Beats: flicker-in behind the steel rod → wave → run with the pan → giggle hops over the broom bristles → BONK into the
bag → stars → spring up → leap off the wall onto the bag → sit, wave, kiss → fade. Awaiting his feedback.

## What worked
- Occlusion = re-drawing the plate on top, clipped to a tracked polygon (the leaning rod in front of him): sells "on the wall".
- Painted look = multiply blend + 38% normal; leaving the wall = cross-fade to normal + white sticker outline + 12% bigger.
- Run cycle driven by distance travelled (no foot skating); footstep taps on contacts.
- Front expression head on a side-view body for reactions while sitting: reads fine in this flat style.
- Bag anchor follows its own track (dark pixels), so he stays seated while the camera keeps moving.

## Watch out
- The similarity track drifted 30–85px off the skirting once the phone turned toward the wall (perspective). Measure
  and fix with `ground.fix`. A chained homography blew up: don't.
- Keep arcs low: the camera zooms in later, so he gets taller and jumps leave the frame.
- Front-view tucked legs cross if the knee bend is bigger than the hip angle.
- The "get up" is a quick spring with overshoot; a slow pivot looked like a plank.

## Shooting tips for him (better tracking = less fixing)
- Slow, steady pan; phone roughly parallel to the wall at a fixed distance (no turning toward it).
- Leave clear wall above the floor line where he walks; objects that lean on / stand at the wall make the best gags.
- 12–15s of footage for a 10s story; a 1s still moment at the end for the payoff.

## Ideas for next versions (Mac)
- Apple Vision masks (`VNGenerateForegroundInstanceMaskRequest`, like scripts/personmask.py) to auto-cut objects in front
  of him instead of hand polygons; a person walking past could occlude him too.
- Shoot with an ARKit camera-tracking app (records the phone's real 3D path) → perfect tracking, no drift fixes.
