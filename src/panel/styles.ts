export const PANEL_WIDTH = 320;
export const PANEL_MIN_WIDTH = 240;
export const PANEL_MAX_WIDTH = 560;

export const panelCss = /* css */ `
  :host {
    all: initial;
    font-family: 'Nunito Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    /* Inherit Coralogix design tokens from the host page (custom props pierce
       the shadow boundary). Hex fallbacks make the panel portable to projects
       that don't load the Brainy token set. */
    --cx-visual-fg: var(--c-text-primary, #09090b);
    --cx-visual-fg-2: var(--c-text-secondary, #68686d);
    --cx-visual-fg-muted: var(--c-text-disabled, #ababb1);
    /* Canonical dropdown chevron (matches the inline SVG in color-picker /
       icon-picker / section headers) as a data-URI so native <select>s can
       render it via background-image. Colour is baked in per theme. */
    --cx-visual-chevron: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath d='M2.5 3.5 L5 6 L7.5 3.5' stroke='%23ababb1' stroke-width='1' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    --cx-visual-bg: var(--c-background-surface-secondary, #ffffff);
    --cx-visual-bg-2: var(--c-background-surface-primary, #f8fafc);
    /* Dedicated input fill. Light mode reuses bg-2; dark mode bumps it
       above bg-2 because controls otherwise visually merge with the
       section background. */
    --cx-visual-input-bg: var(--cx-visual-bg-2);
    --cx-visual-figma-pad-bg: var(--cx-visual-input-bg);
    --cx-visual-bg-hover: var(--c-background-hover, rgba(0, 0, 0, 0.04));
    --cx-visual-bg-focus: var(--c-background-focus, #e6fff2);
    --cx-visual-border: var(--c-border-subtle, #ececee);
    --cx-visual-border-strong: var(--c-border-strong, #dedee0);
    --cx-visual-accent: var(--c-text-interactive, #029449);
    --cx-visual-success: var(--c-text-success, #3cc67e);
    --cx-visual-error: var(--c-text-error, #eb6166);
    --cx-visual-warn-bg: var(--c-tag-yellow-bg, #fff8e6);
    --cx-visual-warn-text: var(--c-tag-yellow-text, #8e581f);

    /* Selector-strip syntax-color tints — tag (orange-ish), id (purple),
       and the Tailwind-utility chip badge. Hard hex values in light mode
       so we don't over-couple to cxui tokens; dark mode equivalents land
       in the @media + :host-context blocks below. */
    --cx-visual-syntax-tag: #b04500;
    --cx-visual-syntax-id: #6941c6;
    --cx-visual-syntax-tw: #5925dc;

    /* ── Spacing scale ─────────────────────────────────────────────────────
       Tight, geometric. Most layouts use s2 (6) for tight rows, s3 (8) for
       section bodies, s4 (12) for section padding, s5 (16) for hero gaps. */
    --cx-visual-s1: 4px;
    --cx-visual-s2: 6px;
    --cx-visual-s3: 8px;
    --cx-visual-s4: 12px;
    --cx-visual-s5: 16px;

    /* ── Control heights ───────────────────────────────────────────────────
       Three rungs only. xs = inline chips inside dense rows (token-chip in
       a spacing cell). sm = primary 26px control rhythm (inputs, chips,
       buttons in section bodies). md = header-level actions / preset rows. */
    --cx-visual-h-xs: 22px;
    --cx-visual-h-sm: 26px;
    --cx-visual-h-md: 28px;

    /* ── Type scale ────────────────────────────────────────────────────────
       Four rungs. xs = meta (sent ago, axis micro-labels). sm = body / chip
       value default. md = section headings. lg = component name in header. */
    --cx-visual-t-xs: 10px;
    --cx-visual-t-sm: 11px;
    --cx-visual-t-md: 12px;
    --cx-visual-t-lg: 13px;

    /* ── Radius ────────────────────────────────────────────────────────────
       sm = chips and tight rows. Default (--cx-visual-radius) for most controls.
       lg = popovers, the panel's "soft" surfaces. */
    --cx-visual-radius-sm: 4px;
    --cx-visual-radius: 6px;
    --cx-visual-radius-lg: 8px;

    /* ── Motion ────────────────────────────────────────────────────────────
       fast = state transitions (hover, focus, active). med = larger layout
       shifts (toggle slide, accordion open). One curve only — Apple-style
       ease-out — so the panel feels coherent in motion. */
    --cx-visual-motion-fast: 120ms cubic-bezier(0.2, 0.7, 0.2, 1);
    --cx-visual-motion-med: 200ms cubic-bezier(0.2, 0.7, 0.2, 1);

    /* ── Shadows ───────────────────────────────────────────────────────────
       sm = small surface lift (chips on hover). md = popover. lg = panel
       drop edge when scrolling. */
    --cx-visual-shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.06);
    --cx-visual-shadow-md: 0 4px 12px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04);
    --cx-visual-shadow-lg: 0 10px 30px rgba(15, 23, 42, 0.10), 0 4px 12px rgba(15, 23, 42, 0.06);

    /* ── Focus ring ────────────────────────────────────────────────────────
       Always 2px solid accent, 1px offset. Set on :focus-visible only so
       mouse clicks don't trigger keyboard-focus rings. */
    --cx-visual-focus-ring: 2px solid var(--cx-visual-accent);
    --cx-visual-focus-offset: 1px;
  }

  /* ── Dark mode ─────────────────────────────────────────────────────────
     When the host page exposes cxui's --c-* tokens, those tokens flip
     automatically (cxui uses class-based dark mode). When they don't,
     the fallback hex values above are LIGHT — which makes the panel
     unreadable on dark pages. Override the fallbacks for both the
     system preference (prefers-color-scheme) and the class-based
     trigger (html.dark, the cxui convention).

     Each rule sets the FALLBACK only — when --c-* tokens are defined
     they still win, because they're the first arg of var(). This means
     adding dark mode here doesn't fight cxui's tokens; it only fills
     in when cxui isn't loaded. */
  @media (prefers-color-scheme: dark) {
    :host {
      --cx-visual-fg: var(--c-text-primary, #e6e6e9);
      --cx-visual-fg-2: var(--c-text-secondary, #a1a1a6);
      --cx-visual-fg-muted: var(--c-text-disabled, #6e6e72);
      --cx-visual-chevron: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath d='M2.5 3.5 L5 6 L7.5 3.5' stroke='%236e6e72' stroke-width='1' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      /* Tiered elevation: bg = panel surround (deepest), bg-2 = inset
         controls (clearly lifted), bg-hover = transient highlight.
         Dark-mode panels use direct hex (no var()) instead of inheriting
         the host page's cxui tokens — Coralogix dark mode resolves the
         host's surface-secondary to near-pure-black and surface-primary
         barely lifted, which makes panel surround and controls merge.
         The Shadow-DOM panel is its own visual surface; it needs to be
         readable, not color-matched. Borders also use hex for the same
         reason — subtle Coralogix border tokens disappear against
         near-black backgrounds. */
      --cx-visual-bg: #1c1c22;
      --cx-visual-bg-2: #2e2e38;
      /* Inputs sit ~10 L above bg-2 so the editable surface is visibly
         distinct from section backgrounds and segmented controls. */
      --cx-visual-input-bg: #3d3d4a;
      --cx-visual-figma-pad-bg: #222222;
      --cx-visual-bg-hover: rgba(255, 255, 255, 0.08);
      --cx-visual-bg-focus: var(--c-background-focus, rgba(2, 148, 73, 0.22));
      --cx-visual-border: #44444f;
      --cx-visual-border-strong: #5e5e6c;
      --cx-visual-warn-bg: var(--c-tag-yellow-bg, #3a2a14);
      --cx-visual-warn-text: var(--c-tag-yellow-text, #f7c97a);
      --cx-visual-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
      --cx-visual-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0, 0, 0, 0.3);
      --cx-visual-shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.55), 0 4px 12px rgba(0, 0, 0, 0.35);
      --cx-visual-syntax-tag: #ff9966;
      --cx-visual-syntax-id: #b294f6;
      --cx-visual-syntax-tw: #a89cf6;
    }
  }
  :host-context(html.dark),
  :host-context(.dark) {
    --cx-visual-fg: var(--c-text-primary, #e6e6e9);
    --cx-visual-fg-2: var(--c-text-secondary, #a1a1a6);
    --cx-visual-fg-muted: var(--c-text-disabled, #6e6e72);
    --cx-visual-chevron: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath d='M2.5 3.5 L5 6 L7.5 3.5' stroke='%236e6e72' stroke-width='1' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    /* Surface + border tokens use direct hex in dark mode (see comment
       in the @media block above for the rationale). */
    --cx-visual-bg: #1c1c22;
    --cx-visual-bg-2: #2e2e38;
    --cx-visual-input-bg: #3d3d4a;
    --cx-visual-figma-pad-bg: #222222;
    --cx-visual-bg-hover: rgba(255, 255, 255, 0.08);
    --cx-visual-bg-focus: var(--c-background-focus, rgba(2, 148, 73, 0.22));
    --cx-visual-border: #44444f;
    --cx-visual-border-strong: #5e5e6c;
    --cx-visual-warn-bg: var(--c-tag-yellow-bg, #3a2a14);
    --cx-visual-warn-text: var(--c-tag-yellow-text, #f7c97a);
    --cx-visual-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
    --cx-visual-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0, 0, 0, 0.3);
    --cx-visual-shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.55), 0 4px 12px rgba(0, 0, 0, 0.35);
    --cx-visual-syntax-tag: #ff9966;
    --cx-visual-syntax-id: #b294f6;
    --cx-visual-syntax-tw: #a89cf6;
  }

  *, *::before, *::after { box-sizing: border-box; }

  /* Universal interactive defaults — give every interactive element the same
     gentle state transition so hover/focus/active feel coherent. The
     transition is intentionally short (120ms) and scoped to colour-ish
     properties so layout doesn't visibly animate. */
  button, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"]) {
    transition:
      background-color var(--cx-visual-motion-fast),
      border-color var(--cx-visual-motion-fast),
      color var(--cx-visual-motion-fast),
      box-shadow var(--cx-visual-motion-fast),
      opacity var(--cx-visual-motion-fast);
  }

  /* Universal focus-visible ring — only fires on keyboard focus, never on
     mouse click. Individual selectors that need a different look can still
     override this. */
  button:focus,
  [role="button"]:focus,
  [tabindex]:focus {
    outline: none;
  }
  button:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible,
  [role="button"]:focus-visible,
  [tabindex]:focus-visible {
    outline: var(--cx-visual-focus-ring);
    outline-offset: var(--cx-visual-focus-offset);
  }

  .root {
    position: fixed;
    top: 0;
    right: 0;
    width: var(--panel-w, ${PANEL_WIDTH}px);
    height: 100vh;
    background: var(--cx-visual-bg);
    border-left: 1px solid var(--cx-visual-border);
    z-index: 2147483646;
    display: flex;
    flex-direction: column;
    color: var(--cx-visual-fg);
    font-size: 12px;
    line-height: 1.4;
  }

  /* Drag handle on the panel's left edge — resize the panel horizontally.
     Highlights with the accent (green) on hover / during drag. */
  .resize-handle {
    position: absolute;
    left: 0;
    top: 0;
    width: 4px;
    height: 100%;
    cursor: col-resize;
    z-index: 10;
    transition: background 120ms;
  }
  .resize-handle:hover,
  .resize-handle[data-dragging] {
    background: var(--cx-visual-accent);
    opacity: 0.25;
  }

  /* Floating toggle button — always visible, top-right of viewport. The
     glyph is the 🎨 palette emoji, centred in the round button. */
  .toggle-btn {
    position: fixed;
    top: 12px;
    right: 12px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid var(--cx-visual-border);
    background: var(--cx-visual-bg);
    color: var(--cx-visual-accent);
    line-height: 1;
    cursor: pointer;
    /* Token-driven shadow scales correctly in dark mode (becomes pure-black,
       stronger) without hand-tuning per theme. */
    box-shadow: var(--cx-visual-shadow-md);
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    pointer-events: auto;
  }
  .toggle-btn:hover {
    background: var(--cx-visual-bg-2);
    border-color: var(--cx-visual-border-strong);
  }
  .toggle-btn[data-open="true"] {
    right: calc(var(--panel-w, ${PANEL_WIDTH}px) + 12px);
    box-shadow: var(--cx-visual-shadow-sm);
  }
  .toggle-btn svg {
    display: block;
  }

  /* ─── Sticky header ────────────────────────────────────────────────────────
     The whole top region (header + changes + target strip) sits above the
     scrolling body via the flex layout. The header itself is the always-on
     identity row: CX-Visual mark + sent indicator on the left, the primary
     Copy-prompt CTA + Pick toggle + Close on the right. The CTA stays in
     place regardless of selection, with a disabled state when there are no
     edits — moving it out of the conditional changes section means the
     designer always sees the next action they need. */
  .header {
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid var(--cx-visual-border);
    background: var(--cx-visual-bg);
  }
  .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--cx-visual-s3) var(--cx-visual-s4);
    gap: var(--cx-visual-s2);
  }
  .header-row-top {
    /* The top row owns the panel identity + global actions. */
  }

  .title {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
    font-weight: 700;
    font-size: 12px;
    color: var(--cx-visual-fg);
    letter-spacing: 0;
  }
  .title-main {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }
  /* Sent timestamp — counts up from "Sent Xs ago"; hidden until first Send. */
  .title-sent {
    font-size: 9.5px;
    font-weight: 500;
    color: var(--cx-visual-fg-muted);
    margin-left: 12px;
    letter-spacing: 0.05px;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--cx-visual-accent);
  }
  /* Brand glyph in the header title — the 🎨 mark next to "CX-Visual". */
  .title-emoji {
    font-size: 13px;
    line-height: 1;
  }

  /* Pick toggle — ghost when off, outlined-interactive when on (Brainy
     ghost-primary / outlined patterns). Visually distinct from Apply, which is
     filled/solid — establishes a clear primary-vs-secondary action hierarchy. */
  .pick-btn {
    border: 1px solid var(--cx-visual-border);
    background: var(--cx-visual-bg);
    border-radius: var(--cx-visual-radius);
    padding: 0 var(--cx-visual-s3);
    height: var(--cx-visual-h-sm);
    font-size: var(--cx-visual-t-sm);
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    color: var(--cx-visual-fg-2);
    white-space: nowrap;
  }
  .pick-btn:hover {
    border-color: var(--cx-visual-border-strong);
    background: var(--cx-visual-bg-2);
    color: var(--cx-visual-fg);
  }
  .pick-btn:active {
    transform: translateY(0.5px);
  }
  .pick-btn[data-active="true"] {
    background: var(--cx-visual-bg-focus);
    border-color: var(--cx-visual-accent);
    color: var(--cx-visual-accent);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--cx-visual-s2);
  }

  /* Apply — primary action, solid interactive (Brainy cxl-btn--solid).
     Lives in the always-visible header CTA slot; disabled state telegraphs
     "no edits yet to copy". */
  .apply-btn {
    border: 1px solid var(--cx-visual-accent);
    background: var(--cx-visual-accent);
    color: white;
    border-radius: var(--cx-visual-radius);
    padding: 0 var(--cx-visual-s3);
    height: var(--cx-visual-h-sm);
    font-size: var(--cx-visual-t-sm);
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    white-space: nowrap;
    /* Subtle shadow lifts the primary CTA from the header background. */
    box-shadow: var(--cx-visual-shadow-sm);
  }
  .apply-btn:hover:not(:disabled) {
    filter: brightness(0.92);
  }
  .apply-btn:disabled {
    background: var(--cx-visual-bg-2);
    border-color: var(--cx-visual-border);
    color: var(--cx-visual-fg-muted);
    box-shadow: none;
    cursor: not-allowed;
  }
  .apply-btn.apply-btn-ok {
    background: var(--cx-visual-success);
    border-color: var(--cx-visual-success);
  }
  .apply-btn.apply-btn-err {
    background: var(--cx-visual-error);
    border-color: var(--cx-visual-error);
  }

  /* Close — tertiary, ghost icon-only. */
  .close-btn {
    border: none;
    background: transparent;
    color: var(--cx-visual-fg-muted);
    border-radius: var(--cx-visual-radius);
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    line-height: 1;
    font-family: inherit;
    cursor: pointer;
    padding: 0;
  }
  .close-btn:hover {
    background: var(--cx-visual-bg-hover);
    color: var(--cx-visual-fg);
  }

  .body {
    flex: 1;
    overflow-y: auto;
    padding: 0;
  }

  .empty {
    text-align: center;
    color: var(--cx-visual-fg-2);
    padding: 40px 16px;
    font-size: 11px;
    line-height: 1.5;
  }
  .empty strong {
    color: var(--cx-visual-fg);
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 700;
  }
  .empty em {
    font-style: normal;
    background: var(--cx-visual-bg-2);
    border: 1px solid var(--cx-visual-border);
    border-radius: 3px;
    padding: 1px 5px;
    font-family: 'Inconsolata', ui-monospace, monospace;
    font-size: 10px;
    color: var(--cx-visual-fg-2);
  }

  /* Selector strip — appears under header, always shows current target. */
  .target-strip {
    padding: 8px 12px;
    border-bottom: 1px solid var(--cx-visual-border);
    background: var(--cx-visual-bg-2);
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow: hidden;
  }
  /* Ancestor breadcrumb — clickable jumps up the tree. Top-most ancestor on
     the left, nearest parent on the right. Wraps onto multiple lines so
     deep selectors stay visible without horizontal scroll clipping the
     nearest ancestor (which is the most relevant one to the designer). */
  .breadcrumb {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px 4px;
    width: 100%;
    overflow: hidden;
    font-family: 'Inconsolata', ui-monospace, monospace;
    font-size: 10.5px;
    color: var(--cx-visual-fg-muted);
  }
  .breadcrumb-seg {
    border: none;
    background: transparent;
    color: var(--cx-visual-fg-muted);
    font-family: inherit;
    font-size: inherit;
    padding: 1px 4px;
    border-radius: 3px;
    cursor: pointer;
    /* Allow segments to shrink and ellipsis when a single one is wider
       than the panel; otherwise they stay full-width and wrap as needed. */
    flex: 0 1 auto;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .breadcrumb-seg:hover {
    background: var(--cx-visual-bg);
    color: var(--cx-visual-accent);
  }
  .breadcrumb-sep {
    flex-shrink: 0;
    color: var(--cx-visual-fg-muted);
    user-select: none;
  }

  /* Collapsed-by-default overflow chips/separators in the descendant list.
     The dataset toggle on .breadcrumb flips display: none → revealed in
     the natural flex flow. */
  .breadcrumb[data-expanded="false"] [data-overflow="true"] {
    display: none;
  }

  /* "Show N more" / "Show less" toggle in the descendant list. Visually
     parallel to a breadcrumb-seg but with the accent underline that
     marks it as a different affordance (analogous to "Show classes"). */
  .breadcrumb-more {
    border: none;
    background: transparent;
    color: var(--cx-visual-accent);
    font-family: inherit;
    font-size: inherit;
    font-weight: 500;
    padding: 1px 4px;
    border-radius: 3px;
    cursor: pointer;
    flex-shrink: 0;
    text-decoration: underline;
    text-decoration-color: color-mix(in srgb, var(--cx-visual-accent) 35%, transparent);
    text-underline-offset: 2px;
  }
  .breadcrumb-more:hover {
    background: var(--cx-visual-bg-hover);
    text-decoration-color: var(--cx-visual-accent);
  }

  /* Changes section — shown only when the selection has been edited. Lists
     each diff (class added/removed, style prop changed, text/value/placeholder)
     and houses the "Copy changes prompt" action so the list and the action
     read together. Yellow tint communicates "pending — not yet in source". */
  .changes-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px 12px;
    background: var(--cx-visual-warn-bg);
    border-bottom: 1px solid var(--cx-visual-border);
  }
  .changes-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  /* Title acts as a disclosure trigger — click toggles data-open on the
     parent section. Strip native button chrome so it reads as a plain label
     with a leading chevron. */
  .changes-title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0;
    margin: 0;
    border: none;
    background: transparent;
    font-family: inherit;
    font-size: 11px;
    font-weight: 700;
    color: var(--cx-visual-warn-text);
    letter-spacing: 0.1px;
    flex-shrink: 0;
    cursor: pointer;
    user-select: none;
    text-align: left;
  }
  .changes-chevron {
    display: inline-flex;
    color: currentColor;
  }
  /* When collapsed: chevron points right, list is hidden (header row only). */
  .changes-section[data-open="false"] .changes-chevron {
    transform: rotate(-90deg);
  }
  .changes-section[data-open="false"] .changes-list {
    display: none;
  }
  /* Tighten the section padding when collapsed so the header reads as a
     single tidy bar, not as a section with an empty body. */
  .changes-section[data-open="false"] {
    padding-bottom: 8px;
    padding-top: 8px;
  }
  .dirty-pill-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }
  .changes-actions {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
  /* Subtle ghost reset — destructive action with low visual weight so it
     doesn't compete with the primary Copy button. */
  .reset-btn {
    border: 1px solid transparent;
    background: transparent;
    color: var(--cx-visual-fg-2);
    border-radius: var(--cx-visual-radius);
    padding: 0 8px;
    height: 24px;
    font-size: 11px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
  }
  .reset-btn:hover {
    background: var(--cx-visual-bg);
    border-color: var(--cx-visual-border);
    color: var(--cx-visual-fg);
  }

  .changes-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 200px;
    overflow-y: auto;
  }
  /* One element's diff: header line (compact selector) + indented item list. */
  .change-group {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .change-group-head {
    padding-left: 0;
  }
  .change-group-head .selector-line {
    font-size: 10.5px;
    color: var(--cx-visual-fg-2);
  }
  .change-group-items {
    list-style: none;
    margin: 0;
    padding: 0 0 0 8px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    border-left: 1px solid rgba(228, 184, 60, 0.45);
  }
  .change {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    font-size: 11px;
    line-height: 1.45;
    color: var(--cx-visual-fg);
  }
  .change-icon {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 700;
    font-family: inherit;
    line-height: 1;
    margin-top: 2px;
  }
  .change-icon-add {
    background: rgba(2, 148, 73, 0.14);
    color: var(--cx-visual-accent);
  }
  .change-icon-remove {
    background: rgba(235, 97, 102, 0.16);
    color: var(--cx-visual-error);
  }
  .change-icon-mod {
    background: rgba(228, 184, 60, 0.28);
    color: var(--cx-visual-warn-text);
  }
  .change-text {
    flex: 1;
    min-width: 0;
    word-break: break-word;
  }
  .change-text code {
    font-family: 'Inconsolata', ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10.5px;
    background: var(--cx-visual-bg-hover);
    padding: 0 4px;
    border-radius: 3px;
    color: var(--cx-visual-fg);
  }
  /* Per-row revert — appears at the right of every change. Hidden until the
     row is hovered to keep the list calm; full opacity on hover. */
  .change {
    position: relative;
  }
  .change-revert {
    border: none;
    background: transparent;
    color: var(--cx-visual-fg-muted);
    font-family: inherit;
    font-size: 11px;
    line-height: 1;
    padding: 0;
    width: 16px;
    height: 16px;
    margin-top: 1px;
    border-radius: 3px;
    cursor: pointer;
    flex-shrink: 0;
    opacity: 0;
  }
  .change:hover .change-revert {
    opacity: 1;
  }
  .change-revert:hover {
    background: var(--cx-visual-bg-hover);
    color: var(--cx-visual-error);
  }
  .change-revert:focus-visible {
    opacity: 1;
    outline: 2px solid var(--cx-visual-accent);
    outline-offset: 1px;
  }
  /* Wrapper holds the identifying class list + the Show-all toggle. */
  .selector-line-wrap {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
  }
  .selector-line {
    font-family: 'Inconsolata', ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    color: var(--cx-visual-fg-2);
    display: flex;
    flex-wrap: wrap;
    gap: 2px 4px;
    width: 100%;
    overflow-wrap: anywhere;
    word-break: break-all;
  }
  /* Non-identifying classes (Tailwind utilities, pseudo-state utility
     prefixes) are hidden by default and only revealed when the toggle
     puts the strip into expanded mode. */
  .selector-line .cls[data-kind="rest"] {
    display: none;
  }
  .selector-line[data-expanded="true"] .cls[data-kind="rest"] {
    display: inline;
  }
  /* Same size/weight as the breadcrumb links — understated, consistent */
  .selector-line-toggle {
    appearance: none;
    border: 0;
    background: transparent;
    color: var(--cx-visual-accent);
    font: inherit;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    padding: 0;
    align-self: center;
    text-decoration: underline;
    text-underline-offset: 2px;
    text-decoration-color: rgba(2, 148, 73, 0.35);
  }
  .selector-line-toggle:hover {
    text-decoration-color: var(--cx-visual-accent);
  }
  /* Selected-element row — consistent with panel's 11px compact language */
  .selector-main-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  /* Pill badge: white bg, subtle border, same shadow depth as value-chip */
  .selector-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: var(--cx-visual-bg);
    border: 1px solid var(--cx-visual-border-strong);
    color: var(--cx-visual-fg);
    border-radius: 20px;
    padding: 2px 10px;
    font-family: 'Inconsolata', ui-monospace, monospace;
    font-size: 11.5px;
    font-weight: 600;
    white-space: nowrap;
    box-shadow: 0 1px 2px rgba(0,0,0,0.06);
  }
  /* Small accent diamond — signals "component" without overpowering */
  .selector-badge-diamond {
    color: var(--cx-visual-accent);
    font-size: 7px;
    line-height: 1;
  }
  .selector-badge-id {
    opacity: 0.5;
    font-weight: 400;
  }

  .selector-line .tag { color: var(--cx-visual-syntax-tag); }
  .selector-line .id  { color: var(--cx-visual-syntax-id); }
  .selector-line .cls { color: var(--cx-visual-accent); }

  /* Sections (Figma-style) */
  /* ─── Sections — Figma right-rail rhythm ─────────────────────────────────
     Each section has a tall, restful header followed by generously-padded
     body content. No bg hover on the header (Figma keeps it visually quiet
     except for the chevron rotate). 16px horizontal padding throughout so
     section internals breathe like Figma's properties rail. */
  .fsection { border-bottom: 1px solid var(--cx-visual-border); }
  .fsection-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px 6px;
    cursor: pointer;
    user-select: none;
    transition: background-color var(--cx-visual-motion-fast);
  }
  .fsection-head:hover { background: transparent; }
  .fsection-head:hover .fsection-title { color: var(--cx-visual-fg); }
  .fsection-head-left {
    display: flex;
    align-items: center;
    gap: var(--cx-visual-s2);
    min-width: 0;
  }
  .fsection-head-right {
    display: flex;
    align-items: center;
    gap: var(--cx-visual-s1);
    color: var(--cx-visual-fg-muted);
  }
  .fsection-chevron {
    display: none; /* Figma's rail headers never show a chevron — clicking the row collapses */
  }
  .fsection-chevron svg {
    transition: transform var(--cx-visual-motion-fast);
  }
  .fsection-title {
    font-weight: 600;
    font-size: 11px;
    letter-spacing: 0;
    color: var(--cx-visual-fg);
  }
  .fsection-body {
    padding: 0 12px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* Value chip (Figma-style row) */
  .value-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 8px;
    height: 26px;
    border: 1px solid var(--cx-visual-border);
    border-radius: var(--cx-visual-radius);
    cursor: pointer;
    background: var(--cx-visual-input-bg);
  }
  .value-chip:hover { border-color: var(--cx-visual-border-strong); background: var(--cx-visual-bg); }
  .value-chip:focus-visible {
    outline: 2px solid var(--cx-visual-accent);
    outline-offset: 1px;
  }
  .value-chip-swatch {
    width: 16px;
    height: 16px;
    border-radius: 3px;
    border: 1px solid var(--cx-visual-border);
    flex-shrink: 0;
  }
  .value-chip-swatch[data-empty="true"] {
    background:
      linear-gradient(45deg, transparent 45%, var(--cx-visual-border) 45%, var(--cx-visual-border) 55%, transparent 55%),
      var(--cx-visual-bg);
  }
  .value-chip-label {
    font-size: 11px;
    color: var(--cx-visual-fg);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  /* Two-column row (used in Stroke for width + style) */
  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .mini-input {
    width: 100%;
    height: 28px;
    padding: 0 8px;
    border: 1px solid var(--cx-visual-border);
    border-radius: var(--cx-visual-radius);
    background: var(--cx-visual-input-bg);
    font-size: 12px;
    font-family: inherit;
    color: var(--cx-visual-fg);
  }
  .mini-input:hover { border-color: var(--cx-visual-border-strong); background: var(--cx-visual-bg-hover); }
  .mini-input:focus {
    outline: none;
    border-color: var(--cx-visual-accent);
    background: var(--cx-visual-bg);
  }
  /* Native <select> has its own internal padding for the chevron — neutralise
     the height/padding so it matches plain inputs. */
  select.mini-input {
    padding: 0 6px;
    line-height: 26px;
  }
  /* Replace the browser's native dropdown chevron with the panel's canonical
     thin chevron (same SVG as color-picker / icon-picker triggers) so every
     dropdown in the panel reads identically. Native <select> ignores ::after,
     so the chevron is painted as a background-image. background-image is a
     longhand, so it survives the hover/focus background: shorthand on the
     base .text-input / .mini-input rules without being reset.
     select.text-input (0,1,1) outspecifies the base .text-input (0,1,0). */
  select.text-input,
  select.mini-input {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    padding-right: 22px;
    background-image: var(--cx-visual-chevron);
    background-repeat: no-repeat;
    background-position: right 7px center;
  }
  select.text-input:hover,
  select.text-input:focus,
  select.mini-input:hover,
  select.mini-input:focus {
    background-image: var(--cx-visual-chevron);
    background-repeat: no-repeat;
    background-position: right 7px center;
  }
  /* Firefox: hide the dotted focus ring on the option text. */
  select.text-input:-moz-focusring,
  select.mini-input:-moz-focusring { color: transparent; text-shadow: 0 0 0 var(--cx-visual-fg); }
  /* Narrow unit selects (W/H → px/%/auto, ~54px) need a tighter chevron inset
     so "auto" doesn't clip. Keeps the wider dropdowns at the comfortable 22px. */
  select.unit-select {
    padding-left: 6px;
    padding-right: 15px;
    background-position: right 4px center;
  }

  /* Control row (label + control) */
  .control-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .control-label {
    font-size: 11px;
    color: var(--cx-visual-fg-2);
  }

  /* Segmented */
  .segmented {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    border: 1px solid var(--cx-visual-border);
    border-radius: var(--cx-visual-radius);
    overflow: hidden;
    background: var(--cx-visual-bg-2);
    padding: 2px;
    gap: 2px;
    height: 28px;
  }
  .segmented:hover { border-color: var(--cx-visual-border-strong); }
  .segmented-btn {
    border: none;
    background: transparent;
    padding: 0 6px;
    font-size: 11px;
    color: var(--cx-visual-fg-2);
    cursor: pointer;
    font-family: inherit;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border-radius: var(--cx-visual-radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .segmented-btn:hover { background: var(--cx-visual-bg); color: var(--cx-visual-fg); }
  .segmented-btn[data-active="true"] {
    background: var(--cx-visual-bg);
    color: var(--cx-visual-fg);
    font-weight: 600;
    box-shadow: var(--cx-visual-shadow-sm);
  }
  .segmented-btn-icon {
    padding: 0;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .segmented-btn-icon svg {
    width: 13px;
    height: 13px;
    display: block;
  }

  /* ─── Scrubbable number input ─────────────────────────────────────────────
     Number field with a drag-to-scrub handle. The handle (left side, shows
     unit "px") becomes the affordance: click and drag horizontally to
     adjust the value. Native pointer capture ensures the drag continues
     even if the cursor leaves the handle. The handle's cursor is set to
     ew-resize so during capture the OS shows the drag cursor everywhere.
     Shift-drag = ×10 sensitivity; Alt-drag = ÷10. Matches Figma's number
     input model exactly. */
  .scrub {
    display: inline-flex;
    align-items: stretch;
    height: 28px;
    border: 1px solid var(--cx-visual-border);
    border-radius: var(--cx-visual-radius);
    background: var(--cx-visual-input-bg);
    overflow: hidden;
    min-width: 0;
  }
  .scrub:hover { border-color: var(--cx-visual-border-strong); background: var(--cx-visual-bg-hover); }
  .scrub:focus-within {
    border-color: var(--cx-visual-accent);
    background: var(--cx-visual-bg);
  }
  .scrub-handle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 8px;
    background: transparent;
    color: var(--cx-visual-fg-muted);
    font-size: 11px;
    font-family: 'Inconsolata', ui-monospace, monospace;
    cursor: ew-resize;
    user-select: none;
    min-width: 24px;
    /* No border separator — the handle blends into the input bg like Figma's
       in-input prefix icons. Active state below changes only colour, not
       background, so the geometry stays stable during a drag. */
    touch-action: none;
  }
  .scrub-handle:hover { color: var(--cx-visual-fg-2); }
  .scrub-handle.scrub-handle-active {
    color: var(--cx-visual-accent);
  }
  .scrub-input {
    flex: 1;
    width: 100%;
    min-width: 0;
    border: none;
    background: transparent;
    padding: 0 8px 0 0;
    font-size: 12px;
    font-family: inherit;
    color: var(--cx-visual-fg);
    outline: none;
    /* Hide native spinner — the scrub handle replaces it. */
    appearance: textfield;
    -moz-appearance: textfield;
  }
  .scrub-input::-webkit-outer-spin-button,
  .scrub-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  /* When the scrub lives inside the two-col grid the row gives it the full
     available width; otherwise narrow controls render too tight. */
  .two-col .scrub { width: 100%; }

  /* ─── Color chip (token-aware) ─────────────────────────────────────────────
     The trigger reads like a value-chip: small swatch on the left, token
     path or hex in the middle, chevron on the right. Empty / no-color shows
     a checkered swatch via the [data-empty] state. Clicking opens the
     token-aware popover below. */
  .color-chip-row {
    width: 100%;
  }
  .color-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: 28px;
    padding: 0 8px;
    border: 1px solid var(--cx-visual-border);
    border-radius: var(--cx-visual-radius);
    background: var(--cx-visual-input-bg);
    color: var(--cx-visual-fg);
    font-family: inherit;
    font-size: 12px;
    cursor: pointer;
    text-align: left;
    min-width: 0;
  }
  .color-chip:hover {
    border-color: var(--cx-visual-border-strong);
    background: var(--cx-visual-bg-hover);
  }
  /* Active state while its popover is open — accent border echoes focus. */
  .color-chip[data-open="true"] {
    border-color: var(--cx-visual-accent);
  }
  .color-chip-swatch {
    width: 16px;
    height: 16px;
    border-radius: var(--cx-visual-radius-sm);
    border: 1px solid var(--cx-visual-border);
    flex-shrink: 0;
    background: var(--cx-visual-bg-2);
  }
  .color-chip-swatch[data-empty="true"] {
    /* Checker pattern for "no colour" — same idiom as Figma's empty fill. */
    background:
      linear-gradient(45deg, transparent 45%, var(--cx-visual-border-strong) 45% 55%, transparent 55%),
      linear-gradient(-45deg, transparent 45%, var(--cx-visual-border-strong) 45% 55%, transparent 55%),
      var(--cx-visual-bg);
  }
  .color-chip-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .color-chip[data-kind="custom"] .color-chip-label {
    font-family: 'Inconsolata', ui-monospace, monospace;
    font-size: var(--cx-visual-t-xs);
    color: var(--cx-visual-fg-2);
  }
  .color-chip[data-kind="empty"] .color-chip-label {
    color: var(--cx-visual-fg-muted);
    font-style: italic;
  }
  .color-chip-chev {
    display: inline-flex;
    color: var(--cx-visual-fg-muted);
    flex-shrink: 0;
  }

  /* Token swatch picker popover — separator-light sections, the grid sits
     six columns wide instead of the default eight so each swatch is large
     enough to read without a tooltip. */
  .color-popover .swatch-grid {
    grid-template-columns: repeat(6, 1fr);
    gap: var(--cx-visual-s1);
  }
  .swatch-picker-empty {
    padding: var(--cx-visual-s3);
    text-align: center;
    color: var(--cx-visual-fg-muted);
    font-size: var(--cx-visual-t-sm);
  }
  .color-popover-custom {
    border-top: 1px solid var(--cx-visual-border);
    padding-top: var(--cx-visual-s3);
    margin-top: var(--cx-visual-s2);
  }
  .color-popover-custom-row {
    display: grid;
    grid-template-columns: 28px 1fr auto;
    gap: var(--cx-visual-s2);
    align-items: center;
  }
  .color-popover-native {
    width: 28px;
    height: var(--cx-visual-h-sm);
    padding: 2px;
    border: 1px solid var(--cx-visual-border);
    border-radius: var(--cx-visual-radius-sm);
    background: var(--cx-visual-input-bg);
    cursor: pointer;
  }
  .color-popover-hex {
    font-family: 'Inconsolata', ui-monospace, monospace;
  }
  .color-popover-apply {
    height: var(--cx-visual-h-sm);
  }

  /* ─── Token-aware row (scrub + token chip) ────────────────────────────────
     Used by Radius / Gap where the user can either drag-scrub the value or
     pick a named token from the popover. The chip on the right echoes which
     token (if any) the current value matches; off-scale values show in
     warn yellow. */
  .token-aware-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--cx-visual-s2);
    align-items: center;
    min-width: 0;
  }
  .token-aware-chip {
    height: var(--cx-visual-h-sm);
    padding: 0 var(--cx-visual-s2);
    border: 1px solid var(--cx-visual-border);
    border-radius: var(--cx-visual-radius-sm);
    background: var(--cx-visual-input-bg);
    color: var(--cx-visual-fg-2);
    font-family: inherit;
    font-size: var(--cx-visual-t-xs);
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    line-height: 1;
  }
  .token-aware-chip:hover {
    border-color: var(--cx-visual-border-strong);
    background: var(--cx-visual-bg);
    color: var(--cx-visual-fg);
  }
  .token-aware-chip[data-scale="off"] {
    border-color: var(--cx-visual-warn-text);
    color: var(--cx-visual-warn-text);
    background: var(--cx-visual-warn-bg);
  }

  /* Token chip — used for spacing (padding sides, gap) and typography. The
     only way to set a value is to pick from the popover; off-scale values
     existing on the element get a yellow "Custom" indicator. */
  .token-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    height: 26px;
    padding: 0 8px;
    border: 1px solid var(--cx-visual-border);
    border-radius: var(--cx-visual-radius);
    background: var(--cx-visual-input-bg);
    color: var(--cx-visual-fg);
    font-family: inherit;
    font-size: 11px;
    cursor: pointer;
    text-align: left;
    min-width: 0;
  }
  .token-chip:hover { border-color: var(--cx-visual-border-strong); background: var(--cx-visual-bg); }
  .token-chip:focus-visible {
    outline: 2px solid var(--cx-visual-accent);
    outline-offset: 1px;
  }
  .token-chip-value {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
  }
  .token-chip-hint {
    color: var(--cx-visual-fg-2);
    font-size: 10.5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex-shrink: 1;
    min-width: 0;
  }
  .token-chip-chev {
    display: inline-flex;
    color: var(--cx-visual-fg-muted);
    flex-shrink: 0;
  }
  /* Off-scale value: yellow rim + warning text — communicates the value
     exists but doesn't conform to the spacing/typography system. */
  .token-chip[data-scale="off"] {
    border-color: var(--cx-visual-warn-text);
    color: var(--cx-visual-warn-text);
    background: var(--cx-visual-warn-bg);
  }
  .token-chip[data-scale="off"] .token-chip-hint,
  .token-chip[data-scale="off"] .token-chip-chev {
    color: var(--cx-visual-warn-text);
  }

  /* Token picker (popover content) — fills whatever width the popover ends
     up with (set on .popover). Lower bound here prevents extreme shrink in
     case the popover ever gets sized smaller. */
  .token-picker {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    min-width: 160px;
  }
  .token-picker-head {
    font-size: 12px;
    font-weight: 700;
    color: var(--cx-visual-fg);
    padding-bottom: 4px;
    border-bottom: 1px solid var(--cx-visual-border);
  }
  .token-picker-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 320px;
    overflow-y: auto;
  }
  .token-picker-option {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border: 1px solid transparent;
    background: transparent;
    border-radius: var(--cx-visual-radius);
    font-family: inherit;
    font-size: 11px;
    color: var(--cx-visual-fg);
    cursor: pointer;
    text-align: left;
    width: 100%;
  }
  .token-picker-option:hover {
    background: var(--cx-visual-bg-2);
    border-color: var(--cx-visual-border);
  }
  .token-picker-option[data-active="true"] {
    background: var(--cx-visual-bg-focus);
    border-color: var(--cx-visual-accent);
    color: var(--cx-visual-accent);
  }
  /* Right-align so 1-digit and 2-digit values share a clean trailing edge.
     Width is the smallest that fits "999" — keeps the hint column flush
     left across all rows without stranding short numbers in a wide column. */
  .token-picker-value {
    font-weight: 700;
    flex-shrink: 0;
    width: 22px;
    text-align: right;
  }
  /* String-labelled presets (Shadow / Stroke style / etc.) — labels need
     natural width, no right-aligned numeric column. */
  .token-picker--preset .token-picker-value {
    width: auto;
    min-width: 0;
    text-align: left;
  }
  .token-picker-hint {
    color: var(--cx-visual-fg-2);
    font-size: 10.5px;
  }
  .token-picker-option[data-active="true"] .token-picker-hint {
    color: var(--cx-visual-accent);
  }
  .token-picker-clear {
    border: 1px dashed var(--cx-visual-border-strong);
    background: transparent;
    color: var(--cx-visual-fg-2);
    font-family: inherit;
    font-size: 11px;
    border-radius: var(--cx-visual-radius);
    padding: 5px 8px;
    cursor: pointer;
  }
  .token-picker-clear:hover {
    color: var(--cx-visual-fg);
    border-style: solid;
    background: var(--cx-visual-bg-2);
  }
  .token-picker-note {
    background: var(--cx-visual-warn-bg);
    color: var(--cx-visual-warn-text);
    border-radius: var(--cx-visual-radius);
    padding: 6px 8px;
    font-size: 11px;
    line-height: 1.4;
  }

  /* Typography option — left-side "Aa" preview rendered with the actual token
     so the picker reads like a real specimen, not a list of names. */
  .typo-list {
    gap: 4px;
  }
  .typo-option {
    align-items: flex-start;
  }
  .typo-option-sample {
    flex-shrink: 0;
    width: 40px;
    text-align: center;
    color: var(--cx-visual-fg);
    line-height: 1;
    /* The inline 'font' on this element is set per-token via JS so each row
       previews its own typography. */
  }
  .typo-option-meta {
    display: flex;
    flex-direction: column;
    gap: 1px;
    flex: 1;
    min-width: 0;
  }
  .token-chip-typo {
    /* Two-line layout when there is both label + spec. Tighter than a regular
       chip's single-line layout. */
    align-items: center;
  }

  /* ─── Tabs collection editor ─────────────────────────────────────────── */

  .tabs-edit-intro {
    font-size: 11px;
    color: var(--cx-visual-fg-2);
    line-height: 1.4;
    margin-bottom: 4px;
  }
  .tabs-edit-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .tabs-edit-empty {
    font-size: 11px;
    color: var(--cx-visual-fg-muted);
    padding: 8px;
    background: var(--cx-visual-bg-2);
    border: 1px dashed var(--cx-visual-border-strong);
    border-radius: var(--cx-visual-radius);
    text-align: center;
  }
  /* Row layout: [radio] [label input ...flex] [↑] [↓] [✕] */
  .tabs-edit-row {
    display: grid;
    grid-template-columns: 18px 1fr 22px 22px 22px;
    gap: 4px;
    align-items: center;
  }
  .tabs-edit-radio {
    accent-color: var(--cx-visual-accent);
    width: 14px;
    height: 14px;
    cursor: pointer;
    margin: 0 2px;
  }
  .tabs-edit-input {
    height: 26px;
    padding: 0 8px;
    border: 1px solid var(--cx-visual-border);
    border-radius: var(--cx-visual-radius);
    background: var(--cx-visual-input-bg);
    font-family: inherit;
    font-size: 11px;
    color: var(--cx-visual-fg);
    min-width: 0;
  }
  .tabs-edit-input:focus {
    outline: none;
    border-color: var(--cx-visual-accent);
    background: var(--cx-visual-bg);
  }
  .tabs-edit-move,
  .tabs-edit-delete {
    border: 1px solid transparent;
    background: transparent;
    color: var(--cx-visual-fg-muted);
    border-radius: 4px;
    height: 22px;
    padding: 0;
    font-family: inherit;
    font-size: 11px;
    cursor: pointer;
  }
  .tabs-edit-move:hover:not(:disabled),
  .tabs-edit-delete:hover {
    background: var(--cx-visual-bg-hover);
    color: var(--cx-visual-fg);
  }
  .tabs-edit-delete:hover {
    color: var(--cx-visual-error);
  }
  .tabs-edit-move:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .tabs-edit-add {
    margin-top: 6px;
    width: 100%;
    height: 28px;
    border: 1px dashed var(--cx-visual-border-strong);
    background: transparent;
    color: var(--cx-visual-fg-2);
    border-radius: var(--cx-visual-radius);
    font-family: inherit;
    font-size: 11px;
    cursor: pointer;
  }
  .tabs-edit-add:hover {
    color: var(--cx-visual-accent);
    border-color: var(--cx-visual-accent);
    border-style: solid;
    background: var(--cx-visual-bg-focus);
  }

  /* ─── State toggles (per-component booleans) ─────────────────────────── */

  /* Two-column grid of small checkboxes — disabled / loading / readonly /
     error / etc. Each component declares which states it supports in
     controls/states.ts. */
  .states-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 12px;
  }
  .state-row {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--cx-visual-fg);
    cursor: pointer;
    user-select: none;
  }
  .state-checkbox {
    accent-color: var(--cx-visual-accent);
    width: 14px;
    height: 14px;
    cursor: pointer;
  }
  .state-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ─── Design-system presets ───────────────────────────────────────────── */

  /* One-click recipes that bundle surface + border + radius + padding tokens
     per the cx-ds-qa surface-hierarchy rule. Buttons are sized to fit two
     per row at the panel's 320px width. */
  .ds-preset-intro {
    font-size: 11px;
    color: var(--cx-visual-fg-2);
    line-height: 1.4;
    margin-bottom: 4px;
  }
  .ds-preset-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .ds-preset-btn {
    height: 30px;
    padding: 0 8px;
    border: 1px solid var(--cx-visual-border);
    background: var(--cx-visual-bg-2);
    color: var(--cx-visual-fg);
    border-radius: var(--cx-visual-radius);
    font-family: inherit;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    text-align: left;
  }
  .ds-preset-btn:hover {
    background: var(--cx-visual-bg);
    border-color: var(--cx-visual-accent);
    color: var(--cx-visual-accent);
  }
  .ds-preset-btn--ghost {
    grid-column: 1 / -1;
    background: transparent;
    border-style: dashed;
    border-color: var(--cx-visual-border-strong);
    color: var(--cx-visual-fg-2);
    font-weight: 500;
    text-align: center;
  }
  .ds-preset-btn--ghost:hover {
    color: var(--cx-visual-error);
    border-color: var(--cx-visual-error);
    background: transparent;
  }

  /* ─── Auto layout section (Figma-style) ──────────────────────────────── */

  /* Direction picker — 4-icon segmented at top of the section. */
  .auto-direction {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    background: var(--cx-visual-bg-2);
    border: 1px solid var(--cx-visual-border);
    border-radius: var(--cx-visual-radius);
    padding: 2px;
  }
  .auto-dir-btn {
    height: 26px;
    border: 1px solid transparent;
    background: transparent;
    border-radius: 4px;
    color: var(--cx-visual-fg-2);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }
  .auto-dir-btn:hover {
    background: var(--cx-visual-bg);
    color: var(--cx-visual-fg);
  }
  .auto-dir-btn[data-active="true"] {
    background: var(--cx-visual-bg);
    border-color: var(--cx-visual-border-strong);
    color: var(--cx-visual-fg);
  }
  .auto-dir-btn svg {
    width: 16px;
    height: 16px;
  }

  /* Size row: label + input + inline mode pill (Fixed / Hug / Fill). */
  .auto-size {
    display: grid;
    grid-template-columns: 14px 1fr 56px;
    gap: 6px;
    align-items: center;
  }
  .auto-size-label {
    font-family: 'Inconsolata', ui-monospace, monospace;
    font-size: 11px;
    color: var(--cx-visual-fg-2);
    text-align: center;
  }
  .auto-size-input {
    height: 26px;
    padding: 0 8px;
    border: 1px solid var(--cx-visual-border);
    border-radius: var(--cx-visual-radius);
    background: var(--cx-visual-input-bg);
    font-family: inherit;
    font-size: 11px;
    color: var(--cx-visual-fg);
    width: 100%;
    min-width: 0;
  }
  .auto-size-input:focus {
    outline: none;
    border-color: var(--cx-visual-accent);
    background: var(--cx-visual-bg);
  }
  .auto-size-pill {
    height: 26px;
    border: 1px solid var(--cx-visual-border);
    border-radius: var(--cx-visual-radius);
    background: var(--cx-visual-input-bg);
    color: var(--cx-visual-fg-2);
    font-size: 10.5px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    padding: 0 6px;
  }
  .auto-size-pill:hover { background: var(--cx-visual-bg); color: var(--cx-visual-fg); }
  .auto-size-pill[data-mode="fill"] {
    background: var(--cx-visual-bg-focus);
    border-color: var(--cx-visual-accent);
    color: var(--cx-visual-accent);
  }

  /* Alignment 9-dot grid. Each dot is a clickable area; the dots themselves
     scale up + turn green on hover/active. */
  .auto-align-row {
    display: grid;
    grid-template-columns: 80px 1fr;
    gap: 8px;
    align-items: center;
  }
  .align-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
    width: 78px;
    height: 78px;
    background: var(--cx-visual-bg-2);
    border: 1px solid var(--cx-visual-border);
    border-radius: var(--cx-visual-radius);
    padding: 6px;
    gap: 0;
  }
  .align-dot {
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .align-dot::before {
    content: '';
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--cx-visual-fg-muted);
  }
  .align-dot:hover::before {
    background: var(--cx-visual-fg-2);
  }
  .align-dot[data-active="true"]::before {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--cx-visual-accent);
  }

  .auto-gap {
    display: flex;
    align-items: center;
  }

  /* Padding row: combined H/V (default) or individual 4-cell grid, with a
     mode-toggle icon button on the right. */
  .auto-padding {
    display: grid;
    grid-template-columns: 1fr 1fr 26px;
    gap: 6px;
    align-items: stretch;
  }
  .auto-padding > .auto-pad-grid {
    grid-column: 1 / span 2;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
  }
  .auto-pad-cell {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
  }
  .auto-pad-icon {
    display: inline-flex;
    color: var(--cx-visual-fg-muted);
    flex-shrink: 0;
  }
  .auto-pad-icon svg { width: 14px; height: 14px; }
  .auto-pad-mini-label {
    font-family: 'Inconsolata', ui-monospace, monospace;
    font-size: 10px;
    color: var(--cx-visual-fg-muted);
    width: 10px;
    text-align: center;
    flex-shrink: 0;
  }
  .auto-pad-mode {
    border: 1px solid var(--cx-visual-border);
    background: var(--cx-visual-bg-2);
    border-radius: var(--cx-visual-radius);
    color: var(--cx-visual-fg-2);
    cursor: pointer;
    width: 26px;
    height: 26px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .auto-pad-mode:hover { background: var(--cx-visual-bg); color: var(--cx-visual-fg); }
  .auto-pad-mode svg { width: 14px; height: 14px; }

  /* Opacity row — slider + numeric input + percent label, side by side. The
     slider gets the bulk of the width; numeric is a narrow pill on the right
     so designers can type an exact value without hunting on the slider. */
  .opacity-row {
    display: grid;
    grid-template-columns: 1fr 36px auto;
    gap: 6px;
    align-items: center;
  }
  .opacity-slider {
    width: 100%;
    accent-color: var(--cx-visual-accent);
    height: 26px;
    margin: 0;
  }
  .opacity-numeric {
    width: 100%;
    height: 26px;
    padding: 0 6px;
    border: 1px solid var(--cx-visual-border);
    border-radius: var(--cx-visual-radius);
    background: var(--cx-visual-input-bg);
    font-family: inherit;
    font-size: 11px;
    color: var(--cx-visual-fg);
    text-align: center;
  }
  .opacity-numeric:focus {
    outline: none;
    border-color: var(--cx-visual-accent);
    background: var(--cx-visual-bg);
  }
  .opacity-pct {
    font-size: 11px;
    color: var(--cx-visual-fg-muted);
  }

  /* Clip-content checkbox row */
  .auto-clip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--cx-visual-fg);
    cursor: pointer;
    user-select: none;
  }
  .auto-clip-checkbox {
    accent-color: var(--cx-visual-accent);
    width: 14px;
    height: 14px;
    cursor: pointer;
  }

  /* ─── Figma-style padding control ─────────────────────────────────────────
     Mirrors Figma's auto-layout padding pattern. In the default *combined*
     mode the user sees just two inputs — horizontal (left+right) and
     vertical (top+bottom) — each prefixed with a tiny side-icon that hints
     at which physical sides it drives. A small mode-toggle on the right
     flips to *individual* mode, where the same two-column layout grows
     into a 2×2 grid of T/R/B/L inputs (each with its own side-icon). The
     mode toggle is visually active (accent fill) when individual mode is
     on, so designers always know which mode they're in. */
  .figma-pad {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: var(--cx-visual-s2);
    align-items: stretch;
  }
  .figma-pad[data-mode="individual"] { align-items: start; }
  .figma-pad-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--cx-visual-s2);
    grid-column: 1 / span 2;
  }
  .figma-pad-cell {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 28px;
    padding: 0 8px;
    border: 1px solid var(--cx-visual-border);
    border-radius: var(--cx-visual-radius);
    background: var(--cx-visual-figma-pad-bg);
    color: var(--cx-visual-fg);
    font-family: inherit;
    font-size: 12px;
    cursor: pointer;
    min-width: 0;
    text-align: left;
  }
  /* Full-width variant used by single-value token inputs (Radius, Gap)
     that live as the right column of a .two-col row, so the cell fills
     the available width instead of shrinking to its content. */
  .token-pick-cell {
    display: flex;
    width: 100%;
  }
  .figma-pad-cell:hover {
    border-color: var(--cx-visual-border-strong);
    background: var(--cx-visual-bg-hover);
  }
  .figma-pad-cell[data-scale="off"] { color: var(--cx-visual-warn-text); }
  .figma-pad-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--cx-visual-fg-muted);
    flex-shrink: 0;
    width: 14px;
    height: 14px;
  }
  .figma-pad-icon svg { width: 14px; height: 14px; display: block; }
  .figma-pad-cell:hover .figma-pad-icon { color: var(--cx-visual-fg-2); }
  .figma-pad-value {
    flex: 1;
    min-width: 0;
    font-weight: 500;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .figma-pad-mode {
    width: 28px;
    height: 28px;
    border: 1px solid var(--cx-visual-border);
    border-radius: var(--cx-visual-radius);
    background: transparent;
    color: var(--cx-visual-fg-muted);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    flex-shrink: 0;
  }
  .figma-pad-mode:hover {
    border-color: var(--cx-visual-border-strong);
    background: var(--cx-visual-bg-hover);
    color: var(--cx-visual-fg);
  }
  .figma-pad-mode[data-on="true"] {
    background: var(--cx-visual-bg-focus);
    color: var(--cx-visual-accent);
  }
  .figma-pad-mode svg { width: 14px; height: 14px; display: block; }
  .spacing-block { display: flex; flex-direction: column; gap: var(--cx-visual-s1); }

  /* Slider */
  .gap-slider {
    width: 100%;
    accent-color: var(--cx-visual-accent);
  }

  /* Chips list */
  .chip-list {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    background: var(--cx-visual-bg-2);
    color: var(--cx-visual-fg-2);
    border: 1px solid var(--cx-visual-border);
    border-radius: 3px;
    padding: 1px 5px;
    font-size: 10px;
    font-family: ui-monospace, monospace;
  }
  .chip.tw { color: var(--cx-visual-syntax-tw); } /* tailwind purple — non-brand syntax tint */
  .chip.cxl { color: var(--cx-visual-accent); }

  .hint {
    color: var(--cx-visual-fg-muted);
    font-size: 11px;
  }

  /* Icon row + picker */
  .icon-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .icon-preview {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--cx-visual-border);
    border-radius: 5px;
    background: var(--cx-visual-bg-2);
    color: var(--cx-visual-fg);
    flex-shrink: 0;
  }
  .icon-preview svg { width: 16px; height: 16px; }
  .icon-name {
    flex: 1;
    font-family: ui-monospace, monospace;
    font-size: 11px;
    color: var(--cx-visual-fg-2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .icon-picker {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }
  /* Icon picker — vertical list (Figma "Swap instance" pattern). Each row
     has a small thumbnail + the icon name, instead of an icons-only grid
     where each thumbnail filled the popover width. */
  .icon-grid {
    display: flex;
    flex-direction: column;
    gap: 1px;
    max-height: 50vh;
    overflow-y: auto;
  }
  .icon-cell {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 6px;
    border: 1px solid transparent;
    background: transparent;
    border-radius: var(--cx-visual-radius);
    cursor: pointer;
    color: var(--cx-visual-fg);
    text-align: left;
    font-family: inherit;
    font-size: 11px;
    width: 100%;
  }
  .icon-cell:hover {
    background: var(--cx-visual-bg-2);
    border-color: var(--cx-visual-border);
  }
  .icon-cell[data-active="true"] {
    background: var(--cx-visual-bg-focus);
    border-color: var(--cx-visual-accent);
    color: var(--cx-visual-accent);
  }
  .icon-cell-svg {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    border: 1px solid var(--cx-visual-border);
    border-radius: 4px;
    background: var(--cx-visual-bg-2);
    color: var(--cx-visual-fg);
    padding: 3px;
  }
  .icon-cell-svg svg { width: 100%; height: 100%; display: block; }

  /* "Inside" drill-in list — slots + nested DS components. Each row is a
     borderless button that selects the corresponding element on click. */
  .drill-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .drill-row {
    appearance: none;
    border: 0;
    background: transparent;
    color: var(--cx-visual-fg);
    font: inherit;
    text-align: left;
    padding: 6px 8px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
  }
  .drill-row:hover { background: var(--cx-visual-bg-hover); }
  .drill-row-icon {
    color: var(--cx-visual-accent);
    width: 12px;
    flex-shrink: 0;
    text-align: center;
  }
  .drill-row-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .drill-row-meta {
    font-family: 'Inconsolata', ui-monospace, monospace;
    font-size: 10px;
    color: var(--cx-visual-fg-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 50%;
  }
  .icon-cell[data-active="true"] .icon-cell-svg {
    border-color: var(--cx-visual-accent);
    color: var(--cx-visual-accent);
  }
  .icon-cell-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  /* DS-mode component header (Figma library-instance style) */
  .comp-header {
    padding: 10px 12px;
    border-bottom: 1px solid var(--cx-visual-border);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .comp-name {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--cx-visual-fg);
  }
  .comp-name-icon {
    color: var(--cx-visual-accent);
  }

  /* Component swap — turns the component name into a clickable picker so
     designers can convert Badge → Pill, Tag → Chip, etc. without re-typing
     classes. Visually a borderless link with a chevron, hover reveals a
     subtle background to signal the affordance. */
  .comp-swap {
    appearance: none;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    padding: 2px 6px;
    margin: -2px -6px;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
  }
  .comp-swap:hover {
    background: var(--cx-visual-bg-hover);
  }
  .comp-swap-chev {
    color: var(--cx-visual-fg-muted);
    display: inline-flex;
    align-items: center;
  }

  .swap-picker {
    width: 220px;
    max-height: 360px;
    display: flex;
    flex-direction: column;
  }
  .swap-list {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding: 4px;
  }
  .swap-row {
    appearance: none;
    border: 0;
    background: transparent;
    color: var(--cx-visual-fg);
    font: inherit;
    text-align: left;
    padding: 6px 8px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .swap-row:hover { background: var(--cx-visual-bg-hover); }
  .swap-row[data-active="true"] {
    background: var(--cx-visual-bg-hover);
    color: var(--cx-visual-accent);
  }
  .swap-row-name { font-weight: 600; }
  .swap-row-meta {
    font-family: 'Inconsolata', ui-monospace, monospace;
    font-size: 10px;
    color: var(--cx-visual-fg-muted);
  }

  .comp-lib {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--cx-visual-fg-muted);
  }

  /* Two-col control row → label left, control right (Figma pattern) */
  .fsection-body .two-col {
    display: grid;
    grid-template-columns: 64px 1fr;
    gap: 6px;
    align-items: center;
  }
  .fsection-body .two-col .control-label {
    margin-bottom: 0;
    color: var(--cx-visual-fg-2);
    font-size: 11px;
  }

  /* Properties' axis rows wrap in .variant-rows. Without explicit gap they
     stack flush; flex w/ 8px gap matches the rhythm of every other section. */
  .variant-rows {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* Variant select picks up the standard select styling */
  .variant-select {
    width: 100%;
  }

  /* Variant chip grid — used in the Properties section */
  .variant-axis {
    margin-bottom: 2px;
  }
  .variant-axis-header {
    font-size: 11px;
    color: var(--cx-visual-fg-2);
    text-transform: none;
    letter-spacing: 0;
    margin-bottom: 6px;
  }
  .variant-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .variant-chip {
    font-size: var(--cx-visual-t-sm);
    padding: 2px var(--cx-visual-s3);
    border-radius: 999px;
    border: 1px solid var(--cx-visual-border);
    background: var(--cx-visual-bg);
    color: var(--cx-visual-fg);
    cursor: pointer;
    white-space: nowrap;
    font-family: inherit;
    line-height: 1.6;
  }
  .variant-chip:hover {
    background: var(--cx-visual-bg-2);
    border-color: var(--cx-visual-border-strong);
  }
  .variant-chip:active {
    transform: translateY(0.5px);
  }
  .variant-chip[data-active="true"] {
    background: var(--cx-visual-accent);
    color: #fff;
    border-color: var(--cx-visual-accent);
    box-shadow: var(--cx-visual-shadow-sm);
  }
  .variant-chip[data-active="true"]:hover {
    background: var(--cx-visual-accent);
    filter: brightness(1.05);
  }

  /* Boolean axis: pill toggle (Off / ● / On). Uses prop-toggle-* prefix to
     avoid colliding with the panel's existing .toggle-btn floating trigger. */
  .prop-toggle-row {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 26px;
  }
  .prop-toggle-label {
    font-size: 11px;
    color: var(--cx-visual-fg-2);
    user-select: none;
  }
  .prop-toggle {
    position: relative;
    display: inline-block;
    width: 32px;
    height: 18px;
    flex-shrink: 0;
    cursor: pointer;
    justify-self: end;
  }
  .prop-toggle input {
    opacity: 0;
    width: 0;
    height: 0;
    position: absolute;
  }
  .prop-toggle-track {
    position: absolute;
    inset: 0;
    background: var(--cx-visual-border-strong);
    border-radius: 9px;
    transition: background 0.15s;
  }
  .prop-toggle input:checked ~ .prop-toggle-track {
    background: var(--cx-visual-accent);
  }
  .prop-toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    background: white;
    border-radius: 50%;
    transition: transform 0.15s;
    pointer-events: none;
  }
  .prop-toggle input:checked ~ .prop-toggle-track .prop-toggle-thumb {
    transform: translateX(14px);
  }
  .prop-toggle:focus-within .prop-toggle-track {
    outline: 2px solid var(--cx-visual-accent);
    outline-offset: 1px;
  }

  /* Inline text editor for button labels and other string content. */
  .text-input {
    width: 100%;
    height: 28px;
    padding: 0 8px;
    background: var(--cx-visual-input-bg);
    border: 1px solid var(--cx-visual-border);
    border-radius: var(--cx-visual-radius);
    color: var(--cx-visual-fg);
    font-size: 12px;
    font-family: inherit;
    outline: none;
    box-sizing: border-box;
  }
  .text-input:hover { border-color: var(--cx-visual-border-strong); background: var(--cx-visual-bg-hover); }
  .text-input:focus {
    border-color: var(--cx-visual-accent);
    background: var(--cx-visual-bg);
  }
  .text-input::placeholder { color: var(--cx-visual-fg-muted); }
  /* Suppress native number spinners — the scrub handle is the numeric affordance. */
  .text-input::-webkit-outer-spin-button,
  .text-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  .text-input[type="number"] { appearance: textfield; -moz-appearance: textfield; }

  /* Icon trigger — looks like a select but opens a popover. Visually identical
     to .mini-input dimensions. */
  .icon-trigger {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    height: 28px;
    background: var(--cx-visual-input-bg);
    border: 1px solid var(--cx-visual-border);
    border-radius: var(--cx-visual-radius);
    padding: 0 8px;
    cursor: pointer;
    font-family: inherit;
    font-size: 12px;
    color: var(--cx-visual-fg);
    text-align: left;
  }
  .icon-trigger:hover { border-color: var(--cx-visual-border-strong); background: var(--cx-visual-bg-hover); }
  .icon-trigger-preview {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
  .icon-trigger-preview svg { width: 14px; height: 14px; }
  .icon-trigger-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .icon-trigger-chev {
    display: inline-flex;
    color: var(--cx-visual-fg-muted);
    flex-shrink: 0;
  }
  /* Inline notice (Brainy yellow tag tokens). */
  .convert-notice {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    padding: 6px 8px;
    background: var(--cx-visual-warn-bg);
    border: 1px solid var(--cx-visual-border);
    border-radius: var(--cx-visual-radius);
    font-size: 11px;
    line-height: 1.4;
  }
  .convert-notice-tag {
    background: var(--cx-visual-bg);
    border-radius: 3px;
    padding: 1px 6px;
    font-weight: 700;
    color: var(--cx-visual-warn-text);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .convert-notice-text {
    color: var(--cx-visual-warn-text);
  }
  .convert-notice-text code {
    background: var(--cx-visual-bg-hover);
    border-radius: 2px;
    padding: 0 3px;
    font-family: 'Inconsolata', ui-monospace, monospace;
    font-size: 10.5px;
    color: var(--cx-visual-warn-text);
  }

  /* Escape hatch — ghost link, low visual weight (Brainy cxl-btn--link). */
  .escape-link {
    margin: 4px 12px 12px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--cx-visual-fg-2);
    cursor: pointer;
    font-family: inherit;
    font-size: 11px;
    text-align: left;
    text-decoration: underline;
    text-decoration-style: dotted;
    text-decoration-color: var(--cx-visual-border-strong);
    text-underline-offset: 3px;
  }
  .escape-link:hover {
    color: var(--cx-visual-accent);
    text-decoration-color: var(--cx-visual-accent);
  }

  /* Popover layer + popover */
  .popover-layer {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    display: none;
    pointer-events: none;
  }
  .popover-overlay {
    position: absolute;
    inset: 0;
    pointer-events: auto;
  }
  .popover {
    position: absolute;
    /* Popover hugs its content. Lower bound keeps short pickers (radius,
       spacing) readable; upper bound prevents the swatch picker from going
       wider than the panel. */
    width: max-content;
    min-width: 200px;
    max-width: 320px;
    max-height: 70vh;
    overflow-y: auto;
    background: var(--cx-visual-bg);
    border: 1px solid var(--cx-visual-border-strong);
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08);
    padding: 10px;
    pointer-events: auto;
  }

  /* Swatch picker (inside popover) */
  .swatch-picker { display: flex; flex-direction: column; gap: 8px; }
  .swatch-picker-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    font-weight: 600;
    color: var(--cx-visual-fg);
  }
  .swatch-picker-heading { color: var(--cx-visual-fg); }
  .swatch-picker-sub {
    font-size: 11px;
    color: var(--cx-visual-fg-muted);
    font-family: ui-monospace, monospace;
    background: var(--cx-visual-bg-2);
    border: 1px solid var(--cx-visual-border);
    border-radius: 4px;
    padding: 4px 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .swatch-picker-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .swatch-cat {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .swatch-cat-heading {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    color: var(--cx-visual-fg);
    text-transform: capitalize;
  }
  .swatch-cat-count {
    font-size: 10px;
    color: var(--cx-visual-fg-muted);
    background: var(--cx-visual-bg-2);
    border-radius: 3px;
    padding: 0 5px;
    font-weight: 500;
  }
  .swatch-picker-clear {
    background: transparent;
    border: none;
    font-family: inherit;
    color: var(--cx-visual-fg-muted);
    font-size: 11px;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 3px;
  }
  .swatch-picker-clear:hover {
    background: var(--cx-visual-bg-2);
    color: var(--cx-visual-fg);
  }
  .swatch-picker-search {
    width: 100%;
    padding: 5px 8px;
    border: 1px solid var(--cx-visual-border);
    border-radius: 5px;
    font-size: 11px;
    font-family: inherit;
    background: var(--cx-visual-bg-2);
  }
  .swatch-picker-search:focus {
    outline: none;
    border-color: var(--cx-visual-accent);
    background: white;
  }
  .swatch-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
  }
  .swatch {
    /* Geometry is locked: same border-width at rest, on hover, when
       active, and on focus. The only thing that changes between states
       is the *colour* of that border. No outline, no box-shadow, no
       z-index, no UA button rendering — that's the only way to truly
       guarantee the swatch never resizes when the cursor or selection
       moves over it. The active state is distinguished from hover by
       an inner dot (drawn via inset shadow on background, doesn't grow
       the box). */
    position: relative;
    appearance: none;
    -webkit-appearance: none;
    margin: 0;
    width: 100%;
    aspect-ratio: 1;
    border: 2px solid var(--cx-visual-border);
    border-radius: 4px;
    cursor: pointer;
    padding: 0;
    background-clip: padding-box;
  }
  .swatch:focus { outline: none; }
  .swatch:hover {
    /* Subtle darken on hover so it stays distinct from the green selected
       state without competing with it. */
    border-color: var(--cx-visual-border-strong);
  }
  .swatch[data-active="true"] {
    /* Single accent border marks the selected swatch — no inner ring (that
       read as a double border). Geometry is unchanged (same 2px width). */
    border-color: var(--cx-visual-accent);
  }
  /* Off-scale marker: the current token is outside the role-narrowed set
     (e.g., a surface-* token applied as text colour). We keep showing it
     so the picker reflects reality, but flag it with a small badge tinted
     by the DS warning text token. */
  .swatch[data-offscale="true"]::after {
    content: 'OFF';
    position: absolute;
    bottom: -3px;
    right: -3px;
    font-size: 8px;
    font-weight: 700;
    background: var(--c-text-warning);
    color: var(--c-background-warning);
    padding: 1px 3px;
    border-radius: 3px;
    pointer-events: none;
  }
  /* Off-scale closed-chip indicator. Mirrors the popover swatch badge so the
     same value isn't rendered as a custom hex when the popover is closed. */
  .color-chip[data-offscale="true"] .color-chip-label::after {
    content: '·OFF';
    margin-left: 4px;
    color: var(--c-text-warning);
    font-weight: 700;
    font-size: 10px;
  }

  /* Dismissable warning banner — shown when a primitive picked inside a cxui
     ancestor still gets visual controls. Same DS warning tokens as the OFF
     badge above so the colour story stays consistent. */
  .cx-visual-banner {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 12px;
    background: var(--c-background-warning);
    color: var(--c-text-warning);
    font-size: 11px;
    line-height: 1.4;
    border-radius: 6px;
    margin: 8px 12px;
  }
  .cx-visual-banner-close {
    background: transparent;
    border: 0;
    color: inherit;
    font-size: 16px;
    line-height: 1;
    padding: 0 4px;
    cursor: pointer;
    opacity: 0.7;
  }
  .cx-visual-banner-close:hover {
    opacity: 1;
  }

  /* Empty state rendered in place of any sections when the selection is
     blocked (chart/graph or descendant). Single-purpose: explain why no
     controls are present and where edits should happen instead. */
  .cx-visual-empty-state {
    padding: 24px 16px;
    text-align: center;
    color: var(--c-text-secondary);
  }
  .cx-visual-empty-state-icon {
    font-size: 24px;
    margin-bottom: 8px;
  }
  .cx-visual-empty-state-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--c-text-primary);
    margin-bottom: 6px;
  }
  .cx-visual-empty-state-body {
    font-size: 11px;
    line-height: 1.5;
  }
  /* Action row below the empty-state body. The blocked-state can render
     two actions side-by-side (Copy prompt + Jump out); the uncataloged
     state renders one (Jump to parent). flex-wrap keeps narrow panels OK. */
  .cx-visual-empty-state-actions {
    margin-top: 12px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }
  .cx-visual-empty-state-action {
    margin-top: 12px;
    padding: 6px 12px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 6px;
    border: 1px solid var(--cx-visual-border);
    background: transparent;
    color: var(--cx-visual-fg);
    cursor: pointer;
  }
  /* When wrapped in .cx-visual-empty-state-actions the parent owns the top
     margin, so reset the per-button margin to keep gaps even. */
  .cx-visual-empty-state-actions .cx-visual-empty-state-action {
    margin-top: 0;
  }
  /* Primary action variant — used for the Copy-prompt button so it reads
     as the recommended next step. Subtle accent tint rather than a full
     solid fill, to match the muted empty-state aesthetic. */
  .cx-visual-empty-state-action-primary {
    border-color: var(--cx-visual-accent);
    background: color-mix(in srgb, var(--cx-visual-accent) 10%, transparent);
    color: var(--cx-visual-accent);
  }
  .cx-visual-empty-state-action:hover:not(:disabled) {
    background: var(--cx-visual-bg-hover);
  }
  .cx-visual-empty-state-action-primary:hover:not(:disabled) {
    background: color-mix(in srgb, var(--cx-visual-accent) 18%, transparent);
  }
  .cx-visual-empty-state-action:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Swatch hover tooltip — viewport-fixed pill with a tiny arrow that
     points back at the source swatch. JS positions via left/top in
     viewport coords; the translate centers the pill and lifts it above
     the row. Hardcoded dark background reads cleanly in both light and
     dark modes (Apple-style floating chrome). */
  .swatch-tooltip {
    position: fixed;
    background: #1d1d1f;
    color: white;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10.5px;
    padding: 4px 8px;
    border-radius: 4px;
    pointer-events: none;
    white-space: nowrap;
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    transform: translate(-50%, calc(-100% - 8px));
    z-index: 2147483647;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
    /* Brief fade-in so the tooltip doesn't blink between swatches. */
    animation: cx-visual-tip-fade-in 80ms ease-out both;
  }
  @keyframes cx-visual-tip-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .swatch-tooltip::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: -4px;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: #1d1d1f;
  }
  /* Below-placement variant — sits under the anchor with the arrow on top. */
  .swatch-tooltip.tip-below {
    transform: translate(-50%, 8px);
  }
  .swatch-tooltip.tip-below::after {
    bottom: auto;
    top: -4px;
    border-top-color: transparent;
    border-bottom-color: #1d1d1f;
  }

  /* Quiet, non-alarming note (e.g. cxui layout is design-system-owned). Muted
     text + a thin top separator — deliberately NOT a warning box, so it doesn't
     read as another error among the notices. */
  .ds-locked-note {
    margin: 0 12px;
    padding: 10px 0 2px;
    font-size: 11px;
    line-height: 1.45;
    color: var(--cx-visual-fg-muted);
  }
  /* Read-only mode (no window.ng) does NOT disable any control here: layout,
     color, content/icon, typography, sizing and spacing all edit the DOM
     directly and work without Angular dev tools — and Copy-prompt + Pick must
     stay live. The only Angular-bound editor is the cxui variant section, and
     it self-disables with its own "Angular component not found" notice. The
     .cx-visual-readonly class is kept solely to scope the informational banner. */

  /* Respect the OS "reduce motion" setting: drop the tooltip fade, the resize
     handle highlight, and neutralise the panel's transitions/animations. */
  @media (prefers-reduced-motion: reduce) {
    .swatch-tooltip { animation: none; }
    .root *,
    .toggle-btn,
    .resize-handle {
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
    }
  }
`;

