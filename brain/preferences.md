# Siddhesh's editing preferences (learned from feedback)

Newest at the bottom. Every rule here overrides defaults. Add to this file after every round of feedback.

## Language & captions
- Captions and transcripts in **Hinglish**: Hindi in Roman script the way people type it, English words in normal spelling. Never Devanagari, never translate Hindi into English.
- Whisper's English mode can silently TRANSLATE Hindi. Always verify Hindi stretches (two-pass transcriber does this); fix spellings in `hinglish.json`.

## On-screen text
- **Never show the same text twice in one frame.** No pop-up that repeats words already in the visible captions (e.g. caption "confused" + pop-up "CONFUSED?" = bad; "Step 1" caption + "STEP 1" pop-up = bad).
- The top half is for **memes / reactions**, the bottom for captions. A highlighted caption word at the bottom + a matching meme at the top is the ideal combo.
- Loved: the 3D hook ("Raat ke 3:45 ka idea"), 3D pop-up animation quality, script-accent captions with glowing keyword.

## Sound
- Whooshes were too many and too abrupt. Whoosh only on real transitions, quiet, with a fade-in.
- Prefer **variety**: context-matched meme sounds (question → confused-cat "huh", fail → moye moye / faah, etc.) over generic whooshes.
- Copyrighted meme sounds are fine (posting on Instagram). Wants **current Indian viral memes**, not only international ones. Meme clips can appear as floating/peeking cards.

## Workflow
- Wants me to do the work directly, not hand over instructions.
- Footage lives on the T7 drive (`/Volumes/T7 Shield/ReelEngine`); the Mac has little free space.
- Batch: many clips in a project folder → transcripts first, arrange, cut, then effects; touch as little footage as possible.
- Show progress honestly; never present a test render as the user's video.
- Don't fear trying new things: templates are starting points, always try to improve on them.

## Memes & stickers (learned 2026-10-08)
- Meme library built from his cat compilation: 29 green-screen cats → transparent stickers (`Library/stickers/`). Tool: `scripts/memes-extract.mjs` (key 0x4BBA45 at similarity 0.10; 0.17 made cats see-through).
- Trim repetitive meme audio to ONE punchy hit (the "huh" cat = first huh only, 0.95s).
- Boring/quiet meme sounds → turned down (idle fillers at 30% volume, silent ones stay silent). Short punchy sounds (huh) stay loud.
- Variety of entrances, not just one swing: peek from left/right edge, pop in top corners, drop from top. Never over the face: beside the head.
- Boring stretches (no visual event for ~8s) → an idle cat peeks in from a corner to keep people engaged.
- He's happy to tag emotions himself if mine are wrong; ask him to review tags when unsure.

## Story first, restraint (learned 2026-10-08, applies to EVERY reel)
- People should focus on HIS story. Never several things at once. Add a meme/effect only when very sure it fits; otherwise nothing.
- His voice is the main hearing point: meme sounds wait for the next pause after the cue word and duck to 30% if they overlap speech. Effects are level-matched (-20 LUFS) below the voice.
- Meme budget: about 1 per 12s (style.memes.secondsPerMeme). Idle fillers only for long empty stretches, and only within budget.
- Long/loopy memes: use a short part; if the clip ends abruptly, cut; if it's continuous, fade out (fadeOut on trimmed sounds).
- Silent action stickers (cats moving without sound) are good: visual engagement without audio clutter.
- Meme sound fades (natural fade-in/out tails) need their time. Don't chop them.

## Comedic beats & screen effects
- Bad/useless line → he finishes the line, THEN a silent freeze (~1s) in black & white + dark vignette, and the fart/bruh plays in that silence. Never under his words. (direction.beats: {after: wordIndex, tag: 'bad-take', seconds, effect: 'mono'})
- Angry, rising voice → red burning look + slight shake over that line; fade out or hard cut depending on the scene. (direction.effects: {from, to, type: 'rage', end: 'fade'|'cut'})
- Automatic detection is strict on purpose (anger needs angry word + voice +5dB; bad-take needs a 'bad' word ending a sentence + pause, max 1). Claude adds subtler ones by hand when directing.

## Emotion nuance
- Laughs differ: laugh-sarcastic (talking cats), laugh-warm (laughing/dancing cats), laugh-silly/goofy (grey face, tutu, GopGopGop). Pick by the intention of the moment, not just "laugh".
- Sound library from his pack (sfx-*): faaah (shock/fail), among-us-reveal (sus/plot twist), dexter (evil plan), fart-reverb/fart-short (bad take, beat), bruh (awkward), punch (impact), gopgopgop (goofy), few-moments-later (time skip, beat), anime-wow (impressed), romance (love/blush), taco-bell-bong (awkward realization), ack (caught off guard), prowler (sneaky).

