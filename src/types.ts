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

export type TextCard = {f: number; frames: number; text: string; mode: 'typewriter' | 'wave' | 'slam'; bg?: 'white' | 'black' | 'accent' | 'blur'; accentWord?: string; size?: number; speed?: number; color?: string; glow?: boolean};
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

// Tracked attachments (src/motion): see scripts/motiontrack.py for the sample format.
export type MotionHand = {side: 'L' | 'R'; conf: number; pts: Record<string, [number, number]>};
export type MotionSample = {
  f: number;
  face?: {box: [number, number, number, number]; roll: number; yaw?: number; pts: Record<string, [number, number]>};
  hands?: MotionHand[];
  body?: {pts: Record<string, [number, number]>};
};
export type Motion = {rate: number; w: number; h: number; frames: MotionSample[]};
export type Attach = {
  f: number;
  frames: number;
  what: string; // prop name in src/motion/props.tsx, or 'image' with src
  to?: string; // anchor (eyes, head, mouth, hand, finger.L, shoulder.R, screen…); default per prop
  offset?: [number, number]; // from the anchor, 100 = face height
  size?: number;
  text?: string;
  color?: string;
  src?: string; // image inside public/ (for what: 'image')
  screen?: [number, number]; // position for to: 'screen' (fractions)
  enter?: 'pop' | 'drop' | 'fade' | 'draw' | 'slide' | 'none';
  idle?: 'bob' | 'wiggle' | 'pulse' | 'spin' | 'float' | 'none';
  exit?: 'pop' | 'fade';
  tilt?: boolean;
  behind?: boolean; // under the person cut-out
};

export type Edit = {
  attach?: Attach[];
  motion?: Motion;
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
  cards?: TextCard[];
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
