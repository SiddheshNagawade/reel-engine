// The ported component kit (src/layers/vendor/*, from remocn + snapcn, both MIT) switched on by direction.kit
// (plan.mjs → scripts/lib/kit.mjs turns words into frames). Two layers:
//   <KitCuts>  cut transitions between two of his shots (whip-pan, zoom-blur, page-turn, glitch-cut), drawn above the
//              footage and under the film look; the two shots are rebuilt around the cut from his video
//   <KitLayer> everything else, above captions: marker / underline / scribble / rolling number / confetti /
//              speed lines / phone / laptop / screen recording / search bar
// Every item lands on his word and leaves with motion (never just disappears).
import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import type {Edit} from '../types';
import type {KitCut, KitItem, KitMedia} from './vendor/kit-types';
import {style} from '../style';
import {fonts} from './fonts';
import {faceAt} from './VideoTrack';
import type {CutPresentation} from './vendor/cut-types';
import {WhipPan} from './vendor/whip-pan';
import {ZoomBlur} from './vendor/zoom-blur';
import {PageTurn} from './vendor/page-turn';
import {GlitchCut} from './vendor/glitch-cut';
import {MarkerHighlight} from './vendor/marker-highlight';
import {InkUnderline} from './vendor/ink-underline';
import {ScribbleCircle} from './vendor/scribble-circle';
import {RollingNumber} from './vendor/rolling-number';
import {Confetti} from './vendor/confetti';
import {SpeedLines} from './vendor/speed-lines';
import {PhoneFrame, SCREEN_W as PHONE_W, SCREEN_H as PHONE_H} from './vendor/phone-frame';
import {LaptopFrame, SCREEN_W as LAPTOP_W, SCREEN_H as LAPTOP_H} from './vendor/laptop-frame';
import {ScreenRecording} from './vendor/screen-recording';
import {SearchTyping} from './vendor/search-typing';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const CUTS: Record<string, CutPresentation> = {'whip-pan': WhipPan, 'zoom-blur': ZoomBlur, 'page-turn': PageTurn, 'glitch-cut': GlitchCut};

