import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {CardStage} from './CardStage';
import {CircleReveal} from './CircleReveal';
import {NumberRoll} from './NumberRoll';

// A short showcase of the motion templates, so Siddhesh (and future chats) can SEE what's available.
export const Gallery: React.FC<{footage: string}> = ({footage}) => (
  <AbsoluteFill style={{background: '#f4f3ef'}}>
    <Sequence durationInFrames={130}>
      <CardStage
        frames={130}
        items={[0, 240, 600].map((t) => ({src: footage, video: true, trimBefore: t}))}
        beats={[{at: 0, layout: 'single'}, {at: 40, layout: 'row'}, {at: 85, layout: 'stack'}]}
      />
    </Sequence>
    <Sequence from={130} durationInFrames={100}>
      <CircleReveal frames={100} before={{src: footage, video: true, trimBefore: 300, filter: 'grayscale(1) contrast(0.9) brightness(1.1)'}} after={{src: footage, video: true, trimBefore: 300}} />
    </Sequence>
    <Sequence from={230} durationInFrames={80}>
      <NumberRoll frames={80} values={[1, 3, 7, 12, 18, 24, 30]} prefix="Day " label="drawing journey" />
    </Sequence>
  </AbsoluteFill>
);
