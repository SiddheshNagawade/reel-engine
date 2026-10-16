# Isometric 3D-look scenes (built 2026-10-17)

He showed two isometric illustrations (a green city on a floating board with wind turbines; a road crossing with a
factory, turbines, pine forest and cars) and asked: can the things we make people visualise look 3D like this,
decided per topic, without spending many tokens each time? Charts stay 2D (he likes them flat).

## What it is
`src/layers/Iso.tsx`: a small flat-shaded 3D engine in SVG. Every object is made of a few solids (any outline pushed
up, cylinder, cone, sphere, thin panel). Each face gets its colour from ONE base colour and one fixed light (top
lighter, left = base, right ≈ 30 % darker), so any colour looks right in 3D automatically. Faces are drawn back to
front. The camera can orbit, so the scene really turns: that slow turn is what sells "3D" in a video.

**Token cost:** one scene = ~10–20 short lines of JSON in direction.json. No drawing code per video. New topic = new
list of objects, positions, colours and words, not new code. Only add a new object type to Iso.tsx when a topic needs
a shape the list can't make (and then it's there for every later video).

## direction.iso (plan.mjs turns word indexes into frames)
```json
{"at": 12, "until": 20, "style": "full", "bg": "#a4cf86",
 "board": {"w": 8, "d": 6, "color": "#5d9b43"}, "orbit": 10, "rings": true,
 "items": [
  {"obj": "box", "word": 13, "x": -2, "y": -1.5, "w": 1.1, "h": 1.8, "color": "#6fae4f", "windows": true},
  {"obj": "road", "points": [[-4, 0], [4, 0]], "width": 0.6},
  {"obj": "pine", "word": 14, "h": 1, "repeat": {"n": 8, "area": [-3.6, -2.6, 3.6, 2.6], "stagger": 0.05}},
  {"obj": "turbine", "word": 16, "x": 3, "y": -2.4, "h": 3.4, "face": 225, "tag": "Wind", "tagWord": 17},
  {"obj": "car", "word": 18, "acts": [{"word": 18, "do": "travel", "path": [[-4, 0.2], [4, 0.2]], "seconds": 3}]}
 ]}
```
- **Coordinates:** world units on the board, (0,0) = centre. +x runs toward the bottom-RIGHT of the screen, +y toward
  the bottom-LEFT (default camera, yaw 45°). Board 8×6 is a good default; objects are ~1 unit wide, buildings 1–3 high.
- **Objects:** box/building/tower (`windows: true` or `[rows, cols]`), bar (3D bar, `value` + `unit` counts up on top),
  slab, cyl, tank (cylinder + dome), cone, pyramid, sphere, dome, tree (round), pine, house (`color2` = roof),
  factory (chimneys + drifting smoke), turbine (`face` = direction it faces, `speed` turns/s), solar (tilted panel),
  car, truck, person, coins (`n` coins), poly (`points` = ANY outline extruded: arrow, country, logo, a "₹" sign),
  road (flat strip with dashes, `points` + `width`), water (flat lake from `points`).
- **Enter:** buildings/bars rise from the board, everything else drops in with a spring; `enter: pop|none` to change.
- **Acts on his words:** `grow` (to a new height `value`), `color` (to `color`), `pulse` (flash lighter), `out` (sinks
  away), `travel` (along `path`, faces the way it drives). Turbines spin and smoke drifts on their own.
- **Many at once:** `repeat: {n, area: [x0, y0, x1, y1] | grid: [cols, rows], stagger}` scatters copies that keep clear
  of placed objects and roads, each popping in a little later (a forest growing, a crowd arriving).
- **Camera:** `orbit` (degrees over the insert, default 10) or `cam: [{word|s, yaw, elev, zoom, x, y}]` to fly to a part.
- `style: "over"` = no background, floats over the footage/canvas (keep it out of his face: x/y/size).
- Test scene: `src/edits/zz-iso-demo.json` (city, 3D bars, road + factory); stills with `node scripts/still.mjs zz-iso-demo 95 200 330`
  (needs a blank `public/input/zz-iso-demo.mp4`; make one with ffmpeg and delete it after).

## When to use it (and when not)
- USE for places and systems: a city, a factory, a supply chain, a store, a farm, a data centre, "how X gets made",
  "where the money goes", growth you can SEE (a town building up, a forest returning). Brand explainers love it.
- USE one per video section at most (it's a big visual, a "world"); give it the section's metaphor (animation-system.md).
- DON'T use for numbers alone (2D charts read better; he said charts stay 2D), for emotions, for a quick 1–2 s beat.
- Colours: one hue family per scene + one accent (the thing he's talking about), like the references. Background a
  lighter/softer version of the board colour.

## What I took from the three repos he shared (2026-10-17)
- **cth9191/animate (MIT): useful.** Its isometric style gave the projection, back-to-front drawing, closed-form springs
  and "stagger along the diagonal" (all used in Iso.tsx). Its story grammar matches ours and adds a few rules worth
  keeping: one simple hero from first frame to last; the world changes while the hero holds its screen position; a
  build holds one framing for 3–6 s while detail piles up; sound dips right before a turn; the loudest hit marks the
  turn, not the busiest cut; late shots call back to early framings, changed. Not taken: its canvas renderer and
  synthesised music (we render in Remotion with his voice + real sounds).
- **howseen-ai/claude-motion-design (MIT): partly useful.** Same idea as our engine (every frame computed from time).
  Kept: spring presets by weight (snappy UI fast, containers/camera medium, heavy type/logos slow, playful mascots
  bouncy); seeded randomness only (never Math.random, so re-renders match); label illustrative data "Example data" on
  screen; sound effects placed on their measured peak. Not taken: its Playwright renderer, launch-film flow, remake mode.
- **dylantarre/animation-principles (MIT): low value for us.** 144 short notes on Disney's 12 principles for UI/web;
  generic and repetitive. The parts that matter (anticipation, follow-through, slow in/out, arcs, staging, secondary
  action) are already in brain/animation-system.md and motion-design.md. Not installed.
