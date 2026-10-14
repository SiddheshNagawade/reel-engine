# Sound design by MEANING (his rule, 2026-10-11)

Sounds are chosen for what the moment MEANS in his story, not for what they literally are. A glitch isn't only for
glitches; a Discord "leave" isn't only for Discord. Think like an editor: what is he feeling/doing right now, and which
sound says that with a wink? If nothing clearly fits, use nothing (story first, his voice always on top).

Library: 387 sounds from his pack (`Library/sounds/`, full list `Library/sounds/INDEX.md`), each with `about.txt`.
Families + meanings are defined once in `scripts/lib/sound-families.mjs` (tags used by `direction.memes`).
Use: `direction.memes: [{at: wordIndex, id: 'glitch-004'}]` (exact sound) or `{at, tag: 'zone-out'}` (pick one, avoids repeats).

## Moment → sound (starting points, not rules)
| What's happening in his story | Reach for | Why it works |
|---|---|---|
| He zones out / loses the thought / says rubbish and snaps to the next topic | glitch (glitch-001…010, terminal/line-break), `17 Disconnected` | the "brain" glitches; the cut feels intentional |
| Awkward or abrupt topic switch | glitch, `CARTOON TRANSITION`, portal hop | funnier than a plain whoosh |
| An idea arrives / lightbulb | notify: new-idea, good-idea, Doraemon gadget, Apple/iPhone ping | the idea "pings" in |
| A reminder / reality calls ("but exams…") | notify (message/iPhone receive) | reality is texting him |
| Someone/an idea enters the conversation | Discord join | a character "joined" |
| He gives up / leaves a topic / gets ghosted | Discord leave, YEET | dramatic exit |
| A mistake / bad decision / plan fails | Windows XP error, wrong answer, access denied, glass shatter | the system says no |
| A useless/bad line (comic beat) | silent freeze → fart / bruh / awkward pause | lands AFTER the line, never over it |
| Self-own / dumb moment | bamboo bonk, minecraft oof, body thud | slapstick on himself |
| Approval / nailed it / unlocked | access granted, correct, ding, ascending, Mario coin | tiny reward |
| Money / price / value / flex | cash register, racks, coin | cha-ching |
| Waiting / it took forever / late night | clock ticking, bike wheel spinning, dial-up | time dragging |
| Working hard / planning / researching | typing, typewriter, hacking | grind sound |
| Drawing / notes / start over | pencil/writing, paper flip (next chapter), rip/crumple (reject idea) | his art + metaphor |
| Thinking it through / connecting dots | gears turning, processing, network connect, loading | the brain at work |
| Flashback / story time / "let me rewind" | flashback, projector, tape rewind | time travel |
| Skip the boring part / time skip | fast forward, "a few moments later" | |
| Build-up before a reveal / number / punchline | riser, drum roll, cine-riser-07 → impact | anticipation |
| Reveal / big number / hard truth / title slam | impact, explosion, boom, boxing bell (challenge starts) | emphasis |
| Mood drops / serious realization / twist | sub-drop, dark drop, sudden suspense, glass-hit stinger | weight |
| Nervous / pressure / regret / lonely | heartbeat, upset pulses, spooky wind, cine drone | under the line, very low |
| Glow-up / motivation / transformation | energy: power-up, lens flare, brassy swell | shine |
| Suspicious / caught / coincidence | among us, hmmm, illuminati confirmed | sus |
| Fake audience reaction | crowd gasp, applause (also sarcastic), awww, kids yay, party horn | |
| Swear / secret / spoiler / "I won't say who" | censor beep | |
| Text, sticker, list item appearing | pop, click, tick | subtle, low |
| Real movement (camera move, scene change) | whoosh-short / whoosh-long | only for real motion |

## Rules
- His voice is the main sound: effects in the pauses, ducked under speech, ~1 meme sound per ~12 s.
- Vary: don't reuse the same sound in back-to-back reels (brain/usage.json); the pack has many variants per family.
- One sound per moment. A sound + a sticker for the same moment is fine; two sounds stacked is not.
- Meme voices (bruh, nope, OMG, rizz, YEET…) are strongest; use them only when HIS attitude matches.
- 8 music beds were imported to `Library/music/` but need his rating before use (names only, I can't hear mood).

## Music by mood (his rule, 2026-10-14: never one bed under the whole video)
One track looping under everything creates no feeling. Music follows the STORY: each part gets the mood it needs, and the
music changes where the story turns (problem → tension/sad, turn → build, payoff → hype/happy, late night → chill/night).
- `direction.music: [{at, until, mood | id, from: seconds into the track (start on its best part), vol}]` → a different
  track per section, cross-faded, ducked under his voice. Silence is also a choice (a serious line with no music hits harder).
- Moods in the Library (catalog `moods`): hype, swag, night, motivational, journey, sad, emotional, calm, talking, chill,
  fun, upbeat, happy, travel, indian-pop. Tags on the first 9 tracks are GUESSED from names: listen and correct.
- Place the track's dramatic part on the problem / big moment (as Pablo does); cut music at a story turn, not mid-phrase.
- Popular songs: Spotify can't be downloaded (locked + copyright) and Instagram mutes copyrighted songs added in the edit.
  For a trending song, he adds it in Instagram's own music picker at upload; our edit then carries only his voice + sfx
  (or a quiet mood bed he turns down). Free-licence tracks (Pixabay Music, YouTube Audio Library, Mixkit) are safe.
- The music has EARS now (scripts/musicmood.py, Essentia models, free + local, 2026-10-14): every track was listened to
  → catalog `moods` (title moods + distinctive heard tags), `moodScores` (happy/sad/aggressive/calm/party/danceable +
  56 Jamendo mood/theme scores), `bpm`, `drop` (second where its most energetic stretch starts; cues start there unless
  `from` is set) and `energy` (curve per ~3 s: quiet intro, build, peak). If no track has the exact mood tag, the
  planner takes the highest listened score for it. Honest limit: these models were trained on mainstream songs; on his
  game-style instrumentals they mostly hear "danceable/happy" (those tags are dropped as meaningless), so tempo,
  energy and drop are the most reliable parts. Still: listen to the chosen part before trusting a mood.
  New tracks: put them in Library/music/<id>/track.mp3 + catalog entry (kind music), then run the script.
- Synthet7 pack (Newgrounds, his pick 2026-10-14): ~50 short game-style tracks in Library/music/synthet7-*, mood-tagged
  (guessed from titles: listen and correct). Licence per track in about.txt + catalog `licence`; most are Creative
  Commons BY-NC-SA: CREDIT "Music: Synthet7" in the caption/description, and NOT for paid/sponsored posts. Tracks under
  12 s are `sting: true`: a jingle moment (thought break, sad trombone, wow, air horn), not a bed.
