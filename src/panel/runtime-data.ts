// One-stop async loader for the four bundled JSON artifacts (catalog, tokens,
// icons, fonts). In the extension these are web-accessible resources fetched
// via chrome.runtime.getURL — replacing the build-injected __CX_VISUAL_* globals the
// in-bundle client used.
import type { Token } from './tokens';
import type { CatalogEntry } from './catalog-loader';

interface CatalogBundle {
  version: string;
  generated: string;
  entries: CatalogEntry[];
}
interface TokenBundle {
  version: string;
  generated: string;
  tokens: Token[];
}
interface IconBundle {
  version: string;
  generated: string;
  icons: string[];
}
interface FontBundle {
  version: string;
  generated: string;
  fonts: string[];
}

declare const chrome: { runtime: { getURL(path: string): string } };

export interface RuntimeData {
  catalog: CatalogEntry[];
  tokens: Token[];
  icons: string[];
  fonts: string[];
}

let cached: RuntimeData | null = null;

export async function loadRuntimeData(): Promise<RuntimeData> {
  if (cached) return cached;
  const [catalog, tokens, icons, fonts] = await Promise.all([
    fetchJson<CatalogBundle>('data/catalog.json'),
    fetchJson<TokenBundle>('data/tokens.json'),
    fetchJson<IconBundle>('data/icons.json'),
    fetchJson<FontBundle>('data/fonts.json'),
  ]);
  cached = {
    catalog: catalog.entries,
    tokens: tokens.tokens,
    icons: icons.icons,
    fonts: fonts.fonts,
  };
  return cached;
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(chrome.runtime.getURL(path));
  if (!res.ok) throw new Error(`[cx-visual] failed to load ${path}: HTTP ${res.status}`);
  return (await res.json()) as T;
}
