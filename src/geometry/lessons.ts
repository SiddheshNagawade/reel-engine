// The lessons (one per video / pilot). The questions themselves live in elementary.ts and intermediate.ts:
// each question = its spoken lines + the actions they trigger, so editing a line re-times the video.
import {Lesson, CM} from './engine';
import {elementary, pilot} from './elementary';
import {intermediate} from './intermediate';

const cache: Record<string, Lesson> = {};
export const LESSONS: Record<string, () => Lesson> = {
  pilot: () => (cache.pilot ??= pilot()),
  elementary: () => (cache.elementary ??= elementary()),
  intermediate: () => (cache.intermediate ??= intermediate()),
};
export {CM};

export const FPS = 30;
export type Part = {id: string; title: string; f0: number; f1: number};
/** a video cut into its questions (intro, q01…, outro) on whole frames: the Studio shows each one on its own and the
 *  preview cache renders and stores each one separately, so an edit re-renders only the questions it changed */
export function lessonParts(lesson: string): Part[] {
  const L = LESSONS[lesson]();
  const total = Math.ceil(L.t * FPS);
  const cuts: {id: string; title: string; t: number}[] = [];
  L.guides.forEach((g, i) => {
    const id = 'q' + String(g.q).replace(/^(\d)\b/, '0$1').replace(/\s*\((\d)\)/, '-$1');
    if (i === 0 && g.t0 > 8) cuts.push({id: 'intro', title: 'Intro', t: 0});
    cuts.push({id, title: `Q${g.q} ${g.title}`, t: i === 0 ? (g.t0 > 8 ? g.t0 - 6 : 0) : L.guides[i - 1].t1});
  });
  const last = L.guides[L.guides.length - 1];
  if (last && L.t - last.t1 > 1) cuts.push({id: 'outro', title: 'Outro', t: last.t1});
  return cuts.map((c, i) => ({id: c.id, title: c.title, f0: Math.round(c.t * FPS), f1: i + 1 < cuts.length ? Math.round(cuts[i + 1].t * FPS) : total}));
}
