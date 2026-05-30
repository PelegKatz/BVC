// Signal-based Properties section for cxui DS components.
// Each axis renders as a row of clickable chips — all options visible at once.

import type { CatalogAxis, CatalogEntry } from '../catalog-loader';
import { getCxuiInstance, getSignalValue, setSignalValue, notifyStorybookArgs, isInStorybook } from '../signal-writer';

import { createSection } from './section';

/**
 * Axes that BVC hides from the Properties section on cxui components.
 * These are component-state booleans (disabled, readonly) whose visible
 * preview can't be made reliable on the live web-app — Angular host
 * bindings re-sync from read-only `input()` signals BVC can't write to.
 * Hiding the toggles is more honest than showing controls that do nothing.
 */
function isHiddenAxis(signalName: string): boolean {
  const lower = signalName.toLowerCase();
  return lower === 'disabled' || lower === 'readonly';
}

export interface CxuiVariantSectionProps {
  el: Element;
  entry: CatalogEntry;
  onChange: () => void;
}

export function createCxuiVariantSection(props: CxuiVariantSectionProps): HTMLDivElement | null {
  if (props.entry.axes.length === 0) return null;

  const instance = getCxuiInstance(props.el);
  const { root, body } = createSection({ title: 'Properties', defaultOpen: true });

  if (!instance) {
    const warn = document.createElement('div');
    warn.className = 'convert-notice';
    warn.textContent = 'Angular component not found — window.ng unavailable';
    body.appendChild(warn);
    return root;
  }

  const renderAll = () => {
    body.innerHTML = '';
    for (const axis of props.entry.axes) {
      if (isHiddenAxis(axis.signalName)) continue;
      body.appendChild(
        createAxisChips(props.el, instance, axis, () => {
          renderAll();
          props.onChange();
        }),
      );
    }
  };

  renderAll();
  return root;
}

function createAxisChips(el: Element, instance: object, axis: CatalogAxis, onChange: () => void): HTMLDivElement {
  const wrap = document.createElement('div');
  const variantDataKey = `bvcVariant${axis.signalName.charAt(0).toUpperCase()}${axis.signalName.slice(1)}`;
  const current = (el as HTMLElement).dataset[variantDataKey] ?? getSignalValue(instance, axis.signalName);

  // In Storybook, notifyStorybookArgs drives updates asynchronously via template bindings.
  // Defer renderAll so the chip's active state is read after the signal is updated.
  const scheduleChange = () => (isInStorybook() ? setTimeout(onChange, 50) : onChange());

  if (axis.type === 'boolean') {
    // Inline two-col row: label left, toggle right — same layout as Icon section rows.
    wrap.className = 'two-col';
    const labelEl = document.createElement('div');
    labelEl.className = 'control-label';
    labelEl.textContent = axis.name.charAt(0).toUpperCase() + axis.name.slice(1);
    if (axis.description) labelEl.title = axis.description;
    wrap.appendChild(labelEl);
    wrap.appendChild(
      makeToggle(Boolean(current), val => {
        setSignalValue(el, instance, axis.signalName, val);
        notifyStorybookArgs(axis.signalName, val);
        scheduleChange();
      }),
    );
  } else if (axis.type === 'text' || axis.type === 'number') {
    // Inline two-col row: label left, single-line input right.
    wrap.className = 'two-col';
    const labelEl = document.createElement('div');
    labelEl.className = 'control-label';
    labelEl.textContent = axis.name.charAt(0).toUpperCase() + axis.name.slice(1);
    if (axis.description) labelEl.title = axis.description;
    wrap.appendChild(labelEl);

    const input = document.createElement('input');
    input.type = axis.type === 'number' ? 'number' : 'text';
    input.className = 'text-input';
    input.spellcheck = false;
    input.value = current == null ? '' : String(current);
    input.addEventListener('input', () => {
      const next = axis.type === 'number' ? Number(input.value) : input.value;
      if (axis.type === 'number' && Number.isNaN(next as number)) return;
      setSignalValue(el, instance, axis.signalName, next);
      notifyStorybookArgs(axis.signalName, next);
      scheduleChange();
    });
    wrap.appendChild(input);
  } else {
    wrap.className = 'variant-axis';
    const header = document.createElement('div');
    header.className = 'variant-axis-header';
    header.textContent = axis.name;
    if (axis.description) header.title = axis.description;
    wrap.appendChild(header);

    if ((axis.values?.length ?? 0) >= 5) {
      wrap.appendChild(
        makeSelectInput(axis.values ?? [], String(current), val => {
          applyVariantChange(el, instance, axis, val);
          scheduleChange();
        }),
      );
    } else {
      const chips = document.createElement('div');
      chips.className = 'segmented';
      for (const opt of axis.values ?? []) {
        chips.appendChild(
          makeChip(opt.label, String(current) === opt.value, () => {
            applyVariantChange(el, instance, axis, opt.value);
            scheduleChange();
          }),
        );
      }
      wrap.appendChild(chips);
    }
  }

  return wrap;
}

