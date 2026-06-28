// Token-aware color picker. The trigger reads like a `.value-chip`
// (swatch + label + chevron); clicking it opens a popover with the relevant
// cx-ui design-token swatches grouped by category, a recent-colors row, a
// search, and a "Custom" footer for raw hex. Picks write either
// `var(--c-${token.name})` (so the live element stays theme-aware) or a raw
// `#rrggbb` for one-off custom values.

import {
  tokens as allTokens,
  tokensByRole,
  findTokenByCssValue,
  tokenPath,
  tokenCategory,
  tokenName,
  loadRecentTokens,
  recordRecentToken,
  type Token,
} from '../tokens';
import { positionPopover } from '../popover-utils';

type ColorRole = 'background' | 'text' | 'border' | 'icon';

export interface NarrowedTokens {
  /** Tokens to render in the popover, in display order. */
  list: Token[];
  /** Current token that fell outside the narrowed set and was appended, or null. */
  offScale: Token | null;
}

/**
 * Tokens the popover should render, given the picker's role and the element's
 * current colour. Returns the narrowed-role set first, plus any off-scale
 * token already in use (so the picker reflects reality rather than hiding
 * the value). The off-scale token is also returned separately so the
 * renderer can flag its swatch.
 */
export function selectVisibleTokens(universe: Token[], role: ColorRole, current: Token | null): NarrowedTokens {
  const inScope = universe.filter(t => roleMatches(t, role) || isAccent(t));
  const offScale = current && !inScope.some(t => t.name === current.name) ? current : null;
  return {
    list: offScale ? [...inScope, offScale] : inScope,
    offScale,
  };
}

// Real tokens (emitted by plugin.ts) have name="c-text-primary" etc. — the
// `c-` prefix would break a name-based role check. Use the structured `role`
// field instead, which is the canonical signal from the token loader.
function roleMatches(token: Token, role: ColorRole): boolean {
  return token.role === role;
}

function isAccent(token: Token): boolean {
  return token.role === 'accent';
}

interface ColorChipProps {
  // Which design-token roles are relevant for this property. The picker also
  // always includes 'accent' tokens since brand / status colours apply
  // across roles.
  role: ColorRole;
  // The element this chip drives — read from inline style first (preserves
  // a raw hex or a token var), fall back to computed style.
  el: Element;
  cssProperty: 'backgroundColor' | 'borderColor' | 'color';
  onChange: (rawValue: string) => void;
}

export function createColorChip(props: ColorChipProps): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.className = 'color-chip-row';

  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'color-chip';

  const swatch = document.createElement('span');
  swatch.className = 'color-chip-swatch';

  const label = document.createElement('span');
  label.className = 'color-chip-label';

  const chev = document.createElement('span');
  chev.className = 'color-chip-chev';
  chev.innerHTML =
    '<svg width="10" height="10" viewBox="0 0 10 10"><path d="M2.5 3.5 L5 6 L7.5 3.5" stroke="currentColor" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  chip.append(swatch, label, chev);
  wrap.appendChild(chip);

  const refresh = () => {
    const current = readCurrentValue(props.el, props.cssProperty);
    // Search the full token catalogue so off-scale tokens (e.g. a surface-*
    // applied as text colour) resolve to a token instead of looking like a
    // custom hex. The popover then surfaces the same off-scale status.
    const token = findTokenByCssValue(current.raw);
    if (token) {
      const offScale = token.role !== props.role && token.role !== 'accent';
      swatch.style.background = token.hex;
      label.textContent = tokenPath(token);
      label.title = offScale
        ? `${tokenPath(token)} · ${token.hex} · off-scale — consider a ${props.role}-* token`
        : `${tokenPath(token)} · ${token.hex}`;
      chip.dataset.kind = 'token';
      chip.dataset.offscale = String(offScale);
    } else if (current.hex) {
      swatch.style.background = current.hex;
      label.textContent = current.hex.toUpperCase();
      label.title = current.hex;
      chip.dataset.kind = 'custom';
      delete chip.dataset.offscale;
    } else {
      swatch.dataset.empty = 'true';
      label.textContent = 'none';
      label.title = 'No colour set';
      chip.dataset.kind = 'empty';
      delete chip.dataset.offscale;
    }
  };
  refresh();

  chip.addEventListener('click', () => {
    openColorPopover({
      anchor: chip,
      role: props.role,
      current: readCurrentValue(props.el, props.cssProperty),
      onPickToken: token => {
        // token.cssVar is `var(--c-foo)`. token.name is `c-foo` (the loader
        // prefixes the kebab key with `c-`), so manually building
        // `var(--c-${name})` would yield `var(--c-c-foo)` — broken.
        props.onChange(token.cssVar);
        recordRecentToken(token);
        refresh();
      },
      onPickCustom: hex => {
        props.onChange(hex);
        refresh();
      },
    });
  });

  return wrap;
}

interface CurrentValue {
  raw: string; // exact CSS value from inline or computed style
  hex: string | null; // best-effort hex equivalent (null when transparent)
}

