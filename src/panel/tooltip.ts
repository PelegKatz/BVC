// Shared hover tooltip for any element inside the panel Shadow DOM.
// Shows after 200ms (avoids flash on brisk traversal), positioned above
// or below the anchor depending on `placement` (default: 'above').
//
// `text` can be a static string or a getter — if the getter returns null/''
// at hover-time the tooltip is suppressed (useful for conditional messages).

export function attachTooltip(
  el: HTMLElement,
  text: string | (() => string | null),
  placement: 'above' | 'below' = 'above',
): void {
  if (!text) return;

  // Accessibility: the tooltip is visual-only, so an icon-only control would
  // otherwise have no accessible name. For a static label on an element with no
  // visible text (and no existing aria-label), mirror the label into aria-label
  // so screen readers and voice control can name the control. Elements with
  // visible text keep that text as their name (avoids WCAG 2.5.3 mismatches).
  if (typeof text === 'string' && !(el.textContent ?? '').trim() && !el.getAttribute('aria-label')) {
    el.setAttribute('aria-label', text);
  }

  let tip: HTMLDivElement | null = null;
  let showTimer: number | null = null;

  const hide = (): void => {
    if (showTimer !== null) {
      window.clearTimeout(showTimer);
      showTimer = null;
    }
    tip?.remove();
    tip = null;
  };

  const show = (): void => {
    if (tip) return;
    const label = typeof text === 'function' ? text() : text;
    if (!label) return;
    const root = el.getRootNode();
    if (!(root instanceof ShadowRoot)) return;
    tip = document.createElement('div');
    tip.className = placement === 'below' ? 'swatch-tooltip tip-below' : 'swatch-tooltip';
    tip.textContent = label;
    const r = el.getBoundingClientRect();
    tip.style.left = `${r.left + r.width / 2}px`;
    tip.style.top = placement === 'below' ? `${r.bottom}px` : `${r.top}px`;
    root.appendChild(tip);
  };

  el.addEventListener('mouseenter', () => {
    if (showTimer !== null) window.clearTimeout(showTimer);
    showTimer = window.setTimeout(show, 200);
  });
  el.addEventListener('mouseleave', hide);
  el.addEventListener('mousedown', hide);
}
