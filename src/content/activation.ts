export type PageMode = 'full' | 'readonly' | 'inactive';

const CXUI_MARKERS = ['cxui-badge', 'cxui-tag', 'cxui-chip', 'cxui-icon', 'cxui-input', 'cxui-button', 'cxui-card', 'cxui-avatar'];

export interface DetectDeps {
  probeNg: () => Promise<boolean>;
}

export async function detectPageMode(deps: DetectDeps): Promise<PageMode> {
  if (!hasCxuiMarkers(document.body)) return 'inactive';
  const ng = await deps.probeNg();
  return ng ? 'full' : 'readonly';
}

/**
 * True when the in-bundle CX-Visual (the dev-build panel that ships inside
 * cx-web-workspace) is already mounted on this page. We key off its
 * double-mount flag `window.__cxVisualMounted` — the extension uses a different
 * flag (`__cxVisualExtensionMounted`), so this never matches the extension itself.
 * During the coexistence phase the extension refuses to activate to avoid two
 * panels fighting over the same shadow-host id and pick-mode events (§9).
 */
export function detectInBundleCxVisual(): boolean {
  return Boolean((window as unknown as Record<string, unknown>).__cxVisualMounted);
}

function hasCxuiMarkers(root: ParentNode): boolean {
  for (const tag of CXUI_MARKERS) {
    if (root.querySelector(tag)) return true;
  }
  // Attribute directives — query by attribute name (e.g. [cxuiButton]).
  for (const attr of ['cxuiButton', 'cxuiBadge', 'cxuiTag', 'cxuiInput', 'cxuiIcon', 'cxuiChip']) {
    if (root.querySelector(`[${attr}]`)) return true;
  }
  return false;
}
