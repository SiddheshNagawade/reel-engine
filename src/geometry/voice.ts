// HIS RECORDED VOICE, per lesson (filled after he records; until then every line uses an estimated length).
// `lines[i]` = [start, end] in seconds inside `src` for the i-th L.say() line of that lesson, in script order.
// When present, each line lasts exactly as long as he speaks it, the animation inside that line starts with
// his words, and his clip plays there: the whole video re-times itself to the voice (no hand re-timing).
// Fill it with: node scripts/geo-voice.mjs <lesson> <recording>  (aligns the transcript to the script lines).
export type VoiceLines = {src: string; lines: [number, number][]};
export const VOICE: Record<string, VoiceLines | undefined> = {};
