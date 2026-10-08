"""Devanagari → casual Roman Hinglish, the way people type it ("apna", "kamzor", "nahi", "samajh").

Rule-based: consonant/vowel tables + Hindi schwa deletion (कर → kar, अपना → apna, रहते → rahte).
"""
import re

CONS = {
    "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "n", "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "n",
    "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n", "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n",
    "प": "p", "फ": "ph", "ब": "b", "भ": "bh", "म": "m", "य": "y", "र": "r", "ल": "l", "व": "v", "श": "sh",
    "ष": "sh", "स": "s", "ह": "h", "क़": "q", "ख़": "kh", "ग़": "gh", "ज़": "z", "ड़": "d", "ढ़": "rh", "फ़": "f",
}
NUKTA = {"क": "क़", "ख": "ख़", "ग": "ग़", "ज": "ज़", "ड": "ड़", "ढ": "ढ़", "फ": "फ़"}
VOWELS = {"अ": "a", "आ": "aa", "इ": "i", "ई": "ee", "उ": "u", "ऊ": "oo", "ऋ": "ri", "ए": "e", "ऐ": "ai", "ओ": "o", "औ": "au", "ऑ": "o"}
MATRAS = {"ा": "aa", "ि": "i", "ी": "ee", "ु": "u", "ू": "oo", "ृ": "ri", "े": "e", "ै": "ai", "ो": "o", "ौ": "au", "ॉ": "o"}
NASAL = {"ं": "n", "ँ": "n"}
HALANT, NUKTA_SIGN = "्", "़"
DIGITS = str.maketrans("०१२३४५६७८९", "0123456789")
DEVANAGARI = re.compile(r"[ऀ-ॿ]")


def _units(word):
    """Split into units: (kind, roman, vowel) where kind is 'C' (consonant) or 'V'; vowel None = inherent schwa."""
    units, i = [], 0
    chars = list(word)
    while i < len(chars):
        ch = chars[i]
        if i + 1 < len(chars) and chars[i + 1] == NUKTA_SIGN and ch in NUKTA:
            ch, i = NUKTA[ch], i + 1
        if ch in CONS:
            u = ["C", CONS[ch], None, ""]
            nxt = chars[i + 1] if i + 1 < len(chars) else ""
            if nxt == HALANT:
                u[2], i = "", i + 1
            elif nxt in MATRAS:
                u[2], i = MATRAS[nxt], i + 1
            units.append(u)
        elif ch in VOWELS:
            units.append(["V", "", VOWELS[ch], ""])
        elif ch in NASAL or ch == "ः":
            if units:
                units[-1][3] += "n" if ch in NASAL else "h"
        else:
            units.append(["X", ch, "", ""])
        i += 1
    return units


def to_hinglish(word: str) -> str:
    if not DEVANAGARI.search(word):
        return word
    word = word.translate(DIGITS)
    units = _units(word)
    n = len(units)
    out = []
    for k, (kind, cons, vowel, tail) in enumerate(units):
        if kind == "C" and vowel is None:
            # Schwa deletion: drop the inherent 'a' at word end, and medially in V C(a) C V.
            last = k == n - 1 or units[k + 1][0] == "X"
            nxt_has_vowel = k + 1 < n and units[k + 1][0] == "C" and units[k + 1][2] not in (None, "")
            prev_has_vowel = k > 0 and (units[k - 1][2] is None or units[k - 1][2] != "")
            vowel = "" if last or (k > 0 and nxt_has_vowel and prev_has_vowel) else "a"
            units[k][2] = vowel
        v = vowel or ""
        final = k == n - 1
        if final and v == "aa":
            v = "a"  # apna, karna
        elif final and v == "ee":
            v = "i"  # nahi, bhi
        elif final and v == "oo":
            v = "u"
        out.append(cons + v + tail)
    r = "".join(out)
    r = r.replace("nhin", "nahi").replace("ain", "ain")
    return r.lower()
