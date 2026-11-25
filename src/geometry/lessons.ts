// The lessons (one per video / pilot). The questions themselves live in elementary.ts (and intermediate.ts):
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
