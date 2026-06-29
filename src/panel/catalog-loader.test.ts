import { describe, expect, it } from 'vitest';

import { extractCxVisualConfig, keepEntry, type CatalogAxis } from './catalog-loader';

const FAKE_AXIS: CatalogAxis = { name: 'a', signalName: 'a', type: 'boolean', default: false };

describe('catalog filter', () => {
  it(`GIVEN an entry with one axis
      THEN keepEntry returns true`, () => {
    expect(keepEntry({ name: 'X', storyTitle: 'X', axes: [FAKE_AXIS] })).toBe(true);
  });

  it(`GIVEN an entry with no axes but a bvc content block
      THEN keepEntry returns true`, () => {
    expect(keepEntry({ name: 'X', storyTitle: 'X', axes: [], bvc: { content: 'copy-text' } })).toBe(true);
  });

  it(`GIVEN an entry with no axes and no bvc block
      THEN keepEntry returns false`, () => {
    expect(keepEntry({ name: 'X', storyTitle: 'X', axes: [] })).toBe(false);
  });
});

describe('extractCxVisualConfig', () => {
  it(`GIVEN a story meta with no parameters
      THEN returns undefined`, () => {
    expect(extractCxVisualConfig({ title: 'X' })).toBeUndefined();
  });

  it(`GIVEN parameters.bvc with a valid content kind
      THEN returns the parsed config`, () => {
    expect(extractCxVisualConfig({ title: 'X', parameters: { bvc: { content: 'copy-text' } } })).toEqual({ content: 'copy-text' });
  });

  it(`GIVEN parameters.bvc with an unknown content kind
      THEN returns undefined`, () => {
    expect(extractCxVisualConfig({ title: 'X', parameters: { bvc: { content: 'made-up' } } })).toBeUndefined();
  });

  it(`GIVEN parameters.bvc as a non-object value
      THEN returns undefined`, () => {
    expect(extractCxVisualConfig({ title: 'X', parameters: { bvc: 'oops' } })).toBeUndefined();
  });

  it(`GIVEN parameters.bvc as an empty object
      THEN returns undefined`, () => {
    expect(extractCxVisualConfig({ title: 'X', parameters: { bvc: {} } })).toBeUndefined();
  });
});
