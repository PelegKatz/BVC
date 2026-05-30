import { Panel } from './panel';
import { Selector } from './selector';
import { loadCatalog } from './catalog-loader';
import { loadRuntimeData } from './runtime-data';
import { initTokens } from './tokens';
import { initIcons } from './icons';
import { initFonts } from './typography-tokens';
import type { PageMode } from '../content/activation';

export async function boot(mode: PageMode): Promise<void> {
  // Load all four bundled JSON artifacts, then seed the data modules that the
  // controls read synchronously, before constructing the panel.
  await loadRuntimeData();
  await Promise.all([initTokens(), initIcons(), initFonts()]);
  const catalog = await loadCatalog();

  const selectorRef: { value: Selector | null } = { value: null };

  const panel = new Panel({
    onTogglePick: next => selectorRef.value?.setPicking(next),
    onMutated: () => selectorRef.value?.refresh(),
    onClearSelection: () => selectorRef.value?.clearSelection(),
    onSelectElement: el => {
      selectorRef.value?.setSelection(el);
      panel.renderSelected(el);
    },
    onPreviewElement: el => {
      if (el) selectorRef.value?.previewHover(el);
      else selectorRef.value?.clearPreviewHover();
    },
  });

  panel.setCatalog(catalog);
  if (mode === 'readonly') panel.setReadOnly(true);

  selectorRef.value = new Selector(
    {
      onHover: () => {},
      onSelect: el => {
        panel.setPicking(false);
        if (el) panel.renderSelected(el);
        else panel.renderEmpty();
      },
    },
    el => panel.isInPanel(el),
  );

  panel.mount(document.body);
}
