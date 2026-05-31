# BVC Extension — Panel Functional Audit (Design)

**Date:** 2026-05-31
**Repo:** `bvc-extension` (Coralogix-specific; stays Coralogix)
**Status:** Spec — pending approval
**Owner:** Peleg

## Purpose

The Brainy Visual Controller extension lets a designer click any element on a
running cxui app, edit it through Figma-style controls in a side panel, and copy
a structured change-prompt that Claude Code applies to source. Manual use has
surfaced at least one real defect — selecting a `button[cxuiButton]` shows
raw-HTML controls instead of the cxui Button controls. This spec defines a
**full functional audit** of the panel against a live app: a systematic pass
that reproduces and root-causes known defects, sweeps every control, logs all
findings severity-ranked, and fixes them with regression coverage.

This is Part 1 of a two-part effort. Part 2 (open-sourcing a generic fork) is a
separate, planning-only design doc: `2026-05-31-bvc-open-source-blueprint.md`.

## Success criteria

1. Every panel control and detection path is exercised against a live cxui app
   for both a cxui component and a raw-HTML element, with the result recorded.
2. Every defect is logged with severity, repro steps, and suspected source
   location.
3. The `button[cxuiButton]` regression is root-caused and fixed, and the fix is
   covered by a test that fails before / passes after.
4. The existing vitest suite stays green; new logic gets new tests.
5. Live re-verification confirms each fix in the browser, not just in unit tests.

## Leading root-cause hypothesis (to confirm first)

The panel boots in the **isolated** content-script world (`content-script.ts` →
`panel/main.ts`). `isCxuiComponent(el)` (`catalog-cxui.ts`) returns `true` only
when either:

- the tag starts with `cxui-` (a synchronous string check — works), **or**
- `getCxuiInstance(el)` is non-null (`signal-writer.ts`) — which reads
  `window.ng`, and `window.ng` **does not exist in the isolated world**. The
  module's own header comment confirms this: in the extension it "returns null
  and signal writes no-op."

Consequence: **attribute/directive-selector cxui components are never detected
as cxui in the running extension.** `button[cxuiButton]`, and any directive-only
cxui element, fall through `renderSelected`'s `const cxui = isCxuiComponent(el)`
branch (`panel.ts:405`) to the raw-HTML primitive controls. Tag-based components
(`cxui-icon`, `cxui-badge`, …) detect fine because of the string check.

Note the asymmetry with **activation**: `activation.ts` already detects
directives by attribute (`[cxuiButton]`, etc.) for the page-mode probe, and it
probes `window.ng` correctly — via the page-bridge RPC to the MAIN world. So the
extension *activates* on a button-only page but then *misclassifies* the button.

If confirmed, the fix is architectural: per-element cxui detection (and the
component/directive name needed for catalog lookup) must travel over the
page-bridge RPC from the MAIN world, the same channel activation already uses —
not via synchronous `window.ng` access in the isolated world. The audit
confirms this before any fix lands.

## Audit method

**Environment:** load the unpacked extension (`npm run build`) against a running
cxui surface — a localhost cx-web-workspace dev server and/or cxui Storybook —
and drive it with the Playwright browser tools (click elements, read the panel's
shadow DOM, capture screenshots, assert control state).

**Surface to cover.** For each, exercise a cxui case and a raw-HTML case:

1. **Detection & selection** — `selector.ts`, `catalog-cxui.ts`,
   `cxui-ancestor.ts`, `signal-writer.ts`. Tag-based cxui, directive cxui
   (`button[cxuiButton]`), raw HTML, uncataloged cxui sub-components, blocked
   (chart) elements, and primitives nested under a cxui ancestor.
2. **Control modules** — every file under `panel/controls/` and
   `panel/controls/content/`: `cxui-variant`, `css-props` (layout + visual
   sections), `typography-section`, `token-typography-picker`, `color-picker`,
   `icon-picker`, `text-label`, `spacing-hover`, `section`, and the content
   controls (`name-text`, `copy-text`, `value-number`, `value-percentage`,
   `qr-data`). Verify each renders, edits live, and emits a correct change.
3. **Change pipeline & output** — `diff.ts` (snapshot / computeChanges /
   revert), the change list + per-change revert, Reset, and `apply.ts`
   (`buildSessionPrompt`, clipboard copy, `postApply`). Confirm the copied
   prompt is correct for both cxui (class-map / signal intent) and raw edits.
4. **Cross-cutting** — catalog loading (`catalog-loader`, `runtime-data`),
   tokens/icons/fonts seeding, banner/blocklist/empty states
   (`banner`, `blocklist`, `blocked-empty-state`, `uncataloged-cxui-state`),
   readonly mode, breadcrumb/descendant navigation, panel open/persist,
   keyboard shortcuts, and the coexistence guard.

**Per-item record:** component/path, action taken, expected, actual,
pass/fail, severity (P0 breaks core flow · P1 wrong output · P2 cosmetic),
suspected source location.

## Defect handling

- Findings accumulate in a severity-ranked defect log at
  `docs/superpowers/specs/2026-05-31-bvc-panel-audit-findings.md`, created at the
  start of the live pass and updated as the audit proceeds.
- Fixes proceed P0 → P2. Each fix with logic gets a vitest test (TDD: red
  first). DOM-detection fixes that can't be unit-tested in isolation get a live
  Playwright re-verification step instead, recorded in the log.
- The detection-layer fix (the hypothesis above) is treated as P0 and done
  first, since it changes how `renderSelected` classifies every element and
  several other findings may be downstream of it.

## Out of scope

- No changes toward open-sourcing (Part 2 is planning-only, separate repo).
- No new features — this is correctness/QA only. New behavior surfaced as
  "missing" gets logged as a recommendation, not built.
- No catalog/data regeneration beyond what's needed to run the audit.

## Risks

- **MAIN-world detection cost:** routing per-element detection over RPC adds
  async hops on hover/select. Mitigation: detect on select (not hover), cache
  per element, and keep the synchronous tag-based fast path.
- **Live environment availability:** the audit needs a running cxui server with
  Angular dev tools enabled (`full` mode). If only a production build is
  reachable, detection fixes can only be verified in `readonly` mode + tests.
