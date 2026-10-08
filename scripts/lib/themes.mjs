// Picks one consistent look per reel: caption style, accent colours (chosen against the actual video colours), transitions.
import {spawn} from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';

export const CAPTION_STYLES = ['bold-pop', 'editorial', 'script-accent', 'condensed-stack', 'highlight-box', 'bubble'];
export const TRANSITIONS = ['whip', 'zoomblur', 'flash', 'lightleak', 'tilt3d'];

const THEMES = {
  money: {captionStyle: 'condensed-stack', accents: ['#FFD400', '#3DFF8F', '#FFB020'], energetic: ['zoomblur', 'whip', 'flash'], calm: ['lightleak', 'zoomblur']},
  tech: {captionStyle: 'highlight-box', accents: ['#00E5FF', '#7C5CFF', '#3DFF8F'], energetic: ['whip', 'tilt3d', 'zoomblur'], calm: ['tilt3d', 'lightleak']},
  fitness: {captionStyle: 'bold-pop', accents: ['#FF3B30', '#FFD400', '#3DFF8F'], energetic: ['zoomblur', 'flash', 'whip'], calm: ['zoomblur', 'lightleak']},
  motivation: {captionStyle: 'condensed-stack', accents: ['#FF7A00', '#FFD400', '#FF3B5C'], energetic: ['zoomblur', 'flash', 'whip'], calm: ['lightleak', 'tilt3d']},
  lifestyle: {captionStyle: 'editorial', accents: ['#F7C6D0', '#EED9A8', '#FF8FB1'], energetic: ['lightleak', 'whip'], calm: ['lightleak', 'tilt3d']},
  fun: {captionStyle: 'bubble', accents: ['#FF5FA2', '#FFD400', '#7CF7FF'], energetic: ['whip', 'flash', 'zoomblur'], calm: ['whip', 'lightleak']},
  food: {captionStyle: 'script-accent', accents: ['#FFB020', '#FF6B4A', '#B6FF3B'], energetic: ['whip', 'zoomblur'], calm: ['lightleak', 'tilt3d']},
  general: {captionStyle: 'script-accent', accents: ['#B6FF3B', '#FFD400', '#7CF7FF'], energetic: ['whip', 'zoomblur', 'flash'], calm: ['lightleak', 'tilt3d', 'whip']},
};

const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
const hueDist = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

// Sample small frames across the video → dominant hue + brightness.
export function analyzeFrames(video, duration) {
  return new Promise((resolve) => {
    const every = Math.max(0.5, duration / 16);
    const p = spawn(ffmpegPath, ['-i', video, '-vf', `fps=1/${every},scale=24:42`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']);
    const chunks = [];
    p.stdout.on('data', (d) => chunks.push(d));
    p.on('close', () => {
      const buf = Buffer.concat(chunks);
      const hist = new Array(36).fill(0);
      let lum = 0, n = 0;
      for (let i = 0; i + 2 < buf.length; i += 3) {
        const [h, s, l] = rgbToHsl([buf[i], buf[i + 1], buf[i + 2]]);
        hist[Math.floor(h / 10) % 36] += s * (1 - Math.abs(l - 0.5) * 2);
        lum += l;
        n++;
      }
      const top = hist.indexOf(Math.max(...hist));
      resolve({dominantHue: top * 10 + 5, brightness: n ? lum / n : 0.5});
    });
  });
}

export function pickTheme({topic, pace, frames, override = {}}) {
  const t = THEMES[topic] ?? THEMES.general;
  // Accent: the theme colour that stands out most against the footage's dominant colour.
  const accents = [...t.accents].sort(
    (a, b) => hueDist(rgbToHsl(hexToRgb(b))[0], frames.dominantHue) - hueDist(rgbToHsl(hexToRgb(a))[0], frames.dominantHue),
  );
  return {
    topic,
    pace,
    captionStyle: override.captionStyle && override.captionStyle !== 'auto' ? override.captionStyle : t.captionStyle,
    accent: override.accent || accents[0],
    accent2: accents[1],
    text: '#FFFFFF',
    transitions: pace === 'energetic' ? t.energetic : t.calm,
    brightFootage: frames.brightness > 0.62,
  };
}
