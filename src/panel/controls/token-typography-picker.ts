import { typographyTokenGroups, type TypographyToken, getAppliedToken, tokenClassName } from '../typography-tokens';

/** Strip all tw-font-* classes from the element. */
function clearTokenClasses(el: Element): void {
  for (const cls of Array.from(el.classList)) {
    if (cls.startsWith('tw-font-')) el.classList.remove(cls);
  }
}

/**
 * Apply a typography token: removes all tw-font-* (covers the legacy
 * multi-class case), adds the new one, and clears inline overrides that
 * would conflict with the token's CSS shorthand.
 */
export function applyTypographyToken(el: Element, token: TypographyToken): void {
  clearTokenClasses(el);
  el.classList.add(tokenClassName(token));
  const html = el as HTMLElement;
  html.style.removeProperty('font-size');
  html.style.removeProperty('font-weight');
  html.style.removeProperty('line-height');
}

/** Builds the Style row (label + dropdown) for the Typography section. */
export function createTypographyTokenRow(el: Element, onChange: () => void): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'two-col';

  const lbl = document.createElement('div');
  lbl.className = 'control-label';
  lbl.textContent = 'Style';

  const wrap = document.createElement('div');
  wrap.style.cssText = 'width:100%;';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'icon-trigger';

  const labelSpan = document.createElement('span');
  labelSpan.className = 'icon-trigger-name';

  const chev = document.createElement('span');
  chev.className = 'icon-trigger-chev';
  chev.innerHTML =
    '<svg width="10" height="10" viewBox="0 0 10 10"><path d="M2.5 3.5 L5 6 L7.5 3.5" stroke="currentColor" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  trigger.append(labelSpan, chev);
  wrap.appendChild(trigger);

  const refresh = () => {
    const current = getAppliedToken(el);
    labelSpan.textContent = current ?? 'Default';
    trigger.dataset.kind = current ? 'token' : 'empty';
  };
  refresh();

  let isOpen = false;
  let overlay: HTMLDivElement | null = null;

  const close = () => {
    isOpen = false;
    overlay?.remove();
    overlay = null;
    trigger.dataset.open = 'false';
  };
  const open = () => {
    isOpen = true;
    trigger.dataset.open = 'true';
    const shadowRoot = wrap.getRootNode() as ShadowRoot;
    const rect = trigger.getBoundingClientRect();
    const w = Math.max(rect.width, 200);

    overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483646;pointer-events:auto;';
    overlay.addEventListener('click', close);

    const content = document.createElement('div');
    content.className = 'popover';
    content.style.cssText = `top:${rect.bottom + 4}px;left:${rect.left}px;width:${w}px;padding:4px;max-height:60vh;overflow:auto;`;
    content.addEventListener('click', e => e.stopPropagation());

    const current = getAppliedToken(el);

    if (!current) {
      const defaultRow = document.createElement('button');
      defaultRow.type = 'button';
      defaultRow.className = 'token-picker-option';
      defaultRow.dataset.active = 'true';
      defaultRow.textContent = `Default · ${getComputedStyle(el).font.split(' ').slice(0, 2).join(' ')}`;
      content.appendChild(defaultRow);
      const divider = document.createElement('div');
      divider.style.cssText = 'height:1px;background:var(--c-border-subtle,#e2e8f0);margin:4px 0;';
      content.appendChild(divider);
    }

    for (const group of typographyTokenGroups) {
      if (group.tokens.length === 0) continue;
      const heading = document.createElement('div');
      heading.className = 'swatch-cat-heading';
      heading.textContent = group.label;
      content.appendChild(heading);
      for (const token of group.tokens) {
        const opt = document.createElement('button');
        opt.type = 'button';
        opt.className = 'token-picker-option';
        opt.textContent = token;
        if (token === current) opt.dataset.active = 'true';
        opt.addEventListener('click', () => {
          applyTypographyToken(el, token);
          close();
          refresh();
          onChange();
        });
        content.appendChild(opt);
      }
    }

    overlay.appendChild(content);
    shadowRoot.appendChild(overlay);
  };

  trigger.addEventListener('click', () => (isOpen ? close() : open()));

  row.append(lbl, wrap);
  return row;
}
