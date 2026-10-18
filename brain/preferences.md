# Siddhesh's editing preferences: HISTORY (learned from feedback)

The dated story behind every rule, newest at the bottom. The CURRENT rules live in brain/rules.md (sorted by topic,
contradictions resolved). After every round of feedback: add the dated note here AND update the rule in rules.md.

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

- STORAGE (2026-10-11): ALL data on the T7 (Library, _work, output, inbox, projects, references, meme-sources). The Mac keeps only the reusable system (code, tools, models, fonts). Mac work while the T7 is unplugged is moved to the drive automatically on the next run. Renders never leave temp files behind (incl. crashes and plan-only runs; --studio keeps them on purpose).

## Learned 2026-10-11 (clipping day): my edits were flat. Why, and the rules that fix it
- His verdict: "you just caption and leave everything. There is no kind of editing." He taught me vectors, motion graphics,
  character overlays and SFX, and the clips used none of them: captions + zooms + one hook line.
- Causes (mine): graphics are opt-in fields, so the default render is captions only; I read the restraint rules as
  "add nothing" (safest = emptiest); the day's time went to plumbing (downloads, sync, fonts); my checks hunt for errors,
  never for "is this gripping?".
- RULES (these override any restraint wording elsewhere):
  1. Restraint = ONE idea at a time, not ZERO ideas. A 20–30 s reel needs something new to see or hear every ~2–3 s
     (vector/graphic, UI frame, b-roll, camera move, real transition, sound). Captions alone are not editing.
  2. Before rendering, write a beat-by-beat VISUAL PLAN: for every line, what the viewer sees besides the face and what
     they hear. "Nothing here" needs a reason, not the other way round.
  3. When the speaker describes something visual, SHOW it. Misses from today: "pie chart, 20% for this, 30% for this" →
     an animated pie chart; "equity, not cash" → cash turning into a share certificate + $1M counter; "me, my tripod, my
     iPhone" → phone/UI frame; "Birkin vs kids' college fund" → two vector cards. If the asset doesn't exist, build it on
     the spot as a reusable layer (CLAUDE.md "Freedom to create").
  4. Use what already exists first: direction.attach (motion-graphics skill), cards, CardStage / CircleReveal / NumberRoll,
     character overlay, SFX library, transitions at real picture changes.
  5. QA as a viewer: watch the whole thing at 1x with sound and ask every ~3 s "why would I keep watching?". Error checks
     (sync, cut-offs) are necessary but not the goal.
  6. If infrastructure is eating the day, say so and protect time for the creative pass.
- His decision: clipping isn't worth it for him; focus on his own content (see brain/clipping.md).

## Learned 2026-10-11 (Chandigarh vlog, first look at the vlog graphics)
- Vlog captions: MrBeast style, not plain subtitles. Big heavy font, thick outline, a few words at a time, pop-in,
  key word in colour. When a caption would cover the action (a face, the object he's showing), move it for that shot.
- More MrBeast-style illustrations (arrows, circles, pop labels, emoji-like stickers, punch-in zooms), not only
  clean minimal titles.
- NEVER point at a person with a name/label unless I know who it is. I confused his friends. Get a labelled face
  sheet from him first, then place tags by face detection, and only where the face is clearly visible.
- (2026-10-11, vlog) He was frustrated that I didn't use the rulebook/features: memes, sound design, magnetic-mask
  cut-outs, canvas moves, zooms. Before rendering ANY video: walk brain/edit-layers.md pass by pass and use the
  library. A friends vlog = funny + poppy + beat-synced; photos hang over footage; heroes intro each friend.
- Music he gives = the backbone: use it in sections all through the video, beat-synced (see brain/vlog.md).

## Learned 2026-10-12 (Chandigarh vlog, his notes on the v2 preview)
- NO EMOJI graphics: "so low effort". Use meme stickers, meme voices, punch-zooms, pop text with a real joke instead.
- Cold open = short and INTENSE: big face zooms (1.3–1.6), tension/shiver sound under it, meme sounds on the beats
  (fart on the reveal, hmmm, faaah). Variety: never the same meme sound twice in a row.
- Captions: karaoke (spoken word lit), centred, big, timed to the REAL audio (Whisper word times + my corrected text),
  on EVERY understandable line. Even-spread timing looked wrong. Group noise clips can't be captioned honestly.
- Filters: his original colours + rich grain, a touch more contrast and vibrance, slightly deeper mids. No vignette.
- Text must carry the friends' actual inside jokes (he supplies them: "drunk dance", "thul thula Hrushi",
  "PAISA BARBAD", "we don't smoke weed, we smoke money", hero titles). Ask/listen for these, don't invent bland ones.
