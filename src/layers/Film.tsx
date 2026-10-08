import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {noise2D} from '@remotion/noise';
import {style} from '../style';

// Gate weave: the tiny drift of film running through a projector.
export const useGateWeave = () => {
  const frame = useCurrentFrame();
  const a = style.film.weave;
  const x = noise2D('wx', frame * 0.06, 0) * a;
  const y = noise2D('wy', frame * 0.06, 0) * a;
  const r = noise2D('wr', frame * 0.04, 0) * a * 0.08;
  return `translate(${x}px, ${y}px) rotate(${r}deg) scale(1.01)`;
};

export const FilmTreatment: React.FC = () => {
  const frame = useCurrentFrame();
  const f = style.film;
  const seed = Math.floor(frame / 2); // grain refreshes every 2 frames, like real film at 24-ish fps
  return (
    <>
      {f.warmth > 0 && (
        <AbsoluteFill
          style={{
            background: `linear-gradient(180deg, rgba(0,90,130,${f.warmth}) 0%, rgba(255,150,70,${f.warmth}) 100%)`,
            mixBlendMode: 'soft-light',
          }}
        />
      )}
      {f.vignette > 0 && (
        <AbsoluteFill
          style={{background: `radial-gradient(ellipse at 50% 45%, transparent 50%, rgba(0,0,0,${f.vignette}) 100%)`}}
        />
      )}
      {f.scanlines > 0 && (
        <AbsoluteFill
          style={{
            background: `repeating-linear-gradient(0deg, rgba(0,0,0,${f.scanlines}) 0px, rgba(0,0,0,${f.scanlines}) 1.6px, transparent 1.6px, transparent 4px)`,
          }}
        />
      )}
      {f.grain > 0 && (
        <Img
          src={staticFile(`assets/film/grain-${(seed % 8) + 1}.jpg`)}
          style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: f.grain * 2.5, mixBlendMode: 'overlay'}}
        />
      )}
    </>
  );
};
