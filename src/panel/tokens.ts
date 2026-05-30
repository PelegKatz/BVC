export interface Token {
  name: string;
  cssVar: string;
  hex: string;
  role: 'text' | 'background' | 'border' | 'accent' | 'icon';
  label: string;
}

import { loadRuntimeData } from './runtime-data';

// Populated at boot from the bundled data/tokens.json (was the __BVC_TOKENS__
// build-injected global in the in-bundle client). `tokens` is a live ESM
// binding — consumers import it and see the seeded array after initTokens().
export let tokens: Token[] = [];

export async function initTokens(): Promise<void> {
  tokens = (await loadRuntimeData()).tokens;
}

export function tokensByRole(role: Token['role']): Token[] {
  return tokens.filter(t => t.role === role);
}

export function findTokenByCssValue(value: string, roles?: Token['role'][]): Token | null {
  if (!value) return null;
  const candidates = roles ? tokens.filter(t => roles.includes(t.role)) : tokens;

  const varMatch = value.match(/var\((--c-[\w-]+)/);
  if (varMatch) {
    const name = varMatch[1].slice(2);
    const t = candidates.find(t => t.name === name);
    if (t) return t;
  }

  const hex = toHex(value);
  if (!hex) return null;
  const matches = candidates.filter(t => t.hex === hex);
  if (matches.length === 0) return null;
  matches.sort((a, b) => a.name.length - b.name.length || a.name.localeCompare(b.name));
  return matches[0];
}

function toHex(value: string): string | null {
  const v = value.trim().toLowerCase();
  if (v.startsWith('#')) {
    const match = v.match(/^#([0-9a-f]{3,8})$/);
    if (!match) return null;
    let body = match[1];
    if (body.length === 3)
      body = body
        .split('')
        .map(c => c + c)
        .join('');
    if (body.length === 4)
      body = body
        .split('')
        .map(c => c + c)
        .join('');
    if (body.length === 6) return '#' + body;
    if (body.length === 8) {
      const alpha = body.slice(6, 8);
      return alpha === 'ff' ? '#' + body.slice(0, 6) : '#' + body;
    }
    return null;
  }
  if (v.startsWith('rgb')) {
    const match = v.match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const parts = match[1].split(/[,/\s]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const [r, g, b] = parts.slice(0, 3).map(p => parseInt(p, 10));
    if ([r, g, b].some(n => Number.isNaN(n))) return null;
    const a = parts.length >= 4 ? parseFloat(parts[3]) : 1;
    let hex = '#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('');
    if (!Number.isNaN(a) && a < 1)
      hex += Math.round(a * 255)
        .toString(16)
        .padStart(2, '0');
    return hex;
  }
  return null;
}

export function tokenPath(t: Token): string {
  const name = t.name.replace(/^c-/, '');
  const idx = name.indexOf('-');
  if (idx === -1) return capitalize(name);
  const category = capitalize(name.slice(0, idx));
  const rest = name.slice(idx + 1).replace(/-/g, ' ');
  return `${category} / ${rest}`;
}

export function tokenCategory(t: Token): string {
  const name = t.name.replace(/^c-/, '');
  const idx = name.indexOf('-');
  return capitalize(idx === -1 ? name : name.slice(0, idx));
}

export function tokenName(t: Token): string {
  const name = t.name.replace(/^c-/, '');
  const idx = name.indexOf('-');
  if (idx === -1) return '';
  return name.slice(idx + 1).replace(/-/g, ' ');
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

const RECENT_STORAGE_KEY = 'bvc-recent-tokens';
const MAX_RECENT = 8;

export function loadRecentTokens(): Token[] {
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    const names: unknown = JSON.parse(raw);
    if (!Array.isArray(names)) return [];
    const out: Token[] = [];
    for (const n of names) {
      if (typeof n !== 'string') continue;
      const t = tokens.find(tok => tok.name === n);
      if (t) out.push(t);
    }
    return out;
  } catch {
    return [];
  }
}

export function recordRecentToken(token: Token): void {
  try {
    const current = loadRecentTokens()
      .filter(t => t.name !== token.name)
      .map(t => t.name);
    current.unshift(token.name);
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(current.slice(0, MAX_RECENT)));
  } catch {
    /* private mode / quota */
  }
}
