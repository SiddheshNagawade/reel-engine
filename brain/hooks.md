# Hooks & retention playbook

Why people keep watching: the brain hates unfinished business. An open question ("what happened to the cat?") keeps
nagging until it's answered (the Zeigarnik effect / curiosity gap). Every technique below either opens a loop,
keeps one open, or pays one off. Rule: every loop we open MUST be paid off, or the viewer feels cheated and stops trusting the channel.

Headlines can sit at the edge of clickbait: a bit exaggerated to grab attention, but the video must genuinely talk about it
(the payoff can be smaller than people imagine; that's normal). Never promise something the video doesn't contain.

## His hook rules (2026-10-09, override everything below)
- Hook text is ALWAYS in English (it works like the title), a bit clickbait, but the video must deliver it.
- Before choosing, give him 3–4 hook OPTIONS (text + what the first 3 seconds look like) and let him pick the direction.
- Cold open from the middle: pull the most striking moments from anywhere in the footage to the front. He loves this; push it further.
- The hook gets the HEAVIEST editing in the reel (MrBeast style): 0.3–0.6s cuts, speed ramps, punch-in zooms, impact sounds,
  text slams, a rewind/reveal effect. After ~3–5s the pace settles into normal story editing.

- WHY he chose "I was so bad at drawing trees" (his words, 2026-10-09, corrected): the video IS about him, told first
  person ("main"), which separates it from a tutorial. But the problem he shares must be a COMMON one (most people can't draw
  trees), so viewers see themselves in his story. His story + their problem. Not tutorial voice ("tum aisa karo"), not a niche
  personal story nobody relates to. Pinterest-copying is relatable too, but weaker than "can't draw trees".

Pick 1–2 techniques per video. Never all of them: the story comes first.

## The 4 hook mistakes check (from a hooks video he shared, 2026-10-14; my notes, in my words)
A hook has one job: make the viewer decide to stay. It needs two things: TOPIC CLARITY (they know what the video is about)
and ON-TARGET CURIOSITY (they believe it's for them and want what comes next). Run every hook option through 4 checks:
1. **Delay**: is the topic clear within the first 1–2 s? Cut any opening line that gives no context ("guys this is the
   craziest thing…"). On existing footage: start on the first line that says what it's about; move it to the front.
2. **Confusion**: could anyone misread it? Fewer, simpler words (a 12-year-old gets it), active voice, the key idea
   early in the sentence. Read the hook alone: is there more than one way to understand it? Rewrite until there's one.
   Hinglish helps here: say it the way he'd say it to a friend.
3. **Irrelevance**: will the viewer feel it's for THEM? Name a pain they already have ("if you can't draw trees…") and
   promise a need-to-have, not a nice-to-have ("trends in skincare" < "if you have acne, try these 3").
   His own rule still stands: his story is told first person, but about a COMMON problem. So: keep "main" for the
   story, and let the hook text or first line point at the viewer's version of the problem. Offer one "you" hook
   among the 3–4 options.
4. **Disinterest**: is there a curiosity gap? Build CONTRAST: A = what they believe / usually do, B = his different,
   faster, cheaper or surprising answer. Stated ("most people do X, I did Y") or implied (only B, A is obvious).
   Clarity usually in line 1, contrast in lines 2–3: a hook can be 2–3 lines, not one punchline.
Vague open hooks only survive on a strong face/emotion or on-screen text; never rely on the spoken words being vague.
When writing scripts AND when cutting a story from existing clips, every hook option must pass all 4 before he sees it.

## 1. Pinned open-loop headline ("My cat died" technique)
- A short, intriguing line pinned at the top for most of the video, while the video talks about something that seems unrelated at first. The answer comes late.
- Works when: the story genuinely builds to a reveal. Not for simple tips.
- ReelEngine: `direction.banner = {text, until: wordIndex}`: pinned headline until the payoff word, then it disappears.

## 2. First frame = hook
- On-screen text in frame 1 (people watch muted) + the first spoken line must match what the text promises.
- Best hooks: odd concrete detail (time, number, place), bold claim, relatable pain, result-first.
- ReelEngine: `hookText` (big 3D keyword).

## 3. Cold open / result first
- Start with the most dramatic line or the result, then "let me explain". The viewer now waits to see how we got there.
- ReelEngine (next feature): `direction.coldOpen = {from, to}`: copy a line to the very start, then play the story.

## 4. Small loops every 10–15s
- Tease the next beat ("…but the second one surprised me"), or show a counter (1/3, 2/3) so they know there's more.
- Re-hook around the middle, where people usually drop.

## 5. Every visual change has a reason, and a sound
- A cut, a push-in, a B-roll, a text: each lands on a meaningful word, with a subtle audio cue. Random motion = noise.
- In one continuous shot, motion comes from the camera (face-tracked push-in/pull-out), not from fake transitions.

## 6. Stakes & contrast
- Numbers, before/after, "most people do X, you should do Y". Specific beats vague.

## 7. Delay the payoff, then end fast
- Payoff near the end, then stop. No long outro. If the last line flows into the first, people rewatch (loop).

## 8. Reels vs long-form (YouTube 16:9)
- Reels: captions always, hook in frame 1, 20–45s.
- Long-form: the first 30s must confirm the title/thumbnail promise, state the stakes, and open a loop. Then mini-loops every 5–15s
  in high-energy content (fast cuts, text pops for key points only, sound on every cut), chapter cards between sections.
  Captions are optional: big keyword text only on key moments, not full subtitles.

## The 3-second formula (from a creator-education video he shared, 2026-10-11; my notes)
- People judge a reel in ~1 s. Never open with an intro ("Hi, I'm…"). The first 1–3 s should carry a TRAILER of the
  highest-effort part of the video.
- A visual hook needs all three: MOTION (something in frame moves), CURIOSITY (a question pops up: "why is he doing that?"),
  CLARITY (you instantly understand what the video is about).
- Hook types, combine 2–3: visual (something people don't normally see) · unbelievable (a shot that makes you ask "how?")
  · pain point (SPECIFIC: "salary gone by the 15th", not "money problems") · curiosity gap (incomplete information) ·
  relatability (alarm at 7, awake at 8) · transformation (show the after first, then the process).
- For his drawing videos the transformation hook is native: final artwork (or the before/after) first, then the process.
  Already proven: the alcoholmarkers trees cold open.
- Body: real value, researched (what are people already saying?); keep attention with questions, humour, meme
  references, and sound that changes with the mood every few seconds.
- Ending: ask a question that people want to answer in the comments, instead of "like, share, subscribe".
- "The algorithm" = consistency + value. Don't chase myths about likes vs shares.
