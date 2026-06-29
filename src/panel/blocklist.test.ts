import { describe, expect, it } from 'vitest';

import { isCxVisualBlocked } from './blocklist';

describe('isCxVisualBlocked', () => {
  it(`GIVEN a cxui-chart-* element
      THEN returns true`, () => {
    expect(isCxVisualBlocked(document.createElement('cxui-chart-bar'))).toBe(true);
  });

  it(`GIVEN a cxui-graph element
      THEN returns true`, () => {
    expect(isCxVisualBlocked(document.createElement('cxui-graph'))).toBe(true);
  });

  it(`GIVEN a descendant of a blocked component
      THEN returns true`, () => {
    const chart = document.createElement('cxui-chart-pie');
    const inner = document.createElement('svg');
    const path = document.createElement('path');
    chart.appendChild(inner);
    inner.appendChild(path);
    expect(isCxVisualBlocked(path)).toBe(true);
  });

  it(`GIVEN a non-visualization cxui component
      THEN returns false`, () => {
    expect(isCxVisualBlocked(document.createElement('cxui-badge'))).toBe(false);
  });

  it(`GIVEN a primitive outside any blocked tree
      THEN returns false`, () => {
    expect(isCxVisualBlocked(document.createElement('p'))).toBe(false);
  });

  it(`GIVEN a tag in the exact CX_VISUAL_BLOCKED_TAGS list
      THEN returns true`, () => {
    expect(isCxVisualBlocked(document.createElement('cxui-radio-circle'))).toBe(true);
  });

  it(`GIVEN a descendant of an exact-tag blocked component
      THEN returns true`, () => {
    const renderer = document.createElement('cxui-md-paragraph');
    const inner = document.createElement('span');
    renderer.appendChild(inner);
    expect(isCxVisualBlocked(inner)).toBe(true);
  });

  it(`GIVEN a cxui component that is neither prefix-blocked nor in the exact list
      THEN returns false`, () => {
    expect(isCxVisualBlocked(document.createElement('cxui-button-group'))).toBe(false);
  });
});