function readCurrentValue(el: Element, cssProperty: 'backgroundColor' | 'borderColor' | 'color'): CurrentValue {
  const inline = (el as HTMLElement).style[cssProperty];
  if (inline) {
    return { raw: inline, hex: cssValueToHex(inline) };
  }
  const computed = window.getComputedStyle(el)[cssProperty];
  return { raw: computed, hex: cssValueToHex(computed) };
}

function cssValueToHex(value: string): string | null {
  if (!value || value === 'transparent' || value === 'none') return null;
  const v = value.trim().toLowerCase();
  if (v.startsWith('#')) {
    const m = v.match(/^#([0-9a-f]{3,8})$/i);
    if (!m) return null;
    let body = m[1];
    if (body.length === 3)
      body = body
        .split('')
        .map(c => c + c)
        .join('');
    return '#' + body.slice(0, 6);
  }
  const rgb = v.match(/rgba?\(([^)]+)\)/);
  if (rgb) {
    const parts = rgb[1].split(/[,/\s]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const [r, g, b, a] = parts.map(p => parseFloat(p));
    if ([r, g, b].some(n => Number.isNaN(n))) return null;
    if (typeof a === 'number' && a === 0) return null;
    return '#' + [r, g, b].map(n => Math.round(n).toString(16).padStart(2, '0')).join('');
  }
  // For var(--c-*) the computed style we read back will already be hex/rgb.
  // For raw named colours we don't try to be clever — return null.
  return null;
}

interface OpenPopoverProps {
  anchor: HTMLElement;
  role: ColorRole;
  current: CurrentValue;
  onPickToken: (token: Token) => void;
  onPickCustom: (hex: string) => void;
}

function openColorPopover(opts: OpenPopoverProps): void {
  const shadowRoot = opts.anchor.getRootNode() as ShadowRoot;

  const overlay = document.createElement('div');
  overlay.className = 'popover-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:auto;';

  const popover = document.createElement('div');
  popover.className = 'popover color-popover';
  popover.style.width = '300px';
  popover.addEventListener('click', e => e.stopPropagation());

  const head = document.createElement('div');
  head.className = 'swatch-picker-head';
  head.innerHTML = '<span class="swatch-picker-heading">Pick a colour</span>';

  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'swatch-picker-search';
  search.placeholder = 'Search tokens…';
  search.spellcheck = false;

  const body = document.createElement('div');
  body.className = 'swatch-picker-body';

  popover.append(head, search, body);
  overlay.appendChild(popover);
  shadowRoot.appendChild(overlay);
  positionPopover(popover, opts.anchor, 300);

  // Highlight the chip while its popover is open. The overlay is removed by
  // several paths (outside-click, pick, custom-apply); a one-shot observer
  // clears the state whenever the overlay leaves the DOM, without threading a
  // close callback through every render helper.
  opts.anchor.setAttribute('data-open', 'true');
  const openObserver = new MutationObserver(() => {
    if (!overlay.isConnected) {
      opts.anchor.removeAttribute('data-open');
      openObserver.disconnect();
    }
  });
  openObserver.observe(shadowRoot, { childList: true });

  // The picker narrows to tokens for the role plus accent tokens (status,
  // brand, etc.) since those bleed across all roles in practice. If the
  // current value is an off-scale token (resolves to a real token but lives
  // outside the narrowed set — e.g., a surface-* token applied as colour),
  // selectVisibleTokens appends it so the picker reflects reality rather
  // than hiding the value.
  const currentToken = findTokenByCssValue(opts.current.raw);
  const universe = unique([...tokensByRole(opts.role), ...tokensByRole('accent')]);
  const { list: roleTokens, offScale } = selectVisibleTokens(universe, opts.role, currentToken);

  const recents = loadRecentTokens().filter(t => roleTokens.some(r => r.name === t.name));

  const renderBody = (query: string) => {
    body.innerHTML = '';

    const q = query.trim().toLowerCase();
    const filtered = q ? roleTokens.filter(t => t.name.toLowerCase().includes(q) || tokenPath(t).toLowerCase().includes(q)) : roleTokens;

    if (!q && recents.length > 0) {
      body.appendChild(renderCategory('Recent', recents, currentToken, opts.onPickToken, overlay, offScale, opts.role));
    }

    const byCategory = new Map<string, Token[]>();
    for (const t of filtered) {
      const cat = tokenCategory(t);
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push(t);
    }
    for (const [cat, tokens] of byCategory) {
      body.appendChild(renderCategory(cat, tokens, currentToken, opts.onPickToken, overlay, offScale, opts.role));
    }

    // Custom hex footer — always visible so users can drop out of the token
    // system when they need a one-off colour.
    body.appendChild(renderCustomFooter(opts.current.hex, opts.onPickCustom, overlay));

    if (filtered.length === 0 && q) {
      const empty = document.createElement('div');
      empty.className = 'swatch-picker-empty';
      empty.textContent = `No tokens match "${q}"`;
      body.insertBefore(empty, body.firstChild);
    }
  };

  search.addEventListener('input', () => renderBody(search.value));
  overlay.addEventListener('click', () => overlay.remove());
  renderBody('');
  setTimeout(() => search.focus(), 0);
}

function renderCategory(
  heading: string,
  tokens: Token[],
  current: Token | null,
  onPick: (token: Token) => void,
  overlay: HTMLDivElement,
  offScale: Token | null = null,
  role: ColorRole = 'text',
): HTMLDivElement {
  const cat = document.createElement('div');
  cat.className = 'swatch-cat';

  const head = document.createElement('div');
  head.className = 'swatch-cat-heading';
  const headText = document.createElement('span');
  headText.textContent = heading;
  const count = document.createElement('span');
  count.className = 'swatch-cat-count';
  count.textContent = String(tokens.length);
  head.append(headText, count);
  cat.appendChild(head);

  const grid = document.createElement('div');
  grid.className = 'swatch-grid';
  for (const t of tokens) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'swatch';
    btn.style.background = t.hex;
    if (current?.name === t.name) btn.dataset.active = 'true';
    let label = `${tokenPath(t)} · ${t.hex}`;
    if (offScale?.name === t.name) {
      btn.dataset.offscale = 'true';
      label += ` · off-scale — consider a ${role}-* token`;
    }
    attachSwatchTooltip(btn, label);
    btn.addEventListener('click', () => {
      onPick(t);
      overlay.remove();
    });
    grid.appendChild(btn);
  }
  cat.appendChild(grid);
  return cat;
}

