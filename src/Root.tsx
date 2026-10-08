import React from 'react';
import {Composition} from 'remotion';
import {Reel} from './Reel';
import {CharScene, type CharSceneProps} from './character/CharScene';
import latest from './edits/latest.json';
import type {Edit} from './types';
import {Gallery} from './templates/Gallery';

export const Root: React.FC = () => (
  <>
  <Composition
    id="CharScene"
    component={CharScene as unknown as React.FC<Record<string, unknown>>}
    width={1920}
    height={1080}
    fps={30}
    durationInFrames={300}
    defaultProps={{scene: {frames: 300, fps: 30}, plate: '', size: {w: 1920, h: 1080}, sfxDir: '', tracks: {wall: []}, heads: {}, anchors: {}}}
    calculateMetadata={({props}) => {
      const p = props as unknown as CharSceneProps;
      return {durationInFrames: Math.max(1, p.scene.frames), fps: p.scene.fps, width: p.size.w, height: p.size.h};
    }}
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
  <Composition id="Gallery" component={Gallery} width={1080} height={1920} fps={30} durationInFrames={310} defaultProps={{footage: 'input/gallery.mp4'}} />
  </>
);
