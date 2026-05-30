# Brainy Visual Controller — Chrome Extension

Designer-facing visual editor for cxui apps. Click any element on a running app, edit through Figma-style controls, copy a structured change prompt that Claude Code applies to source.

## Install (P1 — unpacked)

1. Run `pnpm bvc:export` in your cx-web-workspace checkout.
2. In this repo: `npm install && npm run fetch-catalog && npm run build`.
3. Open `chrome://extensions`, enable "Developer mode", click "Load unpacked", point at this repo's root (the `manifest.json` lives here; built JS is under `dist/`).
4. Open a localhost cx-web-workspace dev server (or Storybook). Click the BVC toolbar icon to activate.

## Apply flow (P1)

- Edit elements via the panel.
- Click "Copy changes prompt".
- Paste into Claude Code, or run `/bvc-apply paste`.

## Status

P1 — clipboard-only apply; class-map swap is the primary live-edit path (signal
RPC is a Storybook-only enhancement, per the pivot plan's Spike A outcome).
Helper-based apply ships in P2. See cx-web-workspace's
`docs/superpowers/plans/2026-05-24-bvc-extension-pivot.md` for the full direction.
