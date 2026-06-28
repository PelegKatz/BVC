import { iconNames, fetchIconSvg, iconLabel } from '../icons';

import { attachTooltip } from '../tooltip';
import { createSection } from './section';

interface NgDevTools {
  getComponent(el: Element): object | null;
  getDirectives(el: Element): object[];
  applyChanges?(cmp: object): void;
}

interface SignalNode {
  value: unknown;
  version: number;
}

/** Figma-exported SVGs have explicit px dimensions that overflow their host.
 *  Normalize width/height to 100% so the host element controls the size. */
function normalizeSvg(container: HTMLElement): void {
  const svg = container.querySelector('svg');
  if (!svg) return;
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  (svg as SVGElement).style.display = 'block';
}

function findSignalNode(signal: unknown): SignalNode | null {
  if (!signal || typeof signal !== 'function') return null;
  for (const sym of Object.getOwnPropertySymbols(signal as object)) {
    const node = (signal as unknown as Record<symbol, unknown>)[sym];
    if (node !== null && typeof node === 'object' && 'value' in (node as object) && 'version' in (node as object)) {
      return node as SignalNode;
    }
  }
  return null;
}

type ButtonContentType = 'text' | 'text+icon' | 'icon';
type IconSide = 'left' | 'right';

/** Returns the CxuiButton instance for a button element (component or directive). */
function getButtonDirective(el: Element): Record<string, unknown> | null {
  const ng = (window as unknown as { ng?: NgDevTools }).ng;
  if (!ng) return null;
  // CxuiButton is registered as a component on the host element
  const cmp = ng.getComponent(el);
  if (cmp?.constructor.name === 'CxuiButton') return cmp as Record<string, unknown>;
  // Fallback: check directives in case the host structure differs
  for (const d of ng.getDirectives(el)) {
    if (d.constructor.name === 'CxuiButton') return d as Record<string, unknown>;
  }
  return null;
}

/** Calls .set() on a writable signal by name on the given instance, then schedules a re-render. */
function setButtonInternalSignal(el: Element, instance: Record<string, unknown>, name: string, value: unknown): void {
  const sig = instance[name];
  if (sig && typeof (sig as Record<string, unknown>)['set'] === 'function') {
    (sig as { set: (v: unknown) => void }).set(value);
    const ng = (window as unknown as { ng?: NgDevTools }).ng;
    setTimeout(() => ng?.applyChanges?.(instance), 0);
  }
}

function detectButtonType(el: Element): ButtonContentType {
  if (el.tagName.toLowerCase() === 'cxui-icon') return 'icon';
  const hasIcon = !!el.querySelector('cxui-icon');
  // Read _iconOnly from the Angular directive instance if available
  const dir = getButtonDirective(el);
  const iconOnlySig = dir?.['_iconOnly'];
  const isIconOnly =
    typeof iconOnlySig === 'function'
      ? !!(iconOnlySig as () => unknown)()
      : el.hasAttribute('cxuiIconButton') || !!el.querySelector('[data-bvc-text-hidden]');
  if (isIconOnly && hasIcon) return 'icon';
  if (hasIcon) return 'text+icon';
  return 'text';
}

function detectIconSide(el: Element): IconSide {
  const iconEl = resolveIconEl(el);
  if (!iconEl) return 'left';
  // Text content is text nodes, not elements — must scan childNodes to determine order.
  for (const child of Array.from(el.childNodes)) {
    if (child === iconEl) return 'left';
    // Skip hidden-text spans and empty text nodes; a visible text node means icon comes after
    if (child.nodeType === Node.ELEMENT_NODE && (child as Element).hasAttribute('data-bvc-text-hidden')) continue;
    if (child.nodeType === Node.TEXT_NODE && !(child.textContent ?? '').trim()) continue;
    return 'right';
  }
  return 'left';
}

/** Returns the first <cxui-icon> child of el, or el itself if el is the icon. */
function resolveIconEl(el: Element): Element | null {
  if (el.tagName.toLowerCase() === 'cxui-icon') return el;
  return el.querySelector('cxui-icon');
}

/** Hides non-icon child content so a button appears icon-only. */
function hideButtonText(el: Element): void {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) {
    if ((n.textContent ?? '').trim()) textNodes.push(n as Text);
  }
  for (const tn of textNodes) {
    const span = document.createElement('span');
    span.setAttribute('data-bvc-text-hidden', 'true');
    span.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;';
    tn.parentNode?.insertBefore(span, tn);
    span.appendChild(tn);
  }
}

