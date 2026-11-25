import React from 'react';
import {Composition, Folder} from 'remotion';
import {Reel} from './Reel';
import {CharScene, type CharSceneProps} from './character/CharScene';
import latest from './edits/latest.json';
import type {Edit} from './types';
import {Gallery} from './templates/Gallery';
import {VlogPiece, type VlogPieceProps} from './vlog/VlogPiece';
import {Episode, type EpisodeProps} from './longform/Episode';
import {GeoVideo, lessonFrames, type GeoProps} from './geometry/GeoVideo';
import {GeoPart} from './geometry/GeoPart';
import {lessonParts} from './geometry/lessons';

// geometry videos shown in the Studio as a folder each: the full video + every question on its own
const GEO_LESSONS = ['elementary', 'intermediate'];

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
  <Composition
    id="VlogPiece"
    component={VlogPiece as unknown as React.FC<Record<string, unknown>>}
    width={1920}
    height={1080}
    fps={30}
    durationInFrames={90}
    defaultProps={{base: null, frames: 90, layers: []}}
    calculateMetadata={({props}) => {
      const p = props as unknown as VlogPieceProps & {size?: [number, number]; fps?: number};
      return {durationInFrames: Math.max(1, p.frames), width: p.size?.[0] ?? 1920, height: p.size?.[1] ?? 1080, fps: p.fps ?? 30};
    }}
  />
  <Composition
    id="Episode"
    component={Episode as unknown as React.FC<Record<string, unknown>>}
    width={1920}
    height={1080}
    fps={30}
    durationInFrames={90}
    defaultProps={{base: '', frames: 90, fps: 30, shots: [{s: 0, e: 3, layout: 'face'}], scenes: []}}
    calculateMetadata={({props}) => {
      const p = props as unknown as EpisodeProps;
      return {durationInFrames: Math.max(1, p.frames), fps: p.fps ?? 30};
    }}
  />
  <Composition
    id="Geo"
    component={GeoVideo as unknown as React.FC<Record<string, unknown>>}
    width={1920}
    height={1080}
    fps={30}
    durationInFrames={90}
    defaultProps={{lesson: 'pilot', subs: true}}
    calculateMetadata={({props}) => ({durationInFrames: lessonFrames((props as unknown as GeoProps).lesson)})}
  />
  <Folder name="Geometry">
    {GEO_LESSONS.map((lesson) => (
      <Folder key={lesson} name={lesson}>
        <Composition id={`${lesson}-full`} component={GeoVideo as unknown as React.FC<Record<string, unknown>>} width={1920} height={1080} fps={30}
          durationInFrames={lessonFrames(lesson)} defaultProps={{lesson}} />
        {lessonParts(lesson).map((p) => (
          <Composition key={p.id} id={`${lesson}-${p.id}`} component={GeoPart as unknown as React.FC<Record<string, unknown>>} width={1920} height={1080}
            fps={30} durationInFrames={Math.max(1, p.f1 - p.f0)} defaultProps={{lesson, f0: p.f0, f1: p.f1}} />
        ))}
      </Folder>
    ))}
  </Folder>
  <Composition id="Gallery" component={Gallery} width={1080} height={1920} fps={30} durationInFrames={310} defaultProps={{footage: 'input/gallery.mp4'}} />
  </>
);
