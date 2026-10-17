import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, interpolate, useCurrentFrame} from 'remotion';
import type {Edit} from './types';
import {VideoTrack} from './layers/VideoTrack';
import {FilmTreatment, useGateWeave} from './layers/Film';
import {Captions} from './layers/Captions';
import {Banner, Hook, HookLines, Popups} from './layers/Text';
import {BrollLayer} from './layers/Broll';
import {TransitionOverlay} from './layers/Transitions';
import {MemeLayer} from './layers/Memes';
import {EffectOverlay} from './layers/Effects';
import {Cards} from './layers/Cards';
import {style, applyStyleOverride} from './style';
import {AttachLayer} from './motion/Attach';
import {BehindInserts, InsertsLayer, RoomFrame} from './layers/Inserts';
import {CanvasWorld} from './layers/Canvas';
import {Probe} from './layers/Probe';
import {KitCuts, KitLayer} from './layers/Vendor';

// probe: only for the automatic frame review (scripts/review.mjs); measures where text/pictures sit, never in a normal render
export const Reel: React.FC<{edit: Edit; probe?: boolean}> = ({edit, probe}) => {
  applyStyleOverride(edit.styleOverride); // per-reel tweaks on top of the defaults
  const weave = useGateWeave();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{transform: weave}}>
        {(() => {
          const footage = (
            <RoomFrame edit={edit}>
              <VideoTrack edit={edit} behind={<>{edit.hookBehind ? <Hook edit={edit} behind /> : null}<BehindInserts edit={edit} /></>} />
            </RoomFrame>
          );
          // canvas mode: the canvas is the base, the footage one layer on it, one camera over all (layers/Canvas.tsx)
          return edit.canvas ? <CanvasWorld edit={edit} footage={footage} /> : footage;
        })()}
        <BrollLayer edit={edit} />
        <TransitionOverlay edit={edit} />
        <KitCuts edit={edit} />
        <EffectOverlay edit={edit} />
        <FilmTreatment />
      </AbsoluteFill>
      {/* Full-screen inserts (counter stage, before/after reveal, card stage) replace the picture; his voice goes on */}
      <InsertsLayer edit={edit} layer="full" />
      <TransitionOverlay edit={edit} top />
      {/* Text sits above the film look so it stays crisp */}
      <Cards edit={edit} />
      <Captions edit={edit} />
      <Popups edit={edit} />
      <MemeLayer edit={edit} />
      <InsertsLayer edit={edit} layer="over" />
      <KitLayer edit={edit} />
      <AttachLayer items={edit.attach} motion={edit.motion} layer="screen" />
      {!edit.hookBehind && <Hook edit={edit} />}
      <HookLines edit={edit} />
      <Banner edit={edit} />
      <SoundDesign edit={edit} />
      <EndFade edit={edit} />
      {probe && <Probe />}
    </AbsoluteFill>
  );
};

const SoundDesign: React.FC<{edit: Edit}> = ({edit}) => {
  const {musicVolume, musicDuckedVolume} = style.audio;
  return (
    <>
      {edit.sfx.map((s, i) => (
        <Sequence key={i} from={Math.max(0, s.f)} layout="none">
          <Audio
            src={staticFile(s.src)}
            // soft fade-in so whooshes swell instead of snapping in
            volume={(f) => s.volume * (s.fade ? Math.min(1, f / s.fade) : 1)}
          />
        </Sequence>
      ))}
      {/* Music by section (brain/sounds.md "Music by mood"): each part of the story gets its own track, cross-faded,
          ducked under his voice. Replaces the single bed when present. */}
      {(edit.musicCues ?? []).map((m, i) => (
        <Sequence key={`mc${i}`} from={m.f} durationInFrames={m.frames} layout="none">
          <Audio src={staticFile(m.src)} trimBefore={m.trimBefore ?? 0} loop
            volume={(f) => {
              const g = m.f + f;
              const talking = edit.speech.some(([a, b]) => g >= a - 6 && g <= b + 6);
              const base = (talking ? musicDuckedVolume : musicVolume) * (m.volume ?? 1);
              // equal-power fades: during a crossfade the two tracks sum to the same loudness (no dip, no bump)
              const inP = interpolate(f, [0, Math.max(1, m.fadeIn ?? 12)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              const outP = interpolate(f, [m.frames - Math.max(1, m.fadeOut ?? 18), m.frames], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              const eq = (p: number) => (m.curve === 'eq' ? Math.sin((p * Math.PI) / 2) : p);
              return base * eq(inP) * eq(outP);
            }} />
        </Sequence>
      ))}
      {edit.music && !(edit.musicCues ?? []).length && (
        <Audio
          src={staticFile(edit.music)}
          loop
          volume={(f) => {
            const talking = edit.speech.some(([a, b]) => f >= a - 6 && f <= b + 6);
            const base = talking ? musicDuckedVolume : musicVolume;
            const fade = interpolate(f, [0, 15, edit.durationInFrames - 20, edit.durationInFrames], [0, 1, 1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return base * fade;
          }}
        />
      )}
    </>
  );
};

// A gentle fade to black at the end instead of a hard stop.
const EndFade: React.FC<{edit: Edit}> = ({edit}) => {
  const frame = useCurrentFrame();
  const n = edit.endFade ?? 0;
  if (!n) return null;
  const o = interpolate(frame, [edit.durationInFrames - n, edit.durationInFrames - 2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return o > 0 ? <AbsoluteFill style={{background: '#000', opacity: o}} /> : null;
};