// ── cuts ────────────────────────────────────────────────────────────────────────────────────────────────────────
// One of his shots, framed like VideoTrack frames it (shot zoom grown from his face + the film grade), playing in sync.
const Shot: React.FC<{edit: Edit; segIndex: number; from: number}> = ({edit, segIndex, from}) => {
  const seg = edit.segments[segIndex];
  const f = style.film;
  const face = faceAt(edit.faces, from, 14);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${seg.zoom})`, transformOrigin: face ? `${face[0] * 100}% ${face[1] * 100}%` : '50% 42%',
        filter: `contrast(${f.contrast}) saturate(${f.saturate}) brightness(${f.brightness})`}}>
        <OffthreadVideo src={staticFile(edit.video)} muted trimBefore={Math.max(0, seg.srcFrame + (from - seg.outFrame))} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const CutWindow: React.FC<{edit: Edit; c: KitCut}> = ({edit, c}) => {
  const frame = useCurrentFrame(); // local to the window
  const Pres = CUTS[c.use];
  const segs = edit.segments;
  const inIdx = segs.findIndex((s) => c.f >= s.outFrame && c.f < s.outFrame + s.frames);
  const outIdx = segs.findIndex((s) => c.f - 1 >= s.outFrame && c.f - 1 < s.outFrame + s.frames);
  if (!Pres || inIdx < 0 || outIdx < 0) return null;
  const start = c.f - Math.floor(c.frames / 2);
  const p = interpolate(frame, [0, c.frames - 1], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Pres p={p} entering={false} props={c} seed={`${c.f}`}><Shot edit={edit} segIndex={outIdx} from={start} /></Pres>
      <Pres p={p} entering props={c} seed={`${c.f}`}><Shot edit={edit} segIndex={inIdx} from={start} /></Pres>
    </AbsoluteFill>
  );
};

export const KitCuts: React.FC<{edit: Edit}> = ({edit}) => (
  <>
    {(edit.kitCuts ?? []).filter((c) => edit.video && edit.segments.length).map((c, i) => (
      <Sequence key={i} from={c.f - Math.floor(c.frames / 2)} durationInFrames={c.frames} layout="none">
        <CutWindow edit={edit} c={c} />
      </Sequence>
    ))}
  </>
);

// ── items ───────────────────────────────────────────────────────────────────────────────────────────────────────
const Media: React.FC<{m: KitMedia; box: [number, number]; cam?: KitItem['cam']; crop?: KitItem['crop']; fit?: 'cover' | 'contain'}> = ({m, box, cam, crop, fit}) =>
  cam?.length || crop || fit
    ? <ScreenRecording src={m.src} video={m.video} trimBefore={m.trimBefore} camera={cam} crop={crop} fit={fit} box={box} entrance="none" />
    : m.video
      ? <OffthreadVideo src={staticFile(m.src)} muted trimBefore={m.trimBefore ?? 0} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      : <Img src={staticFile(m.src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />;

// the way out: shrink a little, blur, fade (8 frames) — so nothing just vanishes
const useExit = (frames: number, n = 8) => {
  const t = useCurrentFrame();
  const k = interpolate(t, [frames - n, frames], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  return {opacity: 1 - k, transform: `scale(${1 - 0.08 * k})`, filter: k ? `blur(${8 * k}px)` : undefined} as React.CSSProperties;
};
// text blocks arrive: rise + un-blur (8 frames)
const useEnter = () => {
  const t = useCurrentFrame();
  const k = interpolate(t, [0, 8], [0, 1], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)});
  return {opacity: k, translate: `0 ${(1 - k) * 40}px`, filter: k < 1 ? `blur(${(1 - k) * 8}px)` : undefined} as React.CSSProperties;
};

const CARD: React.CSSProperties = {background: '#fffdf8', borderRadius: 28, padding: '34px 42px', boxShadow: '0 30px 80px rgba(0,0,0,0.35)'};
const Placed: React.FC<{x: KitItem; children: React.ReactNode}> = ({x, children}) => {
  const {width: W, height: H} = useVideoConfig();
  const enter = useEnter();
  return (
    <div style={{position: 'absolute', left: W * (x.x ?? 0.5), top: H * (x.y ?? 0.32), transform: 'translate(-50%, -50%)', width: W * (x.w ?? 0.84), display: 'flex', justifyContent: 'center', textAlign: 'center'}}>
      <div style={{...enter, ...(x.bg === 'card' ? CARD : {})}}>{children}</div>
    </div>
  );
};

const Item: React.FC<{edit: Edit; x: KitItem}> = ({x}) => {
  const {width: W, height: H} = useVideoConfig();
  const exit = useExit(x.frames);
  const U = W; // reels: width is the size unit
  const font = x.font ? (fonts as Record<string, string>)[x.font] ?? x.font : fonts.poppins;
  const ink = x.color ?? (x.bg === 'card' ? '#171717' : '#ffffff');
  const shadow = x.bg === 'card' ? undefined : '0 4px 24px rgba(0,0,0,0.55)';
  let body: React.ReactNode = null;
  if (x.use === 'marker') {
    body = (
      <Placed x={x}>
        <div style={{textShadow: shadow}}>
          <MarkerHighlight before={x.before} highlight={x.highlight ?? ''} after={x.after} markAt={x.markAt ?? 8} fontSize={U * (x.size ?? 0.075)} fontWeight={800} fontFamily={font}
            baseColor={ink} highlightedTextColor={x.inkOn ?? '#171717'} markerColor={x.accent ?? '#facc15'} />
        </div>
      </Placed>
    );
  } else if (x.use === 'underline') {
    // the underline is as wide as the text: measured by an inline-block wrapper (width: max-content) + the line inside it
    // one line: the font shrinks to fit the width, the stroke is as wide as the text (≈0.55 em per letter)
    const len = Math.max(1, (x.text ?? '').length);
    const fs = Math.min(U * (x.size ?? 0.085), (W * (x.w ?? 0.84)) / (len * 0.55));
    const wEst = len * fs * 0.55;
    body = (
      <Placed x={x}>
        <div style={{display: 'inline-flex', flexDirection: 'column', alignItems: 'center'}}>
          <span style={{fontSize: fs, fontWeight: 800, fontFamily: font, color: ink, lineHeight: 1.1, textShadow: shadow, whiteSpace: 'nowrap'}}>{x.text}</span>
          <InkUnderline width={wEst} thickness={fs * 0.22} color={x.accent ?? '#ff5a36'} delay={x.drawAt ?? 8} seed={`ul-${x.f}`} />
        </div>
      </Placed>
    );
  } else if (x.use === 'scribble') {
    const [bx, by, bw, bh] = x.box ?? [0.3, 0.3, 0.4, 0.15];
    body = (
      <div style={{position: 'absolute', left: W * bx, top: H * by}}>
        <ScribbleCircle width={W * bw} height={H * bh} color={x.accent ?? '#ff3b30'} strokeWidth={U * (x.stroke ?? 0.016)} delay={x.drawAt ?? 4} seed={`sc-${x.f}`} />
        {x.text && <div style={{position: 'absolute', left: 0, right: 0, top: H * bh + U * 0.03, textAlign: 'center', fontFamily: fonts.marker, fontSize: U * 0.055, color: x.accent ?? '#ff3b30', textShadow: '0 3px 14px rgba(0,0,0,0.5)'}}>{x.text}</div>}
      </div>
    );
  } else if (x.use === 'rolling') {
    body = (
      <Placed x={x}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: U * 0.01, filter: shadow ? 'drop-shadow(0 6px 18px rgba(0,0,0,0.5))' : undefined}}>
          <RollingNumber from={x.from ?? 0} to={x.to ?? 0} fontSize={U * (x.size ?? 0.16)} color={x.accent ?? ink} delay={x.rollAt ?? 4} rollFrames={x.rollFrames ?? 40} prefix={x.prefix} suffix={x.suffix} separator={x.separator} />
          {x.text && <div style={{fontFamily: font, fontWeight: 700, fontSize: U * 0.045, color: ink, opacity: 0.85}}>{x.text}</div>}
        </div>
      </Placed>
    );
  } else if (x.use === 'confetti') {
    body = <Confetti originX={x.x ?? 0.5} originY={x.y ?? 0.45} startFrame={x.fireAt ?? 0} lifetime={x.frames} particleCount={x.count ?? 140} colors={x.colors} power={x.power ?? 17} seed={x.f} />;
  } else if (x.use === 'speedlines') {
    body = (
      <SpeedLines mode={x.mode ?? 'focus'} x={x.x ?? 0.5} y={x.y ?? 0.45} from={x.fromPoint} color={x.accent ?? '#ffffff'} count={x.count ?? (x.mode === 'trail' ? 12 : 28)} weight={x.stroke ?? 3}
        spread={x.spread ?? 200} delay={x.lineAt ?? 0} seed={x.f}>
        {x.text ? <span style={{fontFamily: fonts.anton, fontSize: U * (x.size ?? 0.12), color: x.color ?? '#ffffff', textShadow: '0 6px 24px rgba(0,0,0,0.5)', whiteSpace: 'nowrap'}}>{x.text}</span> : undefined}
      </SpeedLines>
    );
  } else if (x.use === 'phone' || x.use === 'laptop') {
    const phone = x.use === 'phone';
    const box: [number, number] = phone ? [PHONE_W, PHONE_H] : [LAPTOP_W, LAPTOP_H];
    const screen = x.media ? <Media m={x.media} box={box} cam={x.cam} crop={x.crop} fit={x.fit} /> : null;
    body = (
      <AbsoluteFill style={{display: 'flex', alignItems: 'center', justifyContent: 'center', ...(x.bg && x.bg !== 'none' ? {background: x.bg} : {})}}>
        <div style={{translate: `${(x.x ?? 0.5) * W - W / 2}px ${(x.y ?? 0.5) * H - H / 2}px`}}>
          {phone
            ? <PhoneFrame variant={x.variant as 'flat' | 'tilt' | 'showcase' | undefined} entrance={x.entrance as 'rise' | 'rotate-in' | 'float' | undefined} mode={x.theme} scale={(x.scale ?? 0.78) * W / 320} showcaseFrames={x.frames}>{screen}</PhoneFrame>
            : <LaptopFrame entrance={x.entrance as 'rise' | 'open' | 'none' | undefined} mode={x.theme} scale={(x.scale ?? 0.95) * W / 900} pushAt={x.pushAt ?? null} notchLabel={x.text} notchAt={x.notchAt}>{screen}</LaptopFrame>}
        </div>
      </AbsoluteFill>
    );
  } else if (x.use === 'screen') {
    const inset = x.inset ?? 0;
    body = x.media ? (
      <AbsoluteFill style={{background: x.bg && x.bg !== 'none' ? x.bg : '#0a0a0a'}}>
        <div style={{position: 'absolute', left: W * inset, top: H * inset, width: W * (1 - 2 * inset), height: H * (1 - 2 * inset), borderRadius: inset ? 28 : 0, overflow: 'hidden', boxShadow: inset ? '0 30px 80px rgba(0,0,0,0.45)' : undefined}}>
          <ScreenRecording src={x.media.src} video={x.media.video} trimBefore={x.media.trimBefore} camera={x.cam} crop={x.crop} fit={x.fit} box={[W * (1 - 2 * inset), H * (1 - 2 * inset)]} />
        </div>
      </AbsoluteFill>
    ) : null;
  } else if (x.use === 'search') {
    body = (
      <AbsoluteFill style={x.bg && x.bg !== 'none' ? {background: x.bg} : {}}>
        <SearchTyping text={x.text ?? ''} startDelay={x.typeAt ?? 10} mode={x.theme ?? 'light'} surface={x.surface} icon={x.icon} y={x.y ?? 0.42} recedeFrames={0} charsPerSecond={x.cps ?? 14} />
      </AbsoluteFill>
    );
  }
  return <AbsoluteFill style={{...exit, pointerEvents: 'none'}}>{body}</AbsoluteFill>;
};

export const KitLayer: React.FC<{edit: Edit}> = ({edit}) => (
  <>
    {(edit.kit ?? []).map((x, i) => (
      <Sequence key={i} from={x.f} durationInFrames={x.frames} layout="none">
        <Item edit={edit} x={x} />
      </Sequence>
    ))}
  </>
);
