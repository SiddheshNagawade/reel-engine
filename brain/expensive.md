# Skill: making edits look expensive

Studied from a reference video Siddhesh shared ("Make Your Edits Look Expensive", NaughtyyJuan): transcript + every second
of footage, plus 10fps close-ups of its text animations. Notes in my own words. Reference copy: T7 `references/expensive-edits.mp4`.

## The core idea
**Expensive = less, but better.** Cheap edits stack effects because the editor is bored; expensive edits use clean visuals
and ONE intentional motion at a time (think Apple ads). Before adding anything ask: "do I need this, or am I just bored?"
Also: you're biased about your own edit. Judge it like a stranger who doesn't know how much work went in.

## The five levers (in order of impact)
1. **Restraint.** Fewer effects, each with a purpose. Calm backgrounds (plain white / near-black / one section colour).
2. **Typography.** The fastest way to look cheap is the wrong font. Clean bold sans (Inter / SF-style) for body; ONE accent
   style per moment (serif caps + a script word with a soft glow for titles; a heavy condensed font only for single-word slams).
   Small, centred, generous space around it often looks more premium than huge text.
3. **Colour.** Flat footage looks like a school project. Gentle S-curve contrast, slight sharpening, subtle grain. Halation
   (warm glow around small bright lights) only on night / practical-light footage: on bright walls it tints everything pink (tested on his footage).
4. **Sound design.** Every visual movement gets a sound: soft whoosh for motion, impact for big moments, a tiny tick/click
   when text or UI appears. This alone makes a plain text animation feel polished.
5. **Smooth motion.** Nothing linear or stiff: ease-out curves (fast start, long soft landing). In ReelEngine: springs and
   `Easing.bezier(0.16, 1, 0.3, 1)`.

## Techniques seen in the video (frame study) → ReelEngine
| Technique | What it looked like | ReelEngine |
|---|---|---|
| Minimal text cards | short lines on plain white/black, letter-by-letter typing or a soft per-letter wave (letters rise, tilt, un-blur, staggered) | ✅ `direction.cards` modes `typewriter`, `wave` (+ `accentWord` in serif italic) |
| Single-word slam | one huge heavy word ("REALITY", "MISSING IMPACT") | ✅ card mode `slam` (+ hit sound) |
| Frosted text over footage | (adapted for talking head) text on blurred footage keeps the speaker present | ✅ card `bg: 'blur'` |
| Mixed-type title with glow | serif caps + script word, warm glow on black | ⚠️ partly: hook styles + `glow: true` on cards; a dedicated title card is a todo |
| Footage framed in rounded cards on white, triptychs | B-roll as clean "photo cards", 3 side by side | ❌ todo (long-form especially) |
| UI mockups | chat bubbles, notification stacks, button + cursor click | ❌ todo (great for CaptionKaro promos) |
| Circle-wipe before/after | circular mask reveals the graded version | ❌ todo |
| 3D tilted UI plane | screen recording tilted in perspective | ❌ todo |
| Section colour coding | a whole segment on one brand colour (e.g. promo section) | ⚠️ card `bg: 'accent'` |
| Grade: S-curve + sharpen (+ halation) | baked into footage | ✅ style.film `scurve`, `sharpen`, `halation` (default 0) |
| UI/text sounds | ticks, clicks, soft whooshes | ✅ Library sfx `tick`, `click`, `soft-whoosh` (generated, original) |

## Reels vs long-form
- **Long-form (16:9):** this style fits best: the speaker's voice runs over a sequence of text cards, framed B-roll, UI
  mockups and stock footage, cutting every 1–3 s on the meaning of the words. (Needs the long-form mode: still to build.)
- **Reels (his talking head):** use it lightly. One text card or slam at a key line (the face stays the main visual), the
  grade + sound design always. Never stack: card OR meme OR camera move per moment.
- Never show the same words twice: captions hide automatically while a card is up.
