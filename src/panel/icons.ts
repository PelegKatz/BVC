import { loadRuntimeData } from './runtime-data';

// Populated at boot from the bundled data/icons.json (was __CX_VISUAL_ICONS__).
export let iconNames: string[] = [];

export async function initIcons(): Promise<void> {
  iconNames = (await loadRuntimeData()).icons;
}

const cache = new Map<string, Promise<string>>();

// P1: the SVG bytes are not bundled (only icon names ship in icons.json), so
// the preview fetch is best-effort and resolves against the host page origin —
// it succeeds on a dev server that serves /assets/figma-icons and degrades
// (no preview) elsewhere. Bundling the SVGs is a P2 refinement.
export function fetchIconSvg(name: string): Promise<string> {
  let p = cache.get(name);
  if (p) return p;
  p = fetch(`/assets/figma-icons/${name}`).then(r => (r.ok ? r.text() : Promise.reject(new Error('failed: ' + name))));
  cache.set(name, p);
  return p;
}

export function iconLabel(name: string): string {
  const base = name.replace(/\.svg$/, '');
  const last = base.split('/').pop() || base;
  return last.replace(/[-_]/g, ' ');
}

export function iconGroup(name: string): string {
  const idx = name.indexOf('/');
  return idx === -1 ? '(root)' : name.slice(0, idx);
}
