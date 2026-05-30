import { describe, expect, it, vi } from 'vitest';

vi.mock('./catalog-cxui', () => ({
  isCxuiComponent: (el: Element) => el.tagName.toLowerCase().startsWith('cxui-'),
  describeCxuiComponent: (el: Element) => el.tagName.toLowerCase(),
}));

import { findCxuiAncestor } from './cxui-ancestor';

describe('findCxuiAncestor', () => {
  it(`GIVEN an element with no cxui ancestor
      THEN returns null`, () => {
    const div = document.createElement('div');
    expect(findCxuiAncestor(div)).toBeNull();
  });

  it(`GIVEN a span inside a cxui-badge
      THEN returns the cxui-badge`, () => {
    const badge = document.createElement('cxui-badge');
    const span = document.createElement('span');
    badge.appendChild(span);
    expect(findCxuiAncestor(span)).toBe(badge);
  });

  it(`GIVEN a cxui element with no cxui ancestor of its own
      THEN returns null (does not consider itself)`, () => {
    const badge = document.createElement('cxui-badge');
    expect(findCxuiAncestor(badge)).toBeNull();
  });

  it(`GIVEN nested non-cxui intermediates inside a cxui-badge
      THEN returns the badge by walking past them`, () => {
    const badge = document.createElement('cxui-badge');
    const inner = document.createElement('div');
    const span = document.createElement('span');
    badge.appendChild(inner);
    inner.appendChild(span);
    expect(findCxuiAncestor(span)).toBe(badge);
  });
});
