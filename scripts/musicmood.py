"""Listen to every music track in the Library and tag it by what it SOUNDS like (not its title).

His ask (2026-10-14): the system only understood words; music needs an ear. Free local models from Essentia (MTG):
discogs-effnet embeddings + mood heads (happy, sad, aggressive, relaxed, party, danceability) + the Jamendo
mood/theme tagger (56 tags: dark, epic, emotional, energetic, funny, hopeful, romantic, suspense-like "dramatic"…).
Per track it writes to the catalog:
  moods        the tags that really fit (Jamendo top tags + strong mood heads), used by direction.music {mood}
  moodScores   every score 0..1 (the planner ranks by these when no track has the exact mood tag)
  bpm          tempo (beat-sync, pacing)
  drop         second where the track's most energetic stretch starts (cues start there unless `from` is given)
  energy       a coarse energy curve (one value per ~3 s) to see quiet intros, builds and drops
Models live in models/essentia (Mac = system). Run:  .venv/bin/python scripts/musicmood.py [--only id1,id2]
"""
import json
import os
import sys

import numpy as np
import essentia
import essentia.standard as es

essentia.log.warningActive = False
M = os.path.join(os.path.dirname(__file__), '..', 'models', 'essentia')
LIB = '/Volumes/T7 Shield/ReelEngine/Library'
HEADS = {'mood_happy': 'happy', 'mood_sad': 'sad', 'mood_aggressive': 'aggressive', 'mood_relaxed': 'calm', 'mood_party': 'party', 'danceability': 'danceable'}


def classes(name):
    return json.load(open(os.path.join(M, f'{name}-discogs-effnet-1.json')))['classes']


def main():
    only = set(sys.argv[sys.argv.index('--only') + 1].split(',')) if '--only' in sys.argv else None
    cat_file = os.path.join(LIB, 'catalog.json')
    cat = json.load(open(cat_file))
    emb_model = es.TensorflowPredictEffnetDiscogs(graphFilename=os.path.join(M, 'discogs-effnet-bs64-1.pb'), output='PartitionedCall:1')
    heads = {h: es.TensorflowPredict2D(graphFilename=os.path.join(M, f'{h}-discogs-effnet-1.pb'), output='model/Softmax') for h in HEADS}
    jam = es.TensorflowPredict2D(graphFilename=os.path.join(M, 'mtg_jamendo_moodtheme-discogs-effnet-1.pb'), output='model/Sigmoid')
    jam_classes = classes('mtg_jamendo_moodtheme')
    n = 0
    for m in cat['memes']:
        if m.get('kind') != 'music' or (only and m['id'] not in only):
            continue
        f = os.path.join(LIB, m['dir'], 'track.mp3')
        if not os.path.exists(f):
            continue
        audio = es.MonoLoader(filename=f, sampleRate=16000, resampleQuality=4)()
        if len(audio) < 16000 * 2:
            continue
        emb = emb_model(audio)  # one embedding per ~1 s patch
        scores = {}
        per_patch = {}
        for h, model in heads.items():
            p = model(emb)  # [patches, 2]
            pos = classes(h).index(h.replace('mood_', '')) if h.replace('mood_', '') in classes(h) else 0
            per_patch[HEADS[h]] = p[:, pos]
            scores[HEADS[h]] = round(float(p[:, pos].mean()), 3)
        jp = jam(emb)  # [patches, 56]
        jm = jp.mean(axis=0)
        for c, v in zip(jam_classes, jm):
            scores[c] = round(float(v), 3)
        # tags that really fit: the strongest Jamendo tags (relative: Jamendo sigmoids are small) + clear mood heads
        top = [jam_classes[i] for i in np.argsort(-jm)[:5] if jm[i] >= max(0.06, jm.max() * 0.45)]
        strong = [name for name, v in sorted(scores.items(), key=lambda kv: -kv[1]) if name in HEADS.values() and v >= 0.5]
        moods = list(dict.fromkeys(strong + top))
        # energy per ~3 s from aggressive + party + danceable, and where the best/energetic stretch starts
        e = per_patch['aggressive'] + per_patch['party'] + per_patch['danceable']
        k = max(1, len(e) // max(1, int(len(audio) / 16000 / 3)))
        curve = [round(float(e[i:i + k].mean() / 3), 2) for i in range(0, len(e), k)]
        sec_per_patch = len(audio) / 16000 / max(1, len(e))
        win = max(1, int(6 / sec_per_patch))
        roll = np.convolve(e, np.ones(win) / win, mode='valid') if len(e) > win else e
        drop = round(float(np.argmax(roll) * sec_per_patch), 1)
        try:
            bpm = round(float(es.RhythmExtractor2013(method='multifeature')(es.MonoLoader(filename=f, sampleRate=44100)())[0]))
        except Exception:
            bpm = None
        if m.get('moodsGuessed'):
            m['titleMoods'] = m.get('moods', [])
        m.update(moods=moods, moodScores=scores, bpm=bpm, drop=drop, energy=curve, seconds=round(len(audio) / 16000, 1), moodsGuessed=False, moodsBy='essentia')
        n += 1
        print(f"{m['id']:<44} {bpm or '?':>4} bpm  drop {drop:>5}s  {', '.join(moods)}", flush=True)
    for m in cat['memes']:
        if m.get('kind') == 'music' and m.get('moodsBy') == 'essentia' and (not only or m['id'] in only):
            m['heard'] = m['moods']
    print('too common to mean anything:', ', '.join(sorted(clean(cat))))
    json.dump(cat, open(cat_file, 'w'), indent=2)
    json.dump(cat, open(os.path.join(os.path.dirname(__file__), '..', 'brain', 'library-catalog.json'), 'w'), indent=2)
    print(f'\n{n} tracks listened to and tagged')


if __name__ == '__main__':
    main()


def clean(cat):
    """Tags that land on most tracks say nothing (the models hear 'danceable/summer/deep' on almost all of his game-style
    instrumentals): drop them. Keep the moods from the title/description (titleMoods) first, then the distinctive
    listened tags. Scores, bpm, drop and energy stay as measured."""
    music = [m for m in cat['memes'] if m.get('kind') == 'music' and m.get('moodsBy') == 'essentia']
    from collections import Counter
    freq = Counter(t for m in music for t in m.get('heard', m['moods']))
    common = {t for t, c in freq.items() if c > len(music) * 0.4}
    for m in music:
        m.setdefault('heard', m['moods'])
        m['moods'] = list(dict.fromkeys(m.get('titleMoods', []) + [t for t in m['heard'] if t not in common]))
    return common
