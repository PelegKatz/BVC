/**
 * Tag prefixes that block BVC entirely. Visualization components have their
 * own design conventions that don't map to BVC's section model; the panel
 * stays closed for any element under one of these prefixes.
 */
export const BVC_BLOCKED_PREFIXES = ['cxui-chart-', 'cxui-graph'];

/**
 * Exact-tag blocklist for internal cxui sub-components — projection slots,
 * structural directives, internal renderers — that have no standalone story
 * and shouldn't surface BVC controls when accidentally picked. Last refreshed
 * from `output/bvc-catalog-audit-2026-05-27.md`.
 *
 * Keep this list curated: every entry here is a component the audit found
 * with zero external references AND no story file.
 */
export const BVC_BLOCKED_TAGS = [
  // Announcement
  'cxui-announcement-slot',
  // Badge variants (internal-only)
  'cxui-priority-badge',
  'cxui-severity-badge',
  // Card chrome
  'cxui-card-clickable',
  // Clipboard internals
  'cxui-copy-to-clipboard-button',
  'cxui-copy-to-clipboard',
  'cxui-copy-url-to-clipboard',
  'cxui-copyable-tooltip-content',
  'cxui-copyable-tooltip',
  // Dialog internals
  'cxui-dialog-container',
  'cxui-slide-in-dialog-toolbar-separator',
  'cxui-slide-in-dialog-container',
  'cxui-dialog-close',
  'cxui-slide-in-fullscreen',
  // Dnd
  'cxui-drag',
  'cxui-drop-list',
  'cxui-drop-list-group',
  'cxui-drag-handle',
  // Form-field internals
  'cxui-form-field-description',
  'cxui-form-field-error',
  'cxui-form-field-errors',
  'cxui-form-field-container',
  // Input internals
  'cxui-input-clear-button',
  'cxui-input-non-negative',
  // Interactions
  'cxui-auto-focus',
  // Core infrastructure
  'cxui-control-value-accessor',
  // Markdown sub-renderers
  'cxui-md-blockquote',
  'cxui-md-code-block',
  'cxui-md-heading',
  'cxui-md-inline-code',
  'cxui-md-link',
  'cxui-md-list',
  'cxui-md-paragraph',
  'cxui-md-table',
  'cxui-md-table-cell',
  'cxui-markdown-nodes',
  // Menu internals
  'cxui-menu-column',
  'cxui-menu-close-on-click',
  // Olly mini box internals
  'cxui-olly-mini-box-content',
  'cxui-olly-mini-footer',
  // Prompt-input family (no host story, the inner pieces aren't independently editable)
  'cxui-prompt-input',
  'cxui-prompt-input-toolbar',
  'cxui-prompt-submit',
  // Pulse loader (animation primitive, no axes)
  'cxui-pulse-loader',
  // Radio internals
  'cxui-radio-circle',
  // Resizable internals
  'cxui-resizable-gutter',
  'cxui-resizable-gutter-template',
  'cxui-resizable-pane',
  // Select internals (triggers, options, sub-components — the host cxui-select
  // is itself uncataloged today; designers should jump to the surrounding
  // primitive when picking any of these)
  'cxui-select-create-option',
  'cxui-select-max-values-counter',
  'cxui-select-dropdown-header-input',
  'cxui-select-trigger-marker',
  'cxui-select-single-button-trigger',
  'cxui-select-filter-trigger',
  // Overflow list internals
  'cxui-overflow-list-item-anchor',
  // Grid internals (single cxui-prefixed component in an otherwise non-cxui lib)
  'cxui-empty-state-icon',
];

/**
 * Non-cxui-prefixed internal tags that also need to be blocked: showcase
 * example components from the graph storybook (`sh-*`), grid-internal test
 * fixtures and helper renderers (`cx-grid-*-example`, `cx-row-loading-overlay`,
 * etc.). Separate list because they don't share the `cxui-` lineage so a
 * `cxui-*` prefix wouldn't catch them. Sourced from the 2026-05-27 audit.
 */
export const BVC_BLOCKED_NON_CXUI_TAGS = [
  // Grid internals + examples
  'cx-circle-help',
  'cx-grid-expand-collapse-cell-example',
  'cx-grid-loading-row',
  'cx-grid-row-style-cell-example',
  'cx-items-list-layout',
  'cx-row-loading-overlay',
  'cx-sample-grid-test-grid',
  // Graph storybook example hosts
  'sh-cxui-graph-page',
  'sh-cluster-showcase-example',
  'sh-cluster-showcase-svg-example',
  'sh-collapsible-nodes-example',
  'sh-custom-nodes-example',
  'sh-focus-example',
  'sh-focus-svg-example',
  'sh-force-clusters-example',
  'sh-force-layout-example',
  'sh-hierarchical-layout-example',
  'sh-hover-behavior-example',
  'sh-hover-expand-svg-example',
  'sh-info-nodes-example',
  'sh-tooltip-context-menu-example',
];

/**
 * Walk up from `el` and return the first ancestor (or `el` itself) that
 * matches a blocklist entry. Returns null when nothing in the chain is
 * blocked. This is the structured form of `isBvcBlocked` — callers that
 * need to surface "which ancestor blocked this?" (e.g., the empty state's
 * escape-out button) use this; callers that only need a boolean keep
 * using `isBvcBlocked`.
 */
export function findBlockingAncestor(el: Element): Element | null {
  let cur: Element | null = el;
  while (cur && cur !== document.body) {
    const tag = cur.tagName.toLowerCase();
    if (BVC_BLOCKED_PREFIXES.some(p => tag.startsWith(p))) return cur;
    if (BVC_BLOCKED_TAGS.includes(tag)) return cur;
    if (BVC_BLOCKED_NON_CXUI_TAGS.includes(tag)) return cur;
    cur = cur.parentElement;
  }
  return null;
}

/**
 * True if the element OR any of its ancestors matches a blocked prefix or
 * an exact blocked tag. Picking anywhere in a blocked subtree shows BVC's
 * empty state instead of any sections.
 */
export function isBvcBlocked(el: Element): boolean {
  return findBlockingAncestor(el) !== null;
}

/**
 * From a blocking ancestor, walk up to find the closest element that is
 * NOT inside any blocked subtree. Used as the "escape" target for the
 * blocked empty state's Jump-out button — picking this element opens the
 * primitive Layout/Spacing/Appearance panel on the container surrounding
 * the chart/graph, which is what designers typically want to edit.
 */
export function findEscapeTarget(blockingAncestor: Element): Element | null {
  let cur: Element | null = blockingAncestor.parentElement;
  while (cur && cur !== document.body) {
    if (!isBvcBlocked(cur)) return cur;
    cur = cur.parentElement;
  }
  return null;
}