function makeToggle(current: boolean, onToggle: (val: boolean) => void): HTMLLabelElement {
  const label = document.createElement('label');
  label.className = 'prop-toggle';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = current;
  input.addEventListener('change', () => onToggle(input.checked));

  const track = document.createElement('span');
  track.className = 'prop-toggle-track';

  const thumb = document.createElement('span');
  thumb.className = 'prop-toggle-thumb';

  track.appendChild(thumb);
  label.append(input, track);
  return label;
}

function makeSelectInput(options: { label: string; value: string }[], current: string, onSelect: (val: string) => void): HTMLDivElement {
  let selectedValue = current;
  let isOpen = false;
  let overlay: HTMLDivElement | null = null;

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

  const refreshTrigger = () => {
    const opt = options.find(o => o.value === selectedValue);
    labelSpan.textContent = opt?.label ?? selectedValue;
    trigger.dataset.open = String(isOpen);
  };

  refreshTrigger();
  trigger.append(labelSpan, chev);
  wrap.appendChild(trigger);

  const closeDropdown = () => {
    isOpen = false;
    overlay?.remove();
    overlay = null;
    refreshTrigger();
  };

  const openDropdown = () => {
    isOpen = true;
    refreshTrigger();

    const shadowRoot = wrap.getRootNode() as ShadowRoot;
    const rect = trigger.getBoundingClientRect();

    const MIN_HEIGHT = options.length * 32 + 20;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < MIN_HEIGHT;
    const w = Math.max(rect.width, 160);

    overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483646;pointer-events:auto;';
    overlay.addEventListener('click', closeDropdown);

    const content = document.createElement('div');
    content.className = 'popover';
    content.style.cssText = openUpward
      ? `bottom:${window.innerHeight - rect.top + 4}px;left:${rect.left}px;width:${w}px;padding:4px;`
      : `top:${rect.bottom + 4}px;left:${rect.left}px;width:${w}px;padding:4px;`;
    content.addEventListener('click', e => e.stopPropagation());

    for (const opt of options) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'token-picker-option';
      row.textContent = opt.label;
      if (opt.value === selectedValue) row.dataset.active = 'true';
      row.addEventListener('click', () => {
        selectedValue = opt.value;
        onSelect(opt.value);
        closeDropdown();
      });
      content.appendChild(row);
    }

    overlay.appendChild(content);
    shadowRoot.appendChild(overlay);
  };

  trigger.addEventListener('click', () => {
    if (isOpen) closeDropdown();
    else openDropdown();
  });

  return wrap;
}

function makeChip(label: string, active: boolean, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'segmented-btn';
  btn.textContent = label;
  if (active) btn.dataset.active = 'true';
  btn.addEventListener('click', onClick);
  return btn;
}

function applyVariantChange(el: Element, instance: object, axis: CatalogAxis, newValue: string): void {
  // Source of truth: mutate the signal that drives the component's [class]
  // binding. Without this, a `classList.add/remove` happens for ~1 frame and
  // then Angular's next change detection cycle re-evaluates the bound
  // expression with the unchanged signal value and overwrites everything we
  // changed. setSignalValue is a no-op in Storybook (notifyStorybookArgs
  // routes the change through the addon channel instead).
  setSignalValue(el, instance, axis.signalName, newValue);
  notifyStorybookArgs(axis.signalName, newValue);

  if (axis.classMap) {
    // Belt-and-braces visual feedback so the swap is visible during the
    // microsecond between click and the CD pass that re-applies the
    // computed [class] binding. After CD, the same classes get written back
    // (idempotent) because the signal write above already set the new value.
    const html = el as HTMLElement;
    const allKnownClasses = Object.values(axis.classMap).flatMap(cls => cls);
    for (const cls of allKnownClasses) html.classList.remove(cls);
    for (const cls of axis.classMap[newValue] ?? []) html.classList.add(cls);
    // Track intent via data attr (Angular never touches data-* attrs).
    const key = `bvcVariant${axis.signalName.charAt(0).toUpperCase()}${axis.signalName.slice(1)}`;
    html.dataset[key] = newValue;
    // Store all managed classes so apply.ts can suppress the raw class diff noise.
    const classesKey = `bvcVariantClasses${axis.signalName.charAt(0).toUpperCase()}${axis.signalName.slice(1)}`;
    html.dataset[classesKey] = allKnownClasses.join(' ');
  }
}
