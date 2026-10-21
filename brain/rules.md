# The rulebook: every CURRENT rule, by topic (newest verdict wins)

This is the one file of rules. brain/preferences.md is the history (when/why each rule came); when he gives a new
verdict, add it there with the date AND change the rule here. Each section is tagged with the passes it belongs to
`{pass,…}` (`;vlog` = only for that kind of video): `node scripts/editplan.mjs <name> brief <pass>` prints the matching
sections at the moment of the decision.

## How I work {all}
- Edit route = the `edit-video` skill, every video: plan.md, one pass at a time, a briefing before each pass, two
  checkpoints with him (hook choice; memes/pictures to search). Scripts = the `write-script` skill.
- RULE 1: never a default without thinking. Every choice is made for THIS video with a reason; existing styles are
  starting points (80 % fit → tweak via styleOverride; nothing fits → build it, reusable).
- Restraint = ONE idea at a time, never ZERO ideas. Something new to see or hear every ~2–3 s (reels); captions alone are
  not editing. (2026-10-11 overrides the older "add nothing unless sure".)
- He's not an editor: I decide and explain why in plain words. Do the work, don't hand over instructions.
- "Whatever makes the video better": improve the system without asking, explain afterwards (2026-10-12).
- After EVERY version: his verdicts → preferences.md (history) + this file (rule); new tools → techniques.mjs +
  brain/skills.md; commit + push. A fresh chat must start at the quality of the latest version.
- Never "we can't do that": a moment needs X → HAVE (skills.md) → PORT/IDEA (brain/toolbox.md, repos on the T7,
  `node scripts/toolbox.mjs find`) → build. Find new open-source repos myself, keep the useful ones (permissive licence) in
  the toolbox and the map (2026-10-17).
- Ready-made skills/pages he brings: read fully, adopt what helps HIS videos into these files, say what was skipped.

## Story, hooks, endings {story}
- Hook text in ENGLISH, title-like, slightly clickbait but delivered. Give him 3–4 options (text + first 3 s); he picks.
- First 1–3 s: motion + curiosity + clarity; heaviest editing of the video sits in the hook (zoom, slam, sound), but
  shots stay ≳ 1 s (0.45 s cuts confused him).
- Cold open from the middle (result first) works for him; push it.
- Every hook option passes the 4 checks (hooks.md): topic clear in 1–2 s, impossible to misread, the viewer's own
  pain, contrast A vs B for curiosity (2026-10-14). Story stays first person; the hook points at the viewer's problem.
- His story + a COMMON problem ("I couldn't draw trees"), first person, present tense for journeys. Not a tutorial.
- Shorter is better: cut warm-ups, re-explaining, trailing "and yeah…", fillers.
- Endings: NEVER a fade, any video. A loop back into the first line, or a hard cut on the payoff. Keep his concluding
  line, don't clip the last word (~0.3 s tail).
