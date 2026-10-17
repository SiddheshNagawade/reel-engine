// Stand-in for snapcn's design-system tokens (lib/snap-cn-ui: useSnapCnTheme, withAlpha). snapcn (github.com/snapcndev/snapcn),
// MIT License, Copyright (c) 2026 Sri Nath (snap-cn). We only need the light/dark palettes the device frames use.
export type SnapTheme = {background: string; foreground: string; card: string; border: string; muted: string; mutedForeground: string};
export const SNAP_THEMES: Record<'light' | 'dark', SnapTheme> = {
  light: {background: '#ffffff', foreground: '#0a0a0a', card: '#ffffff', border: '#e5e5e5', muted: '#f5f5f5', mutedForeground: '#737373'},
  dark: {background: '#0a0a0a', foreground: '#fafafa', card: '#171717', border: '#262626', muted: '#262626', mutedForeground: '#a3a3a3'},
};
export const snapTheme = (mode: 'light' | 'dark' = 'dark', over?: Partial<SnapTheme>): SnapTheme => ({...SNAP_THEMES[mode], ...over});
// hex (#rgb / #rrggbb) → rgba with alpha
export function withAlpha(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  const n = parseInt(f, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
// mix two hex colours (snapcn mixes in OKLCH; a plain sRGB mix is close enough for shell greys)
export function mix(a: string, b: string, t: number): string {
  const p = (x: string) => { const h = x.replace('#', ''); const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h; return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16)); };
  const [A, B] = [p(a), p(b)];
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}
