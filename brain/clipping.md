# Clipping for Whop Content Rewards: playbook

Started 2026-10-11. Goal: first income (~$100/month) by editing other creators' footage, no face/story needed from him.
Campaign files live next to the footage: T7 `clipings/<campaign>/CAMPAIGN.md` (rules, money, log).

## How it works
1. Join a campaign on Whop → download its source footage.
2. We cut 9:16 clips; he posts them on HIS clip accounts (never his personal art account), connected in Whop.
3. He submits each post link + country analytics in Whop; paid per 1,000 views between the min and max payout.
- Payout min/max are PER POST. Views of different posts do not add up. One clip at 20k views beats 20 clips at 300.

## Picking a campaign (check before downloading anything)
- Can he meet the platform rule? TikTok is banned in India: campaigns that REQUIRE TikTok are out (e.g. Sabri Malle, 2026-10-11).
- Can he meet the audience rule? Tier-1-only campaigns are hard from a new Indian account. Campaigns that accept Indian or
  any-country views (Hindi/Indian creators) fit him naturally.
- Real numbers beat the budget: look at "top clippers" earnings + total views (Sabri Malle: 13 clippers, top $230/month,
  avg ≈ $60). That's the realistic ceiling, not the budget.
- Content he's comfortable having on his account (politics, fake-news formats, controversy).
- Real human creators usually outperform AI-generated footage.

## Editing rules for clips
- Hook in the first 1–2 s: the strongest line/visual first, then context. Must work with zero knowledge of the show.
- Respect the campaign's brand rules (audio, grade, logos). ReelEngine's film look is OFF unless allowed.
- Burned-in subtitles on wide footage: a 9:16 centre crop cuts them. Choose blurred-background 16:9 or our own captions.
- One clip = one complete moment (setup → payoff), 15–45 s. End on the payoff; no fade.

## Tools (built 2026-10-11)
- `scripts/subocr.py <video> <out.json> [--from --to --fps 4 --band 0.8,1.0]`: reads burned-in subtitles with Apple Vision.
  Use it when the footage is DUBBED (PsyopAnime is Japanese audio + English subs: Whisper outputs nonsense on it).
  Clean OCR noise by hand (stray letters like "MINN"), save as `*.subs.clean.json`.
- `scripts/clip.mjs <clip.json> [--still <s> <out.png>]`: 16:9 → 9:16 fan-page post with the original picture and audio:
  logo on top, ONE hook line, the clip cropped ABOVE the burned subtitle band, subtitles below. Fields: segments [{in,out,fx}],
  crop {w,h,y}, fgY, logo, hook (*word* = yellow), highlight, look (comic|gothic|marker). `--still` = quick preview frame.
- Fonts live in Library/fonts. Family names are the ones INSIDE the file (fontsource Montserrat 900 = "Montserrat Thin Black");
  a wrong name silently falls back to Arial: check a still.
- Measure the burned subtitle band before cropping (grab a frame strip): PsyopAnime subs start at y≈820/1080 → crop h 810.
  First render missed this and showed every line twice.
- Find cut points with ffmpeg scene detection (`select='gt(scene,0.25)',showinfo`) so cuts land on shot changes.

## Podcast / interview clips (Aspire campaign, 2026-10-11): the efficient + correct pipeline
1. PLAN CHEAP: 360p video-only preview + YouTube's own captions (json3 word timings, `--write-auto-subs --sub-format json3`).
   Local Whisper on a 1-hour episode was too slow here. Read the transcript, pick moments, note exact times.
2. FETCH ONLY WHAT'S NEEDED in 4K: `yt-dlp --download-sections "*a-b"` (VP9 313; AV1 decodes too slowly). 4K → a 9:16 crop
   is native 1080x1920 (1080p would be upscaled 1.8x and soft). Never download the whole episode in high quality.
   YouTube may block this Mac ("not a bot"): `--cookies-from-browser chrome` (ask him first) + `yt-dlp[default]` (EJS solver)
   + `--js-runtimes node`.
3. AUDIO: pick the ORIGINAL English track WITHOUT DRC (`140-15`, "original … m4a_dash", not "DRC"); multi-language episodes
   also carry AI-dubbed tracks: never those.
4. A/V SYNC (critical, he caught it): section downloads start the picture at the previous keyframe but the audio exactly
   on time → picture 0.1–5.4 s ahead of the voice, different per clip. ALWAYS run `scripts/avsync.py` (matches camera
   cuts against the 360p preview, falls back to frame matching; replaces the audio with the exact slice of the full
   original track). Both methods agreed within 1 frame on every clip.
5. `scripts/vcrop.py`: 16:9 → 9:16, one steady framing per camera shot on the biggest face, changes only at real cuts.
6. Then the normal pipeline with `REEL_VOICE_AF=anull`: mastered audio must NOT go through our denoiser (afftdn made her
   voice sound fake/"dubbed"). Direction: original colours (film look off), no memes, honest hook, highlight-box captions.
7. Logo on top afterwards: light logo + soft shadow, top centre at y≈150 (reads on light AND dark backgrounds).
8. Before showing him anything: check lip sync on a real frame, listen to the voice, check stills.

## Posting
- Post at the time the target audience is awake (US evening = 5:30–8:30 AM IST).
- Warm up new accounts 2–3 days in the target niche/country content. No VPN (breaks platform rules).
- Every clip ships with a posting kit: title, caption, credit line, hashtags, per platform.

## His verdicts (2026-10-11, PsyopAnime round)
- v1 layout (logo top, one title line, clip, subtitles) = the right format. My "v2" with a 3-line headline, PART tag,
  chunky ALL-CAPS captions and end card "looks like an advertisement": too much text. Fan page, not ad channel.
- Hooks must work for a stranger who knows NO characters: short, opinionated, fan voice, a little curiosity
  ("bro's priorities were set at age 10", "they really did this to cortana", "wait for the last line"). Never build the
  hook on a name the viewer must already care about ("Asmongold's childhood" = who?). Compare to famous anime when it
  helps ("harder than goku vs vegeta"). Lowercase, one line or two short ones.
- A bare fight with no hook = "blank" to someone who doesn't read the subs. Every clip needs a reason to keep watching.
- Length: 20–30 s (campaign minimum 15 s). One moment per clip, not a whole scene. Shorter is better for new accounts.
- Look: `look: "gothic"` (Dela Gothic One hook, lowercase; Poppins ExtraBold subtitles 68px). Options exist: comic, marker.
- Spicy/naughty moments ARE good hooks when they're in the footage (e.g. the "huge boobs" line as the payoff).
- Research the current conversation before writing hooks (e.g. a fresh Asmongold/Hasan feud that week, Sweet Baby Inc).

## Results log
- (fill in: which clips got views, Tier 1 %, payouts)
