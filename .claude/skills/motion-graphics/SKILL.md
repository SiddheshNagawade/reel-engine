---
name: motion-graphics
description: Add animation to Siddhesh's footage on your own judgement - props stuck to his face/hands (sunglasses, crown, anime anger/sweat/question marks, tears, hearts, light bulb), speech/thought bubbles, callout labels and arrows, sticky notes for key points, any object turned into a cut-out sticker (from his footage or a picture), and cartoon characters living in the shot. Use whenever you edit a reel and a moment would land better with a visual gag or an explanation, or when he asks for "animation", "stickers", "something on my head/hand", "notes", "make it more fun/beautiful".
---

# Motion graphics (ReelEngine)

The toolkit is built and reusable: for a new video you **choose moments and write data**, not code.
Read first: `brain/preferences.md`, `brain/principles.md`, `brain/craft.md` (cut vocabulary), `brain/expensive.md`.

## 0. Taste first (the most important part)
- Animation must SAY something: his emotion (confused → ?, frustrated → anger mark, embarrassed → blush/sweat), an idea
  (bulb), a brag (sunglasses/crown), a sad truth (tears), a key point (note/label). Decoration for its own sake = noise.
- 0–4 tracked props per 30s reel; never two reactions at once (the pipeline drops a meme that overlaps a prop).
- Short: 1–2.5s for reactions; notes/labels as long as it takes to read (~0.25s per word, min 2s).
- Hit it ON the word (`at` = the word that carries the feeling) or just after it for a punchline.
- Never cover his eyes/mouth with anything except things that belong there (glasses, tears, blush); never the captions.
- Informative videos: notes + labels + circles are the core. Comedy/vibe videos: reaction marks + accessories + stickers.

## 1. The toolbox
| Tool | What | How |
|---|---|---|
| Body tracking | face (eyes, nose, mouth, chin, head top, head tilt), hands (palm + fingertips), shoulders | `scripts/motiontrack.py` (Apple Vision), run automatically by `npm run reel` when `direction.attach` exists, cached as `_work/<reel>/motion-<key>.json` |
| Tracked props | ~20 drawn props that stick to those points and follow the head's tilt and the camera zooms | `direction.attach` → `src/motion/props.tsx` + `src/motion/Attach.tsx` |
| Sticker maker | ANY object → cut-out PNG with white outline + shadow (background removal) | `.venv/bin/python scripts/sticker.py <picture or video> out.png [--frame N] [--point x,y]` → look at `out-check.jpg` |
| Surface tracking + characters | a cartoon living on a wall, hiding behind real things, jumping onto objects | `npm run char` (see `.claude/skills/character-overlay/SKILL.md`) |
| Text behind him, cards, memes | other layers | `brain/skills.md` |

## 2. `direction.attach` (in `_work/<reel>/direction.json`)
```json
"attach": [
  {"at": 23, "what": "question", "seconds": 1.6},
  {"at": 52, "what": "sweat"},
  {"at": 68, "what": "label", "text": "Ye website!", "seconds": 2},
  {"at": 35, "what": "note", "text": "Progress track karo | Kamzor category dekho", "seconds": 3},
  {"at": 90, "what": "image", "src": "stickers/my-bag.png", "to": "hand", "size": 0.8},
  {"at": 12, "what": "bubble", "text": "Bhai sun na!", "until": 16}
]
```
- `at` / `until` = word numbers from `transcript.md` (survive re-cuts); or `seconds` (default 2). `delay` = frames after the word.
- `to` (anchor, optional: each prop has a default): `eyes leye reye nose mouth chin head face hand hand.L hand.R finger finger.L finger.R shoulder.L shoulder.R neck screen`
- Optional: `offset [x,y]` (100 = his face height), `size`, `text`, `color`, `screen [x,y]` (for `to: screen`),
  `enter pop|drop|fade|draw|slide|none`, `idle bob|wiggle|pulse|spin|float|none`, `exit pop|fade`, `tilt`, `behind` (under a
  person cut-out: slow, ~0.6s/frame), `sound` (pop/whoosh/hit/tick/click/soft-whoosh folder in public/assets/sfx, or null).

| what | default anchor | use for |
|---|---|---|
| sunglasses (drops in) | eyes | "deal with it", flex, confident line |
| crown / halo / horns | head | king move / innocent / mischievous |
| anger / sweat / question / exclaim / bulb / zzz | head (side) | frustrated / nervous / confused / surprise / idea / boring |
| blush / tears | eyes (cheeks) | embarrassed, cute / sad, fake crying |
| hearts / sparkles | head / face | love it / "clean", magic |
| fire | hand | "this is fire", hot take (only when a hand is clearly in frame) |
| bubble / thought | mouth / head | a line he says to someone / his inner voice (Hinglish, Roman script) |
| label (arrow, draws on) / circle (draws on) | face | point at a thing, highlight it |
| note (sticky note, items split by `\|`) | screen | 2–4 key points of an informative video |
| image (`src`) | face | any sticker: cut from his footage, a library PNG, a picture he gave |

Bubbles, labels, notes and images flip to the roomier side and stay inside the frame (Instagram UI zones kept clear).

## 3. Workflow
1. Read `transcript.md`; mark the moments (emotion, idea, key point). Decide 0–4 props. Story first.
2. Hands: check the motion track says a hand is really there at that time (`hands` in motion json) before anchoring to it.
3. Objects as stickers: find the frame where the object is clearest (`scripts/char-inspect.py frame …` or ffmpeg),
   run `sticker.py --point` on it, look at the check image, save into `_work/<reel>/` and use `{"what":"image","src":"<file>"}`.
4. `npm run reel -- <name> --no-render`, then `node scripts/still.mjs <name> <frames…>` at every prop. LOOK at them.
5. Render. Check the real file (frames + sound). Add what he liked / disliked to `brain/preferences.md`.

## 4. Limits (measured on his footage, 2026-10-08)
- Face points are solid (582/584 frames). Head top = estimate; tilt follows the eye line.
- Hands: Vision misses partial/blurry hands and sometimes "finds" one in a towel or his face. Filters (skin colour, not on
  the face, seen in 2 of 3 samples) remove most. Fingertip labels get jumbled in close-ups: anchor to `hand` (palm) for safety.
- No body pose in close-up selfies (no torso visible): shoulders are estimated from the face.
- Intel Mac: no MediaPipe (Apple Silicon only); tracking ~1.5s per second of video.

## 5. Growing the toolkit
- New prop: one entry in `PROPS` (`src/motion/props.tsx`): default anchor/size/motion + an SVG drawing in 100-unit space
  (100 = face height). Thick dark outline (`INK`, `W`), flat colours: keep the house style. Add a row above.
- Track any object (not just him): Vision `VNTrackObjectRequest` from a box: next step when a video needs it.
- Ideas backlog: lip-flap mouth for a sticker character, a dog/cat character from a cut-out with a squash-and-stretch rig,
  stickers that land ON a tracked object (hold in palm), confetti/money bursts on punchlines, J/L-cut sound leads (craft.md).
- Pictures from the internet: only free-licence sources, and ask him before downloading anything.
