# BVC — Open-Source Generic Fork (Blueprint)

**Date:** 2026-05-31
**Status:** Blueprint — planning only, no code changes in this repo
**Relationship:** This repo (`bvc-extension`) stays Coralogix-specific. The
open-source effort is a **separate, future, duplicated repo** that is made
generic. This doc inventories what couples the current code to Coralogix/cxui
and defines the abstraction boundary the fork would adopt. It is a living
design doc, expected to evolve when the fork is actually spun up.

## Goal

A catalog-agnostic "visual controller" Chrome extension: any team points it at
their own component catalog + design tokens and gets the same click-to-edit,
copy-a-change-prompt workflow — without any Coralogix or cxui assumptions baked
in.

## Coralogix / cxui coupling inventory

What in the current code assumes cxui specifically:

### 1. Component-name prefix (`Cxui*` / `cxui-`)
- `catalog-cxui.ts` — `isCxuiComponent` checks `tagName.startsWith('cxui-')`;
  `findCxuiEntry` / `describeCxuiComponent` strip a hardcoded `Cxui` ctor
  prefix (`.slice(4)`, `startsWith('Cxui')`).
- `signal-writer.ts` — `isCxuiCtor` checks `constructor.name.startsWith('Cxui')`.
- `cxui-ancestor.ts` — banner copy references the cxui component name.
- `panel.ts` — header label hardcodes `'cxui Design System'` vs `'HTML element'`.

### 2. Activation markers
- `activation.ts` — `CXUI_MARKERS` (tag list) and the attribute-directive list
  (`cxuiButton`, `cxuiBadge`, …) are hardcoded cxui tags/attributes.

### 3. Framework assumption (Angular)
- `signal-writer.ts` — entire live-edit path assumes Angular signal inputs,
  `window.ng` dev tools, `_effective*` / `_directive*` / `*Override` internal
  conventions, and Storybook `updateStoryArgs`. Deeply cxui/Angular-specific.

### 4. Catalog + design data (build-time)
- `tools/fetch-catalog.ts` + README — catalog comes from
  `pnpm bvc:export` in a cx-web-workspace checkout.
- `data/catalog.json`, `data/tokens.json`, `data/fonts.json`, `data/icons.json`
  — Coralogix design-system content, bundled as web-accessible resources.
- `runtime-data.ts`, `tokens.ts`, `icons.ts`, `typography-tokens.ts`,
  `design-tokens.ts` — load and assume the shape of those files.

### 5. Identity, hosts, and apply path
- `manifest.json` — name "Brainy Visual Controller", `*.coralogix.com`
  host permissions.
- `apply.ts` — `postApply` writes `.bvc/last-edit.md`; the `/bvc-apply` Claude
  Code skill and prompt wording are Coralogix-workflow-specific.
- README — points at internal cx-web-workspace plans and `pnpm bvc:export`.

### 6. Coexistence guard
- `activation.ts` `detectInBundleBvc()` keys off `window.__bvcMounted` — the
  in-bundle BVC that ships inside cx-web-workspace. Irrelevant to a generic
  fork; would be dropped or made opt-in.

## Proposed abstraction boundary (for the fork)

A single **adapter config** the host team supplies, isolating everything above:

```
{
  prefix:        "Cxui" / "cxui-",        // ctor prefix + tag prefix
  markers:       { tags: [...], attrs: [...] },   // activation
  designSystemLabel: "cxui Design System",
  catalogSource: () => CatalogEntry[],     // pluggable: bundled JSON, URL, or
                                           //   build-time export
  tokens / fonts / icons: <same shape, host-provided>,
  framework adapter: detect(el) -> { isComponent, name } | null,
                     read/write(el, prop, value),   // Angular adapter today;
                                                     //   React/Vue/Web-Components later
  apply adapter: how a change-prompt is emitted (clipboard format + optional
                 local write path)
}
```

Refactor targets (in the fork, not here):
- Replace the hardcoded `Cxui`/`cxui-` checks with `config.prefix`.
- Replace `CXUI_MARKERS` with `config.markers`.
- Extract the Angular/`window.ng` logic in `signal-writer.ts` behind a
  **framework adapter** interface so other frameworks can be added.
- Replace bundled `data/*.json` with a configurable catalog source; ship a
  small example catalog instead of cxui's.
- Generic naming throughout: extension name, manifest, README, the apply
  prompt and any companion CLI skill.

Note: Part 1's detection fix (routing per-element detection through the
page-bridge RPC) lands in *this* repo and is a natural fit for the framework
adapter boundary — the fork inherits a cleaner seam for free.

## Mechanical OSS-prep checklist (for the fork)

- [ ] Choose a license (MIT/Apache-2.0) and add `LICENSE`.
- [ ] Scrub internal references: cx-web-workspace plan paths, `*.coralogix.com`
      hosts, internal Slack/Jira/vault links, the `bvc:export` instructions.
- [ ] Replace bundled Coralogix `data/*.json` with a neutral example catalog.
- [ ] Rename the product and all `bvc`/`Cxui` identifiers to neutral names.
- [ ] Public README: what it is, supported frameworks, how to wire a catalog,
      install/build, the copy-prompt workflow, contributing guide.
- [ ] Confirm no secrets/tokens in git history (`tools/`, build scripts).
- [ ] Decide distribution: source-only vs Chrome Web Store listing.
- [ ] CI: build + the vitest suite on PRs.

## Open questions (resolve when spinning up the fork)

- Is the first OSS release Angular-only (just generalize the prefix/catalog), or
  is the framework-adapter abstraction in scope from day one?
- Does the fork track this repo's improvements, or hard-fork once?
- Catalog format: standardize on the current `CatalogEntry` shape as the public
  contract, or define a new neutral schema?

## Out of scope

- Any code change in `bvc-extension` itself. The only cross-over is that Part 1's
  detection-layer refactor incidentally improves the seam the fork would extract.
