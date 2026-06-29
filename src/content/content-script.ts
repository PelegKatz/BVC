import { rpc } from './page-bridge';
import { detectPageMode, detectInBundleCxVisual } from './activation';

const FLAG = '__cxVisualExtensionMounted';
declare global {
  interface Window {
    [FLAG]?: boolean;
  }
}

async function main(): Promise<void> {
  if (window[FLAG]) {
    console.log('[cx-visual] already mounted in this tab');
    return;
  }
  window[FLAG] = true;

  // Coexistence guard (§9): if the in-bundle CX-Visual is already on the page, stand
  // down rather than mount a second panel that collides on shadow-host id and
  // pick-mode events. (A storage-backed opt-out is a P2 refinement.)
  if (detectInBundleCxVisual()) {
    console.log('[cx-visual] in-bundle CX-Visual detected — extension standing down (coexistence guard)');
    return;
  }

  const mode = await detectPageMode({
    probeNg: async () => {
      try {
        return await rpc<boolean>('has-ng', {}, { timeoutMs: 500 });
      } catch {
        return false;
      }
    },
  });

  if (mode === 'inactive') {
    console.log('[cx-visual] no cxui markers — staying dormant');
    return;
  }

  console.log(`[cx-visual] activating in ${mode} mode`);
  const { boot } = await import('../panel/main');
  await boot(mode);
}

main().catch(err => console.error('[cx-visual] content script crashed:', err));
