// Element-to-component detection predicates for common cxui components.
// This is a hand-maintained supplement to the catalog — it lets BVC recognise
// native elements that host cxui directives even before the full catalog is
// loaded (e.g. for tooltip hints on hover).

export interface DetectEntry {
  name: string;
  matches: (el: Element) => boolean;
}

export const DETECT_MAP: DetectEntry[] = [
  {
    name: 'Button',
    matches: el => (el.tagName === 'BUTTON' || el.tagName === 'A') && el.hasAttribute('cxuiButton'),
  },
  {
    name: 'Badge',
    matches: el => el.tagName.toLowerCase() === 'cxui-badge' || el.hasAttribute('cxuiBadge'),
  },
  {
    name: 'Tag',
    matches: el => el.tagName.toLowerCase() === 'cxui-tag' || el.hasAttribute('cxuiTag'),
  },
  {
    name: 'Icon',
    matches: el => el.tagName.toLowerCase() === 'cxui-icon' || el.hasAttribute('cxuiIcon'),
  },
  {
    name: 'Input',
    matches: el => (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.hasAttribute('cxuiInput'),
  },
  {
    name: 'Chip',
    matches: el => el.tagName.toLowerCase() === 'cxui-chip' || el.hasAttribute('cxuiChip'),
  },
];

/** Quick name lookup — returns component name or null without full catalog. */
export function detectComponentName(el: Element): string | null {
  return DETECT_MAP.find(e => e.matches(el))?.name ?? null;
}