- Show real numbers when there are any (punch score 308 read off the machine display; push-up counts he gave).
- Music must NOT run under real conversations: drop out, come back on a beat with a different song section.
- Two cuts: a tight ~10 min version AND a long 20+ min one that keeps every moment and conversation.
- Censor (pixel mosaic, tracked) only on crotch/butt moments, never chests. Crude labels are his call.
- He's fine with the drinking content (night 2, "drunk manager"); no need to hide it.

## Learned 2026-10-12 (after the Chandigarh vlog): step by step, and ask me for memes
- His words: the steps "should be one by one, step by step, so that you don't miss anything". The vlog had no vector
  graphics or illustrations ("it didn't even think of doing that work"), and nothing asked him for memes.
- Measured: 104 graphics, but 37 pop texts + 18 hanging photos; 7 meme stickers in 11 min; 2 arrows, 1 circle; no
  vector illustrations/props/bubbles; 66% of the runtime in 6 s+ stretches with nothing new added.
- He WANTS to be asked: "even if it is just some expression memes, I can search on Google and provide them", building a
  stack of stickers, memes and GIFs over time. Every video now has an asset-request checkpoint (pass 9).
- New sessions didn't follow the layer method because it was only prose among ~15 auto-loaded files and nothing checked
  it. Now: the edit-video skill + plan.md + a render gate in code (brain/edit-layers.md "Enforced").
- Standing permission (2026-10-12): "whatever makes the video better". Changes to the system (like the render gate)
  don't need his explicit request if they clearly improve the videos; explain them afterwards.

## Learned 2026-10-12 (cuts + "make it for everything")
- "You just speed up the long recordings": the cut vocabulary he taught (jump, J/L, match, cut on action, smash, ramp,
  dissolve) was documentation only. Now built for vlogs, and plain fast-forward of people is a blocking check.
- His ask: everything he ever taught must be BUILT and CHECKED like that, not just written down. Now every technique
  lives in scripts/lib/techniques.mjs → a checklist in every plan.md (mark used / not used with a reason) +
  brain/coverage.md (66 techniques: 65 built, 1 parked on purpose: subject separation, because he chose the v1 look).
  Rule for the future: a new lesson from him = a line in techniques.mjs (+ a lint rule if a computer can check it).

## Learned 2026-10-14 (ready-made skills he collects)
- He brings ready-made skills/pages other people made ("so that you can use it"). My job: read each fully, keep what
  makes HIS videos better, adapt it into brain/ + techniques.mjs (so every new chat uses it), and say plainly what I
  skipped and why. Never install something that would hijack the edit route.
- scriptwriter-skill (fiction series, Chinese screenplay format): adapted → brain/content-brief.md §10 + write-script skill.
- meme-maker (20 classic templates): integrated as meme cards (scripts/memecard.mjs); his current Indian memes first.
- video-editing skill (generic FFmpeg/Remotion/ElevenLabs pipeline, Downloads): NOT installed. ReelEngine already does it
  in more depth; it pushes AI voiceovers and CapCut hand-finishing, and would take over "edit the video".
- Jason Cooperson's "Claude Video Editor" blueprint: adopted the parts that beat ours: cut audit (no clipped words),
  two-pass loudness (no pumping), secrets sweep (blur private info on screens), hero-frame cover picker, YouTube 4K
  upload. The rest is Premiere/Resolve/CapCut plumbing he doesn't need.

