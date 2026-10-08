# Motion design: frame-level study + reusable templates

From a 10fps study of the "expensive edits" reference (T7 `references/expensive-edits.mp4`), in my own words.
See `brain/expensive.md` for the principles; this file is about HOW things move and how frames are organised.

## Frame grammar (how each frame is organised)
- **One idea per frame.** One line of text, OR one object, OR one comparison. Centred, lots of empty space around it.
- **Calm stages.** Plain white / near-black / one section colour; footage often sits *inside* a rounded card on that stage.
- **Objects carry across beats.** Instead of cutting, the card that's on screen shrinks, moves, multiplies or morphs into the
  next layout (a grid becomes a phone screen; a card slides up to make room for a chat box). The eye never loses its place.
- **Information arrives in steps,** in the order the voice says it: card → bubble → typing dots; item 1 → 2 → 3.
- **A line can stay while shots change underneath it** ("*sometimes*" over 4 cuts): rhythm without losing the sentence.

## Motion vocabulary
| Move | Frame-by-frame | Use |
|---|---|---|
| Blur-in entrance | object starts blurred + slightly small/tilted, overshoots, settles in ~0.3s | every object entrance |
| Motion-blurred whip | fast move with directional blur, sharp at rest | objects flying in, cascades |
| Push-through | an object moves INTO the lens until it fills the frame, then the next scene | transition between ideas (needs a real object) |
| Layout morph | cards slide/resize/reflow into a new arrangement, staggered by a few frames | list → detail, grid → focus, before/after |
| Make room | current element shrinks/moves aside as a new one enters | adding context without cutting |
| Spotlight / circle reveal | soft circle travels showing the "after", then opens | before/after, sketch → final |
| Counter roll | slot-machine roll + giant faded echo behind | progress over time, numbers, years |
| Cascade / 3D stack | items pile up with perspective + motion blur | "so many…", notifications, overwhelm |
| 3D tilted plane | screen/UI tilted in perspective, scrolling | showing an app/website |
| Light burst / glitch flash | 2–4 frame overexposure or RGB split between shots | rare accent on a big moment |
| Scatter text | words land at different spots/sizes, then settle | playful emphasis |

Deformation/morph moments are ACCENTS: one per section at most.

## Built templates (src/templates/, preview: T7 `references/templates-gallery.mp4`)
- `CardStage`: rounded cards on a stage, morphing between layouts `single | row | grid | stack | focus`, blur-in entrances, motion blur on fast moves.
- `CircleReveal`: before/after spotlight, soft edge + guide ring, opens to full reveal.
- `NumberRoll`: slot-machine counter with giant faded echo + label.
- (from expensive.md) text cards `typewriter | wave | slam` on white/black/accent/blur.
Todo when a video needs them: push-through, chat/notification UI, 3D tilted plane, cascade, scatter text, light-burst transition.
Render the gallery: `node scripts/gallery.mjs <footage.mp4> <out.mp4>`.

## Mood first (most important; from Siddhesh)
- Every video has ONE feeling; editing must enhance that feeling, not show off. A casual update under a blanket = casual,
  friendly fonts and light touches (v1/v2 of img-1391 were right). Serious/"cinematic" styling on a casual video feels wrong.
- **Clutter kills the story.** Not a strict rule, but roughly: give each visual idea ~2 seconds to land before the next one.
  If every frame has something new happening, the brain processes nothing. The viewer must understand HIS story first.
- Test pieces (like the gallery) may look different; real videos follow the video's mood.
