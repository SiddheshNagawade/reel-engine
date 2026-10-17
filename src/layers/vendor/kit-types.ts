// Shapes of the ported-kit items in the edit (scripts/lib/kit.mjs builds them from direction.kit). All times inside an
// item (markAt, drawAt, rollAt, fireAt, lineAt, pushAt, typeAt, notchAt, cam[].at) are frames from the item start.
import type {CutProps} from './cut-types';
import type {CameraMove, ScreenCrop} from './screen-recording';

export type KitCut = CutProps & {use: 'whip-pan' | 'zoom-blur' | 'page-turn' | 'glitch-cut'; f: number; frames: number};
export type KitMedia = {src: string; video?: boolean; trimBefore?: number};
export type KitItem = {
  use: 'marker' | 'underline' | 'scribble' | 'rolling' | 'confetti' | 'speedlines' | 'phone' | 'laptop' | 'screen' | 'search';
  f: number; frames: number;
  x?: number; y?: number; w?: number; size?: number; color?: string; accent?: string; inkOn?: string; font?: string; bg?: string; stroke?: number;
  text?: string; before?: string; highlight?: string; after?: string;
  box?: [number, number, number, number];
  from?: number; to?: number; prefix?: string; suffix?: string; separator?: 'thin' | 'comma' | 'none'; rollFrames?: number;
  count?: number; colors?: string[]; power?: number; mode?: 'trail' | 'focus'; fromPoint?: {x: number; y: number}; spread?: number;
  media?: KitMedia; cam?: CameraMove[]; crop?: ScreenCrop; fit?: 'cover' | 'contain'; inset?: number;
  variant?: string; entrance?: string; theme?: 'light' | 'dark'; scale?: number; surface?: 'shadcn' | 'glass'; icon?: 'search' | 'sparkle' | 'none'; cps?: number;
  markAt?: number; drawAt?: number; rollAt?: number; fireAt?: number; lineAt?: number; pushAt?: number; typeAt?: number; notchAt?: number;
};