- 2026-10-14: music must follow the story by mood, not one bed; silences where a joke lands or fails; transitions between tracks overlap with proper fades / on the beat, never abrupt (his words: "it should not sound bad").
- 2026-10-14: "sometimes my face is yellow / things too warm, like a hot environment": colour must complement his skin tone, not change it, and adapt per clip and light. Also: learn from existing tools (GitHub repos, his resources) instead of only trial and error. → skin balance (method borrowed from AKMessi/vex), automatic on reels.
- 2026-10-14 (later): angry at skin balance treating his words as hard rules: an orange light can be the mood; flat/grey footage needs grading, not "keep as is"; use trained models from GitHub; be efficient with tokens. → skin balance off by default, trained auto-grade model (scripts/autograde.py) tested.
- 2026-10-15: compared 6 versions on 3 of his raw scenes → "our earlier look was the best, make it final; remember the logic, not the parameters, scenes will change". → scripts/lib/look.mjs adapts each knob by its reason; the trained model is parked (lost to raw).
- 2026-10-15: "Claude never uses real images (memes, topic logos)": wants me to go find the right pictures myself and choose them deliberately, not random ones. → scripts/findimg.mjs (Wikimedia, Openverse, GIPHY; one sheet per moment, I choose).
- 2026-10-15: "is it the highest quality, HD?" (the downloaded logo looked low quality to him; it was the preview sheet, the file is an SVG; the GIF really was 380 px). → every found picture/GIF under HD is upscaled with Real-ESRGAN before it enters the Library.
- 2026-10-15: no upscaling: memes/GIFs as they come; pictures (logos etc.) must be the best real quality. GIFs: search the meme side of GIPHY (giphy.com/search/memes): universal, relatable memes (IShowSpeed, cartoons, as examples only), not too foreign. Removed the Star Trek facepalm.
- 2026-10-15: "for God sake don't use image memes": memes must be GIFs or videos with sound. → still memes + meme cards banned (check blocks them); silent GIPHY GIFs get a Library meme sound (GIPHY clips with sound need a paid key).

- 2026-10-16: charts in empty boxes look wrong; "whole frame is yours": graphics without boxes, entering/leaving through the frame edges, everything united instead of separate clips.
- 2026-10-16 (later): the unboxed chart overlapping his face card = "fucked up". Earlier concept was right: the video goes, THEN the chart. One main element, others only support; the viewer must always know what to watch.

## 2026-10-17: face vs graphics in explainers + illustrated objects
- He wants explainers like Varun Mayya / Anurag Bansal: his face used little, beautiful illustrations of the things
  he mentions so viewers follow the story, animations close to the references. Measured the references (face 31 %
  on YouTube, max 12 s; reels: hook + one proof line) → rule in rules.md + explainers.md "Face vs graphics".
- Built direction.illos (Illos.tsx): drawn-on vector objects that act out his words (printer prints his bill,
  globe + orbiting satellite, bulb, coins, beaker, clock, stamp, any SVG). Stills shown; verdict pending.

- 2026-10-17: "study every animation in the references up close, frame by frame … think how you can create things of
  your own for different new topics, that's the main system." → every animation of the 7 references studied at 5–10 fps
  (notes on the T7: references/library/animation-study.md) and turned into brain/animation-system.md (the method + motion
  dictionary), read in the visuals/motion briefings. Ghost captions now build line by line; chart bars rise on their word,
  ranges are hatched bands, bars can start equal and shrink.
- 2026-10-17: showed two isometric illustrations (green city on a floating board with wind turbines; road crossing with
  factory, turbines, pines, cars): "can the things we make people visualise look 3D like this, decided per topic?"
  Charts stay 2D ("they look beautiful flat"). Built direction.iso (src/layers/Iso.tsx, brain/iso.md). Verdict on the
  test stills (city rising, turbines, 3D bars, road + factory): "Yes, the 3D look is right. Use it in my explainer
  videos when the topic fits."
- 2026-10-17: "find GitHub repos yourself, take the code, keep them; the brain must know what tools exist so it never
  misses something it could have built." → 19 repos (MIT/Apache) cloned to the T7 toolbox/repos, mapped in
  brain/toolbox.md (HAVE / PORT / IDEA by pass, read in every briefing), scripts/toolbox.mjs to search them.
