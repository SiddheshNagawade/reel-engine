// One question of a geometry video on its own (Studio sidebar: Geometry → <lesson> → q05 …), so a question can be
// watched, checked and rendered alone. Same frames and sound as the full video, just cut to that question.
import React from 'react';
import {Sequence} from 'remotion';
import {GeoVideo} from './GeoVideo';
import {LESSONS} from './lessons';

export type GeoPartProps = {lesson: string; from: number; to: number};
export const GeoPart: React.FC<GeoPartProps> = ({lesson, from}) => (
  <Sequence from={-Math.round(from * 30)}>
    <GeoVideo lesson={lesson} />
  </Sequence>
);

/** the parts of a lesson: intro, each question (from the end of the previous one to its own end), outro */
export function lessonParts(lesson: string) {
  const L = LESSONS[lesson]();
  const parts: {id: string; from: number; to: number}[] = [];
  let prev = 0;
  L.guides.forEach((g) => {
    const id = 'q' + String(g.q).replace(/^(\d)\b/, '0$1').replace(/\s*\((\d)\)/, '-$1');
    if (parts.length === 0 && g.t0 > 8) parts.push({id: 'intro', from: 0, to: Math.max(0.1, g.t0 - 6)}), (prev = g.t0 - 6);
    parts.push({id, from: prev, to: g.t1});
    prev = g.t1;
  });
  if (L.t - prev > 1) parts.push({id: 'outro', from: prev, to: L.t});
  return parts;
}