export const outlineCss = /* css */ `
  /* Outline-layer tokens — declared on the layer's own root since the
     outline elements are NOT inside the panel's shadow DOM and don't
     inherit the panel's --cx-visual-* aliases. */
  :root {
    --cx-visual-outline-color: var(--c-text-interactive, #029449);
    --cx-visual-outline-color-hover: var(--c-border-interactive, rgba(2, 148, 73, 0.55));
  }
  .cx-visual-outline {
    position: fixed;
    pointer-events: none;
    border: 2px solid var(--cx-visual-outline-color);
    border-radius: 2px;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.6) inset;
    z-index: 2147483645;
  }
  .cx-visual-outline[data-mode="hover"] {
    border-color: var(--cx-visual-outline-color-hover);
    border-style: dashed;
    opacity: 0.7;
  }
  .cx-visual-label {
    position: fixed;
    pointer-events: none;
    background: var(--cx-visual-outline-color);
    color: white;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 3px;
    z-index: 2147483646;
    white-space: nowrap;
    max-width: 320px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  /* Spacing-hover overlay — magenta diagonal-stripe bands shown over the
     picked element while the user hovers a padding / margin input in the
     panel. Each band fills the actual padding (inside the element) or
     margin (outside) region for the side it represents, so designers see
     exactly where the value will land before they pick. */
  .cx-visual-spacing-band {
    position: fixed;
    pointer-events: none;
    z-index: 2147483645;
    background-color: rgba(236, 70, 156, 0.30);
    background-image: repeating-linear-gradient(
      -45deg,
      rgba(236, 70, 156, 0.55) 0,
      rgba(236, 70, 156, 0.55) 3px,
      rgba(236, 70, 156, 0.25) 3px,
      rgba(236, 70, 156, 0.25) 6px
    );
    display: none;
  }
  .cx-visual-spacing-band[data-on="true"] { display: block; }

  /* Floating "Esc to cancel" pill that follows the cursor while picking.
     Designers couldn't tell what to press to exit pick mode without a
     visible affordance. */
  .cx-visual-cursor-badge {
    position: fixed;
    pointer-events: none;
    background: #1d1d1f;
    color: white;
    font-family: 'Nunito Sans', -apple-system, system-ui, sans-serif;
    font-size: 10px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 999px;
    z-index: 2147483647;
    white-space: nowrap;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
  }
`;