- 2026-10-17: on the evidence cards (article/website captures): "even if the screenshots are long, scroll them and present
  them so they're visible in the video: zoom and properly show it. Highlight the line or word that is being spoken, the
  way other YouTube videos do. Animate the website by scrolling: highlight words at the top, and if another topic is
  spoken from the same website, fast scroll and slow down when you reach that location." → direction.evidence page
  TOURS (stops: fast scroll with a slight zoom-out and motion blur, slow arrival, each stop's line marked on his word),
  every stop zoomed to a readable size (the camera glides along long lines with the marker).

## 2026-10-19: long-form topic ideas must create a "I need to know this" gap
- He rejected 5 Indian pilot ideas I offered (Parle-G shrinking pack, Amul ad spend, ATM recalibration for new notes,
  Paytm Soundbox, quick-commerce apps looking alike): "very common", "already on YouTube", "people already know what's
  in it". On the notes idea: fine INSIDE a video, but "why would I click that title?". On Paytm: "you are giving away
  the answer and the question in the same title".
- What he liked (his earlier list): Adobe paid $1B for a company it never bought, Apple sued Samsung over rounded
  corners and won, Cadbury tried to own a colour and lost, Netflix built its own font, Jaguar stopped selling cars then
  changed its logo, OpenAI paid billions for a company with no product. Specific name + impossible result + current,
  answer hidden. Global design-business drama is fine; "make it Indian" was my rule, not his.

## 2026-10-19: long-form scripts, final format
- "Whatever the idea is, even a long-ago idea, it should feel very relevant at this time. The title too."
- "Don't keep my take blank. Write something for it from my side. I don't want to think a lot… I can manipulate your
  script a little, but give it so I can just speak it out."
- Script files in a text format that opens anywhere, with all reference links, so he can hand the file + his recording
  to the editor and it has all the knowledge to edit completely. "Make it final so this context isn't needed in every chat."
  → brain/templates/longform-script.md, saved to projects/<slug>/script.md; rules.md + write-script skill + edit-video.
- Agreed the episode formula: a small-news-style title as the door, then the general concept, then where else it applies.
- Same day, later: "I hope you haven't made it very formula-like… it should feel human, not structured, not
  repeating the same things, not high-level language… the editor isn't able to get the context." → two files:
  script.md (only what he says, plain words) + editor-brief.md (whole context for the editor). The 9-beat anatomy in
  longform-scripts.md is a toolbox of moves, not an order to follow.
- Same day: "Cybertruck's topic is old, it can be part of the video but not the title… the Roadster news is current.
  You are not aware of current news. We have to act faster… make something that makes you aware every day… so we
  are the first ones to make the video. That's our main advantage." → daily 8 AM news radar task + freshness ranking
  in the ideas doc (Roadster now #1).
- Same day: "It should be very, very engaging… very hook kind of thing, story formatted, because people like to
  listen to stories. They don't want a lecture." → story rule in rules.md + longform-scripts.md §7c.
- Same day, roast #3: "Tesla taken $250,000… finally saw the car… the title is very bad… what is it sparking in
  people? Not attractive enough to click, no idea what I'll get… understand how Anurag writes titles, how consumer
  friendly." He shared Enrico Tartarotti's full title list next to Anurag's: "Enrico is UI side, Anurag product
  management side; we have to find our own category." → Title rule (round 3) + our lane in longform-scripts.md;
  Round 3 table in the ideas doc; radar task now proposes titles in our lane.
- Same day, roast #4: "Now all the titles are very general… even if you write Cybertruck or Tesla you could have gotten
  views… if we talk about Netflix's font inside, why not in the title… give me multiple options (general, specific)…
  the Roadster delay wasn't a strategy, they just couldn't make it… the video should be insightful, the insights
  detailed enough to write scripts." → Title rule (round 4) + Round 4 deep briefs in the ideas doc.
- Same day, roast #5: he hated the Cybertruck idea at #1: "I'd just get one insight, the steel is not bendable…
  research a lot… a very dense informative video in the easiest story possible… not one fact covered in a long
  video." → density rule (≥ 8 insights) in rules.md + longform-scripts.md; Cybertruck and Apple-icons ideas dropped;
  font brief researched to 11 insights as the model.
- Same day: "people have one thing in the thumbnail and one in the title, related but separate… study what works…
  save every thumbnail and their ideas in the reference… tell me which kind of thumbnail can be made where… is
  having a face getting views or not?" → brain/thumbnails.md (split rule, 8 types, face data) + T7
  references/thumbnails/ (153 thumbnails, INDEX, contact sheets). Face verdict: helps Anurag, hurts Enrico; the
  picture's idea matters more; test with YouTube Test & Compare.
