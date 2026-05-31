// Detects cxui Angular components on DOM elements and maps them to catalog entries.

import type { CatalogEntry } from './catalog-loader';
import { getCxuiInstance } from './signal-writer';
import { detectComponentName } from './detect-map';

/**
 * Returns true when the element is (or hosts) a cxui component or directive.
 *
 * Detection order:
 *   1. Tag name starts with "cxui-" (element selector components).
 *   2. getCxuiInstance(el) is non-null — a Cxui* component (attribute or
 *      element selector) or directive instance, via window.ng dev tools.
 *   3. detectComponentName(el) (detect-map.ts) — synchronous fallback when
 *      window.ng is absent (isolated content-script world), e.g.
 *      button[cxuiButton].
 */
export function isCxuiComponent(el: Element): boolean {
  if (el.tagName.toLowerCase().startsWith('cxui-')) return true;
  if (getCxuiInstance(el) !== null) return true;
  // Isolated content-script world: window.ng is absent, so getCxuiInstance is
  // always null. Fall back to the synchronous attribute detector so directive
  // components (e.g. button[cxuiButton]) are still classified as cxui.
  return detectComponentName(el) !== null;
}

/**
 * Returns the catalog entry for el, or null when none matches.
 *
 * Constructor names are PascalCase ("CxuiButtonGroup"); catalog entry names
 * come from the story title's last segment ("Button Group", with spaces).
 * Naive case-insensitive equality therefore fails on every multi-word
 * component — Button Group, Form Field, Progress Bar, Range Slider, Code
 * Block, QR Code, Radio Button, etc. Normalising both sides to alphanumerics
 * only lets the strings line up regardless of separator.
 */
export function findCxuiEntry(el: Element, catalog: CatalogEntry[]): CatalogEntry | null {
  const instance = getCxuiInstance(el);

  let target: string | null = null;
  if (instance) {
    const ctorName = instance.constructor.name;
    if (ctorName.startsWith('Cxui')) target = normalizeName(ctorName.slice(4));
  }
  // No live instance (isolated world): derive the name from the attribute map.
  if (!target) {
    const detected = detectComponentName(el);
    if (detected) target = normalizeName(detected);
  }
  // Tag-based cxui components beyond DETECT_MAP (e.g. cxui-form-field): derive
  // the lookup name from the element-selector tag when window.ng is absent.
  if (!target) {
    const tag = el.tagName.toLowerCase();
    if (tag.startsWith('cxui-')) target = normalizeName(tag.slice('cxui-'.length));
  }
  if (!target) return null;

  return (
    catalog.find(e => normalizeName(e.name) === target) ??
    catalog.find(e => {
      const last = e.storyTitle.split('/').at(-1) ?? '';
      return normalizeName(last) === target;
    }) ??
    null
  );
}

function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Human-readable component name for the panel header. */
export function describeCxuiComponent(el: Element): string {
  const instance = getCxuiInstance(el);
  if (instance) {
    const name = instance.constructor.name;
    return name.startsWith('Cxui') ? name.slice(4) : name;
  }
  const detected = detectComponentName(el);
  if (detected) return detected;
  return el.tagName.toLowerCase();
}
