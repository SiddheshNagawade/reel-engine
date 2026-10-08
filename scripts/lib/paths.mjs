// Where media lives: the external drive when it's plugged in, otherwise ~/ReelEngine.
// Raw footage is only READ from the drive; heavy temporary work happens on the Mac's fast internal SSD (work/).
import fs from 'node:fs';
import path from 'node:path';

const config = fs.existsSync('reel.config.json') ? JSON.parse(fs.readFileSync('reel.config.json', 'utf8')) : {};
export const DRIVE_ROOT = config.driveRoot ?? '/Volumes/T7 Shield/ReelEngine';
export const LOCAL_ROOT = path.resolve('.');

export const driveAttached = () => fs.existsSync(path.dirname(DRIVE_ROOT));

export function mediaRoots() {
  const roots = [LOCAL_ROOT];
  if (driveAttached()) roots.unshift(DRIVE_ROOT);
  for (const r of roots) for (const d of ['inbox', 'projects', 'output']) fs.mkdirSync(path.join(r, d), {recursive: true});
  return roots;
}

// Working files (transcripts, kept footage, face data, versions) live on the drive; the Mac is only scratch space.
export const workRoot = () => (driveAttached() ? path.join(DRIVE_ROOT, '_work') : path.join(LOCAL_ROOT, 'work'));

export const outputRoot = () => (driveAttached() ? path.join(DRIVE_ROOT, 'output') : path.join(LOCAL_ROOT, 'output'));

export const VIDEO_RE = /\.(mp4|mov|m4v|mkv|webm|mts)$/i;
export const listVideos = (dir) =>
  fs
    .readdirSync(dir)
    .filter((f) => VIDEO_RE.test(f) && !f.startsWith('.') && !f.startsWith('._'))
    .map((f) => path.join(dir, f));
