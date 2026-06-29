#!/usr/bin/env node
// Copies the bvc:export artifacts (catalog/tokens/icons/fonts JSON) from a
// cx-web-workspace checkout into this repo's data/ dir at build time.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

export function resolveWorkspaceRoot(env: Record<string, string | undefined>): string {
  if (env.CX_VISUAL_WORKSPACE_ROOT) return env.CX_VISUAL_WORKSPACE_ROOT;
  if (env.HOME) return resolve(env.HOME, 'Desktop', 'cx-web-workspace');
  throw new Error('cannot resolve workspace root: set CX_VISUAL_WORKSPACE_ROOT or $HOME');
}

if (process.argv[1]?.endsWith('fetch-catalog.ts')) {
  const root = resolveWorkspaceRoot(process.env);
  const srcDir = resolve(root, '.cx-visual-exports');
  const dstDir = resolve(import.meta.dirname, '..', 'data');

  if (!existsSync(srcDir)) {
    console.error(`[fetch-catalog] ${srcDir} not found. Run \`pnpm bvc:export\` in cx-web-workspace first.`);
    process.exit(1);
  }
  mkdirSync(dstDir, { recursive: true });

  for (const f of ['catalog.json', 'tokens.json', 'icons.json', 'fonts.json']) {
    const src = resolve(srcDir, f);
    if (!existsSync(src)) {
      console.warn(`[fetch-catalog] ${src} missing — skipping`);
      continue;
    }
    copyFileSync(src, resolve(dstDir, f));
    console.log(`[fetch-catalog] ${f}`);
  }
}
