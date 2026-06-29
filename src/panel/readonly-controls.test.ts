import { describe, expect, it } from 'vitest';

import { panelCss } from './styles';

/**
 * Read-only mode (no `window.ng`) means only the cxui *variant* editor is
 * unavailable — and that section self-disables with its own "Angular component
 * not found" notice. Every other control (layout, color, content/icon,
 * typography, sizing, spacing) edits the DOM directly and works regardless of
 * Angular dev tools, so read-only must NOT grey any of them out. Selection
 * (`.pick-btn`) and Copy-prompt (`.apply-btn`) must stay live too.
 */
function readonlyDisabledSelectors(): string[] {
  const match = panelCss.match(/((?:\s*\.cx-visual-readonly[^,{]+,?)+)\{\s*pointer-events:\s*none/);
  if (!match) return [];
  return match[1]
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

describe('read-only mode disabled controls', () => {
  const mustStayUsable = [
    '.cx-visual-readonly .apply-btn', // Copy prompt
    '.cx-visual-readonly .pick-btn', // Pick / selection
    '.cx-visual-readonly .reset-btn', // Reset (restores snapshots, pure DOM)
    '.cx-visual-readonly .swatch', // color picker
    '.cx-visual-readonly input', // sizing / spacing fields
    '.cx-visual-readonly .segmented-btn', // auto-layout toggles
    '.cx-visual-readonly .icon-trigger', // icon picker
  ];

  for (const selector of mustStayUsable) {
    it(`GIVEN read-only mode
        THEN it does not disable ${selector}`, () => {
      expect(readonlyDisabledSelectors()).not.toContain(selector);
    });
  }

  it(`GIVEN read-only mode
      THEN there is no global read-only banner (removed as non-actionable noise)`, () => {
    expect(panelCss).not.toContain('.cx-visual-readonly-banner');
  });
});