- Honest: clickbait only as far as the video delivers; say when a drawing came from Pinterest; never invent facts.
- Long-form topics/titles (2026-10-19): a SPECIFIC name + a result that sounds impossible + CURRENT (this year's news),
  and the title must hide the mechanism (never question + answer in one title). Reject evergreen "everyone knows it"
  topics and anything with existing deep videos on YouTube (check with `yt-dlp ytsearch`). Global brands are fine.
- Speed is the edge (2026-10-19): rank ideas by how fresh the news door is (days old beats months old); an older
  story (Cybertruck flop) goes INSIDE a video, never in the title. A daily 8 AM scheduled task
  (designomics-news-radar) writes picks to T7 references/news-radar/LATEST.md: read it before proposing topics.
- Long-form must feel relevant NOW: even an old story needs a 2026 door, and the title is about today's version of
  it (2026-10-19). Formula: news door → named concept → same concept in 2–3 other cases (one Indian) → his take.
- Long-form scripts are speak-as-is and complete: "my take" is WRITTEN for him in his voice (opinion + designer
  insight + one doubt), never left blank; he only tweaks. Never invent things he did. TWO Markdown files per episode
  in projects/<slug>/ on the T7: script.md = only what he says (brain/templates/longform-script.md) and
  editor-brief.md = the full context for the editor: story, look, moment-by-moment, sources, assets, posting
  (brain/templates/longform-editor-brief.md). He records into that folder (2026-10-19).
- Long-form titles (round 5, 2026-10-21, beats rounds 3-4): nobody knows him yet, so the title is a QUESTION or
  strange claim the viewer is itching to have answered, never "I'll tell you about X" or a statement about a company
  ("Why Netflix, IBM And Airbnb All Stopped Paying For Fonts" = dead). Test: would a stranger who doesn't care about
  the topic still need the answer? Make the everyday thing feel strange or owned ("Who Owns The Alphabet?"), keep it
  short, keep one famous name when it adds weight, and stay true to what the video delivers.
- Thumbnail prompts (2026-10-21): give COMPLETE, ready-to-paste ChatGPT image prompts that produce the final
  thumbnail as-is: exact text in quotes with font, colour, size and position, every element, lighting, background,
  empty bottom-right corner (timestamp), "no other text". Nothing left for him to add in Figma; no face of his.
- Long-form thumbnails (2026-10-19): title = the famous names, thumbnail = the feeling/contradiction in a picture
  + 1–4 words, never the same words; 3 thumbnail options per idea from the 8 types in brain/thumbnails.md; his face
  only as a big real reaction, and A/B test with YouTube Test & Compare. Library: T7 references/thumbnails/.
- Long-form density (2026-10-19): ≥ 8 separate insights per episode, all in one story; research until you have
  them or drop the idea. One fact stretched over minutes is the worst failure.
- Long-form titles (round 4, 2026-10-19): famous name + hidden reason, always 3 options (specific / mixed / broad)
  with a pick; every idea needs a real insight and a brief deep enough to script (longform-scripts.md round 4).
- Long-form titles (round 3, 2026-10-19): a hidden truth about something the viewer already uses/knows, viewer as
  the subject, one emotion word; news = the opening, never the title. Our lane = why things look the way they do
  and who gets rich from that design decision (longform-scripts.md "Title rule (round 3)").
- Long-form = a STORY, never a lecture (2026-10-19): a real person or company the viewer follows, a moment we can
  picture, something at stake, open questions that pay off later, a reveal, an ending that lands. Explanations live
  inside the story, never as a block of theory.
- Long-form scripts are SPOKEN English like Anurag talks to camera ("You know,…", "See,…", "right?", "think about
  it"), never written-style fragments, epigrams or rule-of-three rhythm (longform-scripts.md "Spoken style", 2026-10-20).
- Scripts sound human, not formula: no fixed beat order every episode, no stock phrases repeated across videos,
  plain words a 15-year-old gets on first hearing, every term explained in the same breath (2026-10-19).
- Long-form: 3-act spine on real clips; two-part series: part 1 ends on the moment it broke (content-brief.md §10).

## Cuts & pacing {cuts}
- Plain 1.5–3× fast-forward of people is banned (blocking check). Per scene: jump cuts to the best beats, a speed ramp
  into a real-time moment, time-lapse only for slow progress, J/L-cuts, match cut, cut on action, smash cut, dissolve only
  for time passing (brain/craft.md).
- Transitions only where the picture really changes, never inside one continuous shot: movement comes from the camera.
- Talking head: retakes/fillers cut; zoom alternation hides jump cuts; every cut is audited for clipped words.
- Drawing videos: mix time-lapse (progress) with real-time moments (stroke, cap click) and stage jump cuts.

## Captions & text {captions,connectors}
- Hinglish in Roman script, never Devanagari, never translated. Fix spellings in clip-N.words.json / hinglish.json.
- Reel caption sizes are PERFECT: don't change them. Style follows the mood (casual video = casual, friendly fonts).
- Vlog captions: MrBeast style (heavy font, outline, few words, pop-in, key word in colour), karaoke on REAL word times,
  on every understandable line, moved off faces.
- Never the same text twice on screen (a pop-up repeating the caption gets dropped).
- Text carries real inside jokes and real numbers (punch score 308), never bland invented lines; ask him for them.
- Top half = memes/reactions, bottom = captions. Keep Instagram safe zones (top 8 %, bottom 20 %, right edge).

## Visuals, memes, props {visuals,layout,depth,asks}
- He describes something visual → SHOW it (chart, UI frame, object). Missing asset → find it myself first
  (scripts/findimg.mjs: one numbered sheet, I choose for the moment), else build it, else ask him (pass 9) (2026-10-15).
- Found memes/GIFs must feel UNIVERSAL and relatable to his Indian audience (internet creators like IShowSpeed, cartoons,
  meme faces, viral/Indian clips), not obscure foreign TV shots; GIPHY is searched as "<reaction> meme" (giphy.com/search/
  memes). Memes keep the quality they come in (no upscaling); pictures (logos, products, places) = full-size originals,
  SVG or ≥ 1000 px (2026-10-15).
- Memes show HIS attitude at that moment; keyword matches alone are wrong. Good matches are welcome (huh on confused,
  sleepy on late night). Current Indian memes preferred.
- NEVER still-image memes (no PNG memes, no meme cards/memecard.mjs): only GIFs or video memes, ideally with their own
  sound; a silent GIF gets a meme sound from the Library chosen by meaning (2026-10-15, blocked by the check).
- Meme presentation is a choice per moment (floating card, half screen, full-screen cut, zoom into it), with an entry
  sound (slam / whoosh); trim to the punch (1–3 s); never sloppy, never two at once, never the same one twice in a row.
  73 video memes in Library/clips; the how-to is brain/memes.md (read in the visuals briefing).
- Stickers fully inside the frame, never over his face (corner stickers sit above his head). Variety of entrances.
- No emoji graphics ("so low effort"). Pop text only with a real joke.
- Never tag/name a person he hasn't confirmed (people.json from his who-is-who sheet).
- Asking him for assets (2026-10-21): get everything I can myself first; what's left = ONE short list in the chat
  (what + where it goes in the video), never a wanted/ folder table he has to work through.
- Real footage over graphics (2026-10-21): in explainers, real clips (news, places, products, events) are the MAIN visual
  wherever the script names a real event; drawn graphics only for letter comparisons, numbers, charts. Clips: short,
  credited, under commentary (fair use); never disguised with filters to dodge Content ID.
- The designed-reel style (brain/pablo.md: mixed-font titles, inverted stacked title, full-screen scenes with a moving
  camera, white light-leak) is ONE more option to mix in where an explaining reel needs it, never the default (2026-10-14).
- His footage doesn't have to be the base: canvas mode (brain/canvas.md) puts it on a designed canvas as one layer
  under one moving camera. Consider it in every layout pass for explaining reels (2026-10-14).
- ONE main element on screen, everything else supports it. When a chart/graphic is the point, the footage LEAVES
  (full chart wipes its colour over the video); never a big graphic on top of his face card (2026-10-16, he was angry
  about the overlap). Footage + graphic together only when the graphic is small and clearly secondary.
- Graphics are NOT boxed by default: charts, objects, labels live on the whole frame like stickers; they fly in from
  outside the frame and leave out of it (never just appear/disappear), so the reel feels like one piece (2026-10-16).
- Places and systems people should SEE (a city, factory, supply chain, store, farm) can be an isometric 3D-look scene
  (direction.iso, brain/iso.md) in explainers when the topic fits; one per section, on his words. Charts stay 2D (2026-10-17).
- Screens on camera: private info (numbers, emails, UPI, OTPs, keys) is always blurred.
- Website/article evidence is never a page "to read": zoom until the text is readable in the video, scroll to the part he
  is talking about and highlight THAT line/word as he says it (yellow marker sweep). Several parts of one page = one
  page tour: fast scroll between them, slow down on arrival, mark the next line (direction.evidence stops) (2026-10-17).
- Explainers: the face is the trust, graphics are the facts (2026-10-17, measured on Anurag Bansal / Varun Mayya,
  brain/explainers.md "Face vs graphics"). Label every line FACT → graphic, QUESTION/TURN → face 2–4 s or breather
  text, OPINION/PROOF/JOKE → face. YouTube ≈ 30–40 % face, never > 12 s of face without a visual, face grows toward
  the end; reels: face for the hook claim + one proof line, the middle is graphics.
- Things he names are DRAWN and ACT (direction.illos: drawn on, never popped in; the printer prints his bill, the
  globe turns and a pin drops). Same object returns when he names it again. Palette chosen per video.

## Motion {motion}
- Every element enters/leaves with motion (ease-out, blur-in, slight overshoot); one idea at a time, ~2 s to land.
- Push-in on a new idea, punch on a hero word; footage is a layer that can make room (layouts).

## Sound & music {sound}
- His voice is always the main sound. Meme/effect sounds land in the pause AFTER his line, ducked if they overlap.
- Sounds by MEANING, not literally (zone-out → glitch, gives up → Discord leave…, brain/sounds.md).
- Whoosh only on real movement, quiet, faded in. Tick/click for text/UI. Variety: never the same meme sound twice in a row.
- Trim repetitive meme audio to one punchy hit; don't chop natural fade tails.
- Never one music bed under a whole reel: music changes with the story by mood (direction.music, sounds.md), silence
  is allowed. Popular songs go in via Instagram's music picker at upload, not in the edit (2026-10-14).
- Silence is a tool (after a joke, a failed joke = music cuts dead, a serious line). Music changes overlap ~1 s with
  equal-power fades on the beat: never an abrupt switch, never silence-then-rise between tracks (2026-10-14).
- Credit music that needs it (Synthet7: "Music: Synthet7" in the post text; never in sponsored posts). Tell him in the hand-off.
- Vlog music = his song as the backbone, beat-synced sections, OUT under real conversations, back on a beat.

## Colour & look {look}
- The look = "our earlier look" (contrast, colour, warm glow, vignette, grain), chosen again 2026-10-15 over raw, a
  trained model and raw+grain. It is LOGIC, not numbers: each knob adapts to the scene (scripts/lib/look.mjs, color.md).
- Judge colour with scopes (colorcheck.py) against v1 targets, on the full look, at 2+ moments.
- Paper/drawing footage: per-clip exposure to a shared paper white, then a light shared look (contrast, VIBRANCE, grain).
- Vlogs: original colours + rich grain, a touch more contrast and vibrance, slightly deeper mids, no vignette.
- Check orientation of every range used (he rotates the phone mid-recording).
- Never undo a deliberate mood (orange light = mood, not an error). Flat/grey footage gets a real grade. Prefer
  trained models / existing tools (scripts/autograde.py) over hand-made rules; checking is done by scripts, not my eyes (2026-10-14).

## Vlog specifics {story,visuals,sound;vlog}
- Friends vlog = funny + poppy + beat-synced; photos hang over footage; hero intros for each friend; inside jokes.
- Two cuts when footage allows: tight ~10 min + long 20+ min. Censor (tracked mosaic) only crotch/butt moments.
- Give honest ETAs before long renders (~2–2.5 h for a 10-min vlog on this Mac); watch renders by file growth.

## Files, storage, versions {all}
- ALL data on the T7 (Library, _work, output, inbox, projects, references, meme-sources). The Mac keeps only the system;
  temp files are deleted after every render; nothing new is written to the Mac when the T7 is unplugged.
- Never overwrite a version: output/<name>/<name>-vN.mp4 + CHANGELOG.md entry saying exactly what changed.
- Only stage my own files in git; another chat may be working in the same folder.

## Long-form edit rules (his verdicts on netflix-font v1, 2026-10-21) {cuts,visuals,layout,motion,sound,look}
- Framing: ONE fixed crop for the full-screen view and one for the small window, centred on him for the whole video;
  only smooth zoom in/out (glides), never shifting/re-framing per shot. The background must not jump.
- Pacing: pauses follow the script's punctuation (comma ≈ 0.06 s, full stop ≈ 0.16 s, paragraph ≈ 0.32 s); every
  silent gap inside a line ≤ 0.12 s; trim silence at the start/end of every take; speed only a touch (≤ 1.05×).
  Target for a ~2,100-word script: 12–13 min. Cut repeated takes (he reads the laptop, then re-says to camera):
  re-transcribe the finished cut and grep for repeated 3-word runs before rendering.
- Freedom to drop script lines that repeat a point (extra examples, side reasons) so it stays engaging.
- Real clips: no captions/kickers on them (he is already saying it); a small credit bottom-right, no dots; keep
  each clip's own sound low underneath (Netflix tudum etc.).
- One idea per screen: lists (logos, conditions, questions, columns) show ONE item big at a time, earlier items
  park small; the end = subscribe (cursor clicks, bell) → thanks for watching, each its own screen.
- Look: modern type (Inter Tight / Geist / Instrument Serif italic), no slab serif; 3D depth (perspective
  entrances, lit card surfaces, slow camera orbit) instead of flat vectors.
- Nothing static > 2–4 s: held graphics get a camera step every ~3 s, long face shots a zoom glide.
- Sound: Synthet7 music by section, whooshes/impacts clearly audible (≈ 0.5–0.7), heavy sound design in the hook.
- Sync (v2 verdict 2026-10-21: graphics lagged up to 38 s): build the cut with scripts/longaudio.mjs + longbase.mjs
  (exact piece order, one 30 fps clock; ffmpeg select alone keeps SOURCE order and breaks a moved cold open), then
  transcribe the final audio and time every graphic from it (longform-time reads cutwords.json). Graphics leave
  2.5 s after their last beat; uncovered time shows his face. Repeats: scripts/longrepeats.py (aligns the cut to the
  script) must come back clean before any render.
- Hook: first ~10 s = a fast recap of the whole story (4 lines over real footage, a cut every ~1 s, riser + hits).
