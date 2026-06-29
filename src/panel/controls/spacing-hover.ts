// Spacing-hover overlay. Mirrors Figma's behaviour: when the user hovers a
// padding/margin input in the panel, a translucent magenta band lights up
// the corresponding physical region(s) on the picked element. The bands
// live in the host-page DOM (not the panel's shadow root) so they can be
// positioned absolutely on top of the element they describe.
//
// Padding bands sit INSIDE the element border-box (covering the actual
// padding); margin bands sit OUTSIDE (covering the actual margin area).
// Both modes use the same band markup — only the positioning maths differ.

export type SpacingKind = 'padding' | 'margin';
export type SpacingSide = 'top' | 'right' | 'bottom' | 'left';

let overlay: HTMLDivElement | null = null;
let bands: Record<SpacingSide, HTMLDivElement> | null = null;
// A flex/grid container can have many gaps (N-1 for N children), unlike
// padding/margin which are always four sides, so gap bands are a growable pool.
let gapBands: HTMLDivElement[] = [];
let activeEl: Element | null = null;
let frameHandle: number | null = null;

function ensureOverlay(): void {
  if (overlay) return;
  overlay = document.createElement('div');
  overlay.id = 'cx-visual-spacing-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483645;';
  const mk = (side: SpacingSide): HTMLDivElement => {
    const band = document.createElement('div');
    band.className = 'cx-visual-spacing-band';
    band.dataset.side = side;
    overlay!.appendChild(band);
    return band;
  };
  bands = { top: mk('top'), right: mk('right'), bottom: mk('bottom'), left: mk('left') };
  document.body.appendChild(overlay);
}

/**
 * Light up the padding/margin band(s) for `sides` on `el`. The overlay
 * stays in sync with the element's bounding rect via rAF until clearHover
 * fires — covers scrolling, layout shifts, etc.
 */
export function highlightSpacing(el: Element, kind: SpacingKind, sides: SpacingSide[]): void {
  ensureOverlay();
  activeEl = el;
  const sidesSet = new Set(sides);

  const update = () => {
    if (!activeEl || !bands) return;
    const rect = activeEl.getBoundingClientRect();
    const cs = window.getComputedStyle(activeEl);
    const v = {
      top: parseFloat(kind === 'padding' ? cs.paddingTop : cs.marginTop) || 0,
      right: parseFloat(kind === 'padding' ? cs.paddingRight : cs.marginRight) || 0,
      bottom: parseFloat(kind === 'padding' ? cs.paddingBottom : cs.marginBottom) || 0,
      left: parseFloat(kind === 'padding' ? cs.paddingLeft : cs.marginLeft) || 0,
    };

    for (const side of ['top', 'right', 'bottom', 'left'] as const) {
      const b = bands[side];
      if (!sidesSet.has(side) || v[side] <= 0) {
        b.dataset.on = 'false';
        continue;
      }
      b.dataset.on = 'true';
      const s = b.style;
      if (kind === 'padding') {
        // Inside the element border-box.
        if (side === 'top') {
          s.left = `${rect.left}px`;
          s.top = `${rect.top}px`;
          s.width = `${rect.width}px`;
          s.height = `${v.top}px`;
        } else if (side === 'bottom') {
          s.left = `${rect.left}px`;
          s.top = `${rect.bottom - v.bottom}px`;
          s.width = `${rect.width}px`;
          s.height = `${v.bottom}px`;
        } else if (side === 'left') {
          s.left = `${rect.left}px`;
          s.top = `${rect.top}px`;
          s.width = `${v.left}px`;
          s.height = `${rect.height}px`;
        } else {
          s.left = `${rect.right - v.right}px`;
          s.top = `${rect.top}px`;
          s.width = `${v.right}px`;
          s.height = `${rect.height}px`;
        }
      } else {
        // Outside the element border-box. The horizontal margins extend
        // the full element height; the vertical margins extend the full
        // element width PLUS the horizontal margins, to match Figma's
        // visualisation where you can see the four bands meet at corners.
        if (side === 'top') {
          s.left = `${rect.left - v.left}px`;
          s.top = `${rect.top - v.top}px`;
          s.width = `${rect.width + v.left + v.right}px`;
          s.height = `${v.top}px`;
        } else if (side === 'bottom') {
          s.left = `${rect.left - v.left}px`;
          s.top = `${rect.bottom}px`;
          s.width = `${rect.width + v.left + v.right}px`;
          s.height = `${v.bottom}px`;
        } else if (side === 'left') {
          s.left = `${rect.left - v.left}px`;
          s.top = `${rect.top}px`;
          s.width = `${v.left}px`;
          s.height = `${rect.height}px`;
        } else {
          s.left = `${rect.right}px`;
          s.top = `${rect.top}px`;
          s.width = `${v.right}px`;
          s.height = `${rect.height}px`;
        }
      }
    }
    if (activeEl) frameHandle = requestAnimationFrame(update);
  };

  // Cancel any existing rAF loop, then start fresh.
  if (frameHandle != null) cancelAnimationFrame(frameHandle);
  update();
}

