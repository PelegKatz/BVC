import { describe, expect, it } from 'vitest';

import type { Token } from '../tokens';

import { selectVisibleTokens } from './color-picker';

// Real tokens emitted by plugin.ts use the `c-` prefix (`c-text-primary`),
// so the fixtures here mirror that shape — the helper must work against
// the structured `role` field, not against name-prefix.
const t = (name: string, role: Token['role']): Token => ({
  name: `c-${name}`,
  hex: '#000',
  cssVar: `var(--c-${name})`,
  role,
  label: name,
});

describe('selectVisibleTokens', () => {
  const universe = [
    t('text-primary', 'text'),
    t('accent-error', 'accent'),
    t('surface-primary', 'background'),
    t('border-subtle', 'border'),
  ];

  it(`GIVEN a 4-token universe and the text role
      THEN list contains only text and accent role tokens`, () => {
    const { list, offScale } = selectVisibleTokens(universe, 'text', null);
    expect(list.map(x => x.name)).toEqual(['c-text-primary', 'c-accent-error']);
    expect(offScale).toBeNull();
  });

  it(`GIVEN an off-scale current token (surface role)
      THEN list appends it and offScale points to it`, () => {
    const current = t('surface-primary', 'background');
    const { list, offScale } = selectVisibleTokens(universe, 'text', current);
    expect(list.map(x => x.name)).toEqual(['c-text-primary', 'c-accent-error', 'c-surface-primary']);
    expect(offScale).toBe(current);
  });

  it(`GIVEN a current token that is already in the narrowed set
      THEN list does not duplicate it and offScale is null`, () => {
    const { list, offScale } = selectVisibleTokens(universe, 'text', t('text-primary', 'text'));
    expect(list.map(x => x.name)).toEqual(['c-text-primary', 'c-accent-error']);
    expect(offScale).toBeNull();
  });
});
