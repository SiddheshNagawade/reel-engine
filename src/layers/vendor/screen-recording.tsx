// Ported from snapcn (github.com/snapcndev/snapcn), registry/snap-cn/screen-recording. MIT License,
// Copyright (c) 2026 Sri Nath (snap-cn). Adapted for ReelEngine: src goes through staticFile (our staged public/
// files), camera moves come from his words (plan.mjs turns {word|s} into frames from the item start), our theme.
// A screen recording or screenshot treated as a shot: browser chrome cropped off, and a camera that pushes in to the
// one spot that matters (zoom + focal point), holds, and pulls back. Works full-frame or inside phone/laptop frames.
import React from 'react';
import {AbsoluteFill, Easing, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

export type ScreenCrop = {top?: number; right?: number; bottom?: number; left?: number};
export type CameraMove = {at: number; duration?: number; zoom?: number; x?: number; y?: number};
export type CameraPose = {zoom: number; x: number; y: number};

export const CAMERA_EASE = Easing.bezier(0.2, 0.6, 0.35, 1);
export const CAMERA_MOVE_FRAMES = 25;
const ENTRANCE_FRAMES = 18;
const ENTRANCE_START = 4;
const ENTRANCE_BLUR = 8;
export const RESTING_POSE: CameraPose = {zoom: 1, x: 0.5, y: 0.5};
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

function moveProgress(frame: number, at: number, duration: number): number {
  if (duration <= 0) return 1;
  return interpolate(frame, [at, at + duration], [0, 1], {easing: CAMERA_EASE, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
}
// The camera pose at a frame: each move eases from the pose actually on screen to its target, then holds.
export function cameraPoseAt(frame: number, moves?: CameraMove[]): CameraPose {
  if (!moves || moves.length === 0) return RESTING_POSE;
  const sorted = moves.map((move, index) => ({move, index})).sort((a, b) => a.move.at - b.move.at || a.index - b.index)
    .filter((e, i, arr) => i === arr.length - 1 || arr[i + 1].move.at !== e.move.at).map((e) => e.move);
  let on = RESTING_POSE, target = RESTING_POSE;
  let current: {from: CameraPose; to: CameraPose; at: number; dur: number} | null = null;
  for (const move of sorted) {
    if (move.at > frame) break;
    if (current) {
      const p = moveProgress(move.at, current.at, current.dur);
      on = {zoom: lerp(current.from.zoom, current.to.zoom, p), x: lerp(current.from.x, current.to.x, p), y: lerp(current.from.y, current.to.y, p)};
    }
    target = {zoom: move.zoom ?? target.zoom, x: move.x ?? target.x, y: move.y ?? target.y};
    current = {from: on, to: target, at: move.at, dur: move.duration ?? CAMERA_MOVE_FRAMES};
  }
  if (!current) return on;
  const p = moveProgress(frame, current.at, current.dur);
  return {zoom: lerp(current.from.zoom, current.to.zoom, p), x: lerp(current.from.x, current.to.x, p), y: lerp(current.from.y, current.to.y, p)};
}
// A focal point the zoom can hold without showing an edge.
export function clampFocus(value: number, zoom: number): number {
  const lo = 0.5 / zoom, hi = 1 - lo;
  if (lo >= hi) return 0.5;
  return Math.min(Math.max(value, lo), hi);
}
function shotLayout(width: number, height: number, crop: ScreenCrop | undefined, fit: 'cover' | 'contain', sourceAspect: number | undefined) {
  const left = crop?.left ?? 0, top = crop?.top ?? 0;
  const keepX = Math.max(1 - left - (crop?.right ?? 0), 0.01);
  const keepY = Math.max(1 - top - (crop?.bottom ?? 0), 0.01);
  const aspect = sourceAspect && sourceAspect > 0 ? sourceAspect : width / height;
  const regionW = aspect * keepX, regionH = keepY;
  const k = fit === 'contain' ? Math.min(width / regionW, height / regionH) : Math.max(width / regionW, height / regionH);
  const w = regionW * k, h = regionH * k;
  return {left: (width - w) / 2, top: (height - h) / 2, width: w, height: h, mediaWidth: aspect * k, mediaHeight: k, mediaLeft: -left * aspect * k, mediaTop: -top * k};
}
const pct = (value: number, of: number) => `${(value / of) * 100}%`;
const isVideo = (src: string) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src);

export type ScreenRecordingProps = {src: string; video?: boolean; crop?: ScreenCrop; sourceAspect?: number; fit?: 'cover' | 'contain'; backdropColor?: string; camera?: CameraMove[]; radius?: number; trimBefore?: number; entrance?: 'fade' | 'none'; box?: [number, number]};

// box: the size of the box it is mounted in (a device screen); defaults to the composition
export const ScreenRecording: React.FC<ScreenRecordingProps> = ({src, video, crop, sourceAspect, fit = 'cover', backdropColor = '#0a0a0a', camera = [], radius = 0, trimBefore, entrance = 'fade', box}) => {
  const frame = useCurrentFrame();
  const vc = useVideoConfig();
  const [width, height] = box ?? [vc.width, vc.height];
  const shot = shotLayout(width, height, crop, fit, sourceAspect);
  const pose = cameraPoseAt(frame, camera);
  const focusX = clampFocus(pose.x, pose.zoom), focusY = clampFocus(pose.y, pose.zoom);
  const tx = (0.5 - focusX * pose.zoom) * 100, ty = (0.5 - focusY * pose.zoom) * 100;
  const arrival = entrance === 'none' ? 1 : interpolate(frame, [ENTRANCE_START, ENTRANCE_START + ENTRANCE_FRAMES], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const mediaStyle: React.CSSProperties = {position: 'absolute', left: pct(shot.mediaLeft, shot.width), top: pct(shot.mediaTop, shot.height), width: pct(shot.mediaWidth, shot.width), height: pct(shot.mediaHeight, shot.height),
    maxWidth: 'none', objectFit: 'cover', opacity: arrival, ...(arrival < 1 ? {filter: `blur(${(1 - arrival) * ENTRANCE_BLUR}px)`} : null)};
  const url = /^(https?:|data:|blob:)/.test(src) ? src : staticFile(src);
  return (
    <AbsoluteFill style={{backgroundColor: backdropColor, borderRadius: radius, overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, transformOrigin: '0 0', transform: `translate(${tx}%, ${ty}%) scale(${pose.zoom})`}}>
        <div style={{position: 'absolute', left: pct(shot.left, width), top: pct(shot.top, height), width: pct(shot.width, width), height: pct(shot.height, height), overflow: 'hidden'}}>
          {video ?? isVideo(src) ? <OffthreadVideo src={url} muted trimBefore={trimBefore} style={mediaStyle} /> : <Img src={url} style={mediaStyle} />}
        </div>
      </div>
    </AbsoluteFill>
  );
};
