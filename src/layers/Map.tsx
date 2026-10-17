// MAPS (brain/animation-system.md: "spreads, global, expands to" / "where it comes from"): direction.maps → inserts
// kind 'map'. Real country shapes (Natural Earth 1:10m, India's OFFICIAL borders = the "IND" point of view, simplified
// to ~400 KB; Library/maps/world-ind.geojson on the T7, staged for the render). Everything lands on his words:
//   view    camera keys: {at, focus: ['IND'] | ['USA','CAN'] | 'world', pad} — the camera glides between them, so
//           "one country → the whole world" (the WHOOP 56-countries move) or "the world → India" is one continuous move
//   fills   {at, codes: ['IND', …], color, stagger}: countries fill in the accent one after another (a spread)
//   pins    {at, lon, lat, label}: a pin drops with a small label pill ("China", "Mumbai")
//   routes  {at, from: [lon, lat], to: [lon, lat], dashed}: an arc draws between two places, a dot travels it (imports,
//           shipping, a signal)
//   title   {at, text}: one big line that pops at the top ("56 COUNTRIES")
// Country codes are ISO-3 (IND, USA, CHN, PAK, BGD, NZL, GBR, ARE…). Colour per video: bg (sea), land, accent, ink.
import React, {useEffect, useMemo, useState} from 'react';
import {Easing, continueRender, delayRender, interpolate, staticFile, useVideoConfig} from 'remotion';
import {geoMercator, geoPath, geoCentroid, geoArea} from 'd3-geo';
import type {FeatureCollection, Feature, Geometry} from 'geojson';
import {fonts} from './fonts';
import {isLight} from './Captions';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const glide = Easing.bezier(0.6, 0, 0.25, 1);
const back = Easing.out(Easing.back(1.7));

export type MapSpec = {
  src?: string;
  style?: 'full' | 'over';
  bg?: string; land?: string; accent?: string; ink?: string;
  view?: {at: number; focus: string[] | 'world'; pad?: number}[];
  fills?: {at: number; codes: string[]; color?: string; stagger?: number; label?: boolean}[];
  pins?: {at: number; lon: number; lat: number; label?: string; color?: string}[];
  routes?: {at: number; from: [number, number]; to: [number, number]; color?: string; dashed?: boolean; seconds?: number}[];
  title?: {at: number; text: string};
};
type Props = {ADM0_A3: string; NAME: string};

// the camera frames a country's biggest landmass (the USA without Alaska across the date line, France without its islands)
const mainland = (f: Feature): Feature => {
  const g = f.geometry as {type: string; coordinates: number[][][][]} | null;
  if (!g || g.type !== 'MultiPolygon') return f;
  let best = g.coordinates[0], ba = -1;
  for (const p of g.coordinates) { const a = geoArea({type: 'Polygon', coordinates: p} as unknown as Feature); if (a > ba) { ba = a; best = p; } }
  return {...f, geometry: {type: 'Polygon', coordinates: best}} as Feature;
};
const useGeo = (src: string) => {
  const [geo, setGeo] = useState<FeatureCollection<Geometry, Props> | null>(null);
  const [h] = useState(() => delayRender(`map ${src}`));
  useEffect(() => {
    fetch(src.startsWith('http') ? src : staticFile(src)).then((r) => r.json()).then((g: FeatureCollection<Geometry, Props>) => {
      // GeoJSON files wind outer rings counter-clockwise; d3 needs clockwise, or a country becomes "the whole globe
      // minus the country" (a filled rectangle). Flip any shape that claims more than half the sphere.
      g.features = g.features.filter((f) => f.geometry);
      for (const f of g.features) {
        if (geoArea(f as Feature) <= 2 * Math.PI) continue;
        const gm = f.geometry as {type: string; coordinates: number[][][] | number[][][][]};
        if (gm.type === 'Polygon') (gm.coordinates as number[][][]).forEach((r) => r.reverse());
        else if (gm.type === 'MultiPolygon') (gm.coordinates as number[][][][]).forEach((p) => p.forEach((r) => r.reverse()));
      }
      setGeo(g); continueRender(h);
    }).catch(() => continueRender(h));
  }, [src, h]);
  return geo;
};

