# BVC Panel Functional Audit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Systematically audit every panel control and detection path of the BVC extension against a live cxui app, root-cause and fix the `button[cxuiButton]` raw-HTML regression, and log + fix all other defects with regression coverage.

**Architecture:** The panel runs in the isolated content-script world where `window.ng` is absent, so the `getCxuiInstance`-based detection in `catalog-cxui.ts` silently misclassifies attribute/directive cxui components as raw HTML. The fix wires the already-present-but-unused synchronous attribute detector (`detect-map.ts`) into `catalog-cxui.ts` as a fallback. The remaining work is a live Playwright sweep of every control that produces a severity-ranked findings log, followed by a TDD fix loop.

**Tech Stack:** TypeScript, Chrome MV3 extension, vitest + jsdom for unit tests, Playwright browser tools for live verification, esbuild (`build.mjs`).

**Reference spec:** `docs/superpowers/specs/2026-05-31-bvc-panel-audit-design.md`

---

## File Structure

- `src/panel/catalog-cxui.ts` — **modify**: add `detect-map` fallback to `isCxuiComponent`, `findCxuiEntry`, `describeCxuiComponent`.
- `src/panel/catalog-cxui.test.ts` — **create**: unit coverage for directive-component detection without `window.ng`.
- `src/panel/detect-map.ts` — **unchanged** (consumed by the fix; today it is dead code).
- `docs/superpowers/specs/2026-05-31-bvc-panel-audit-findings.md` — **create**: the running defect log.
- Additional `src/panel/**/*.ts` + co-located `*.test.ts` — **modify/create per discovered defect** in the fix loop (Task 8).

---

## Task 1: Set up live audit environment + findings log

**Files:**
- Create: `docs/superpowers/specs/2026-05-31-bvc-panel-audit-findings.md`

- [ ] **Step 1: Build the extension**

Run: `npm install && npm run fetch-catalog && npm run build`
Expected: `dist/` is populated (`dist/background/service-worker.js`, `dist/content/content-script.js`, `dist/page-world/signal-bridge.js`, `dist/data/*.json`) with no build errors.

- [ ] **Step 2: Confirm a live cxui surface is reachable**

Start a localhost cx-web-workspace dev server (or cxui Storybook) that renders cxui components including at least one `button[cxuiButton]`. Note the URL (e.g. `http://localhost:4200` or the Storybook iframe URL). Confirm the page has Angular dev tools (`window.ng`) so detection runs in `full` mode, not `readonly`.

- [ ] **Step 3: Load the unpacked extension**

In `chrome://extensions` → Developer mode → Load unpacked → point at the repo root. Open the cxui URL, click the BVC toolbar action to activate. Expected: the BVC panel mounts (toggle button visible top-right).

- [ ] **Step 4: Create the findings log skeleton**

```markdown
# BVC Panel Audit — Findings

**Date:** 2026-05-31
**Environment:** <cxui URL>, Chrome <version>, extension build <git sha>

Severity: P0 breaks core flow · P1 wrong output · P2 cosmetic

| # | Area | Action | Expected | Actual | Severity | Suspected source |
|---|------|--------|----------|--------|----------|------------------|

## Notes
```

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-05-31-bvc-panel-audit-findings.md
git commit -m "docs: bvc panel audit findings log skeleton"
```

---

## Task 2: Reproduce + confirm the detection root cause (RED)

Confirms the hypothesis with a unit test that fails for the same reason the live bug happens: in jsdom there is no `window.ng`, so `getCxuiInstance` returns null and a `button[cxuiButton]` is misclassified.

**Files:**
- Create: `src/panel/catalog-cxui.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { isCxuiComponent, findCxuiEntry, describeCxuiComponent } from './catalog-cxui';
import type { CatalogEntry } from './catalog-loader';

// jsdom has no window.ng, so getCxuiInstance() returns null here — exactly the
// extension's isolated-world condition that produced the raw-HTML regression.
const CATALOG: CatalogEntry[] = [
  {
    name: 'Button',
    storyTitle: 'Components/Button',
    axes: [{ name: 'Variant', signalName: 'variant', type: 'select', default: 'solid' }],
  },
];

function cxuiButton(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.setAttribute('cxuiButton', '');
  return btn;
}

