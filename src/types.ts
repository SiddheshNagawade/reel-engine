// Everything is in output-timeline frames unless named src*.
export type Segment = {srcFrame: number; outFrame: number; frames: number; zoom: number; freeze?: boolean};
export type CapWord = {w: string; f0: number; f1: number; emph: boolean};
export type CaptionGroup = {f0: number; f1: number; words: CapWord[]};
export type Popup = {text: string; f: number; frames: number};
export type Broll = {src: string; f: number; frames: number; isVideo: boolean};
export type Sfx = {src: string; f: number; volume: number; fade?: number};
export type MemePlacement = 'peek-left' | 'peek-right' | 'corner-left' | 'corner-right' | 'drop-top';
export type Meme = {f: number; frames: number; sound: string | null; visual: string | null; isVideo: boolean; volume: number; sticker: boolean; placement: MemePlacement; fadeOut?: number; id?: string; scale?: number; lift?: number; tilt?: number};
export type Effect = {f: number; frames: number; type: 'mono' | 'dark' | 'rage'; end: 'fade' | 'cut'};

export type CaptionStyle = 'bold-pop' | 'editorial' | 'script-accent' | 'condensed-stack' | 'highlight-box' | 'bubble';
export type TransitionType = 'whip' | 'zoomblur' | 'flash' | 'lightleak' | 'tilt3d';
export type Theme = {
  topic: string;
  pace: string;
  captionStyle: CaptionStyle;
  accent: string;
  accent2: string;
  text: string;
  transitions: TransitionType[];
  brightFootage: boolean;
};
export type Transition = {f: number; type: TransitionType};

export type Edit = {
  theme: Theme;
  transitions: Transition[];
  memes?: Meme[];
  effects?: Effect[];
  moves?: {f: number; type: 'push' | 'pull'}[];
  banner?: {text: string; f0: number; f1: number} | null;
  hookBehind?: boolean;
  foreground?: {f: number; frames: number; src?: string}[];
  endFade?: number;
  styleOverride?: Record<string, unknown> | null;
  faces?: [number, number, number, number?][]; // [frame, x, y, h] of the speaker's face
  name: string;
  video: string; // path inside public/
  fps: number;
  durationInFrames: number;
  segments: Segment[];
  captions: CaptionGroup[];
  emphasisFrames: number[];
  speech: [number, number][]; // frame ranges where someone is talking (for music ducking)
  popups: Popup[];
  broll: Broll[];
  sfx: Sfx[];
  music: string | null;
  hookText: string | null;
};
