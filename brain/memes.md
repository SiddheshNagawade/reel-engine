# Memes: when, which, and how to SHOW them (never sloppy)

His ask (2026-10-14): video memes that make the videos feel more human, shown the way an editor would: "a frame
hovering on the existing frame, or half screen, or zoom into that meme… with the sound effects of slam and all…
don't make it too sloppy".

## What's in the Library
- Video memes: Library/clips/<id>/ (73 from github.com/fgetcat/my-meme-folder, chosen after a content filter and a look
  at every clip; list + meanings in brain/meme-picks.json). Each: clip.mp4 = the PUNCH (0.7–3.3 s), sound.mp3, full.mp4
  (whole clip), poster.png, tags + meaning + a default way to show it. `editplan brief visuals` lists them by meaning.
- Cat stickers (transparent), meme sounds (Library/sounds, by meaning: brain/sounds.md), (meme cards: BANNED, still images),
  and whatever he Googles for a video (asset requests → assets.mjs import).
- Add more: a picks file like brain/meme-picks.json → `node scripts/memeclips.mjs <picks.json> --src <folder>`.

## When a meme belongs (the rules that keep it human, not random)
1. It shows HIS attitude at that moment (he failed, he's shocked, the money's gone, it's 3 am). A keyword match alone
   is not enough. If you can't say in one sentence why THIS meme fits THIS line, use nothing.
2. It lands in the PAUSE right after his line, never over his words (the planner waits for the next pause and ducks).
3. One reaction at a time: never a meme + a sticker/prop/pop text at once; never two memes back to back; ~1 per 10–12 s
   in a reel (a vlog can carry more in the chaotic parts, fewer in conversations).
4. Short: the punch only (the clip is already cut). Use full.mp4 only when the setup is the joke.
5. Variety: never the same meme or the same display mode twice in a row; check brain/usage.json for recent reels.
6. Current Indian memes he sends beat these international ones when both fit.

## Finding new memes online (2026-10-15)
- Memes MOVE: GIFs or video memes only, never still images. GIPHY's clips-with-sound need a paid key (403 on the free
  one), so a GIPHY GIF is silent: pair it with a Library meme sound by meaning (sounds.md), landing after his line.
- `node scripts/findimg.mjs search <reel> <id> "<reaction>" --src giphy` searches "<reaction> meme" first (GIPHY's meme
  side), then the plain words. Choose what his Indian audience instantly recognises: meme faces (soyjak, cat memes),
  cartoons, internet creators (IShowSpeed-type), viral or Indian clips. Skip obscure foreign TV/film shots (a Star Trek
  facepalm is "foreign", nobody here feels it), stock-photo people, watermarks.
- Keep memes in the quality they come in: no upscaling (his verdict). Pictures of things are a different rule: full-size.

## How to show it: pick per moment (direction.memes `{at, id, show}` · vlog gfx `{type: "meme", clip, show}`)
| show | Looks like | Use for | Sound |
|---|---|---|---|
| card | framed clip slams in (overshoot + small shake), tilted, beside/above his head | quick reactions while he stays on screen: lie detector, skull, oh no, sus | slam (hit) + the meme's own sound |
| half | meme takes the top half, his footage glides to the bottom half (blurred fill); vlog: side by side | when the meme needs room or tells a mini story next to him: life savings gone, parking fail, 3 am | whoosh in |
| full | hard cut to the meme full screen, 2-frame flash, slight push-in; captions step aside | the big punchline / smash-cut moment: BOOM, big slap, video frozen | the meme's own sound only |
| zoom | small card appears, camera zooms INTO it until it fills the screen | escalation: "and then…" → the meme takes over | whoosh |
- Each meme has a default `show` (catalog), but choose for the moment: the same meme can be a card in one video and a
  full cut in another. Don't use full/zoom more than about once per reel: they stop the story.
- Hook rule still holds: no memes over the 3D hook (first ~2.5 s).
