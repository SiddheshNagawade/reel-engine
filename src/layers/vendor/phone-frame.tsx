// Ported from snapcn (github.com/snapcndev/snapcn), registry/snap-cn/phone-frame. MIT License,
// Copyright (c) 2026 Sri Nath (snap-cn). Adapted for ReelEngine: the demo ride-summary screen is dropped (the screen
// shows our media: his screen recording, a screenshot, or ScreenRecording with a camera), our light/dark tokens,
// sizes scale with `scale` (the device is 320×656 at 1, so ~2.3 fills a reel's width nicely).
// An iPhone-like shell (concentric corners, dynamic island, side buttons) that rises / rotates / floats in, with an
// optional static tilt or the cinematic "showcase" crane move (low corner → sweep up the screen → frontal).
import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {snapTheme, withAlpha} from './snapcn-theme';

export type PhoneFrameVariant = 'flat' | 'tilt' | 'showcase';
export type PhoneFrameEntrance = 'rise' | 'rotate-in' | 'float';
export const DEVICE_WIDTH = 320;
export const DEVICE_HEIGHT = 656;
export const BEZEL_WIDTH = 12;
export const SCREEN_W = DEVICE_WIDTH - BEZEL_WIDTH * 2;
export const SCREEN_H = DEVICE_HEIGHT - BEZEL_WIDTH * 2;
const DEVICE_RADIUS_RATIO = 0.165;
const ENTRANCE_FRAMES = 30;
const FLOAT_PERIOD_SECONDS = 4.5;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const deviceRadius = (w: number) => Math.round(w * DEVICE_RADIUS_RATIO);
export const screenRadiusFor = (radius: number, bezel = BEZEL_WIDTH) => Math.max(4, radius - bezel);

export function entrancePose(frame: number, entrance: PhoneFrameEntrance) {
  const easeOut = Easing.out(Easing.cubic);
  if (entrance === 'rotate-in') return {opacity: interpolate(frame, [0, 12], [0, 1], clamp), translateY: interpolate(frame, [0, 28], [60, 0], {...clamp, easing: easeOut}), rotateDeg: interpolate(frame, [0, 28], [-8, 0], {...clamp, easing: easeOut}), scale: interpolate(frame, [0, 28], [0.94, 1], {...clamp, easing: easeOut})};
  if (entrance === 'float') return {opacity: interpolate(frame, [0, 16], [0, 1], clamp), translateY: 0, rotateDeg: 0, scale: interpolate(frame, [0, 24], [0.96, 1], {...clamp, easing: easeOut})};
  return {opacity: interpolate(frame, [0, 12], [0, 1], clamp), translateY: interpolate(frame, [0, 26], [70, 0], {...clamp, easing: easeOut}), rotateDeg: 0, scale: 1};
}
export function floatOffset(frame: number, fps: number, amplitude: number, startFrame = 0, periodSeconds = FLOAT_PERIOD_SECONDS): number {
  const value = Math.sin((Math.max(0, frame - startFrame) / (fps * periodSeconds)) * Math.PI * 2) * amplitude;
  return value === 0 ? 0 : -value;
}
const SIDE_BUTTONS: {side: 'left' | 'right'; top: number; length: number}[] = [
  {side: 'left', top: 118, length: 26}, {side: 'left', top: 166, length: 46}, {side: 'left', top: 222, length: 46}, {side: 'right', top: 176, length: 68},
];
const SHOWCASE_STOPS = [0, 0.1, 0.42, 0.62, 0.9, 1];
const SHOWCASE_KEYS = {rotateX: [52, 36, 26, 12, 1.5, 0], rotateY: [28, 20, 10, 6, 1, 0], rotateZ: [30, 14, 2, 0, 0, 0], zoom: [2.6, 1.35, 2.75, 2.3, 1.04, 1], x: [60, 30, 0, -10, 0, 0], y: [-195, -40, 430, 380, 15, 0]};
// The crane move over `moveFrames` (snapcn ran it over the whole composition; here it is its own length).
export function showcasePose(frame: number, moveFrames: number) {
  const p = Math.max(0, Math.min(1, frame / Math.max(1, moveFrames - 1)));
  const at = (values: number[]) => interpolate(p, SHOWCASE_STOPS, values, {easing: Easing.inOut(Easing.cubic)});
  return {rotateX: at(SHOWCASE_KEYS.rotateX), rotateY: at(SHOWCASE_KEYS.rotateY), rotateZ: at(SHOWCASE_KEYS.rotateZ), zoom: at(SHOWCASE_KEYS.zoom), x: at(SHOWCASE_KEYS.x), y: at(SHOWCASE_KEYS.y)};
}

