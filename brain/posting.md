# Posting kit: how to write the post for each platform (2026-10-14)

Every final render gets `output/<name>/<name>-vN.post.md`: the text he copy-pastes when posting. The render writes the
facts (`-vN.post.json`: length, hook, spoken lines, music credits); I write the words with this playbook
(`node scripts/postkit.mjs <name>` prints facts + the template). Uploading stays manual on purpose: Instagram's music
picker (trending audio) only exists in the app, and unreviewed YouTube API uploads are locked private.

What the platforms actually rank (2026, Mosseri / YouTube Shorts team via secondary sources; treat specifics as guesses
and check against HIS analytics every Sunday):
- Instagram Reels: watch time, likes per reach, and **sends per reach (DM shares = strongest for reaching new people)**.
  Hashtags barely add reach; max 5 count (Dec 2025 cap). Keywords in caption, on-screen text and spoken audio tell
  Instagram WHO to test the reel on. The first ~125 characters show before "more".
- YouTube Shorts: viewed vs swiped (the first 1–2 s), % watched, rewatches, shares. The title is a second hook and the
  search key; the transcript of his voice is indexed too. Description short; 3 hashtags show above the title.
- The video does 90 % of the work. The kit's job: (1) tell the algorithm the right audience, (2) give a reason to
  SEND / comment / follow, (3) never contradict or repeat the on-screen hook word for word.

## Instagram caption
1. **Line 1 (≤125 chars) = a second hook, not the on-screen hook repeated.** Adds a detail, a number or a question that
   makes them watch again or open the caption. Contains the 1–2 search words of the topic in plain English
   ("building apps", "IIT design", "gym transformation").
2. Lines 2–4: one or two short lines of context in his voice (Hinglish ok, Roman script), first person, honest.
3. A **send / comment trigger** that fits THIS reel, never generic "like & share": "send this to the friend who…",
   a question people can answer in one word, or "comment X and I'll…" only if he will really do it.
4. Series reels: "Part 1/2 · I've built 10 things, most failed. #3" + "Part 2 on Friday": a reason to follow.
5. 3–5 hashtags, specific > big: topic + niche + India/location (#iitbombay style only if true). Never 30, never the
   same block on every post.
6. Credit line if the music needs it (catalog `credit`, e.g. "Music: Synthet7"; never on sponsored posts).
Also in the kit: **cover frame** (heroframe.py, text-free face + hook words fit the 4:5 grid crop), trending-audio
note (which mood of song to search in the picker; keep his voice main, song ~5–10 %), collaborator to invite (only
people confirmed in people.json), location tag if real.

## YouTube Shorts
1. **Title ≤ 60 chars**, curiosity + the searchable keyword, English (Hinglish words fine). Different from the IG line
   1. No ALL CAPS, no "#shorts" in the title.
2. Description: line 1 = one-sentence summary with keywords (search reads it); line 2 = series / next-part pointer;
   then 3 hashtags (the first three show above the title): topic, niche, #shorts optional.
3. Tags field: misspellings + Hinglish spellings people type ("iit design student", "app banaya").
4. Related video: link the previous part (Shorts "related video" field) so swipes turn into a second view.
5. Upload as scheduled, not instant, so processing (HD, captions) finishes before it is shown.

## Timing
Post when HIS audience is online (Instagram Insights → Followers → Most active times; YouTube Analytics → When your
viewers are on YouTube). Until he shares those: Indian students ≈ 7–10 pm IST. Same reel on both platforms, IG first.
After posting: reply to every comment in the first hour (counts as engagement on both platforms).

## Brand-new account (his situation, 2026-10-14: zero history, no analytics yet)
- Instagram: Professional → Creator account (unlocks Insights + Trial Reels). Use **Trial Reels** for the first posts:
  they go to non-followers only, so a small follower count doesn't cap the test.
- The first ~10 posts teach both platforms WHO he is: same topics every time (building things / IIT design / gym),
  same keywords in captions, name field ("Siddhesh | builds apps + gym") and bio. No off-topic posts in this phase.
- No follow-for-follow, no engagement groups, no bought views: they teach the algorithm the wrong audience.
- Times until Insights has data (~2 weeks, needs some followers): 7–9 pm IST weekdays, 11 am–1 pm Sundays; vary a bit
  and note views per slot in Verdicts.
- Judge a post after 48 h (IG) / 7 days (YT), not in the first hour. 200 views on IG and ~1k on a new YT channel are
  normal starts; watch % and sends matter more than views now.

## Don't
- Don't mention ReelEngine / "AI edits my videos" (content-plan.md decision).
- No engagement bait the video doesn't earn, no fake numbers, no tags of unconfirmed people.
- No emoji walls; one or two emoji max, only if they carry meaning.

## Learning loop
Sunday analytics → write what worked under "Verdicts" below (caption style, title, posting time vs views,
viewed-vs-swiped %, sends). Newest verdict wins; move lasting rules into rules.md {post}.

## Verdicts
- (none yet)
