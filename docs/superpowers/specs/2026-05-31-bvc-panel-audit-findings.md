# BVC Panel Audit — Findings

**Date:** 2026-05-31
**Environment:** `http://localhost:4200` (Coralogix app, login view), Angular dev
tools present (`window.ng` available — `full` mode). Detection verified via
Playwright code injection against the live DOM.
**Branch:** `fix/panel-audit-detection`

Severity: P0 breaks core flow · P1 wrong output · P2 cosmetic

## Method note / constraint

The Playwright-controlled browser is a separate Chrome instance from the one
where the unpacked extension is loaded, and loading an unpacked MV3 extension
into it is not supported. So the **interactive panel sweep** (Pick → rendered
sections, live edits, copy-prompt) for Tasks 5–7 must be done in the user's own
Chrome. What *was* verified headlessly: the detection logic (the source of the
reported bug) run against the real cxui DOM, plus what Angular `ng` returns for
each element — which is the data that confirms/extends the fix.

## Live `ng` probe (real elements on the login view)

| Selector | `ng.getComponent` | cxui directive | Isolated-world detect (fixed) | Catalog match |
|----------|-------------------|----------------|-------------------------------|---------------|
| `button[cxuiButton]` | `CxuiButton` | `CxuiIconButton`/`CxuiInputSuffix` | `Button` | Button ✓ |
| `a[cxuiButton]` | `CxuiButton` | — | `Button` | Button ✓ |
| `input[cxuiInput]` | `null` | `CxuiInput` (directive) | `Input` | Input ✓ |
| `cxui-icon` | `CxuiIcon` | — | `Icon` | Icon ✓ |
| `cxui-form-field` | `CxuiFormField` | `CxuiFormFieldContainer` | **`null`** | Form Field (unreachable) |

## Findings

| # | Area | Action | Expected | Actual | Severity | Source |
|---|------|--------|----------|--------|----------|--------|
| F1 | Detection | Select `button[cxuiButton]` / `a[cxuiButton]` in isolated world | Classified cxui "Button", Button catalog entry | **FIXED** — now resolves "Button" (was raw HTML) | P0 | `catalog-cxui.ts` ✓ commit `b35535b` |
| F2 | Detection | Select a tag-based `cxui-*` component not in DETECT_MAP (e.g. `cxui-form-field`, `cxui-avatar`) in isolated world | Resolve its catalog entry + Properties section | **FIXED** — `findCxuiEntry` now derives the lookup name from the `cxui-*` tag (commit `1c4d343`); resolves "Form Field" etc. Was: returned null → "uncataloged cxui" empty state | P1 | `catalog-cxui.ts` ✓ |
| F3 | Live-edit (RPC) | Live-edit a directive-only component (`input[cxuiInput]`, `getComponent`→null) via the page-bridge signal RPC | Signal read/write works | Bridge `get-signal`/`set-signal` call `ng.getComponent(el)` only and throw "no component on element" for directive-only elements | P2 (known: signal RPC is Storybook-only secondary path per D8) | `signal-bridge.ts` |
| F4 | Tooling | Audit the packaged extension via Playwright | Drive the real panel | Extension can't load in the Playwright browser; interactive panel sweep deferred to user's Chrome | n/a (process) | — |
| F5 | Properties / variant edit | Select any cxui component in the extension, open **Properties** | Variant/size chips that swap classes live (class-map path, per pivot D8) | **Properties shows "Angular component not found — window.ng unavailable" for EVERY cxui component** — the whole section short-circuits when `getCxuiInstance` is null, which is always true in the isolated world. The working `classMap` swap path (`applyVariantChange`) is never reached. Confirmed live on a cxui Button. | **P0** | `controls/cxui-variant.ts:33-39` gates the section on an ng instance instead of rendering classMap-backed axes |

## Fix plan deltas (vs original plan)

- **F2** is a new P1 discovered live. Fix: in `findCxuiEntry` (and
  `describeCxuiComponent`), when there is no `ng` instance and `detectComponentName`
  returns null, derive the lookup name from a `cxui-*` tag by stripping the
  `cxui-` prefix and normalizing (`cxui-form-field` → `formfield` → "Form Field").
  This generalizes catalog resolution to **all** tag-based cxui components in the
  isolated world, not just the 6 in DETECT_MAP. Verified the catalog has matching
  entries (30 entries; "Form Field", "Avatar", etc. all normalize-match).
- **F3** is pre-existing and out of scope for the classification fix (the signal
  RPC path is the Storybook-only secondary path). Logged for the record.
- **F5 (P0) fix approach** (decided): in `cxui-variant.ts`, stop early-returning
  on a null instance. Render select axes that have a `classMap` as chips driven
  by the existing class-swap path (`applyVariantChange`), with the initial
  selected value inferred from the element's current classes. Axes that need
  signal read/write (no classMap: e.g. `color`, `loading`, free-text) render
  **disabled with a small "needs Angular dev build" hint** (user decision —
  honest over hidden, matching the readonly-banner philosophy). To be fixed in
  the post-sweep batch.

## Outstanding (needs user's Chrome)

Interactive panel sweep — Tasks 5–7: rendered sections per control, live DOM
edits, change list / revert / Reset, Copy-prompt output, readonly mode, panel
chrome, coexistence guard. Not doable headlessly.
