import { isCxuiComponent, describeCxuiComponent } from './catalog-cxui';

/**
 * Walk up parentElement looking for a cxui ancestor. Returns the ancestor
 * element, or null. The element itself is never considered a match — the
 * caller already knows whether `el` is cxui.
 */
export function findCxuiAncestor(el: Element): Element | null {
  let cur: Element | null = el.parentElement;
  while (cur) {
    if (isCxuiComponent(cur)) return cur;
    cur = cur.parentElement;
  }
  return null;
}

export function describeAncestorBanner(ancestor: Element): string {
  return `⚠ This is inside <${describeCxuiComponent(ancestor).toLowerCase()}> — visual edits here may conflict with the component's styling.`;
}
