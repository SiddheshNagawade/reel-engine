---
name: character-overlay
description: Put a flat vector cartoon character into real footage - painted on a wall, walking/running with the camera, hidden behind real objects, bonking into things, jumping off the wall onto objects. Use when Siddhesh gives a video + a character sheet (EPS/AI/PDF/PNG) and asks for a character animation, "vector character", "make him interact with things", or a short story with a cartoon in his footage.
---

# Character overlay (ReelEngine)

The system is built: **do not write new animation code for a new video.** Prepare → look → write `scene.json` → stills → render → check.
Read `brain/genres/character-overlay.md` (lessons) and `brain/preferences.md` first.

## 1. Prepare (one command, cached)
```
npm run char -- <video in inbox> --sheet <character sheet in inbox> [--start 0] [--dur 10.6]
```
Makes, in `work/char/<name>/` (on the T7 `_work/` when attached):
- `plate.mp4`: HDR tone-mapped, 30fps, trimmed (`--start/--dur` pick the best 10s)
- `track-wall.json` (camera track of the wall) and `track-dark.json` (dark objects: bags, people)
- `inspect/contact.jpg` (every 15th frame, numbered) and `inspect/frame-*.jpg` (full size, 100px grid)
- a starter `scene.json`
- heads from the sheet: `work/char/parts/<sheet>/parts.png` (numbered; map them in `character.heads`)

## 2. Look and measure (always look at the pictures)
- `contact.jpg`: what passes when (objects, surfaces, where the camera goes, where it stops).
- `frame-0000.jpg` grid: the floor line he walks on, as `ground.y0` + `ground.slope` (frame-0 px, usually the top of the skirting).
  Measure the same way on any frame: `python3 scripts/char-inspect.py frame work/char/<n>/plate.mp4 out.jpg <frame>…`
- Wall coordinates = frame-0 pixels. Something seen on a later frame F at screen (sx, sy) sits at wall-x ≈ x where the
  track maps it; easiest: the camera centre's wall-x grows with the pan (print it from the track if needed).
- Things leaning in front of the wall (rods, poles): `occluders` polygons in frame-0 px, active `from`–`to`.
- Spots on 3D objects (top of a bag): `anchors` = `{track: 'dark', frame: F, screen: [x, y], lock: <landing frame>}`.
- After writing it: `npm run char -- <name>` rewrites `inspect/track-check.jpg` (floor line, occluders, anchors on the plate).
  The similarity track drifts when the phone turns toward the wall: measure the real floor line at his position on a few
  frames and put the offsets in `ground.fix: [[frame, +px down], …]`.

## 3. Write the story: `scene.json` beats
Each beat runs from the previous beat's `to` to its own `to` (frames). `x` = where his feet end (wall px).
| do | what | params |
|---|---|---|
| appear | projector flicker-in | x |
| stand / wave | front view, waves at camera | head |
| turn | squash + turn to side view | |
| walk / run | cycle driven by distance (no foot skating); faces the way he moves | x, head |
| hop | giggly hops, legs tucked (tickled, excited) | x, count, height, head |
| bonk | squashes into something, flies back, lands flat | x (landing) |
| lie | on his back, dizzy stars | stars |
| getup | springs up | |
| think | looks, gets an idea, crouches | |
| leap | jumps OFF the wall onto an anchor (paint → sticker + outline) | anchor, height |
| sit | sits on the anchor, legs dangling, face to camera | anchor, wave [a,b], kiss |
Heads: smile, shock, laugh, sad, kiss, side. Sounds are automatic per beat (flicker, taps, boing, bonk, thud, twinkle,
whoosh, pop, mwah); add `sfx: [{at, sound, volume}]`, drop with `mute: ["tap"]`.
Template: `brain/templates/character/*.scene.json`. Start from it and change it to fit the footage; don't copy it blindly.
Story first: one clear little arc (arrive → play → trouble → recover → payoff), gags must use what's REALLY in the shot.

## 4. Stills → render → check
```
npm run char -- <name> --stills 25,100,190,260     # inspect/still-*.png: look at them
npm run char -- <name> --render --note "what changed"   # output/char/<name>/<name>-vN.mp4 (+ scene copy, CHANGELOG)
```
Check the real output with ffmpeg frames (`fps=2,tile`) + `volumedetect`. Never call it done without looking.
Common fixes: feet floating → `ground.fix`; leaves frame → lower `height` / move x; wrong face → `head`.

## 5. New moves / characters
- New action → add a case in `src/character/engine.ts` (`frameAt` + `soundCues`) and a row above. Keep it data-driven.
- Different character → `character.colors` (sweater, jeans, skin, shoe…; see `COLORS` in `src/character/Rig.tsx`) and
  `character.heads` mapping. Sheets need a row of expression heads at the top; a side-view figure is optional.
- After his feedback: lesson → `brain/preferences.md` + `brain/genres/character-overlay.md`; systematic issue → fix the engine.

## Setup (once per machine)
`npm install` · `.venv/bin/pip install opencv-python-headless numpy` (or python3) · `brew install ghostscript` (EPS/AI sheets).
Linux/cloud only: `REEL_BROWSER=<path to headless chrome>` if Remotion can't download its browser.
