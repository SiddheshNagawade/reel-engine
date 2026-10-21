# Title + thumbnail: how they split the job (Designomics)

Studied 2026-10-19 from his screenshots of every thumbnail on Anurag Bansal's and Enrico Tartarotti's channels next
to their views. Read with brain/longform-scripts.md "Title rule (round 4)".

## The core rule: two jobs, never the same words
- **Title = the who/what**: the searchable famous name and the topic ("How Milky Mist Built a ₹11,000 Crore Dairy
  Business Without Selling Milk").
- **Thumbnail = the feeling or the contradiction, in a picture + 1–4 words that ADD something** ("INDIA'S STRANGEST
  DAIRY COMPANY?"). The eye reads the thumbnail first (one second), then the title explains it.
- Never repeat title words in the thumbnail. If one is specific, the other can be broad, and vice versa.
  - Names-in-title + feeling-in-thumbnail = the default (good for search and for browse).
  - Broad title + specific picture (Enrico: "The LIES That Make Your Tech ACTUALLY Work" + a keyboard close-up
    saying "this is a lie") works when the object in the picture is instantly recognised.

## What the hits do
Anurag (face always, bold caps, yellow/red highlight word):
- Show the contradiction you get in one second: Coke can and bottle both "₹40" + "SAME PRICE?" (188k);
  Amazon vs Blinkit, same Dove bottle, two MRPs (296k); ₹10,497,000 watch vs ₹4,000 watch + "IS IT EVEN WORTH IT?";
  a car split half Suzuki/half Toyota + "SUZUKI-TOYOTA TRUTH!" (537k).
- A real number or price on the object (₹50,000 toothbrush, ₹20 dog food tag, ₹40).
- A question or claim that the title doesn't answer: "WITHOUT ONLINE STORES?" (Zudio 1M), "WHY FAME DOESN'T SELL
  PRODUCTS" (1.8M), "YOU CAN'T USE THIS COLOR" (Pantone 326k), "NVIDIA IN TROUBLE?" (282k).
- Famous faces only when they ARE the story (Musk vs Ambani, Ratan Tata for Zudio, Deepika for Dyson).
Enrico (light/white background, usually no face, lowercase short text, red hand-drawn circles and arrows):
- A familiar object or UI detail close up, circled, with a short claim that it's not what you think: "this is a lie"
  on a keyboard (1.1M), "this is not a circle / this is not true" on the battery icon (595k), "I love you… Read 9:39"
  (messaging 1.6M), "cheap | luxury" on two metal edges (780k).
- One idea, one object, 1–4 words. The red circle = "there is a secret right here".
- A repeatable look (white, red marker, lowercase) so every thumbnail is recognisable as his.

## What the misses have in common (often the topic, not the thumbnail)
- Wordplay you have to decode: "MEME BEFORE MEMES EXISTED" (Fevicol 16k), "MAHA KUMBH OF MARKETING" (20k).
- Abstract or unknown subjects: concerts "SOLD OUT" (6k), Korea (7k), Royal Enfield "BANKRUPT 3 TIMES" (10k),
  Enrico's AI Pin "really?" (48k), Italy (27k), "I quit my job" (23k).
- When the topic is weak, no thumbnail saves it. Topic first, then title, then thumbnail.

## Our thumbnail system (Designomics)
- Base: the series look (charcoal paper, cadmium orange as the ONLY accent, used as Enrico-style marker circles,
  arrows and the Price Tag).
- One hero object people recognise in one second (an app screen, a product, a letter, a logo-free shape). Max 3
  elements: object + 1–4 words + optional face.
- The words add what the title doesn't say: a claim ("this costs money"), a question ("same letter?"), or a
  contradiction (two prices). Never the title again; never wordplay that needs thinking.
- Money shows as a real figure on the object when money is the hook (₹ first for Indian viewers).
- Face: optional, only with a real reaction that adds emotion; right side, cut out.
- Every idea gets 3 thumbnail options (familiar-object + circle claim · split contradiction · price/number) and a pick,
  written next to the title in the editor brief.
- Test at phone size (about 160 px wide): can you read the words and get the point in one second?

## The library on the T7
`/Volumes/T7 Shield/ReelEngine/references/thumbnails/`: every thumbnail of both channels (153 jpgs, by video id),
`INDEX.md` (views · face yes/no · title · file, sorted by views), `sheet-anurag.jpg` / `sheet-enrico.jpg` (top 24 by
views on one image, look at these before designing), `faces.json`, and his original screenshots in `screenshots/`.

## Thumbnail types (pick one per idea; examples with views)
| Type | What it looks like | Hits | Use it when |
|---|---|---|---|
| 1. Circled detail | A familiar UI/object close up, one part circled in marker + "this is a lie" / "this is not true" | Enrico: keyboard 1.1M, battery icon 595k, volume slider 407k, letter "A" 301k | The insight is a hidden detail in something everyone uses |
| 2. Two-side contradiction | Split frame, two things that should differ (or match) with labels/prices | Enrico: cheap\|luxury 780k, $2 billion\|$0.00 467k · Anurag: Suzuki\|Toyota car 537k, Amazon\|Blinkit MRP 296k, can ₹40\|bottle ₹40 188k | The story is a paradox or a comparison |
| 3. One-word verdict | One huge word + the object: "dead.", "uncool", "genius", "yes." | Enrico: ChatGPT "genius" 950k, phone "uncool" 592k, UI "dead." 534k | An opinion or a trend ("X is dying / winning") |
| 4. Famous faces in conflict | The real people of the story, facing each other or split | Enrico: Cook vs Jobs 484k · Anurag: Musk vs Ambani, Bhavish vs Elon | The people ARE the story |
| 5. Number shock | One surprising number big: "218 hours to design a button", "₹50,000", "₹3,000 CR AD BUDGET?!" | Enrico: 218 hours 560k · Anurag: Dyson ₹50,000 | One number carries the surprise |
| 6. Brand + question | The brand's real place/product + a short question in caps | Anurag: Zudio "WITHOUT ONLINE STORES?" 1M, "INDIA'S STRANGEST DAIRY COMPANY?" 922k, "NVIDIA IN TROUBLE?" 282k | A famous brand doing something odd |
| 7. Recreated moment | A chat bubble / screen moment everyone has lived | Enrico: "I love you / Read 9:39" 1.6M, "will you hurt humans? well…" 230k | The topic is a feeling people know |
| 8. Series label | "the secret psychology of ___" + the app icon | Enrico: Notion 614k, Arc 341k, but WhatsApp 42k, Maps 52k | Only when the brand itself is hot right now |
Weak everywhere: wordplay to decode (Fevicol "MEME BEFORE MEMES EXISTED" 16k), unknown subjects, abstract concepts.

## Does a face get views? (measured 2026-10-19, Apple Vision on all 153 thumbnails)
- Anurag: face in thumbnail median **77k** (54 videos) vs no face **45k** (11). Newest 40: face 83k vs no face 71k.
- Enrico: face median **73k** (32) vs no face **100k** (55). Newest 40: face 74.5k vs no face 117k. Small faces (under
  35% of the height) did worst: 27k.
- Verdict: **a face is not what gets the view; the idea in the picture is.** Anurag's audience knows and trusts his face
  (Indian creator, the face is the brand), so it helps him. Enrico's best thumbnails are objects with a claim, and
  his face only works when it carries a strong reaction and is big.
- For Siddhesh (new, nobody knows the face yet): the object/contradiction is always the hero. Add his face only as a
  big, clear reaction that adds emotion (never small, never neutral). Test it: upload 3 versions with YouTube's
  "Test & Compare" (one with face, two without) for the first 6 episodes, then keep what wins.
- Caveats: detection counts any face (celebrities too); this is correlation across different topics, not proof.

## How the reference thumbnails are BUILT (studied 2026-10-21 from his 9 screenshots) → write prompts this way
Prompts go straight to ChatGPT image and get uploaded as-is (rules.md "Thumbnail prompts"), so every prompt spells out all of this.
- **Enrico look (fits us best, no face needed):** bright white / light-grey studio background with soft vignette and a faint
  cracked-glass texture; ONE glossy photoreal 3D hero object (a key, a toggle, a letter "A", a phone) lit softly from the
  top-left with a real shadow; 1–4 words HUGE in a heavy rounded sans (Inter / SF style), mostly lowercase, deep navy or
  red-to-pink gradient, tiny extrusion shadow, often ending in a full stop ("dead.", "gone.", "lies.", "complicated.");
  red hand-drawn marker circles, arrows and scribbles pointing at the one detail that matters. His typography video
  ("The Ridiculous Engineering Of Text", 301k) = a giant serif "A" with chromatic blur + red circles: our topic works.
- **Anurag look:** dark cinematic real-photo scene (store, office, street at dusk), the famous face or product in a hand,
  heavy condensed ALL-CAPS (Bebas / Anton style) white with ONE word on a yellow or red highlight bar, price tags
  (₹40 / ₹20) as props, tug-of-war or split screens for a fight. Faces are famous people, never an unknown host.
- Shared: one idea, 3 elements max, text and picture never say the same thing, readable at phone size, bottom-right
  corner empty (the timestamp sits there).
