# Canvas mode: the canvas is the base, his footage is one layer, ONE camera over everything (his idea, 2026-10-14)

Before, his footage was always the base and everything sat on top of it (or replaced it). In canvas mode the base is
a designed canvas (colour + vignette + edge grain, optional grid / blinds); his footage is ONE layer placed on it like
any photo or text; one camera moves over the whole canvas. That's what makes edits feel designed, not stacked.

## What it can do (direction.canvas; times are word indexes {word: i} or seconds {s} from the reel start)
- `footage` keys `{word, x, y, w, rot, shape: rect|round|circle, cut}`: each key glides into place (~0.7 s) and holds.
  * full frame = `{x: .5, y: .5, w: 1}` (looks like a normal reel);
  * rounded card beside a graphic = `{x: .3, y: .45, w: .55, shape: "round", rot: -3}`;
  * a circle (his face as a bubble) = `{shape: "circle", w: .6}`;
  * JUST HIM on the canvas (person cut-out, background gone) = `{cut: true, w: .82, y: .56}` (cut-out made by reel.mjs).
  His voice keeps playing whatever the picture does.
- `cam` keys `{word, x, y, zoom, rot}`: the one camera. Pan from him to the graphic beside him, push in on the
  payoff, pull out so he becomes one element among others. Keys before the moment start the move early.
- `items`: the same elements as full-screen scenes (brain/pablo.md): text (script/heavy/grotesk), gradient boxes,
  pictures (`file` from the drive), dashed lines drawn on, numbered dots, badges, counters, a badge riding a path.
  Put graphics beside him in world space (x > 1 = off to the right, the camera travels there). Give items an `out`
  (seconds) when the footage goes back to full frame, or they sit on top of him.
- `bg`: `{color, style: radial|grid|blinds}`; pick the colour by meaning (red problem, blue solution, his brand).
- Everything else still works on top: captions, memes, titles, scenes, transitions. Without direction.canvas the
  reel works exactly as before.

## When to use it (decide in the layout pass, plan the moves in the motion pass)
- An explaining reel where graphics and he should share the screen: he becomes a card while the idea is drawn next to
  him, then the camera returns to him. Or the hook: just him cut out on a coloured canvas with the title.
- Not for every reel: a casual vlog-ish talking clip stays plain footage. One idea at a time still applies.
- Sound: footage moves and camera travels get soft whooshes automatically; items get his sound map.

Built in src/layers/Canvas.tsx (+ templates/Scene.tsx for the world, items and camera); planned in plan.mjs.
