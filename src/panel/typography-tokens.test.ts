import { describe, it, expect, beforeEach, vi } from 'vitest';

const FONTS = [
  'state-number-large',
  'state-number',
  'page-title',
  'section-title',
  'subheading-bold',
  'subheading-reg',
  'paragraph-bold',
  'paragraph-reg',
  'code-bold',
  'code-reg',
  'code-sm-bold',
  'code-sm-reg',
  'caption',
  'button',
  'link',
  'error-bold',
  'error-reg',
];

vi.mock('./runtime-data', () => ({
  loadRuntimeData: vi.fn(async () => ({ catalog: [], tokens: [], icons: [], fonts: FONTS })),
}));

import { initFonts, typographyTokens, typographyTokenGroups } from './typography-tokens';

describe('typography-tokens', () => {
  beforeEach(async () => {
    await initFonts();
  });

  it('seeds the 17 tokens in declaration order', () => {
    expect(typographyTokens).toHaveLength(17);
    expect(typographyTokens[0]).toBe('state-number-large');
    expect(typographyTokens.at(-1)).toBe('error-reg');
  });

  it('groups every token into exactly one category', () => {
    const allInGroups = typographyTokenGroups.flatMap(g => g.tokens);
    expect(allInGroups).toHaveLength(typographyTokens.length);
    expect(new Set(allInGroups)).toEqual(new Set(typographyTokens));
  });

  it('groups: Headings(4) Body(4) Code(4) Utility(5)', () => {
    expect(typographyTokenGroups.map(g => [g.label, g.tokens.length])).toEqual([
      ['Headings', 4],
      ['Body', 4],
      ['Code', 4],
      ['Utility', 5],
    ]);
  });
});
