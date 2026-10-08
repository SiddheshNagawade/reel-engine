import React from 'react';
import {Composition} from 'remotion';
import {Reel} from './Reel';
import latest from './edits/latest.json';
import type {Edit} from './types';

export const Root: React.FC = () => (
  <Composition
    id="Reel"
    component={Reel}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={90}
    defaultProps={{edit: latest as unknown as Edit}}
    calculateMetadata={({props}) => ({
      durationInFrames: Math.max(1, props.edit.durationInFrames),
      fps: props.edit.fps,
    })}
  />
);