## Library & taste (learned 2026-10-08)
- Everything lives in `Library/` (visible): `stickers/`, `sounds/`, `rejected/` (his "useless" ones: never use), `wanted/` (empty, to fill). Each item: own folder + about.txt. New extractions go straight there.
- His sticker review: sleepy (long/boring stretch or long stare, corner), yawn (boring), yapping (he yaps a lot, corner), wtf-shocked (shocking thing said), happy-dance (happy), pain, huh (THE huh meme: question marks), sus-drip / sus-caught (Among Us drip: caught doing something), sarcastic-look, drunk-zoned (zoned out, good beat, fun), soft (best soft), disgust. cat-dance = low priority. 2 cats unrated → not used until he reviews.
- NOT mechanical: no fixed rotation or formula. Placement follows meaning, with natural variation. Don't repeat what recent reels used (brain/usage.json). If the reel is engaging enough on its own, add nothing.
- Prefer story-linked choices over keyword triggers (e.g. sleepy cat on "middle of the night" in a 3:45 AM idea reel).

## Intention over keywords (learned 2026-10-08, after the cat version of img-1391)
- A meme must show HIS attitude at that moment. "samajh me nahi aata" inside his example pitch is him talking TO the viewer, not him confused → a huh cat there felt random. Keyword matches are not enough; if the intention isn't clearly his emotion, add nothing.
- Shorter is better: cut him re-explaining the idea, trailing "and yeah, this is the crux…", and fillers ("ya phir kuch bhi ho"). img-1391 went 51s → 34s.
- NO slide/whip/tilt transitions inside one continuous shot: they promise a scene change that never comes. Transitions only where the picture really changes (different clip / B-roll).
- Movement should come from the camera instead: face-tracked zooms (Apple Vision via scripts/facetrack.py), a lagged camera that follows his head, slow push-in / pull-out at new sections. Later: hand-gesture punch-ins, nod tracking.
- Automatic idle-filler memes stay OFF when Claude directs a reel whose story carries itself (direction.fillIdle = false).
- Night selfie footage has motion blur from the phone itself; strong zooms make it more visible. Keep zooms modest on soft footage.

## Learned 2026-10-08 (v2 round)
- Hooks/headlines may sit right at the edge of clickbait: exaggerated curiosity is OK *as long as the video does talk about it*, even if the payoff is less dramatic than viewers imagine. Never an outright lie.
- STORAGE: the Mac is scratch space only. All working files (_work), versions and outputs live on the T7. Temp copies on the Mac are deleted right after each render. Never leave clutter for him to clean.
- VERSIONS: never overwrite. Each render = output/<reel>/<reel>-vN.mp4 + transcript + CHANGELOG.md entry saying exactly what changed. Keep everything he didn't ask to change.
- He liked: the huh cat on "confused" and the sleepy cat on "late night" (img-1391). Those were RIGHT: removing them in v1 was my mistake. Good keyword+intention matches are welcome; random ones aren't.
- He likes the premium film look (grain, grade). Keep it.
- ENDINGS (replaced 2026-10-09): keep a concluding line if he has one and don't clip the last word (~0.3s tail), but NO fade (see below).
- Hook keyword shows 2.5s then disappears so the story takes over; it can sit BEHIND his head (person cut-out via scripts/personmask.py) with small words readable on top.
- Corner stickers must sit above the head (uses face tracking), never on his hair/face.
- He says he's not an editor and is just dumping thoughts: I decide what works best and explain why.

