import { rpc } from './page-bridge';
import { detectPageMode, detectInBundleBvc } from './activation';

const FLAG = '__bvcExtensionMounted';
declare global {
  interface Window {
    [FLAG]?: boolean;
  }
}

async function main(): Promise<void> {
  if (window[FLAG]) {
    console.log('[bvc] already mounted in this tab');
    return;
  }
  window[FLAG] = true;

  // Coexistence guard (§9): if the in-bundle BVC is already on the page, stand
  // down rather than mount a second panel that collides on shadow-host id and
  // pick-mode events. (A storage-backed opt-out is a P2 refinement.)
  if (detectInBundleBvc()) {
    console.log('[bvc] in-bundle BVC detected — extension standing down (coexistence guard)');
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
    console.log('[bvc] no cxui markers — staying dormant');
    return;
  }

  console.log(`[bvc] activating in ${mode} mode`);
  const { boot } = await import('../panel/main');
  await boot(mode);
}

main().catch(err => console.error('[bvc] content script crashed:', err));