export const MapBoard: React.FC<{x: MapSpec & {frames: number}; t: number}> = ({x, t}) => {
  const {fps, width: W, height: H} = useVideoConfig();
  const U = Math.min(W, H * 0.5625);
  const geo = useGeo(x.src ?? 'assets/library/maps/world-ind.geojson');
  const bg = x.bg ?? '#0f7a55', land = x.land ?? '#f3d79a', acc = x.accent ?? '#f2b632';
  const ink = x.ink ?? (isLight(bg) ? '#1b1b1f' : '#ffffff');
  // one fixed projection for the whole world; the camera is a transform over it (paths are built once)
  const proj = useMemo(() => geoMercator().center([0, 20]).scale(W / 6.3).translate([W / 2, H / 2]), [W, H]);
  const path = useMemo(() => geoPath(proj), [proj]);
  const shapes = useMemo(() => (geo?.features ?? [])
    .filter((f) => f.geometry && f.properties.ADM0_A3 !== 'ATA')
    .map((f) => ({code: f.properties.ADM0_A3, name: f.properties.NAME, d: path(f as Feature) ?? '', b: path.bounds(mainland(f as Feature)), c: proj(geoCentroid(f as Feature)) ?? [0, 0]})), [geo, path, proj]);
  if (!geo) return null;
  const byCode = new Map(shapes.map((s) => [s.code, s]));
  // camera: fit the focus box into the frame (pad = margin), glide between keys
  const fit = (k: {focus: string[] | 'world'; pad?: number}) => {
    let b: [[number, number], [number, number]] = [[W * 0.02, H * 0.15], [W * 0.98, H * 0.85]];
    if (k.focus !== 'world') {
      const bs = k.focus.map((c) => byCode.get(c)?.b).filter(Boolean) as [[number, number], [number, number]][];
      if (bs.length) b = [[Math.min(...bs.map((q) => q[0][0])), Math.min(...bs.map((q) => q[0][1]))], [Math.max(...bs.map((q) => q[1][0])), Math.max(...bs.map((q) => q[1][1]))]];
    }
    const pad = k.focus === 'world' ? 1 : 1 + (k.pad ?? 0.35);
    const s = Math.min(W / ((b[1][0] - b[0][0]) * pad), H * 0.62 / ((b[1][1] - b[0][1]) * pad));
    return {s, cx: (b[0][0] + b[1][0]) / 2, cy: (b[0][1] + b[1][1]) / 2};
  };
  const keys = (x.view ?? [{at: 0, focus: 'world' as const}]).slice().sort((a, b) => a.at - b.at);
  let cam = fit(keys[0]);
  for (let i = 1; i < keys.length; i++) {
    if (t < keys[i].at) break;
    const to = fit(keys[i]), p = glide(Math.min(1, (t - keys[i].at) / Math.round(1.1 * fps)));
    // zoom moves in log space so a big pull-back feels even
    const ls = Math.log(cam.s) + (Math.log(to.s) - Math.log(cam.s)) * p;
    cam = {s: Math.exp(ls), cx: cam.cx + (to.cx - cam.cx) * p, cy: cam.cy + (to.cy - cam.cy) * p};
  }
  const tf = `translate(${W / 2},${H * 0.52}) scale(${cam.s}) translate(${-cam.cx},${-cam.cy})`;
  const sw = 1.2 / cam.s;
  // fill progress per country
  const fillK = new Map<string, {k: number; col: string}>();
  for (const f of x.fills ?? []) {
    f.codes.forEach((c, i) => {
      const s0 = f.at + i * Math.round((f.stagger ?? 0.12) * fps);
      const k = interpolate(t, [s0, s0 + Math.round(0.4 * fps)], [0, 1], clamp);
      if (k > (fillK.get(c)?.k ?? 0)) fillK.set(c, {k, col: f.color ?? acc});
    });
  }
  const mix = (a: string, b: string, p: number) => {
    const h = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
    if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) return p < 0.5 ? a : b;
    const A = h(a), B = h(b);
    return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * p)).join(',')})`;
  };
  const appear = interpolate(t, [0, Math.round(0.35 * fps)], [0, 1], clamp);
  const out = interpolate(t, [x.frames - Math.round(0.3 * fps), x.frames], [1, 0], clamp);
  const toScreen = (lon: number, lat: number): [number, number] => {
    const p = proj([lon, lat]) ?? [0, 0];
    return [W / 2 + (p[0] - cam.cx) * cam.s, H * 0.52 + (p[1] - cam.cy) * cam.s];
  };
  const ti = x.title && t >= x.title.at ? interpolate(t, [x.title.at, x.title.at + Math.round(0.3 * fps)], [0, 1], {...clamp, easing: back}) : 0;
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden', opacity: out}}>
      {x.style !== 'over' && <div style={{position: 'absolute', inset: 0, background: bg, opacity: appear}} />}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: appear}}>
        <g transform={tf}>
          {shapes.map((s) => {
            const f = fillK.get(s.code);
            return <path key={s.code} d={s.d} fill={f ? mix(land, f.col, f.k) : land} stroke={bg} strokeWidth={sw} strokeLinejoin="round" />;
          })}
        </g>
        {(x.routes ?? []).map((r, i) => {
          const d0 = Math.round((r.seconds ?? 1.2) * fps);
          const p = interpolate(t, [r.at, r.at + d0], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
          if (p <= 0) return null;
          const a = toScreen(...r.from), b = toScreen(...r.to);
          const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.3;
          const q = (u: number): [number, number] => [(1 - u) ** 2 * a[0] + 2 * (1 - u) * u * mx + u * u * b[0], (1 - u) ** 2 * a[1] + 2 * (1 - u) * u * my + u * u * b[1]];
          const tip = q(p), col = r.color ?? acc;
          return (
            <g key={i}>
              <path d={`M${a[0]},${a[1]} Q${mx},${my} ${b[0]},${b[1]}`} pathLength={1} strokeDasharray={r.dashed ? undefined : '1 1'} strokeDashoffset={r.dashed ? undefined : 1 - p}
                fill="none" stroke={col} strokeWidth={U * 0.008} strokeLinecap="round" opacity={0.9}
                {...(r.dashed ? {strokeDasharray: `${U * 0.015} ${U * 0.012}`, clipPath: undefined} : {})} />
              {p < 1 && <circle cx={tip[0]} cy={tip[1]} r={U * 0.014} fill={col} />}
            </g>
          );
        })}
      </svg>
      {(x.pins ?? []).map((pn, i) => {
        if (t < pn.at) return null;
        const k = interpolate(t, [pn.at, pn.at + Math.round(0.35 * fps)], [0, 1], {...clamp, easing: back});
        const [px, py] = toScreen(pn.lon, pn.lat), r = U * 0.022;
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: px - r, top: py - r * 2.6 - (1 - k) * U * 0.08, width: r * 2, height: r * 2.6, opacity: Math.min(1, k * 2)}}>
              <svg viewBox="0 0 20 26" width="100%" height="100%"><path d="M10 26 C10 26 0 15 0 9.5 A10 10 0 0 1 20 9.5 C20 15 10 26 10 26 Z" fill={pn.color ?? '#e5533d'} stroke="#1b1b1f" strokeWidth={1.2} /><circle cx={10} cy={9.5} r={3.6} fill="#fff" /></svg>
            </div>
            {pn.label && (
              <div style={{position: 'absolute', left: px + r * 0.6, top: py - r * 3.4, transform: `scale(${k})`, transformOrigin: 'left bottom', background: '#1b1b1f', color: '#fff',
                fontFamily: fonts.inter, fontWeight: 800, fontSize: U * 0.03, padding: `${U * 0.006}px ${U * 0.014}px`, borderRadius: U * 0.01, whiteSpace: 'nowrap'}}>{pn.label}</div>
            )}
          </React.Fragment>
        );
      })}
      {(x.fills ?? []).filter((f) => f.label).flatMap((f) => f.codes).map((c) => {
        const s = byCode.get(c), fk = fillK.get(c);
        if (!s || !fk || fk.k <= 0) return null;
        const [lx, ly] = [W / 2 + (s.c[0] - cam.cx) * cam.s, H * 0.52 + (s.c[1] - cam.cy) * cam.s];
        return <div key={`l${c}`} style={{position: 'absolute', left: lx - U * 0.3, width: U * 0.6, top: ly - U * 0.025, textAlign: 'center', fontFamily: fonts.anton,
          fontSize: U * 0.045, color: ink, opacity: fk.k, textShadow: isLight(ink) ? '0 2px 8px rgba(0,0,0,0.4)' : 'none'}}>{s.name.toUpperCase()}</div>;
      })}
      {ti > 0 && (
        <div style={{position: 'absolute', left: 0, width: W, top: H * 0.1, textAlign: 'center', fontFamily: fonts.anton, fontSize: U * 0.1, color: x.style === 'over' ? '#fff' : land,
          transform: `scale(${ti})`, letterSpacing: 1}}>{x.title!.text}</div>
      )}
    </div>
  );
};
