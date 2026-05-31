import { describe, expect, it } from 'vitest';
import { isCxuiComponent, findCxuiEntry, describeCxuiComponent } from './catalog-cxui';
import type { CatalogEntry } from './catalog-loader';

// jsdom has no window.ng, so getCxuiInstance() returns null here — exactly the
// extension's isolated-world condition that produced the raw-HTML regression.
const CATALOG: CatalogEntry[] = [
  {
    name: 'Button',
    storyTitle: 'Components/Button',
    axes: [{ name: 'Variant', signalName: 'variant', type: 'select', default: 'solid' }],
  },
];

function cxuiButton(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.setAttribute('cxuiButton', '');
  return btn;
}

describe('catalog-cxui — directive components without window.ng', () => {
  it(`GIVEN a <button cxuiButton> and no window.ng
      THEN isCxuiComponent returns true`, () => {
    expect(isCxuiComponent(cxuiButton())).toBe(true);
  });

  it(`GIVEN a <button cxuiButton> and a catalog with a Button entry
      THEN findCxuiEntry resolves to the Button entry`, () => {
    expect(findCxuiEntry(cxuiButton(), CATALOG)?.name).toBe('Button');
  });

  it(`GIVEN a <button cxuiButton>
      THEN describeCxuiComponent returns "Button"`, () => {
    expect(describeCxuiComponent(cxuiButton())).toBe('Button');
  });
});
