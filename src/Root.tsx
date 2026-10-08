import React from 'react';
import {Composition} from 'remotion';
import {Reel} from './Reel';
import {CharTest} from './character/CharTest';
import latest from './edits/latest.json';
import type {Edit} from './types';

export const Root: React.FC = () => (
  <>
  <Composition
    id="CharTest"
    component={CharTest as unknown as React.FC<Record<string, unknown>>}
    width={1920}
    height={1080}
    fps={30}
    durationInFrames={318}
    defaultProps={{plate: 'char-test/plate.mp4', wall: [], bag: [], heads: {}, seat: {x: 0, y: 0}, occluders: []}}
    calculateMetadata={({props}) => ({durationInFrames: Math.max(1, (props.wall as unknown[]).length || 318)})}
  />
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
  </>
);
