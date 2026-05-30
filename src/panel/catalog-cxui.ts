// Detects cxui Angular components on DOM elements and maps them to catalog entries.

import type { CatalogEntry } from './catalog-loader';
import { getCxuiInstance } from './signal-writer';

/**
 * Returns true when the element is (or hosts) a cxui component or directive.
 *
 * Detection order:
 *   1. Tag name starts with "cxui-" (element selector components).
 *   2. window.ng.getComponent(el) returns a Cxui* class (component with
 *      attribute selector, e.g. `button[cxuiButton]`).
 *   3. window.ng.getDirectives(el) contains a Cxui* instance (directive).
 */
export function isCxuiComponent(el: Element): boolean {
  if (el.tagName.toLowerCase().startsWith('cxui-')) return true;
  return getCxuiInstance(el) !== null;
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
  if (!instance) return null;

  const ctorName = instance.constructor.name;
  if (!ctorName.startsWith('Cxui')) return null;
  const target = normalizeName(ctorName.slice(4));
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
  if (!instance) return el.tagName.toLowerCase();
  const name = instance.constructor.name;
  return name.startsWith('Cxui') ? name.slice(4) : name;
}
