import { describe, expect, it } from 'vitest';

describe('applyTypographyToken', () => {
  it(`GIVEN an element with multiple tw-font-* classes
      WHEN applying a new token
      THEN all tw-font-* classes are replaced with the picked one and other classes are preserved`, async () => {
    const { applyTypographyToken } = await import('./token-typography-picker');
    const el = document.createElement('p');
    el.classList.add('tw-font-paragraph-reg', 'tw-font-caption', 'tw-text-red-500');
    applyTypographyToken(el, 'page-title');
    expect(Array.from(el.classList)).toEqual(['tw-text-red-500', 'tw-font-page-title']);
  });

  it(`GIVEN an element with inline font-size, font-weight, and line-height
      WHEN applying a token
      THEN those inline properties are cleared but unrelated inline styles survive`, async () => {
    const { applyTypographyToken } = await import('./token-typography-picker');
    const el = document.createElement('p');
    el.style.fontSize = '20px';
    el.style.fontWeight = '700';
    el.style.lineHeight = '24px';
    el.style.color = 'red';
    applyTypographyToken(el, 'caption');
    expect(el.style.fontSize).toBe('');
    expect(el.style.fontWeight).toBe('');
    expect(el.style.lineHeight).toBe('');
    expect(el.style.color).toBe('red');
  });
});
