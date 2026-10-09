# Drawing / process videos: playbook (proven on `alcoholmarkers`, v1 → v6, he loved v6)

What he gives: many clips, often HOURS, of drawing/unboxing, usually no voice, landscape phone footage. The job: find a story
people relate to, shrink hours into ~30–35s, write his VO to the picture, and keep every shot readable.
Reference: `_work/alcoholmarkers/timeline.json` (v6, with a "why" block explaining each choice) and `output/alcoholmarkers/CHANGELOG.md`.

## The process that worked
1. **Watch everything cheaply:** `scripts/sheet.mjs` contact sheet of EVERY clip, then dense sheets of key ranges for exact
   in/out points and real-time moments (a stroke, a slash, a cap click). Never decode hours at full quality to decide.
2. **Check orientation in every range you use.** He rotates the phone mid-recording: paper upside down (→ `rotate: 180`) or
   sideways (→ `rotate: 90/270`; a sideways landscape clip turned upright fills 9:16 perfectly), or skip the stretch.
3. **Find the story:** HIS story, first person, around a problem MANY people share ("I can't draw trees"). Not a tutorial
   ("tum aisa karo"), not a niche personal story. Pull the strongest before/after moment to the front as a cold open.
4. **Give hook options first** (English text + what the first 3s look like); he picks the direction. See brain/hooks.md.
5. **Cut the picture, then write the VO to it** in PRESENT tense Hinglish, one line per beat, with a loop line at the end.
   Deliver `-vN-vo-guide.mp4` (lines + timer burned in) so he can record while watching.
6. **After his VO:** captions, English hook text, sound design, motion graphics (final stage, see "Still to build").

## Craft rules (each one learned from a mistake)
- **Never default** (RULE 1): choose the style per beat and say why. Mix on purpose:
  time-lapse = progress · speed ramp (`rampTo`) into a real-time stroke = technique + sound · jump cuts = beats like unboxing ·
  floating `cards` over a running background = "lots of practice" without cutting away · continuous time-lapse = big build-ups.
- **Readable pace:** no shot under ~1s. 0.45s cuts confused him. Hook energy comes from slow-mo, push/pull zoom, a text slam
  and sound, not from the number of cuts.
- **Hook = most edited part** (slow push on the "bad" result → slow-mo moment → pull-back reveal), then normal pacing.
- **Colour per clip, not one filter:** per-segment exposure is measured (paper white → shared target, nothing clipped), then a
  light shared look (contrast ~1.04, vibrance ~0.2 instead of saturation, light vignette, grain). One global whites-lift blew
  out the bright clips.
- **Stabilize handheld shots only** (`stabilize`: vidstab, value = smoothing); tripod time-lapses don't need it.
- **Endings: no automatic fade.** A loop (last line flows into the first line, hard cut) or a hard cut on the payoff.
- **Honesty:** if a drawing is from a reference (Pinterest), the VO says so.
- **Final reveal:** start close on the meaningful detail (him in the drawing), ease back to the whole artwork.

## Tools
- `scripts/sheet.mjs <video> <out.jpg> [--from --to --n --cols --w]`: timestamped contact sheet.
- `scripts/process.mjs <name>`: renders `_work/<name>/timeline.json` → `output/<name>/<name>-vN.mp4` (+ VO guide + script +
  timeline copy + CHANGELOG). Segment fields: src, in/out, dur|speed, rampTo, rotate, fx/fy (+toFx pan), zoom/toZoom (+zx/zy
  centre, eased), mode fill|fit, hold, stabilize, exposure, audio, vo. Reel fields: look, endFade, cards
  [{src, in, out, dur, at, from, y, w, aspect, tilt, fx, fy, zoom, rotate}]. Speed ≥ 60× decodes keyframes only.
- Gotchas: macOS writes `._*` files on the T7 (filter them); `vidstabdetect accuracy=12` corrupts the .trf in this ffmpeg build.

## Still to build
- **Final stage for process reels:** feed the picture-locked cut + his VO into the Remotion pipeline (captions from the VO
  transcript WITHOUT silence-cutting the picture, hook text, sound design, CircleReveal/NumberRoll/cards from src/templates).
- `scripts/activity.mjs`: per-second change score → idle vs active stretches, to find moments faster on long footage.
- Long-form 16:9 mode (YouTube: chapters, calmer time-lapse, no crop) and beat-synced cuts.