## Final Cut + framing (learned 2026-10-08)
- Every render also writes `<reel>-vN.fcpxml` (by default; it's free). Clips point at the ORIGINAL full recordings with in/out points, so he can drag edges in FCP to extend. Captions = editable titles, memes/sounds = connected clips, camera moves/beats = markers, finished MP4 = disabled reference lane. Validated against FCP's own DTD.
- The exact Remotion graphics (3D captions, film look, face camera, text-behind) can't be native FCP; a transparent graphics overlay is possible ON REQUEST (doubles render time).
- Stickers must be FULLY inside the frame (v2 had the huh cat's head cut off at the top). Text must be big/contrasty enough to read; respect Instagram UI zones. See brain/skills.md checklist.
- img-1391 is a TEST reel for learning, not for posting. The point is to build skills + taste.
- His iPhone footage is 10-bit HDR HEVC (HLG) with variable frame rate. DONE: HDR is auto-detected and tone-mapped (hable) when extracting; without it skin looks grey/washed out.
- UPDATE: the FCP project rebuilt from original footage lost the whole look (all defaults) → he found it useless. Default is now the RENDERED reel bladed at every cut (exact look, trimmable, not extendable). If he doesn't use it, drop FCP export entirely.
- Caption/font sizes are PERFECT for mobile as they are. Don't change them. The readability checklist is for NEW elements only.
- Topic effects (winter snow, summer heat, rain, confetti, money, hearts…): build each the first time a video actually needs it, then keep it in Library for reuse. Don't pre-build a pile.

## Character overlays (learned 2026-10-08, first test; awaiting his feedback)
- He wants vector characters living in real footage: walking flat on walls, interacting with objects, ~10s with a little story. See brain/genres/character-overlay.md.

## Mood & clutter (learned 2026-10-08)
- MATCH THE VIDEO'S FEELING. A casual update (under a blanket) gets casual, friendly fonts + light touches, like v1/v2 of img-1391.
  Don't make every video "cinematic/serious/cool"; each video has one emotion to enhance.
- Too much editing ruins it: roughly ~2s per visual idea (not a hard rule). The viewer must understand his story first.
- He'll often bring drawing time-lapse footage (hours of clips): see brain/process-videos.md.

- COLOUR: v1 of img-1391 is his favourite look (original iPhone colours + grain/film look). That is the default; don't 'improve' it unasked. See brain/color.md.

## Process / drawing reels (learned 2026-10-09, alcoholmarkers)
- His reaction to the first process cut (story from unboxing → test → before/after trees → big piece, VO guide): "wow, just wow, too good". Keep this structure as the starting point for drawing videos.
- ORIENTATION: he rotates the phone mid-recording. Check every used range for sideways / upside-down paper (dense contact sheets) and
  fix it per segment (`rotate` in timeline.json), or skip the stretch. A sideways landscape clip rotated 90° fills 9:16 perfectly.
  I missed an upside-down tree in v2; he noticed immediately.
- COLOUR for paper/drawing footage: he wants it to pop a little: grain + slight contrast + VIBRANCE (not saturation). The real
  fix was exposure: paper came out grey (Y max ~190) → lift whites (colorlevels 0.84) so paper is white without clipping (Y max < 235).
- Honesty in VO: the big drawing was a Pinterest piece he copied and modified (himself in his first-year room). Say so in the VO
  ("Pinterest pe dekhi, apna twist diya"); never present a reference as fully original.

## Learned 2026-10-09 (alcoholmarkers v3 feedback)
- GRADE PER CLIP, not one global filter. One whites-lift fixed the grey-paper clips but pushed already-bright clips
  (unboxing, white marker bodies, big drawing; Y max 243–253) over the edge. Method: measure every segment (signalstats
  YHIGH/YMAX, paper white), correct each to a shared target (paper white ≈ 215–225, nothing above 235), THEN one shared look on top.
- EDITING STYLE is a choice, not a default. Don't turn every long process into a pure time-lapse: mix time-lapse (progress)
  with jump cuts to real-time moments (a stroke, a blend, the cap click: texture + ASMR) and stage jump cuts (same framing,
  drawing visibly further along). Say WHY I picked a style.
- ENDINGS: no automatic fade-out. Decide per reel: a loop (last frame/line flows back into the first, so the viewer rewatches
  without noticing the end) or a hard cut on the payoff.
- NO FADE-OUT AT THE END OF ANY VIDEO, EVER (his words: "it looks bad", 2026-10-09). style.json endFade = 0; process.mjs has no fade option.
- He expects the premium/motion learnings (cards, CircleReveal, NumberRoll, text cards, sound design) to show up in the final
  edit. Picture-lock versions must be clearly labelled as such, with the graphics plan stated up front.

## Hooks (2026-10-09)
- Hook text in English, title-like, slightly clickbait. Give him 3–4 hook options first; he chooses the direction.
- He liked the cold open built from mid-video clips (crossed-out tree → marker trees). Heaviest editing goes in the hook
  (MrBeast-style density), then normal pacing. See brain/hooks.md.
- RULE 1 (in CLAUDE.md): never default, always think creatively and give the reason for each choice.

## Learned 2026-10-09 (v5 → v6)
- VO TENSE: present tense for process/journey stories ("nahi banta", "try karta hoon"): the viewer lives it with him. Past
  tense sounds like a report afterwards.
- PACING: 0.45–0.5s cuts confused him ("I'm not able to focus on anything, I might scroll"). Keep shots ≳1s; hook energy
  comes from slow-mo, zoom, text slam and sound, NOT from cut count. "MrBeast density" ≠ unreadable.
- His idea: one clip keeps running in the background while extra practice slides across in framed cards (timeline "cards").
  Reads as "lots of work done" without cutting away. Awaiting his verdict on v6.
- VERDICT on v6 (2026-10-09): "amazing… flabbergasted, I like it very much". Present tense, calm pacing, floating practice
  cards, continuous time-lapse, loop ending = KEEP. Playbook: brain/process-videos.md.
