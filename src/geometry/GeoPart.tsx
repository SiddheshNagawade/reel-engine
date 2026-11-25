// One question of a geometry video on its own (Studio sidebar: Geometry → <lesson> → q05 …; the preview cache renders
// each one separately). Same frames and sound as the full video, cut to frames f0..f1 (lessonParts in lessons.ts).
import React from 'react';
import {Sequence} from 'remotion';
import {GeoVideo} from './GeoVideo';

export type GeoPartProps = {lesson: string; f0: number; f1: number};
export const GeoPart: React.FC<GeoPartProps> = ({lesson, f0}) => (
  <Sequence from={-f0}>
    <GeoVideo lesson={lesson} />
  </Sequence>
);
