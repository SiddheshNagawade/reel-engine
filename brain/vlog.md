# Long-form vlog (YouTube 16:9): playbook (started 2026-10-11, Chandigarh trip; v2 after his first notes)

What he gives: a folder with 1–2 hours of phone clips (mostly vertical, often held sideways/upside down, iPhone HLG HDR)
+ photos (HEIC), from a trip with friends. Little narration, lots of chaos. He wants a YouTube vlog "in perfect pace,
not too short, not too long", in a proper sequence, characters introduced, action kept even when nobody speaks,
a few narration lines (he records them; not the whole video), premium-edit style (brain/expensive.md).

## Process that works
1. **Catalogue** (`clips.json`: duration, size, rotation, creation time, HDR). Creation time = the story order.
2. **Watch cheaply**: one contact sheet per clip (`scripts/sheet.mjs`, n ≈ duration/7), one tiled sheet of all photos,
   dense sheets (16 frames) only for the key action ranges (exact in/out of a punch, an imprint, a stunt).
3. **Transcribe only clips where words matter** (monologues, car chats, late-night talk). Whisper on game-zone noise,
   engines or music outputs garbage ("paad paad paad…") and on an 8 GB Mac runs at 2–8× real time when RAM is
   full (Chrome/Illustrator open). Single Hindi pass (`language='hi'` + to_hinglish) is enough to understand; subtitles
   are then written by hand (English words come out transliterated: "parmanet" = permanent).
4. **Story first**: find the personal hook in the footage (Chandigarh: the mooch dilemma the night before → shave
   time-lapse → reveal), then a ~10 s trailer of the best moments, then the title, then day by day.
5. Write the edit as code (`_work/<name>/make_vlog.py` → `vlog.json`), render `--preview --pieces-only` (960×540),
   check a still of EVERY piece for orientation/framing, fix, then the full render.

## Format decisions (and why)
- 16:9 1920×1080 because it's YouTube long-form. Vertical clips are NOT cropped to 16:9 (soft + heads cut):
  - one vertical clip → `card` (rounded card on a darker blurred copy of itself, soft shadow);
  - 2–3 clips/photos of the same moment → `split` (cards side by side, staggered slide-up entrance): his idea
    ("if images are from a similar moment, have them at once");
  - a clip filmed sideways → `rotate` 90/270 turns it into a real landscape shot → `full`.
- HLG HDR: tone-map with the hable chain (`TONEMAP` in media.mjs). The plain conversion looked pale and blew out
  skies; hable gave natural skin (compared side by side on car, park and selfie frames). No warm overlay on top.
- Graphics (src/vlog/VlogPiece.tsx): stamp (time · place), chapter (DAY 1 + title + date), title (letters rise and
  un-blur + script accent), map (route draws itself, train rides along), photos (prints drop in, slight tilts),
  name tag (line from the person to the label), cast (row of face cards), text line. One idea at a time.
- Sound: natural sound levelled to −16 LUFS; music beds ducked by sidechain under speech; real-time chaos moments keep
  their own noise without music (the noise IS the vibe); sfx only on real moments (punch, bell, shutter on photos).
- Subtitles: clean lower-third (Poppins ExtraBold 46 px, soft shadow), only where words matter, hand-written Hinglish.
- Chapters: segments with `chapter` → `<name>-vN.chapters.txt` for the YouTube description.
- Ending: hard cut, never a fade. Chandigarh: he said on camera "is pure vlog ka end banega", so that line ends it.

## His notes on the first look (2026-10-11): what a vlog of his must have
- MODERN, POPPY, FUNNY (MrBeast energy, not cringe). My first version was "too old / boring": clean minimal titles,
  photo slideshows, plain subtitles. Calm-premium (expensive.md) is the wrong default for a friends-trip vlog.
- Captions: MrBeast style (2–3 words, words pop, hot word coloured), moved off faces per shot (`captionLayers` in
  vlog.mjs uses Apple Vision face boxes: bottom → beside the card → top).
- Photos never as cropped full-screen slides: they HANG over the running footage (drop on a string, swing, yank up),
  whole photo visible. Several photos of one moment = several hangs, staggered.
- Characters: South-film HERO INTROS at the start: freeze, person cut out (scripts/herocut.py = Vision instance mask,
  one person at a labelled point), speed-blur world, gold name slam, flash + shake, impact sound. One per friend.
- Never tag a person I haven't verified. Ask him to label a numbered face sheet (people.json); a hidden person needs
  a different source frame (Hrushi was behind him in the group photo → took a clear video frame instead).
- Use EVERYTHING we built: memes (Library cat stickers + meme voices) where the attitude matches, a sound on every
  graphic, punch-zooms + flash on the big beats, push-ins on every shot (the footage is a layer, not the canvas).
- Music: his pick (Ritviz "Udd Gaye"), used in SECTIONS, not once through: analyse the song (beats.json: 72.8 bpm,
  drop 12.02 s, breaks 42/63/96 s), land the drop on each chapter (build-up = lead-in under the previous segment),
  break → re-entry on a mood change, soft intro again for the ending; crossfade sections on a beat; snap every
  non-dialogue cut to the active section's beat grid. Music runs under everything, ducked by speech.
- He asked for a progress + time estimate mid-render: give one up front next time (≈ 2–2.5 h for a 10-min vlog on
  this 8 GB Mac: preview 30–40 min, full 1080p 60–80 min).

## v3 (2026-10-12): tools added
- `make_vlog.py [--long]` builds both cuts from one script (L(short, long) per value); `node scripts/vlog.mjs <name>
  --edit vlog-long.json --out <name>-long`. Pieces are content-addressed (md5 of the segment) so both cuts share renders.
- Hardware encoding (h264_videotoolbox ~26 Mbps) for every piece + Remotion `hardwareAcceleration` → several times faster.
- `sub(src, s, e, text)` aligns my corrected caption words to Whisper word times (difflib); captions are karaoke.
- `censor: [{keys: [[t, x, y, w, h], ...]}]` = tracked pixel mosaic (keys from 3-fps gridded frames of the piece).
- scripts/herocut.py: one person out of a photo/frame by Vision instance mask (hero intros).
- Music runs: talk segments (talk=True or captions ≥ 6 s) end a run; each new run starts on a different strong entry
  of the song (drop / after a break), cuts snapped to that run's beat grid.

## Taste notes / open questions for him
- Alcohol: night 2 has bottles/drinking; v1 keeps the chaos (wrestling, dancing, tucking someone in) and leaves out
  the drinking shots, because the account is his personal brand. His call.
- Friends' names: needed for name tags / cast intro (sent him a numbered who-is-who sheet).
- Music beds are unrated (Library/music): chosen by name only; ask him to rate them.

## Tools
- `node scripts/vlog.mjs <name> [--preview] [--pieces-only] [--only id1,id2] [--note "..."]`
  Pieces are cached per segment (signature), so re-renders only redo changed beats. Graphics pass via Remotion per
  piece (`scripts/lib/vlog-gfx.mjs`, staged into public/vlog-stage only during the render).
