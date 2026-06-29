import { loadRuntimeData } from './runtime-data';

export type TypographyToken = string;

export interface TypographyTokenGroup {
  label: 'Headings' | 'Body' | 'Code' | 'Utility';
  tokens: TypographyToken[];
}

const HEADINGS = new Set(['state-number-large', 'state-number', 'page-title', 'section-title']);
const BODY = new Set(['subheading-bold', 'subheading-reg', 'paragraph-bold', 'paragraph-reg']);
const CODE = new Set(['code-bold', 'code-reg', 'code-sm-bold', 'code-sm-reg']);

// Populated at boot from the bundled data/fonts.json (was __CX_VISUAL_FONTS__).
// Both are live ESM bindings seeded by initFonts() before the panel renders.
export let typographyTokens: TypographyToken[] = [];
export let typographyTokenGroups: TypographyTokenGroup[] = [];

export async function initFonts(): Promise<void> {
  typographyTokens = (await loadRuntimeData()).fonts;
  typographyTokenGroups = [
    { label: 'Headings', tokens: typographyTokens.filter(t => HEADINGS.has(t)) },
    { label: 'Body', tokens: typographyTokens.filter(t => BODY.has(t)) },
    { label: 'Code', tokens: typographyTokens.filter(t => CODE.has(t)) },
    { label: 'Utility', tokens: typographyTokens.filter(t => !HEADINGS.has(t) && !BODY.has(t) && !CODE.has(t)) },
  ];
}

/** Tailwind utility class for a token. */
export function tokenClassName(token: TypographyToken): string {
  return `tw-font-${token}`;
}

/** Currently-applied token on the element, or null. */
export function getAppliedToken(el: Element): TypographyToken | null {
  for (const cls of el.classList) {
    if (cls.startsWith('tw-font-')) return cls.slice('tw-font-'.length);
  }
  return null;
}
