// The shape every ported cut transition takes in ReelEngine. remocn's transitions are @remotion/transitions
// "presentations": both shots are drawn at once and each gets the same progress p (0 → 1) plus whether it is the shot
// leaving (exiting) or arriving (entering). Our reel is ONE footage track, so layers/Vendor.tsx rebuilds the two shots
// around the cut (the leaving shot keeps playing a few frames past the cut, the arriving one starts a few frames early)
// and hands them to these components. p = 0.5 is the cut frame itself.
import type React from 'react';
export type CutProps = {direction?: 'left' | 'right' | 'up' | 'down'; blur?: number; rise?: number; angle?: number; origin?: string; poses?: number; intensity?: number; slices?: number; rgbSplit?: number};
export type CutPresentation = React.FC<{children: React.ReactNode; p: number; entering: boolean; props: CutProps; seed?: string}>;