/** Restores text hidden by hideButtonText. */
function showButtonText(el: Element): void {
  for (const span of Array.from(el.querySelectorAll('[data-bvc-text-hidden]'))) {
    span.replaceWith(...Array.from(span.childNodes));
  }
}

/** Moves the icon to the specified side of the button. */
function moveIconToSide(el: Element, side: IconSide): void {
  const iconEl = resolveIconEl(el);
  if (!iconEl) return;
  if (side === 'left') {
    el.insertBefore(iconEl, el.firstChild);
  } else {
    el.appendChild(iconEl);
  }
}

/** Updates an existing <cxui-icon> element's icon: writes the Angular signal and refreshes the SVG. */
export function applyIconToElement(targetEl: Element, iconPath: string): void {
  const ng = (window as unknown as { ng?: NgDevTools }).ng;
  const instance = ng?.getComponent(targetEl) as Record<string, unknown> | null;
  if (instance) {
    const node = findSignalNode(instance['icon']);
    if (node) {
      node.value = iconPath;
      node.version++;
    }
    setTimeout(() => ng?.applyChanges?.(instance as object), 0);
  }
  targetEl.setAttribute('icon', iconPath);
  fetchIconSvg(iconPath)
    .then(svg => {
      const el = targetEl as HTMLElement;
      el.innerHTML = svg;
      normalizeSvg(el);
    })
    .catch(() => {});
}

/**
 * Injects a bare-DOM <cxui-icon> into el.
 * Angular won't bootstrap it, so the SVG is set manually.
 * Ephemeral — Angular may remove it on the next template re-evaluation.
 */
export function injectIconIntoElement(el: Element, iconPath: string, side: IconSide = 'left'): void {
  const iconEl = document.createElement('cxui-icon');
  iconEl.setAttribute('icon', iconPath);
  iconEl.setAttribute('data-bvc-injected', 'true');
  (iconEl as HTMLElement).style.cssText =
    'display:inline-flex;align-items:center;justify-content:center;width:1em;height:1em;flex-shrink:0;';
  fetchIconSvg(iconPath)
    .then(svg => {
      iconEl.innerHTML = svg;
      normalizeSvg(iconEl);
    })
    .catch(() => {});
  if (side === 'right') {
    el.appendChild(iconEl);
  } else {
    el.insertBefore(iconEl, el.firstChild);
  }
}

export function removeIconFromElement(el: Element): void {
  resolveIconEl(el)?.remove();
}

const DEFAULT_ICON = 'actions/add-circle.svg';

// ── Text label helpers ────────────────────────────────────────────────────────

/** Finds the primary text node in a button — inside a hidden span (icon-only) or a visible text node. */
function findButtonTextNode(el: Element): Text | null {
  // When icon-only, text is wrapped in a [data-bvc-text-hidden] span
  const hiddenSpan = el.querySelector('[data-bvc-text-hidden]');
  if (hiddenSpan) {
    const walker = document.createTreeWalker(hiddenSpan, NodeFilter.SHOW_TEXT);
    const n = walker.nextNode();
    if (n) return n as Text;
  }
  // Visible text node not inside a hidden span
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      let p = node.parentElement;
      while (p && p !== el) {
        if (p.hasAttribute('data-bvc-text-hidden')) return NodeFilter.FILTER_REJECT;
        p = p.parentElement;
      }
      return (node.textContent ?? '').trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    },
  });
  return walker.nextNode() as Text | null;
}

function getButtonText(el: Element): string {
  return findButtonTextNode(el)?.textContent?.trim() ?? '';
}

function setButtonText(el: Element, text: string): void {
  const node = findButtonTextNode(el);
  if (node) node.textContent = ' ' + text + ' ';
}

// ─────────────────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<ButtonContentType, string> = {
  'text': 'Text',
  'text+icon': 'Text + Icon',
  'icon': 'Icon',
};

