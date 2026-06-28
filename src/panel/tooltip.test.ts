import { describe, expect, it } from 'vitest';

import { attachTooltip } from './tooltip';

describe('attachTooltip accessible name', () => {
  it(`GIVEN an icon-only element (no visible text) and a static label
      THEN it sets an aria-label so screen readers have an accessible name`, () => {
    const btn = document.createElement('button');
    btn.innerHTML = '<svg></svg>';
    attachTooltip(btn, 'Toggle padding');
    expect(btn.getAttribute('aria-label')).toBe('Toggle padding');
  });

  it(`GIVEN an element that already has visible text
      THEN it does NOT override the accessible name with an aria-label`, () => {
    const btn = document.createElement('button');
    btn.textContent = 'Pick';
    attachTooltip(btn, 'Enter pick mode, then click any element');
    expect(btn.hasAttribute('aria-label')).toBe(false);
  });

  it(`GIVEN an element that already has an aria-label
      THEN it leaves the existing label untouched`, () => {
    const btn = document.createElement('button');
    btn.innerHTML = '<svg></svg>';
    btn.setAttribute('aria-label', 'Close panel');
    attachTooltip(btn, 'Dismiss');
    expect(btn.getAttribute('aria-label')).toBe('Close panel');
  });

  it(`GIVEN a dynamic (getter) label on an icon-only element
      THEN it does not set a static aria-label`, () => {
    const btn = document.createElement('button');
    btn.innerHTML = '<svg></svg>';
    attachTooltip(btn, () => 'maybe', 'below');
    expect(btn.hasAttribute('aria-label')).toBe(false);
  });
});