/** Grow/reuse the gap-band pool, returning the i-th band. */
function gapBand(i: number): HTMLDivElement {
  while (gapBands.length <= i) {
    const b = document.createElement('div');
    b.className = 'cx-visual-spacing-band';
    b.dataset.side = 'gap';
    overlay!.appendChild(b);
    gapBands.push(b);
  }
  return gapBands[i];
}

/**
 * Light up the flex/grid gap(s) of `el`, mirroring how highlightSpacing lights
 * up padding — a band fills the empty space between each pair of adjacent
 * children, sized to their shared extent. The actual child geometry is read
 * (not the CSS gap value) so row, column, and grid layouts all work, and
 * stays in sync via rAF until clearSpacingHighlight fires.
 */
export function highlightGap(el: Element): void {
  ensureOverlay();
  activeEl = el;

  const update = () => {
    if (!activeEl) return;
    const kids = Array.from((activeEl as HTMLElement).children).filter(c => {
      const ccs = window.getComputedStyle(c);
      return ccs.display !== 'none' && ccs.position !== 'absolute' && ccs.position !== 'fixed';
    });

    let n = 0;
    for (let i = 0; i < kids.length - 1; i++) {
      const a = kids[i].getBoundingClientRect();
      const b = kids[i + 1].getBoundingClientRect();
      const vOverlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      const hOverlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const hGap = b.left - a.right; // horizontal space → row layout
      const vGap = b.top - a.bottom; // vertical space → column layout

      let rect: { left: number; top: number; width: number; height: number } | null = null;
      if (hGap > 0.5 && vOverlap > 0) {
        rect = { left: a.right, top: Math.max(a.top, b.top), width: hGap, height: vOverlap };
      } else if (vGap > 0.5 && hOverlap > 0) {
        rect = { left: Math.max(a.left, b.left), top: a.bottom, width: hOverlap, height: vGap };
      }
      if (!rect) continue;

      const band = gapBand(n++);
      band.dataset.on = 'true';
      band.style.left = `${rect.left}px`;
      band.style.top = `${rect.top}px`;
      band.style.width = `${rect.width}px`;
      band.style.height = `${rect.height}px`;
    }
    // Hide any bands left over from a previous, larger layout.
    for (let j = n; j < gapBands.length; j++) gapBands[j].dataset.on = 'false';

    if (activeEl) frameHandle = requestAnimationFrame(update);
  };

  if (frameHandle != null) cancelAnimationFrame(frameHandle);
  update();
}

export function clearSpacingHighlight(): void {
  activeEl = null;
  if (frameHandle != null) {
    cancelAnimationFrame(frameHandle);
    frameHandle = null;
  }
  if (bands) {
    for (const side of ['top', 'right', 'bottom', 'left'] as const) {
      bands[side].dataset.on = 'false';
    }
  }
  for (const b of gapBands) b.dataset.on = 'false';
}
