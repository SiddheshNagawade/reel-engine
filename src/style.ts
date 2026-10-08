// The look settings every layer reads. Defaults come from style.json; a reel can tweak any of them for itself via
// direction.json → styleOverride (passed in as edit.styleOverride). Defaults are never modified.
import base from '../style.json';

type Style = typeof base;
const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o));
export const style: Style = clone(base);

const merge = (t: Record<string, unknown>, o: Record<string, unknown>) => {
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && t[k] && typeof t[k] === 'object') merge(t[k] as Record<string, unknown>, v as Record<string, unknown>);
    else t[k] = v;
  }
};

let applied = '';
export function applyStyleOverride(o?: Record<string, unknown> | null) {
  const key = JSON.stringify(o ?? {});
  if (key === applied) return;
  applied = key;
  const fresh = clone(base) as unknown as Record<string, unknown>;
  for (const k of Object.keys(style)) delete (style as unknown as Record<string, unknown>)[k];
  Object.assign(style, fresh);
  if (o) merge(style as unknown as Record<string, unknown>, o);
}