export function createIconSection(el: Element, onChange: () => void): HTMLDivElement {
  const isIconEl = el.tagName.toLowerCase() === 'cxui-icon';
  const { root, body } = createSection({ title: 'Content', defaultOpen: true });

  // For standalone cxui-icon elements, skip the type switcher and go straight to the picker.
  if (isIconEl) {
    renderIconPicker(el, body, onChange);
    return root;
  }

  // ── Button Type segmented control (first: drives visibility of other rows) ──
  const typeRow = document.createElement('div');
  typeRow.className = 'two-col';

  const typeLbl = document.createElement('div');
  typeLbl.className = 'control-label';
  typeLbl.textContent = 'Type';

  const seg = document.createElement('div');
  seg.className = 'segmented';

  // ── Text label row ────────────────────────────────────────────────────────
  const labelRow = document.createElement('div');
  labelRow.className = 'two-col';

  const labelLbl = document.createElement('div');
  labelLbl.className = 'control-label';
  labelLbl.textContent = 'Label';

  const labelInput = document.createElement('input');
  labelInput.type = 'text';
  labelInput.className = 'text-input';
  labelInput.value = getButtonText(el);
  labelInput.placeholder = 'Button text…';
  labelInput.spellcheck = false;
  labelInput.addEventListener('input', () => {
    setButtonText(el, labelInput.value);
    onChange();
  });

  labelRow.append(labelLbl, labelInput);

  const updateLabelVisibility = () => {
    labelRow.style.display = detectButtonType(el) === 'icon' ? 'none' : '';
  };

  const setType = (type: ButtonContentType) => {
    const current = detectButtonType(el);
    if (type === current) return;

    const dir = getButtonDirective(el);
    const hasIcon = !!resolveIconEl(el);

    if (type === 'text') {
      showButtonText(el);
      removeIconFromElement(el);
      if (dir) setButtonInternalSignal(el, dir, '_iconOnly', false);
    } else if (type === 'text+icon') {
      showButtonText(el);
      if (dir) setButtonInternalSignal(el, dir, '_iconOnly', false);
      if (!hasIcon) injectIconIntoElement(el, DEFAULT_ICON);
    } else {
      // icon-only: use _iconOnly signal so the library applies its own square sizing
      if (dir) setButtonInternalSignal(el, dir, '_iconOnly', true);
      if (!hasIcon) injectIconIntoElement(el, DEFAULT_ICON);
      hideButtonText(el);
    }

    renderSegButtons();
    updateLabelVisibility();
    renderIconArea();
    onChange();
  };

  const setSide = (side: IconSide) => {
    if (detectIconSide(el) === side) return;
    moveIconToSide(el, side);
    renderSideButtons();
    onChange();
  };

  const renderSegButtons = () => {
    seg.innerHTML = '';
    const current = detectButtonType(el);
    for (const type of ['text', 'text+icon', 'icon'] as ButtonContentType[]) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'segmented-btn';
      btn.textContent = TYPE_LABELS[type];
      attachTooltip(btn, TYPE_LABELS[type]);
      if (type === current) btn.dataset.active = 'true';
      btn.addEventListener('click', () => setType(type));
      seg.appendChild(btn);
    }
  };

  const sideRow = document.createElement('div');
  sideRow.className = 'two-col';
  const sideLbl = document.createElement('div');
  sideLbl.className = 'control-label';
  sideLbl.textContent = 'Side';
  const sideSeg = document.createElement('div');
  sideSeg.className = 'segmented';

  const renderSideButtons = () => {
    sideSeg.innerHTML = '';
    const current = detectIconSide(el);
    for (const side of ['left', 'right'] as IconSide[]) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'segmented-btn';
      btn.textContent = side === 'left' ? '← Left' : 'Right →';
      attachTooltip(btn, side === 'left' ? 'Icon on left' : 'Icon on right');
      if (side === current) btn.dataset.active = 'true';
      btn.addEventListener('click', () => setSide(side));
      sideSeg.appendChild(btn);
    }
  };

  sideRow.append(sideLbl, sideSeg);

  const iconArea = document.createElement('div');
  iconArea.className = 'variant-rows';

  const renderIconArea = () => {
    iconArea.innerHTML = '';
    const type = detectButtonType(el);
    if (type === 'text+icon') {
      renderSideButtons();
      iconArea.appendChild(sideRow);
      renderIconPicker(el, iconArea, () => {
        renderSegButtons();
        onChange();
      });
    } else if (type === 'icon') {
      renderIconPicker(el, iconArea, () => {
        renderSegButtons();
        onChange();
      });
    }
  };

  typeRow.append(typeLbl, seg);
  body.appendChild(typeRow);
  body.appendChild(labelRow);
  body.appendChild(iconArea);

  renderSegButtons();
  updateLabelVisibility();
  renderIconArea();

  return root;
}

// ── Icon picker (shared by button and standalone icon element) ─────────────

export { renderIconPicker as renderIconPickerRow };

