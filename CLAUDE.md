# ReelEngine: instructions for Claude

Local auto-editor for Siddhesh's Instagram reels (Remotion + local Whisper). Before editing any reel:

1. Read `brain/preferences.md` (his rules, which override defaults) and `brain/principles.md` (retention principles).
2. Check `brain/genres/` for the matching genre and `brain/templates/` for a starting point (then try to improve on it).
3. After each round of his feedback: add the lesson to `brain/preferences.md`, update the genre notes/template, and fix the code if it's a systematic issue.

## How things fit
- `npm run reel -- <video | folder | reel-name>`: full pipeline. Media is on the T7 (`/Volumes/T7 Shield/ReelEngine/{inbox,projects,output}`) when attached, else `./{inbox,projects,output}`.
- Work cache per reel: `work/<name>/` (clip-N.words.json transcripts, direction.json = edit decisions, transcript.md = readable edit with frame numbers, selects.mp4 = only the kept footage).
- To change decisions: edit `work/<name>/direction.json` (removeRanges, emphasis, popups, memes, sections, hookText, themeOverride) and re-run with the reel name. Transcript fixes: edit `work/<name>/clip-N.words.json`.
- Look: `style.json`. Spelling fixes: `hinglish.json`. Memes: `public/assets/memes/<id>/` + `catalog.json` tags.
- Verify by extracting frames from the output with ffmpeg and looking at them. Never call a reel done without checking the actual file.

## Hard rules
- Hinglish captions (Roman script); never let Hindi be translated to English.
- Never show the same text twice in one frame.
- Keep this project separate from other repos (it has its own git repo).
