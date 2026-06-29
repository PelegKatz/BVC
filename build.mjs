#!/usr/bin/env node
import { build, context } from 'esbuild';
import { mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const watch = process.argv.includes('--watch');
const outdir = 'dist';

mkdirSync(outdir, { recursive: true });

const entries = [
  { in: 'src/background/service-worker.ts', out: 'dist/background/service-worker.js' },
  { in: 'src/content/content-script.ts', out: 'dist/content/content-script.js' },
  { in: 'src/page-world/signal-bridge.ts', out: 'dist/page-world/signal-bridge.js' },
];

const opts = entries.map(e => ({
  entryPoints: [e.in],
  outfile: e.out,
  bundle: true,
  format: 'iife',
  target: 'es2022',
  platform: 'browser',
  sourcemap: 'inline',
  define: {
    __CX_VISUAL_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
}));

if (watch) {
  for (const o of opts) {
    const ctx = await context(o);
    await ctx.watch();
  }
  console.log('[build] watching...');
} else {
  await Promise.all(opts.map(o => build(o)));
  // Copy manifest + data into dist for unpacked-load convenience
  for (const f of ['manifest.json']) {
    copyFileSync(f, resolve(outdir, f));
  }
  for (const f of ['catalog.json', 'tokens.json', 'icons.json', 'fonts.json']) {
    const src = resolve('data', f);
    if (existsSync(src)) {
      mkdirSync(resolve(outdir, 'data'), { recursive: true });
      copyFileSync(src, resolve(outdir, 'data', f));
    }
  }
  console.log('[build] done');
}