/**
 * Attaches a styled hover tooltip to a swatch. Replaces the native title
 * attribute (slow + system-styled). Pill floats in viewport coords above
 * the swatch with a 200ms delay so brisk mouse traversal between swatches
 * doesn't flash a tooltip on every cell. The element is appended to the
 * panel's shadow root so the panel's CSS applies and the tooltip vanishes
 * if the popover closes mid-hover.
 */
function attachSwatchTooltip(btn: HTMLButtonElement, label: string): void {
  let tip: HTMLDivElement | null = null;
  let showTimer: number | null = null;
  const SHOW_DELAY = 200;

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
    tip = document.createElement('div');
    tip.className = 'swatch-tooltip';
    tip.textContent = label;
    const r = btn.getBoundingClientRect();
    tip.style.left = `${r.left + r.width / 2}px`;
    tip.style.top = `${r.top}px`;
    (btn.getRootNode() as ShadowRoot).appendChild(tip);
  };

  btn.addEventListener('mouseenter', () => {
    if (showTimer !== null) window.clearTimeout(showTimer);
    showTimer = window.setTimeout(show, SHOW_DELAY);
  });
  btn.addEventListener('mouseleave', hide);
  btn.addEventListener('mousedown', hide);
}

function renderCustomFooter(currentHex: string | null, onPick: (hex: string) => void, overlay: HTMLDivElement): HTMLDivElement {
  const cat = document.createElement('div');
  cat.className = 'swatch-cat color-popover-custom';

  const heading = document.createElement('div');
  heading.className = 'swatch-cat-heading';
  heading.textContent = 'Custom';
  cat.appendChild(heading);

  const row = document.createElement('div');
  row.className = 'color-popover-custom-row';

  const native = document.createElement('input');
  native.type = 'color';
  native.className = 'color-popover-native';
  native.value = currentHex ?? '#000000';

  const hex = document.createElement('input');
  hex.type = 'text';
  hex.className = 'mini-input color-popover-hex';
  hex.maxLength = 7;
  hex.placeholder = '#rrggbb';
  hex.spellcheck = false;
  hex.value = currentHex ?? '';

  const apply = document.createElement('button');
  apply.type = 'button';
  apply.className = 'pick-btn color-popover-apply';
  apply.textContent = 'Apply';

  const tryApply = (raw: string) => {
    const normalized = normaliseHex(raw);
    if (!normalized) return false;
    onPick(normalized);
    overlay.remove();
    return true;
  };

  native.addEventListener('input', () => {
    hex.value = native.value;
  });
  native.addEventListener('change', () => tryApply(native.value));
  hex.addEventListener('input', () => {
    const n = normaliseHex(hex.value);
    if (n) native.value = n;
  });
  hex.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      tryApply(hex.value);
    }
  });
  apply.addEventListener('click', () => tryApply(hex.value));

  row.append(native, hex, apply);
  cat.appendChild(row);
  return cat;
}

function normaliseHex(input: string): string | null {
  const v = input.trim().toLowerCase();
  const withHash = v.startsWith('#') ? v : '#' + v;
  const m = withHash.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (!m) return null;
  let body = m[1];
  if (body.length === 3)
    body = body
      .split('')
      .map(c => c + c)
      .join('');
  return '#' + body;
}

function unique(tokens: Token[]): Token[] {
  const seen = new Set<string>();
  const out: Token[] = [];
  for (const t of tokens) {
    if (seen.has(t.name)) continue;
    seen.add(t.name);
    out.push(t);
  }
  return out;
}

// Silence unused warnings on identifiers we may need later.
void allTokens;
void tokenName;
