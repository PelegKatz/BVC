import { afterEach, describe, expect, it, vi } from 'vitest';

import { Selector } from './selector';

function makeTarget(): HTMLElement {
  const el = document.createElement('div');
  el.textContent = 'target';
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Selector pick-mode UX', () => {
  it(`GIVEN pick mode is active
      WHEN an element is clicked
      THEN it stays in pick mode and reports the selection`, () => {
    const onSelect = vi.fn();
    const selector = new Selector({ onHover: () => {}, onSelect }, () => false);
    selector.setPicking(true);

    const target = makeTarget();
    target.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onSelect).toHaveBeenCalledWith(target);
    expect(selector.isPicking()).toBe(true); // stays in pick mode for rapid re-picking
  });

  it(`GIVEN pick mode is active
      WHEN Escape is pressed
      THEN it leaves pick mode and fires onPickCancelled`, () => {
    const onPickCancelled = vi.fn();
    const selector = new Selector({ onHover: () => {}, onSelect: () => {}, onPickCancelled }, () => false);
    selector.setPicking(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(onPickCancelled).toHaveBeenCalledOnce();
    expect(selector.isPicking()).toBe(false);
  });
});
