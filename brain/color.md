# Colour grading: lessons (learned the hard way on img-1391)

## What went wrong in v3
- I judged an HDR→SDR tone-map (hable) on ONE frame without the rest of the look. In the real render it stacked with the
  film look's warm overlay + contrast → yellow/white, dull, pale skin. He clearly preferred v1.
- Why v1 looked good: his iPhone footage is HLG HDR. In v1 the cut footage kept its HDR colour tags (bt2020 / arib-std-b67),
  and the render engine did the colour conversion itself → natural, rosy, fresh skin.

## Rules
1. **Skin tones first.** The goal is HIS original colours, slightly enhanced: fresh, natural, never yellow, grey or orange.
2. **Judge colour only on the full final look** (film overlays included) and on at least two moments, never a single raw frame.
3. **Compare against what he liked before** (v1 of img-1391 is the reference for his indoor night selfies).
4. Make small moves: a gentle S-curve, vibrance (boosts dull colours, gentle on skin), light sharpening. A strong warm overlay
   yellows white walls; keep `film.warmth` low (~0.05) on bright-wall footage.
5. Halation only for night footage with small light sources.
6. Subject/background separation (person mask: subject slightly brighter/warmer, background slightly darker) is the pro move,
   but needs a clean mask edge. The first attempt left a white halo around his hair → not ready (todo: shrink + feather the mask inward).

## Colour lab (how to test a grade without re-rendering a video)
Cut 1-second clips per variant straight from the source (keep colour tags where the pipeline does), render one still each
through the full Reel composition, and put them side by side with v1. Example: T7 `references/color-lab-img1391.jpg`.

## Status (his verdict, 2026-10-08)
- **v1 is the look.** He compared v1, v3, "natural+" and "relight" and chose v1: "just perfect with grains and all".
- Pipeline default = v1: HDR tags kept (no tone-map), no S-curve/sharpen, film look grain 0.1 / vignette 0.5 / contrast 1.08 /
  saturate 1.08 / warmth 0.18 / weave 1.2. The extra grade options exist (style.film scurve, sharpen, halation, hdrTonemap)
  but stay OFF unless a specific video clearly needs them, and then only after a colour-lab comparison against v1.
- Lesson: when he already loves a look, protect it. "Improving" it is a risk, not a default.