export type PhoneFrameProps = {children?: React.ReactNode; variant?: PhoneFrameVariant; entrance?: PhoneFrameEntrance; mode?: 'light' | 'dark'; bezelColor?: string; screenColor?: string;
  scale?: number; showDynamicIsland?: boolean; floatLoop?: boolean; floatAmplitude?: number; tiltAngle?: number; showcaseFrames?: number; shadow?: string};

export const PhoneFrame: React.FC<PhoneFrameProps> = ({children, variant = 'flat', entrance = 'rise', mode = 'dark', bezelColor, screenColor, scale = 1, showDynamicIsland = true, floatLoop = true, floatAmplitude = 6, tiltAngle = -12, showcaseFrames = 150, shadow}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = snapTheme(mode);
  const island = snapTheme('dark');
  const body = bezelColor ?? '#111114'; // the body is a physical object: always the dark end (as snapcn does)
  const glass = screenColor ?? t.card;
  const drop = shadow ?? `0 24px 60px ${withAlpha('#000000', 0.35)}`;
  const bodyRadius = deviceRadius(DEVICE_WIDTH);
  const pose = entrancePose(frame, entrance);
  const bob = floatLoop ? floatOffset(frame, fps, floatAmplitude, entrance === 'float' ? 0 : ENTRANCE_FRAMES) : 0;
  const crane = variant === 'showcase' ? showcasePose(frame, showcaseFrames) : null;
  return (
    <div style={{opacity: pose.opacity, translate: `0px ${(pose.translateY + bob) * scale}px`, rotate: `${pose.rotateDeg}deg`, scale: `${pose.scale * scale}`}}>
      <div style={{transform: crane ? `translate(${crane.x}px, ${crane.y}px) scale(${crane.zoom})` : undefined}}>
        <div style={{transform: `perspective(1400px) rotateX(${crane ? crane.rotateX : 0}deg) rotateY(${crane ? crane.rotateY : variant === 'tilt' ? tiltAngle : 0}deg) rotateZ(${crane ? crane.rotateZ : 0}deg)`}}>
          <div style={{position: 'relative', width: DEVICE_WIDTH, height: DEVICE_HEIGHT, borderRadius: bodyRadius, backgroundColor: body, padding: BEZEL_WIDTH, boxSizing: 'border-box', ...(shadow === '' ? {} : {boxShadow: drop})}}>
            {SIDE_BUTTONS.map((b) => <div key={`${b.side}-${b.top}`} style={{position: 'absolute', top: b.top, [b.side]: -3, width: 3, height: b.length, borderRadius: 2, backgroundColor: body}} />)}
            <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: screenRadiusFor(bodyRadius), backgroundColor: glass, overflow: 'hidden'}}>
              {children}
              {showDynamicIsland && (
                <div style={{position: 'absolute', top: 10, left: '50%', translate: '-50% 0px', width: 90, height: 26, borderRadius: 999, backgroundColor: island.background, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 9, boxSizing: 'border-box'}}>
                  <div style={{width: 9, height: 9, borderRadius: 999, backgroundColor: island.card, border: `1px solid ${island.border}`}} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
