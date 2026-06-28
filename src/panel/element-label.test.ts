import { describe, expect, it } from 'vitest';

import { describeShort } from './element-label';

function withClass(tag: string, className: string): Element {
  const el = document.createElement(tag);
  el.setAttribute('class', className);
  return el;
}

describe('describeShort', () => {
  it(`GIVEN an element with only a Tailwind arbitrary-variant class
      THEN drops the unreadable class and shows just the tag`, () => {
    const el = withClass('button', '[&.active:enabled]:tw-bg-green-500');
    expect(describeShort(el)).toBe('button');
  });

  it(`GIVEN an element with a Tailwind modifier class (hover:, focus:)
      THEN drops the modifier class`, () => {
    const el = withClass('button', 'hover:tw-bg-green focus:tw-ring');
    expect(describeShort(el)).toBe('button');
  });

  it(`GIVEN an element with both a readable and an unreadable class
      THEN shows only the readable class`, () => {
    const el = withClass('button', '[&.active:enabled]:tw-bg-green cxl-btn');
    expect(describeShort(el)).toBe('button.cxl-btn');
  });

  it(`GIVEN an element with a readable class
      THEN shows tag.class`, () => {
    const el = withClass('div', 'tw-flex');
    expect(describeShort(el)).toBe('div.tw-flex');
  });

  it(`GIVEN an element with an id
      THEN shows tag#id and ignores classes`, () => {
    const el = withClass('section', 'tw-flex');
    el.id = 'main';
    expect(describeShort(el)).toBe('section#main');
  });

  it(`GIVEN an element with no classes
      THEN shows just the tag`, () => {
    expect(describeShort(document.createElement('span'))).toBe('span');
  });

  it(`GIVEN an element with several readable classes and a maxClasses of 2
      THEN shows at most two classes`, () => {
    const el = withClass('div', 'cxl-btn cxl-btn--solid tw-flex');
    expect(describeShort(el, 2)).toBe('div.cxl-btn.cxl-btn--solid');
  });
});
