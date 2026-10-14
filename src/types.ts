import type {CanvasSpec} from './layers/Canvas';
import type {SceneSpec} from './templates/Scene';
import type {WordsSpec, StackSpec, PhotoSpec, CardSpec} from './layers/TitleText';
// Everything is in output-timeline frames unless named src*.
export type Segment = {srcFrame: number; outFrame: number; frames: number; zoom: number; freeze?: boolean};
export type CapWord = {w: string; f0: number; f1: number; emph: boolean};
export type CaptionGroup = {f0: number; f1: number; words: CapWord[]};
export type Popup = {text: string; f: number; frames: number};
export type Broll = {src: string; f: number; frames: number; isVideo: boolean};
export type Sfx = {src: string; f: number; volume: number; fade?: number};
export type MemePlacement = 'peek-left' | 'peek-right' | 'corner-left' | 'corner-right' | 'drop-top' | 'card' | 'half' | 'full' | 'zoom';
export type Meme = {f: number; frames: number; sound: string | null; visual: string | null; isVideo: boolean; volume: number; sticker: boolean; placement: MemePlacement; fadeOut?: number; id?: string; scale?: number; lift?: number; tilt?: number; clip?: boolean; w?: number; h?: number; side?: 'left' | 'right'};
export type Effect = {f: number; frames: number; type: 'mono' | 'dark' | 'rage'; end: 'fade' | 'cut'};

export type TextCard = {f: number; frames: number; text: string; mode: 'typewriter' | 'wave' | 'slam' | 'title'; bg?: 'white' | 'black' | 'accent' | 'blur'; accentWord?: string; size?: number; speed?: number; color?: string; glow?: boolean};
export type CaptionStyle = 'bold-pop' | 'editorial' | 'script-accent' | 'condensed-stack' | 'highlight-box' | 'bubble' | 'glow-grad';
export type TransitionType = 'whip' | 'zoomblur' | 'flash' | 'lightleak' | 'tilt3d' | 'leakwhite';
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

// Media for inserts: a file inside public/ (staged for the render), a video from a point (trimBefore, frames).
export type MediaRef = {src: string; video?: boolean; trimBefore?: number; filter?: string; label?: string};
type InsertBase = {f: number; frames: number};
export type Insert = InsertBase & (
  | {kind: 'counter'; values: (string | number)[]; label?: string; prefix?: string; suffix?: string; style?: 'full' | 'overlay'; x?: number; y?: number; bg?: string; ink?: string; accent?: string}
  | {kind: 'reveal'; before: MediaRef; after: MediaRef; path?: [number, number][]}
  | {kind: 'stage'; items: MediaRef[]; beats: {at: number; layout: 'single' | 'row' | 'grid' | 'stack' | 'focus'; focus?: number}[]; bg?: string}
  | {kind: 'chat'; app?: 'whatsapp' | 'imessage' | 'instagram'; title?: string; messages: {from: 'me' | 'them'; text: string; at?: number}[]; x?: number; y?: number; gap?: number}
  | {kind: 'notify'; items: {app?: string; title: string; text: string; color?: string; at?: number}[]; x?: number; y?: number; gap?: number; stack?: boolean}
  | {kind: 'cursor'; label: string; doneLabel?: string; color?: string; doneColor?: string; x?: number; y?: number; clickAt?: number}
  | {kind: 'connector'; from: [number, number]; to: [number, number]; curve?: number; dotted?: boolean; color?: string; label?: string}
  | {kind: 'burst'; x?: number; y?: number; color?: string}
  | {kind: 'blur'; keys: [number, number, number, number, number][]} // [frame from start, x, y, w, h] (fractions, top-left)
  | {kind: 'plane'; media: MediaRef; tilt?: number; x?: number; y?: number; w?: number; scroll?: number}
  | {kind: 'push'; text?: string; media?: MediaRef; color?: string}
  | {kind: 'scatter'; text: string; accentWord?: string; accent?: string; color?: string; size?: number; y?: number; settleAt?: number}
  | ({kind: 'scene'} & Omit<SceneSpec, 'frames'>)
  | ({kind: 'words'} & WordsSpec)
  | ({kind: 'stack'} & StackSpec)
  | ({kind: 'photo'} & PhotoSpec)
  | ({kind: 'card'} & CardSpec)
);
// The footage makes room: scale (0.6 = 60 %), shift (fractions of the frame), rounded corners, what fills behind it.
export type RoomLayout = {f: number; frames: number; scale?: number; x?: number; y?: number; radius?: number; fill?: 'blur' | 'color'; color?: string};
export type CaptionMove = {f: number; frames: number; top?: number; scale?: number};

export type Edit = {
  inserts?: Insert[];
  layouts?: RoomLayout[];
  captionMoves?: CaptionMove[];
  attach?: Attach[];
  motion?: Motion;
  theme: Theme;
  transitions: Transition[];
  memes?: Meme[];
  effects?: Effect[];
  moves?: {f: number; type: 'push' | 'pull' | 'zoomout' | 'keypush'}[];
  banner?: {text: string; f0: number; f1: number} | null;
  hookBehind?: boolean;
  foreground?: {f: number; frames: number; src?: string; canvas?: boolean}[];
  canvas?: CanvasSpec | null; // canvas mode: footage is one layer on a canvas under one camera (layers/Canvas.tsx)
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
  musicCues?: {src: string; f: number; frames: number; volume?: number; trimBefore?: number; fadeIn?: number; fadeOut?: number; mood?: string}[];
  hookText: string | null;
};
