/**
 * A class token is "readable" only when it's a plain CSS identifier — letters,
 * digits, underscores and dashes. Tailwind arbitrary-variant utilities like
 * `[&.active:enabled]:tw-bg-green-500` and modifier-prefixed utilities like
 * `hover:tw-ring` contain `[`, `]`, `:` or `&`, so they fail this test. Those
 * tokens are visually useless noise in a short label (and absurdly long), so
 * we drop them.
 */
function isReadableClass(c: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_-]*$/.test(c);
}

/** Pick up to `max` readable class tokens off an element, in source order. */
export function readableClasses(el: Element, max = Infinity): string[] {
  return (el.getAttribute('class') || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter(isReadableClass)
    .slice(0, max === Infinity ? undefined : max);
}

/**
 * A compact, human-readable label for an element: `tag#id`, or
 * `tag.class.class` using only readable class names, falling back to the bare
 * tag. Used for the on-page selection/hover overlay badges and the panel's
 * ancestor breadcrumbs.
 */
export function describeShort(el: Element, maxClasses = 2): string {
  const tag = el.tagName.toLowerCase();
  if (el.id) return `${tag}#${el.id}`;
  const cls = readableClasses(el, maxClasses);
  return cls.length ? `${tag}${cls.map(c => `.${c}`).join('')}` : tag;
}
