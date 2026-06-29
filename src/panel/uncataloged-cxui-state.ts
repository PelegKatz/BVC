import type { CatalogEntry } from './catalog-loader';
import { findCxuiEntry, describeCxuiComponent, isCxuiComponent } from './catalog-cxui';

const PICK_COUNT_KEY = 'cx-visual-uncataloged-pick-counts';

export interface JumpTarget {
  el: Element;
  kind: 'cataloged' | 'primitive';
}

/**
 * Picks the best "Jump to parent" target for an uncataloged cxui component:
 *
 *   1. The nearest ancestor that resolves to a catalog entry (DS-mode panel
 *      with Properties + Content). This is what the designer usually wants —
 *      e.g. picking <cxui-select-input-trigger> jumps to its <cxui-select>
 *      parent so they can change the component's variant or value.
 *
 *   2. If no cataloged ancestor exists (some cxui components don't have
 *      stories yet — the Select family is the standing example), fall back
 *      to the nearest non-cxui ancestor (a primitive wrapper). The panel
 *      renders Layout / Spacing / Appearance there, which is at least
 *      something useful — better than a disabled button on a lock screen.
 *
 *   3. Returns null only when both walks fail (extreme edge case — the
 *      ancestor chain is entirely uncataloged cxui all the way to <body>).
 */
export function findJumpTarget(el: Element, catalog: CatalogEntry[]): JumpTarget | null {
  let cur: Element | null = el.parentElement;
  while (cur && cur !== document.body) {
    if (findCxuiEntry(cur, catalog) !== null) return { el: cur, kind: 'cataloged' };
    cur = cur.parentElement;
  }
  cur = el.parentElement;
  while (cur && cur !== document.body) {
    if (!isCxuiComponent(cur)) return { el: cur, kind: 'primitive' };
    cur = cur.parentElement;
  }
  return null;
}

/**
 * Increment a per-tag pick counter in localStorage so we can later triage
 * which uncataloged cxui internals designers actually hit. No UI surfaces
 * this — it's data for "should we ship a story for X?" decisions.
 */
export function recordUncatalogedTag(tagOrName: string): void {
  try {
    const raw = localStorage.getItem(PICK_COUNT_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    const counts: Record<string, number> =
      parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, number>) : {};
    counts[tagOrName] = (counts[tagOrName] ?? 0) + 1;
    localStorage.setItem(PICK_COUNT_KEY, JSON.stringify(counts));
  } catch {
    /* localStorage unavailable (private mode / quota) — silent */
  }
}

interface UncatalogedStateProps {
  el: Element;
  catalog: CatalogEntry[];
  /** Callback fired when the user clicks "Jump to parent". */
  onJumpTo: (ancestor: Element) => void;
}

/**
 * Empty state rendered when a cxui component is picked but has no catalog
 * entry (typically an internal sub-component of a parent DS unit, e.g.
 * `CxuiInlineSelectTrigger` inside `cxui-select`). Communicates the
 * lock-down and offers a one-click "Jump to parent" affordance.
 */
export function createUncatalogedCxuiState(props: UncatalogedStateProps): HTMLDivElement {
  const componentName = describeCxuiComponent(props.el);
  const tagLabel = `<${componentName.toLowerCase()}>`;
  recordUncatalogedTag(componentName);

  const target = findJumpTarget(props.el, props.catalog);

  const wrap = document.createElement('div');
  wrap.className = 'cx-visual-empty-state cx-visual-uncataloged-state';

  const icon = document.createElement('div');
  icon.className = 'cx-visual-empty-state-icon';
  icon.textContent = '🔒';

  const title = document.createElement('div');
  title.className = 'cx-visual-empty-state-title';
  title.textContent = `${tagLabel} is an internal part of a parent cxui component and isn't directly editable.`;

  const body = document.createElement('div');
  body.className = 'cx-visual-empty-state-body';

  const jumpBtn = document.createElement('button');
  jumpBtn.type = 'button';
  jumpBtn.className = 'cx-visual-empty-state-action';

  if (target?.kind === 'cataloged') {
    const parentName = describeCxuiComponent(target.el).toLowerCase();
    body.textContent = `Edit <${parentName}> instead.`;
    jumpBtn.textContent = `↑ Jump to <${parentName}>`;
    jumpBtn.addEventListener('click', () => props.onJumpTo(target.el));
  } else if (target?.kind === 'primitive') {
    const tag = target.el.tagName.toLowerCase();
    body.textContent = `No cataloged parent yet — jump to the surrounding <${tag}> to adjust layout instead.`;
    jumpBtn.textContent = `↑ Jump to <${tag}>`;
    jumpBtn.addEventListener('click', () => props.onJumpTo(target.el));
  } else {
    body.textContent = 'No editable parent found.';
    jumpBtn.textContent = '↑ Jump to parent';
    jumpBtn.disabled = true;
  }

  wrap.append(icon, title, body, jumpBtn);
  return wrap;
}
