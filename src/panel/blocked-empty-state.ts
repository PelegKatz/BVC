import { findEscapeTarget } from './blocklist';
import { buildChartConfigPrompt } from './chart-config-prompt';
import { copyToClipboard } from './apply';

export interface BlockedStateProps {
  blockingAncestor: Element;
  onJumpTo: (el: Element) => void;
  /** Optional toast hook — defaults to a console log when omitted. */
  onCopySuccess?: (message: string) => void;
  onCopyFailure?: (message: string) => void;
}

/**
 * Empty state rendered into the panel body when the selection is blocked
 * (chart or graph component, or any descendant). Names the specific
 * ancestor that triggered the block and offers a one-click escape that
 * jumps to the first non-blocked ancestor — typically the layout
 * container surrounding the visualization. Same pattern as the
 * uncataloged empty state's "Jump to parent" affordance.
 */
export function createBlockedEmptyState(props: BlockedStateProps): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.className = 'cx-visual-empty-state';

  const icon = document.createElement('div');
  icon.className = 'cx-visual-empty-state-icon';
  icon.textContent = '📊';

  const blockingTag = props.blockingAncestor.tagName.toLowerCase();
  const isChart = blockingTag.startsWith('cxui-chart');

  const title = document.createElement('div');
  title.className = 'cx-visual-empty-state-title';
  title.textContent = isChart ? `<${blockingTag}> is driven by chart config — not editable here` : `<${blockingTag}> isn't editable in CX-Visual`;

  const body = document.createElement('div');
  body.className = 'cx-visual-empty-state-body';
  body.textContent = isChart
    ? "This element is rendered from the parent `<cxui-chart>`'s `[config]` input. CX-Visual overrides on the DOM node would get overwritten on the next chart render. Copy a prompt that tells Claude exactly what to edit in source, or jump out to the surrounding layout container."
    : "Visualization components (cxui-graph) have config-driven rendering that doesn't map to CX-Visual sections. Jump out to the surrounding layout container to adjust placement.";

  wrap.append(icon, title, body);

  const actions = document.createElement('div');
  actions.className = 'cx-visual-empty-state-actions';

  const prompt = buildChartConfigPrompt(props.blockingAncestor);
  if (prompt) {
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'cx-visual-empty-state-action cx-visual-empty-state-action-primary';
    copyBtn.textContent = '⧉ Copy prompt';
    copyBtn.addEventListener('click', async () => {
      const ok = await copyToClipboard(prompt);
      if (ok) {
        copyBtn.textContent = '✓ Copied';
        props.onCopySuccess?.('Prompt copied — paste into Claude');
        setTimeout(() => (copyBtn.textContent = '⧉ Copy prompt'), 1600);
      } else {
        props.onCopyFailure?.('Could not copy prompt');
      }
    });
    actions.appendChild(copyBtn);
  }

  const escape = findEscapeTarget(props.blockingAncestor);
  if (escape) {
    const escapeTag = escape.tagName.toLowerCase();
    const jumpBtn = document.createElement('button');
    jumpBtn.type = 'button';
    jumpBtn.className = 'cx-visual-empty-state-action';
    jumpBtn.textContent = `↑ Jump to <${escapeTag}>`;
    jumpBtn.addEventListener('click', () => props.onJumpTo(escape));
    actions.appendChild(jumpBtn);
  }

  if (actions.children.length > 0) wrap.appendChild(actions);

  return wrap;
}
