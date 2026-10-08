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

export const Reel: React.FC<{edit: Edit}> = ({edit}) => {
  applyStyleOverride(edit.styleOverride); // per-reel tweaks on top of the defaults
  const weave = useGateWeave();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{transform: weave}}>
        <VideoTrack edit={edit} behind={edit.hookBehind ? <Hook edit={edit} behind /> : null} />
        <BrollLayer edit={edit} />
        <TransitionOverlay edit={edit} />
        <EffectOverlay edit={edit} />
        <FilmTreatment />
      </AbsoluteFill>
      {/* Text sits above the film look so it stays crisp */}
      <Cards edit={edit} />
      <Captions edit={edit} />
      <Popups edit={edit} />
      <MemeLayer edit={edit} />
      <AttachLayer items={edit.attach} motion={edit.motion} layer="screen" />
      {!edit.hookBehind && <Hook edit={edit} />}
      <HookLines edit={edit} />
      <Banner edit={edit} />
      <SoundDesign edit={edit} />
      <EndFade edit={edit} />
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
      {edit.music && (
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
