// Loads the BVC component catalog. In the extension the catalog is pre-baked
// (cx-web-workspace `pnpm bvc:export`) and bundled as data/catalog.json, loaded
// via runtime-data. The in-bundle client's dev-server fetch + Storybook /@fs
// fallback are dropped here — not available in an extension context.
import { loadRuntimeData } from './runtime-data';

export interface CatalogAxis {
  name: string;
  signalName: string;
  type: 'select' | 'boolean' | 'text' | 'number';
  values?: { label: string; value: string }[];
  default: string | boolean;
  description?: string;
  /** Maps each variant value to the CSS classes CVA applies for it. */
  classMap?: Record<string, string[]>;
}

export type BvcContentKind = 'text-label' | 'icon' | 'copy-text' | 'value' | 'percentage' | 'name' | 'qr-data';

export interface BvcConfig {
  /** Which Content section creator the panel should render. */
  content?: BvcContentKind;
}

export interface CatalogEntry {
  name: string;
  storyTitle: string;
  axes: CatalogAxis[];
  /** Optional BVC config from a story's parameters.bvc block. */
  bvc?: BvcConfig;
}

/**
 * A catalog entry is meaningful if it has either:
 *   - one or more Properties axes (story argTypes), or
 *   - a bvc block declaring a Content kind.
 * Entries with neither carry no editable signal and aren't worth surfacing.
 */
export function keepEntry(entry: CatalogEntry): boolean {
  return entry.axes.length > 0 || entry.bvc !== undefined;
}

interface ArgTypeDef {
  control?: string | { type: string };
  options?: unknown[];
  table?: { disable?: boolean; defaultValue?: { summary?: string } };
  description?: string;
}

interface StoryMeta {
  title: string;
  argTypes?: Record<string, ArgTypeDef>;
  parameters?: { bvc?: unknown };
}

const CONTENT_KINDS: BvcContentKind[] = ['text-label', 'icon', 'copy-text', 'value', 'percentage', 'name', 'qr-data'];

function isContentKind(v: unknown): v is BvcContentKind {
  return typeof v === 'string' && (CONTENT_KINDS as string[]).includes(v);
}

/**
 * Parse `parameters.bvc` from a story default export. Returns `undefined`
 * unless the block has a recognized `content` kind — an empty or
 * malformed bvc block carries no actionable signal and would cause
 * `keepEntry` to retain a useless catalog entry.
 */
export function extractBvcConfig(meta: StoryMeta): BvcConfig | undefined {
  const raw = meta.parameters?.bvc;
  if (!raw || typeof raw !== 'object') return undefined;
  // Read `content` via Reflect.get to avoid `as`-casting an `unknown` value.
  const content: unknown = Reflect.get(raw, 'content');
  if (!isContentKind(content)) return undefined;
  return { content };
}

let cached: CatalogEntry[] | null = null;

export async function loadCatalog(): Promise<CatalogEntry[]> {
  if (cached) return cached;
  cached = (await loadRuntimeData()).catalog;
  return cached;
}
