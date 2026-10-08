// Generates a starter set of sound effects so reels have sound design out of the box.
// Add your own better ones to public/assets/sfx/<whoosh|hit|pop>/ any time.
import fs from 'node:fs';
import {ffmpeg} from './lib/media.mjs';

const sounds = {
  whoosh: [
    "aevalsrc='(random(0)*2-1)*pow(sin(PI*t/0.55),3)':d=0.55:s=48000,bandpass=f=1400:width_type=o:w=2.5,lowpass=f=5000,volume=2.2",
    "aevalsrc='(random(1)*2-1)*pow(sin(PI*t/0.4),2)':d=0.4:s=48000,bandpass=f=2200:width_type=o:w=2,volume=2",
  ],
  hit: [
    "aevalsrc='0.95*sin(2*PI*(42*t+14*(1-exp(-12*t))))*exp(-3.5*t)+0.25*(random(2)*2-1)*exp(-60*t)':d=0.9:s=48000",
  ],
  pop: [
    "aevalsrc='0.7*sin(2*PI*(700*t+120*(1-exp(-40*t))))*exp(-28*t)':d=0.18:s=48000",
  ],
};

for (const [type, list] of Object.entries(sounds)) {
  const dir = `public/assets/sfx/${type}`;
  fs.mkdirSync(dir, {recursive: true});
  for (const [i, graph] of list.entries()) {
    const [src, ...filters] = graph.split(/,(?=[a-z]+=)/);
    const out = `${dir}/starter-${i + 1}.wav`;
    await ffmpeg(['-y', '-f', 'lavfi', '-i', src, ...(filters.length ? ['-af', filters.join(',')] : []), out]);
    console.log('  made', out);
  }
}
for (const d of ['music', 'broll']) fs.mkdirSync(`public/assets/${d}`, {recursive: true});
