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
