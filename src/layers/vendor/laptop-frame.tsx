// Ported from snapcn (github.com/snapcndev/snapcn), registry/snap-cn/laptop-frame. MIT License,
// Copyright (c) 2026 Sri Nath (snap-cn). Adapted for ReelEngine: demo screen dropped (the screen shows our media),
// the "zoom-to-screen" finale starts at `pushAt` (his word) instead of a fixed frame 140, our tokens. The notch
// keeps its idle → loading → "label" morph when a label is given (e.g. "Payment received").
// A MacBook-like laptop: lid hinged at the deck, rises or OPENS in, floats; the finale dives into the screen until the
// screen fills the frame (the next scene happens "inside" the laptop).
import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {snapTheme, withAlpha, mix} from './snapcn-theme';

export const LID_WIDTH = 820;
export const LID_HEIGHT = 500;
export const BEZEL_WIDTH = 14;
const DECK_WIDTH = 900;
const DECK_HEIGHT = 22;
const LID_RADIUS = 22;
const REST_TILT = 18;
const PERSPECTIVE = 1600;
const ENTRANCE_FRAMES = 30;
const PUSH_FRAMES = 45;
export const CAMERA_EASE = Easing.bezier(0.2, 0.6, 0.35, 1);
const COLUMN_HEIGHT = LID_HEIGHT + DECK_HEIGHT;
const FLOAT_PERIOD_SECONDS = 5;
const NOTCH_HEIGHT = 30;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const SCREEN_W = LID_WIDTH - BEZEL_WIDTH * 2;
export const SCREEN_H = LID_HEIGHT - BEZEL_WIDTH * 2;

