"""Local word-level transcription with Whisper (MLX, runs on the Mac GPU). No internet/API needed after the first model download.

Hinglish mode (default) transcribes TWICE and keeps the right pass for each stretch of speech:
  - Hindi pass  (language=hi): faithful to Hindi speech; Devanagari is converted to Roman Hinglish.
  - English pass (language=en): faithful to English speech, but it can *translate* Hindi, so it is
    only used where the Hindi pass shows English speech or breaks down (repetition loops).

Usage: .venv/bin/python scripts/transcribe.py <audio> <out.json> [--lang hinglish|hi|en|auto]
"""
import json
import os
import re
import sys

import mlx_whisper

sys.path.insert(0, os.path.dirname(__file__))
from hinglish import DEVANAGARI, to_hinglish  # noqa: E402

MODEL = "mlx-community/whisper-large-v3-turbo"
HINGLISH_PROMPT = (
    "Toh dosto, aaj hum baat karenge ki paise kaise bachaye. Ye bahut simple hai, "
    "bas teen steps follow karo. Matlab, agar aap ye kar loge toh life easy ho jayegi."
)


def run(audio, **kw):
    kw = dict(path_or_hf_repo=MODEL, word_timestamps=True, condition_on_previous_text=False, **kw)
    try:
        return mlx_whisper.transcribe(audio, hallucination_silence_threshold=2.0, **kw)
    except TypeError:  # older mlx-whisper without that option
        return mlx_whisper.transcribe(audio, **kw)


def words_of(result):
    out = []
    for seg in result.get("segments", []):
        for w in seg.get("words", []):
            t = w["word"].strip()
            if t:
                out.append({"w": t, "s": round(w["start"], 3), "e": round(w["end"], 3), "p": round(w.get("probability", 1), 3)})
    return out


def looping(tokens, n_max=4, reps=3):
    """True if some 1..n_max-word phrase repeats `reps`+ times in a row (Whisper hallucination)."""
    for n in range(1, n_max + 1):
        for i in range(len(tokens) - n * reps + 1):
            if all(tokens[i + k * n:i + (k + 1) * n] == tokens[i:i + n] for k in range(reps)):
                return True
    return False


def hybrid(audio):
    hi, en = run(audio, language="hi"), run(audio, language="en", initial_prompt=HINGLISH_PROMPT)
    en_words = words_of(en)
    chosen, hindi_windows = [], []
    for seg in hi.get("segments", []):
        ws = [w for w in seg.get("words", []) if w["word"].strip()]
        if not ws:
            continue
        toks = [w["word"].strip() for w in ws]
        deva = sum(bool(DEVANAGARI.search(t)) for t in toks) / len(toks)
        if deva >= 0.4 and not looping(toks):
            hindi_windows.append((ws[0]["start"], ws[-1]["end"]))
            for w in ws:
                chosen.append({"w": to_hinglish(w["word"].strip()), "s": round(w["start"], 3), "e": round(w["end"], 3), "p": round(w.get("probability", 1), 3)})
    # English pass fills everything outside the accepted Hindi stretches.
    inside = lambda t: any(a - 0.15 <= t <= b + 0.15 for a, b in hindi_windows)
    chosen += [w for w in en_words if not inside((w["s"] + w["e"]) / 2)]
    chosen.sort(key=lambda w: w["s"])
    lang = "hinglish" if hindi_windows else "en"
    return chosen, lang


def main():
    audio, out = sys.argv[1], sys.argv[2]
    lang = sys.argv[sys.argv.index("--lang") + 1] if "--lang" in sys.argv else "hinglish"

    if lang == "hinglish":
        words, detected = hybrid(audio)
    else:
        kw = {"language": lang} if lang in ("hi", "en") else {}
        result = run(audio, **kw)
        words, detected = words_of(result), result.get("language")
        for w in words:
            w["w"] = to_hinglish(w["w"])

    # Personal Hinglish spelling fixes (hinglish.json), keeping punctuation and capitalisation.
    try:
        fixes = {k: v for k, v in json.load(open("hinglish.json")).items() if not k.startswith("_")}
    except FileNotFoundError:
        fixes = {}
    for w in words:
        m = re.match(r"^(\W*)([\w']+)(\W*)$", w["w"])
        if m and m.group(2).lower() in fixes:
            fixed = fixes[m.group(2).lower()]
            if m.group(2)[0].isupper():
                fixed = fixed[0].upper() + fixed[1:]
            w["w"] = m.group(1) + fixed + m.group(3)

    with open(out, "w") as f:
        json.dump({"language": detected, "words": words}, f, ensure_ascii=False, indent=1)
    print(f"  {len(words)} words ({detected})")


if __name__ == "__main__":
    main()
