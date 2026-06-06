# Repaint — Design Spec

**Date:** 2026-06-06
**Repo:** `Peleg770/repaint` (new, public, open source)
**Relationship to BVC:** Independent fork of BVC's core — CX extension untouched

---

## What Is Repaint

Repaint is a Chrome extension that lets you click any element on any web page, edit its CSS properties and classes through a Figma-style side panel, and copy a structured prompt that Claude Code applies to the source files.

It works on any framework (React, Angular, Vue, vanilla) and any design system. No configuration, no pre-baked catalog. The page's own CSS custom properties become the token picker.

---

## Scope

**In scope:**
- Click-to-inspect any element
- Edit: classes, layout (flex/grid/spacing), visual (color, background, radius, shadow), typography (size, weight, line-height, align)
- Token-aware color picker via CSS-var scanning
- Copy-to-clipboard Claude Code apply prompt
- Toolbar icon toggle (on/off per tab)
- Chrome Web Store publication

**Out of scope:**
- Component variant swapping (no catalog, no Storybook dependency)
- Framework signal writes (no `window.ng`, no React fiber access)
- Keyboard shortcuts (full labels used everywhere instead)
- Firefox / Safari support (Chrome MV3 only for now)

---

## Execution Approach

Fork core files from the existing BVC extension. Strip all CX-specific code. Add three new pieces. Do NOT refactor the CX extension — it stays untouched.

The CX BVC extension remains at `PelegKatz/BVC` / `Peleg770/Web-visual-controller`, independently maintained.

---

## Repository Structure

```
repaint/
├── src/
│   ├── background/
│   │   └── service-worker.ts     — toolbar toggle via chrome.action.onClicked
│   ├── content/
│   │   ├── content-script.ts     — mounts/unmounts panel on TOGGLE message
│   │   └── page-bridge.ts        — content ↔ panel messaging (copied from BVC)
│   ├── page-world/
│   │   └── protocol.ts           — message type definitions (copied from BVC)
│   └── panel/
│       ├── main.ts               — generic boot: scan CSS vars, init panel
│       ├── panel.ts              — Shadow DOM host, panel layout (CX refs removed)
│       ├── selector.ts           — hover/click element picker (copied as-is)
│       ├── diff.ts               — snapshot & change tracking (copied as-is)
│       ├── apply.ts              — Claude Code prompt builder (prompt text generalised)
│       ├── banner.ts             — warning/info banners (copied as-is)
│       ├── styles.ts             — panel CSS (copied as-is)
│       ├── design-tokens.ts      — spacing/shadow/radius scales (copied as-is)
│       ├── css-var-scanner.ts    — NEW: scans :root for color CSS custom properties
│       └── controls/
│           ├── class-editor.ts   — NEW: classList chips + add-class input
│           ├── css-props.ts      — layout & visual CSS sections (copied as-is)
│           ├── color-picker.ts   — adapted: uses scanner results, not CX token bundle
│           ├── typography-section.ts — adapted: no CX typography token picker
│           ├── section.ts        — collapsible section wrapper (copied as-is)
│           ├── spacing-hover.ts  — spacing highlight overlay (copied as-is)
│           └── content/          — text/value/copy controls (copied as-is)
├── icons/                        — 🎨 palette icon at 16/32/48/128px
├── manifest.json                 — activeTab + scripting permissions only
├── build.mjs                     — esbuild, simplified (no catalog fetch step)
└── package.json
```

---

## Three New Pieces

### 1. Toolbar Toggle

The service worker listens to `chrome.action.onClicked`. On each click it sends a `{ type: 'TOGGLE' }` message to the active tab's content script. The content script mounts the panel if not present, unmounts if present.

Manifest uses `activeTab` permission — no broad host permissions. This is the easiest path through Chrome Web Store review.

The extension icon is **🎨** (palette emoji rendered to PNG at all required sizes). No badge text, no keyboard shortcut registered in the manifest.

### 2. CSS-Var Scanner (`css-var-scanner.ts`)

Runs once on panel boot. Iterates `document.styleSheets`, catches cross-origin sheets (CORS), reads all `:root {}` rules, and extracts every `--*` property whose resolved value is a color (hex, `rgb()`, `hsl()`, or named color).

Returns `{ name: string; cssVar: string; hex: string }[]` — same shape as BVC's `Token` interface so `color-picker.ts` needs minimal changes.

Falls back to an empty array on pages with no CSS custom properties, in which case the color picker shows raw hex values.

### 3. Class Editor (`controls/class-editor.ts`)

Renders at the top of the panel when an element is selected, above the Layout section.

- Shows current `el.classList` as removable chips (click chip to remove, change is tracked in `diff.ts`)
- Text input with live preview: typing a class name applies it to the element immediately, pressing Enter or clicking "Add" commits the change to the diff
- Chip removals and additions both appear in the apply prompt

---

## Panel Sections (in order)

When an element is selected:

1. **Classes** — class chips + add input (new)
2. **Layout** — display mode, flex direction/wrap/gap, padding, margin
3. **Visual** — color, background (token-aware via scanner), border-radius, box-shadow
4. **Typography** — font-size, font-weight, line-height, text-align

No "Properties" section (no catalog). No "readonly" mode (activation is toolbar-controlled, not detection-based).

All section labels use full text — no icon-only shortcuts.

---

## Apply Prompt Format

```
Repaint changes on <button.btn-primary>:
• Classes: removed "text-sm", added "text-xs"
• background: var(--color-primary) → var(--color-secondary)
• padding: 8px 16px → 6px 12px

Find this element in the source and apply the changes.
```

Claude Code identifies the source file and applies. No component-level context is provided — the prompt describes the DOM element and its changes.

---

## Framework Compatibility

Works on React, Angular, Vue, Svelte, vanilla JS — any rendered HTML.

**Live preview caveat:** Inline style overrides applied for preview may be wiped by framework reconciliation on re-render. The apply prompt is always correct regardless. On pages with frequent re-renders (live data), preview may flicker. This is acceptable for v1.

---

## What's Excluded vs BVC

| BVC Feature | Repaint | Reason |
|---|---|---|
| cxui component detection | ❌ | CX-specific |
| Storybook catalog / variant picker | ❌ | CX-specific |
| Angular signal writes (`window.ng`) | ❌ | Framework-specific |
| MAIN-world signal bridge | ❌ | Angular-only |
| CX token bundle (colors/icons/fonts) | ❌ | Replaced by CSS-var scanner |
| Keyboard shortcuts | ❌ | Full labels instead |
| Blocklist | ❌ | CX-specific |

---

## Publishing Path

1. Build: `npm run build` → `dist/`
2. Test: Load unpacked at `chrome://extensions`
3. Repo: `Peleg770/repaint` — public, MIT licence
4. Chrome Web Store: submit `dist/` as a zip, `activeTab` permission → straightforward review