export type LaptopEntrance = 'rise' | 'open' | 'none';
function entrancePose(frame: number, entrance: LaptopEntrance) {
  const easeOut = Easing.out(Easing.cubic);
  if (entrance === 'none') return {opacity: 1, translateY: 0};
  if (entrance === 'open') return {opacity: interpolate(frame, [0, 10], [0, 1], clamp), translateY: interpolate(frame, [0, 24], [24, 0], {...clamp, easing: easeOut})};
  return {opacity: interpolate(frame, [0, 12], [0, 1], clamp), translateY: interpolate(frame, [0, 26], [70, 0], {...clamp, easing: easeOut})};
}
function lidTilt(frame: number, entrance: LaptopEntrance, pushAt: number | null, restTilt: number): number {
  const opened = entrance === 'open' ? interpolate(frame, [0, ENTRANCE_FRAMES], [82, restTilt], {...clamp, easing: Easing.out(Easing.cubic)}) : restTilt;
  if (pushAt == null || frame < pushAt) return opened;
  return interpolate(frame, [pushAt, pushAt + PUSH_FRAMES], [restTilt, 0], {...clamp, easing: CAMERA_EASE});
}
// The screen-takeover dolly: scale until the screen's inner rect covers the frame, sliding so it stays centred.
function cameraPose(frame: number, pushAt: number | null, baseScale: number, compWidth: number, compHeight: number) {
  if (pushAt == null) return {scale: 1, translateY: 0};
  const p = interpolate(frame, [pushAt, pushAt + PUSH_FRAMES], [0, 1], {...clamp, easing: CAMERA_EASE});
  const cover = Math.max(compWidth / (SCREEN_W * baseScale), compHeight / (SCREEN_H * baseScale));
  const d = (COLUMN_HEIGHT / 2 - LID_HEIGHT / 2) * baseScale;
  return {scale: 1 + (cover - 1) * p, translateY: d * cover * p};
}
const floatOffset = (frame: number, fps: number, amp: number, start = 0) => {
  const v = Math.sin((Math.max(0, frame - start) / (fps * FLOAT_PERIOD_SECONDS)) * Math.PI * 2) * amp;
  return v === 0 ? 0 : -v;
};
// notch: idle (camera dot) → loading (three dots) → done (label + battery), the pill widening as it goes
function notchState(frame: number, loadingAt: number, doneAt: number, doneWidth: number) {
  const c = (a: number, b: number) => interpolate(frame, [a, b], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const toLoad = c(loadingAt, loadingAt + 8), toDone = c(doneAt, doneAt + 12);
  return {width: 116 + (150 - 116) * toLoad + (doneWidth - 150) * toDone, idle: 1 - toLoad, loading: toLoad * (1 - toDone), done: toDone};
}
const Dot: React.FC<{size: number; color: string; style?: React.CSSProperties}> = ({size, color, style}) => <div style={{width: size, height: size, borderRadius: 999, backgroundColor: color, ...style}} />;

export type LaptopFrameProps = {children?: React.ReactNode; entrance?: LaptopEntrance; pushAt?: number | null; mode?: 'light' | 'dark'; bezelColor?: string; screenColor?: string; restTilt?: number;
  scale?: number; notchLabel?: string; notchAt?: number; indicatorColor?: string; batteryLevel?: number; floatLoop?: boolean; floatAmplitude?: number; shadow?: string};

export const LaptopFrame: React.FC<LaptopFrameProps> = ({children, entrance = 'rise', pushAt = null, mode = 'dark', bezelColor, screenColor, restTilt = REST_TILT, scale = 0.95, notchLabel, notchAt = 40, indicatorColor = '#30D158', batteryLevel = 85, floatLoop = true, floatAmplitude = 4, shadow}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = snapTheme(mode);
  const shell = snapTheme('dark');
  const lid = bezelColor ?? mix(shell.background, shell.foreground, 0.09);
  const glass = screenColor ?? t.card;
  const drop = shadow ?? `0 40px 80px ${withAlpha(shell.background, 0.45)}`;
  const pose = entrancePose(frame, entrance);
  const tilt = lidTilt(frame, entrance, pushAt, restTilt);
  const camera = cameraPose(frame, pushAt, scale, width, height);
  const bob = floatLoop && !(pushAt != null && frame >= pushAt) ? floatOffset(frame, fps, floatAmplitude, ENTRANCE_FRAMES) : 0;
  const notchFade = pushAt != null ? interpolate(frame, [pushAt, pushAt + 10], [1, 0], clamp) : 1;
  const n = notchState(frame, notchLabel ? notchAt : 1e9, notchLabel ? notchAt + 30 : 1e9, Math.min(SCREEN_W - 40, 90 + (notchLabel?.length ?? 0) * 7.5));
  const r2 = Math.max(4, LID_RADIUS - BEZEL_WIDTH);
  const layer: React.CSSProperties = {position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'};
  return (
    <div style={{transform: `translateY(${camera.translateY}px) scale(${camera.scale})`, transformOrigin: 'center center', textRendering: 'geometricPrecision'}}>
      <div style={{opacity: pose.opacity, translate: `0px ${pose.translateY + bob}px`, scale: `${scale}`}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', perspective: PERSPECTIVE}}>
          <div style={{width: LID_WIDTH, height: LID_HEIGHT, borderRadius: `${LID_RADIUS}px ${LID_RADIUS}px 6px 6px`, backgroundColor: lid, padding: BEZEL_WIDTH, boxSizing: 'border-box', transformOrigin: 'center bottom', transform: `rotateX(${tilt}deg)`}}>
            <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: `${r2}px ${r2}px 4px 4px`, backgroundColor: glass, overflow: 'hidden'}}>
              {children}
              {notchFade > 0 && (
                <div style={{position: 'absolute', top: 9, left: '50%', translate: '-50% 0px', width: n.width, height: NOTCH_HEIGHT, borderRadius: 999, backgroundColor: shell.background, overflow: 'hidden', zIndex: 10, opacity: notchFade}}>
                  <div style={{...layer, gap: 6, opacity: n.idle}}>
                    <Dot size={9} color={mix(shell.background, shell.foreground, 0.12)} style={{border: `1px solid ${mix(shell.background, shell.foreground, 0.2)}`}} />
                    <Dot size={5} color={mix(shell.background, shell.foreground, 0.06)} />
                  </div>
                  <div style={{...layer, gap: 4, opacity: n.loading}}>
                    {[0, 1, 2].map((i) => <Dot key={i} size={5} color={shell.foreground} style={{opacity: 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(frame / 4 - i * 0.9))}} />)}
                  </div>
                  <div style={{...layer, gap: 8, opacity: n.done}}>
                    <span style={{fontSize: 12, fontWeight: 500, letterSpacing: '-0.01em', color: shell.foreground, whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif'}}>{notchLabel}</span>
                    <div style={{width: 22, height: 11, borderRadius: 3, border: `1.5px solid ${indicatorColor}`, padding: 1.5, display: 'flex', alignItems: 'center', boxSizing: 'border-box'}}>
                      <div style={{width: `${Math.max(0, Math.min(100, batteryLevel))}%`, height: '100%', borderRadius: 1, backgroundColor: indicatorColor}} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div style={{position: 'relative', width: DECK_WIDTH, height: DECK_HEIGHT, borderRadius: '6px 6px 40px 40px',
            background: `linear-gradient(to bottom, ${withAlpha(shell.foreground, 0.16)}, ${withAlpha(shell.background, 0)} 34%, ${withAlpha(shell.background, 0.34)}), ${lid}`, ...(shadow === '' ? {} : {boxShadow: drop})}}>
            <div style={{position: 'absolute', top: 0, left: '50%', translate: '-50% 0px', width: 132, height: 8, borderRadius: '0 0 6px 6px', backgroundColor: withAlpha(shell.background, 0.28)}} />
          </div>
        </div>
      </div>
    </div>
  );
};
