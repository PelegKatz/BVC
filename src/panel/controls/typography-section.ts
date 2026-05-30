// Primitive-only Typography section: Style (token picker) + Color (narrowed
// token picker) + Align (icon row). The free-form Size / Weight / Line-height
// controls were removed — cxui components hide Typography entirely, and
// primitives are token-only.

import { createColorChip } from './color-picker';
import { createSection } from './section';
import { createTypographyTokenRow } from './token-typography-picker';

const ICON_TEXT_LEFT =
  '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="2" y="3" width="10" height="1.2" rx="0.4"/><rect x="2" y="6" width="7" height="1.2" rx="0.4"/><rect x="2" y="9" width="9" height="1.2" rx="0.4"/></svg>';
const ICON_TEXT_CENTER =
  '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="2" y="3" width="10" height="1.2" rx="0.4"/><rect x="3.5" y="6" width="7" height="1.2" rx="0.4"/><rect x="2.5" y="9" width="9" height="1.2" rx="0.4"/></svg>';
const ICON_TEXT_RIGHT =
  '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="2" y="3" width="10" height="1.2" rx="0.4"/><rect x="5" y="6" width="7" height="1.2" rx="0.4"/><rect x="3" y="9" width="9" height="1.2" rx="0.4"/></svg>';
const ICON_TEXT_JUSTIFY =
  '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="2" y="3" width="10" height="1.2" rx="0.4"/><rect x="2" y="6" width="10" height="1.2" rx="0.4"/><rect x="2" y="9" width="10" height="1.2" rx="0.4"/></svg>';

/** Primitive-only Typography: Style + Color + Align. No free-form size/weight/line-height. */
export function buildPrimitiveTypographySection(el: Element, onChange: () => void): HTMLDivElement {
  const { root, body } = createSection({ title: 'Typography', defaultOpen: true });
  const html = el as HTMLElement;

  // Style — token picker.
  body.appendChild(createTypographyTokenRow(el, onChange));

  // Color — narrowed token picker (text + accent roles).
  const colorRow = document.createElement('div');
  colorRow.className = 'two-col';
  const colorLbl = document.createElement('div');
  colorLbl.className = 'control-label';
  colorLbl.textContent = 'Color';
  const colorChip = createColorChip({
    el,
    cssProperty: 'color',
    role: 'text',
    onChange: val => {
      html.style.color = val;
      onChange();
    },
  });
  colorRow.append(colorLbl, colorChip);
  body.appendChild(colorRow);

  // Align — icon row over text-align.
  body.appendChild(makeAlignRow(el, onChange));

  return root;
}

function normalizeTextAlign(v: string): string {
  if (v === 'start') return 'left';
  if (v === 'end') return 'right';
  return v;
}

function makeAlignRow(el: Element, onChange: () => void): HTMLDivElement {
  const html = el as HTMLElement;
  const align = normalizeTextAlign(window.getComputedStyle(el).textAlign || 'left');

  const row = document.createElement('div');
  row.className = 'two-col';

  const lbl = document.createElement('div');
  lbl.className = 'control-label';
  lbl.textContent = 'Align';

  const group = document.createElement('div');
  group.className = 'segmented';

  const opts: { value: string; label: string; icon: string }[] = [
    { value: 'left', label: 'Left', icon: ICON_TEXT_LEFT },
    { value: 'center', label: 'Center', icon: ICON_TEXT_CENTER },
    { value: 'right', label: 'Right', icon: ICON_TEXT_RIGHT },
    { value: 'justify', label: 'Justify', icon: ICON_TEXT_JUSTIFY },
  ];
  for (const opt of opts) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'segmented-btn segmented-btn-icon';
    btn.title = opt.label;
    btn.dataset.value = opt.value;
    btn.innerHTML = opt.icon;
    if (align === opt.value) btn.dataset.active = 'true';
    btn.addEventListener('click', () => {
      html.style.textAlign = opt.value;
      for (const sibling of Array.from(group.children)) {
        (sibling as HTMLElement).dataset.active = String(sibling === btn);
      }
      onChange();
    });
    group.appendChild(btn);
  }

  row.append(lbl, group);
  return row;
}