describe('catalog-cxui — directive components without window.ng', () => {
  it(`GIVEN a <button cxuiButton> and no window.ng
      THEN isCxuiComponent returns true`, () => {
    expect(isCxuiComponent(cxuiButton())).toBe(true);
  });

  it(`GIVEN a <button cxuiButton> and a catalog with a Button entry
      THEN findCxuiEntry resolves to the Button entry`, () => {
    expect(findCxuiEntry(cxuiButton(), CATALOG)?.name).toBe('Button');
  });

  it(`GIVEN a <button cxuiButton>
      THEN describeCxuiComponent returns "Button"`, () => {
    expect(describeCxuiComponent(cxuiButton())).toBe('Button');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/panel/catalog-cxui.test.ts`
Expected: FAIL — `isCxuiComponent` returns `false`, `findCxuiEntry` returns `null`, `describeCxuiComponent` returns `"button"`.

- [ ] **Step 3: Commit the failing test**

```bash
git add src/panel/catalog-cxui.test.ts
git commit -m "test: reproduce button[cxuiButton] misclassification without window.ng"
```

---

## Task 3: Fix detection — wire detect-map into catalog-cxui (GREEN)

**Files:**
- Modify: `src/panel/catalog-cxui.ts`

- [ ] **Step 1: Import the synchronous attribute detector**

At the top of `src/panel/catalog-cxui.ts`, add to the imports:

```ts
import { detectComponentName } from './detect-map';
```

- [ ] **Step 2: Add the fallback to `isCxuiComponent`**

Replace the body of `isCxuiComponent`:

```ts
export function isCxuiComponent(el: Element): boolean {
  if (el.tagName.toLowerCase().startsWith('cxui-')) return true;
  if (getCxuiInstance(el) !== null) return true;
  // Isolated content-script world: window.ng is absent, so getCxuiInstance is
  // always null. Fall back to the synchronous attribute detector so directive
  // components (e.g. button[cxuiButton]) are still classified as cxui.
  return detectComponentName(el) !== null;
}
```

- [ ] **Step 3: Add the fallback to `findCxuiEntry`**

Replace the body of `findCxuiEntry`:

```ts
export function findCxuiEntry(el: Element, catalog: CatalogEntry[]): CatalogEntry | null {
  const instance = getCxuiInstance(el);

  let target: string | null = null;
  if (instance) {
    const ctorName = instance.constructor.name;
    if (ctorName.startsWith('Cxui')) target = normalizeName(ctorName.slice(4));
  }
  // No live instance (isolated world): derive the name from the attribute map.
  if (!target) {
    const detected = detectComponentName(el);
    if (detected) target = normalizeName(detected);
  }
  if (!target) return null;

  return (
    catalog.find(e => normalizeName(e.name) === target) ??
    catalog.find(e => {
      const last = e.storyTitle.split('/').at(-1) ?? '';
      return normalizeName(last) === target;
    }) ??
    null
  );
}
```

- [ ] **Step 4: Add the fallback to `describeCxuiComponent`**

Replace the body of `describeCxuiComponent`:

```ts
export function describeCxuiComponent(el: Element): string {
  const instance = getCxuiInstance(el);
  if (instance) {
    const name = instance.constructor.name;
    return name.startsWith('Cxui') ? name.slice(4) : name;
  }
  const detected = detectComponentName(el);
  if (detected) return detected;
  return el.tagName.toLowerCase();
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/panel/catalog-cxui.test.ts`
Expected: PASS (all three assertions green).

- [ ] **Step 6: Run the full suite for regressions**

Run: `npx vitest run`
Expected: PASS — no existing test broken.

- [ ] **Step 7: Commit**

```bash
git add src/panel/catalog-cxui.ts
git commit -m "fix: detect directive cxui components in isolated world via detect-map"
```

---

## Task 4: Live-verify the detection fix (Playwright)

**Files:** none (verification only — record result in the findings log).

- [ ] **Step 1: Rebuild and reload**

Run: `npm run build`. In `chrome://extensions`, click reload on the BVC extension. Reload the cxui page.

- [ ] **Step 2: Pick a `button[cxuiButton]` element**

Using the Playwright browser tools, navigate to the cxui URL, click the panel's **Pick** button, then click a `button[cxuiButton]` on the page.

- [ ] **Step 3: Assert the panel classifies it as cxui**

Read the panel shadow DOM. Expected: header shows the diamond `◆`, component name `Button`, library label `cxui Design System` — **not** `button` / `HTML element`. Expected: a **Properties** section (variant chips) renders, not the raw-HTML Layout/Visual/Typography primitive sections.

- [ ] **Step 4: Record the result**

Mark the original `button[cxuiButton]` defect as FIXED in the findings log (note the build sha and a screenshot path). If the header is correct but the Properties section is empty (because live variant editing still needs `window.ng` via the page bridge), log that separately as its own finding — it is the known Storybook-only live-edit limitation, not this fix's scope.

---

## Task 5: Live sweep — detection & selection paths

Exercise each case live; for every row, record expected vs actual in the findings log. Do **not** fix here — log only.

**Files:** `docs/superpowers/specs/2026-05-31-bvc-panel-audit-findings.md` (append rows).

- [ ] **Step 1: Tag-based cxui component** — pick a `cxui-icon` / `cxui-badge`. Expected: `◆`, correct name, `cxui Design System`, Properties + Content sections as applicable.
- [ ] **Step 2: Directive cxui component** — pick `button[cxuiButton]`, an `[cxuiBadge]`, `[cxuiTag]`, `input[cxuiInput]`, `[cxuiChip]`. Expected: each classified as cxui with the right name (covered by Task 4 for Button; verify the others).
- [ ] **Step 3: Raw HTML element** — pick a plain `<div>` / `<span>`. Expected: `◇`, tag name, `HTML element`, Layout + Visual + Typography sections.
- [ ] **Step 4: Uncataloged cxui sub-component** — pick an internal cxui piece with no catalog entry (e.g. a CxuiInlineSelectTrigger). Expected: the "uncataloged" empty state with a **Jump to parent** shortcut; no Layout/Content sections.
- [ ] **Step 5: Blocked element** — pick a chart/graph element or a descendant. Expected: the blocked empty state (`blocked-empty-state.ts`), no edit sections.
- [ ] **Step 6: Primitive nested in a cxui ancestor** — pick a raw `<span>` inside a `cxui-badge`. Expected: primitive sections **plus** the descendant warning banner; banner dismiss persists.
- [ ] **Step 7: Breadcrumb + descendant navigation** — click an ancestor breadcrumb segment and a descendant chip; verify selection follows, hover preview outlines the right element, and the `Show N more` toggle works.
- [ ] **Step 8: Commit the log**

```bash
git add docs/superpowers/specs/2026-05-31-bvc-panel-audit-findings.md
git commit -m "docs: audit findings — detection & selection sweep"
```

---

## Task 6: Live sweep — control modules

For each control, with an appropriate target selected: confirm it (a) renders, (b) edits the live DOM, and (c) produces a change entry in the **Local edits** list. Log defects only.

**Files:** findings log (append rows).

- [ ] **Step 1: cxui Properties (`cxui-variant.ts`)** — change a variant chip on a cataloged cxui component. Expected: a class-map swap updates the element's classes and a change row appears. (If the live swap no-ops because variant editing needs `window.ng`, log it as a known limitation per Task 4 Step 4.)
- [ ] **Step 2: Layout sections (`css-props.ts` → `createLayoutSections`)** — on a raw element, edit Auto-layout / Sizing / Spacing fields. Expected: inline styles change live; change rows appear; `spacing-hover.ts` highlight shows on hover.
- [ ] **Step 3: Visual sections (`css-props.ts` → `createVisualSections`)** — edit background/border/radius via the color picker (`color-picker.ts`). Expected: live style change + change row; picker popover opens/closes correctly.
- [ ] **Step 4: Primitive typography (`typography-section.ts`, `token-typography-picker.ts`)** — apply a typography token to a raw element. Expected: token classes/styles applied; change row reflects it.
- [ ] **Step 5: Icon picker (`icon-picker.ts`)** — on an icon-capable target, set / change / remove the icon. Expected: `cxui-icon` injected/updated/removed live; change row kind `icon` with correct +/~/− state.
- [ ] **Step 6: Content controls (`controls/content/*`)** — for each declared `bvc.content` kind reachable (`text-label`, `copy-text`, `value`, `percentage`, `name`, `qr-data`): edit the value. Expected: live update + change row of the right kind. Note any kind unreachable in the current app.
- [ ] **Step 7: Commit the log**

```bash
git add docs/superpowers/specs/2026-05-31-bvc-panel-audit-findings.md
git commit -m "docs: audit findings — control modules sweep"
```

---

## Task 7: Live sweep — change pipeline, output, and cross-cutting

**Files:** findings log (append rows).

- [ ] **Step 1: Diff & revert (`diff.ts`, change list)** — make several edits across two elements. Expected: grouped change list with correct per-change icons; per-change revert restores exactly that change; **Reset** restores all elements and clears the list.
- [ ] **Step 2: Copy-prompt output (`apply.ts`)** — click **Copy prompt** with edits present. Expected: button shows `Copied + saved ✓` / `Copied to clipboard`; clipboard holds a coherent Claude Code prompt; verify cxui edits and raw edits are both represented correctly. Capture the copied text into the log.
- [ ] **Step 3: `.bvc/last-edit.md` write (`postApply`)** — confirm whether the local write succeeds or degrades to clipboard-only, and that the status label matches reality.
- [ ] **Step 4: Readonly mode** — load against a build without Angular dev tools (or simulate). Expected: readonly banner, controls disabled, selection + Copy-prompt still work.
- [ ] **Step 5: Panel chrome** — open/close persistence (`bvc-panel-open`), `⌘.` / `⌘\` shortcut, Esc to exit pick mode, beforeunload guard when edits are pending, `Sent Ns ago` ticker.
- [ ] **Step 6: Coexistence guard (`activation.ts`)** — on a page where the in-bundle BVC (`window.__bvcMounted`) is present, confirm the extension stands down (no second panel).
- [ ] **Step 7: Commit the log**

```bash
git add docs/superpowers/specs/2026-05-31-bvc-panel-audit-findings.md
git commit -m "docs: audit findings — pipeline, output, cross-cutting sweep"
```

---

## Task 8: Triage + fix loop for discovered defects

Work the findings log P0 → P1 → P2. Repeat the cycle below **once per defect**. (The template is deliberate: defects are unknown until the sweep runs, so each gets its own red/green/verify cycle.)

**Files (per defect):**
- Modify: the suspected source file from the log row.
- Create/Modify: a co-located `*.test.ts` when the defect is in testable logic.

- [ ] **Step 1: Pick the highest-severity unresolved defect** and re-read its log row (area, repro, suspected source).

- [ ] **Step 2: Decide testability.** If the defect lives in pure/DOM logic exercisable in jsdom (parsing, diff, name resolution, class/style computation), it gets a unit test. If it is purely a live cross-world / rendering behavior, it gets a Playwright re-verification instead (skip to Step 6).

- [ ] **Step 3: Write the failing test** in the co-located `*.test.ts`, using the existing idiom — `describe` + `it` with `GIVEN/THEN` wording, `document.createElement` for DOM, and a literal `CatalogEntry[]` where a catalog is needed (see `src/panel/cxui-ancestor.test.ts` and `src/panel/catalog-cxui.test.ts`).

- [ ] **Step 4: Run it and confirm it fails**

Run: `npx vitest run <path-to-test>`
Expected: FAIL describing the defect.

- [ ] **Step 5: Implement the minimal fix** in the suspected source file.

- [ ] **Step 6: Verify.** Run `npx vitest run` (expect full suite PASS). Then `npm run build`, reload the extension, and re-run the original live repro with the Playwright tools — confirm the actual behavior now matches expected.

- [ ] **Step 7: Update the log + commit**

Mark the row FIXED with the commit sha.

```bash
git add -A
git commit -m "fix(bvc): <one-line defect description>"
```

- [ ] **Step 8: Repeat** from Step 1 until no unresolved P0/P1 rows remain. P2 cosmetic items may be deferred — if deferred, leave them OPEN in the log with a note rather than silently dropping them.

---

## Task 9: Final verification

- [ ] **Step 1: Full unit suite green**

Run: `npx vitest run`
Expected: PASS, including the new `catalog-cxui.test.ts` and every per-defect test.

- [ ] **Step 2: Clean build**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 3: Findings log reconciled** — every row is FIXED or an explicitly-noted deferred P2. No row left ambiguous.

- [ ] **Step 4: Final commit if anything is outstanding**

```bash
git add -A && git commit -m "docs: finalize bvc panel audit findings"
```

---

## Self-Review notes (coverage vs spec)

- Spec success criterion 1 (every control/path exercised both cxui + raw) → Tasks 5–7.
- Criterion 2 (severity-ranked defect log) → Task 1 skeleton + Tasks 5–7 rows.
- Criterion 3 (button regression root-caused + fixed + covered) → Tasks 2–4.
- Criterion 4 (suite green, new logic tested) → Tasks 3, 8, 9.
- Criterion 5 (live re-verification) → Tasks 4, 6 notes, 8 Step 6.
- Out-of-scope items (open-source, new features) are excluded; discovered "missing feature" items are logged as recommendations, not built (Task 8 only fixes correctness defects).