function renderIconPicker(el: Element, container: HTMLElement, onChange: () => void): void {
  let pickerOpen = false;
  let overlay: HTMLDivElement | null = null;

  const triggerRow = document.createElement('div');
  triggerRow.className = 'two-col';

  const lbl = document.createElement('div');
  lbl.className = 'control-label';
  lbl.textContent = 'Icon';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'icon-trigger';

  triggerRow.append(lbl, trigger);
  container.appendChild(triggerRow);

  const refreshTrigger = () => {
    const iconEl = resolveIconEl(el);
    trigger.innerHTML = '';
    trigger.dataset.open = String(pickerOpen);

    const preview = document.createElement('span');
    preview.className = 'icon-trigger-preview';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'icon-trigger-name';

    if (iconEl) {
      const iconPath = iconEl.getAttribute('icon') ?? '';
      nameSpan.textContent = iconLabel(iconPath);
      attachTooltip(nameSpan, iconPath);
      fetchIconSvg(iconPath)
        .then(svg => {
          preview.innerHTML = svg;
          normalizeSvg(preview);
        })
        .catch(() => {});
    } else {
      nameSpan.textContent = 'Pick icon…';
      nameSpan.style.color = 'var(--bvc-fg-muted)';
    }

    const chev = document.createElement('span');
    chev.className = 'icon-trigger-chev';
    chev.innerHTML =
      '<svg width="10" height="10" viewBox="0 0 10 10"><path d="M2.5 3.5 L5 6 L7.5 3.5" stroke="currentColor" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    trigger.append(preview, nameSpan, chev);
  };

  const closePicker = () => {
    pickerOpen = false;
    overlay?.remove();
    overlay = null;
    refreshTrigger();
  };

  const openPicker = () => {
    pickerOpen = true;
    refreshTrigger();

    const shadowRoot = triggerRow.getRootNode() as ShadowRoot;
    const rect = trigger.getBoundingClientRect();

    // Full-viewport transparent overlay to capture outside clicks.
    overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483646;pointer-events:auto;';
    overlay.addEventListener('click', closePicker);

    // Picker positioned below or above the trigger depending on available space.
    // search bar (~36px) + 6 items (~40px each) + padding (~20px) ≈ 296px minimum
    const MIN_PICKER_HEIGHT = 296;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < MIN_PICKER_HEIGHT;
    const pickerContent = document.createElement('div');
    pickerContent.className = 'popover icon-picker';
    const w = Math.max(rect.width, 220);
    pickerContent.style.cssText = openUpward
      ? `bottom:${window.innerHeight - rect.top + 4}px;left:${rect.left}px;width:${w}px;`
      : `top:${rect.bottom + 4}px;left:${rect.left}px;width:${w}px;`;
    pickerContent.addEventListener('click', e => e.stopPropagation());

    const currentPath = resolveIconEl(el)?.getAttribute('icon') ?? null;

    const search = document.createElement('input');
    search.type = 'search';
    search.className = 'mini-input';
    search.placeholder = 'Search icons…';
    pickerContent.appendChild(search);

    const grid = document.createElement('div');
    grid.className = 'icon-grid';
    pickerContent.appendChild(grid);

    const renderGrid = (filter: string) => {
      grid.innerHTML = '';
      const matches = filter ? iconNames.filter(n => n.toLowerCase().includes(filter.toLowerCase())) : iconNames;
      for (const name of matches.slice(0, 80)) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'icon-cell';
        if (name === currentPath) cell.dataset.active = 'true';

        const svgWrap = document.createElement('span');
        svgWrap.className = 'icon-cell-svg';
        fetchIconSvg(name)
          .then(svg => {
            svgWrap.innerHTML = svg;
            normalizeSvg(svgWrap);
          })
          .catch(() => {});

        const cellLabel = document.createElement('span');
        cellLabel.className = 'icon-cell-label';
        cellLabel.textContent = iconLabel(name);
        attachTooltip(cellLabel, name);

        cell.append(svgWrap, cellLabel);
        cell.addEventListener('click', () => {
          const iconEl = resolveIconEl(el);
          if (iconEl) applyIconToElement(iconEl, name);
          else injectIconIntoElement(el, name);
          closePicker();
          onChange();
        });
        grid.appendChild(cell);
      }
    };

    renderGrid('');
    search.addEventListener('input', () => renderGrid(search.value));

    overlay.appendChild(pickerContent);
    shadowRoot.appendChild(overlay);
    setTimeout(() => search.focus(), 0);
  };

  trigger.addEventListener('click', () => {
    if (pickerOpen) closePicker();
    else openPicker();
  });

  refreshTrigger();
}
