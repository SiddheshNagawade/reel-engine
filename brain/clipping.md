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
- `scripts/clip.mjs <clip.json>`: 16:9 → 9:16 post with the original picture and audio: blurred-copy background, the clip
  cropped ABOVE the burned subtitle band in the middle, campaign logo + title on top, big captions below (from the subs).
  Fields: segments [{in,out,fx}], crop {w,h,y}, fgY, logo, title {text, accent}, caption {size,y,colour}.
- Measure the burned subtitle band before cropping (grab a frame strip): PsyopAnime subs start at y≈820/1080 → crop h 810.
  First render missed this and showed every line twice.
- Find cut points with ffmpeg scene detection (`select='gt(scene,0.25)',showinfo`) so cuts land on shot changes.

## Posting
- Post at the time the target audience is awake (US evening = 5:30–8:30 AM IST).
- Warm up new accounts 2–3 days in the target niche/country content. No VPN (breaks platform rules).
- Every clip ships with a posting kit: title, caption, credit line, hashtags, per platform.

## Verdicts / results log
- (fill in: which clips got views, Tier 1 %, payouts)
