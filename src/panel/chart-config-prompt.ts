// Generates a "copy-paste into Claude" prompt for editing the chart config
// of the parent <cxui-chart> when CX-Visual's blocked empty state is showing.
//
// Why this exists: chart sub-components (legend, tooltip, zoom, empty-state)
// look editable in the DOM — they have flat input signals — but their values
// are bound from the chart's [config] input on every re-render, so any CX-Visual
// input override gets clobbered. The honest path is "tell the designer
// what to change in source," and the prompt encodes both *where* (config
// path) and the *current state* read live from the component.

import { getCxuiInstance, getSignalValue } from './signal-writer';

/** Per-blocking-tag metadata: where in `config` to edit, and what the
 * common edits look like. The lists are illustrative, not exhaustive — the
 * goal is to give Claude (and the designer) enough shape to find the
 * right source file and propose a change. */
interface ChartConfigTarget {
  /** Dot-path inside CxuiChartConfig (e.g. 'legend', 'tooltip', 'zoom'). */
  configPath: string;
  /** Short label shown in the UI ("Legend config", "Tooltip config"). */
  label: string;
  /** One-line explanation of why this can't be live-edited. */
  reason: string;
  /** Markdown bullet list of common edits with code snippets. */
  commonEdits: string;
  /** Reads the relevant slice out of the resolved config object. */
  extractCurrentValue: (config: unknown) => unknown;
}

const LEGEND_TARGET: ChartConfigTarget = {
  configPath: 'config.legend',
  label: 'Legend config',
  reason:
    'The legend component is rendered by `<cxui-chart>` from `config.legend` — any CX-Visual input override is overwritten on the next config change.',
  commonEdits: [
    '- **Hide the legend:** `legend: false`',
    "- **Move:** `legend: { position: 'top' | 'bottom' | 'left' | 'right' }`",
    "- **Truncation:** `legend: { truncation: 'leading' | 'trailing' | 'auto' | 'highlight' }`",
    "- **Switch to table layout:** `legend: { type: 'table', columns: [...] }`",
    "- **Accessibility:** `legend: { ariaLabel: 'My chart legend' }`",
  ].join('\n'),
  extractCurrentValue: config => readNested(config, 'legend'),
};

const TOOLTIP_TARGET: ChartConfigTarget = {
  configPath: 'config.tooltip',
  label: 'Tooltip config',
  reason:
    'Tooltip content + behavior are configured through `config.tooltip` and (optionally) a `*cxuiChartTooltip` template — not via the rendered DOM nodes.',
  commonEdits: [
    '- **Hide the tooltip:** `tooltip: false`',
    '- **Shared across series:** `tooltip: { shared: true }`',
    '- **Custom template:** declare `*cxuiChartTooltip` on an `<ng-template>` inside the chart',
    '- **Disable pinning:** `tooltip: { pinnable: false }`',
  ].join('\n'),
  extractCurrentValue: config => readNested(config, 'tooltip'),
};

const ZOOM_TARGET: ChartConfigTarget = {
  configPath: 'config.zoom',
  label: 'Zoom config',
  reason: 'Zoom overlay is rendered from `config.zoom` — its DOM is a presentation layer, not a settings surface.',
  commonEdits: ['- **Disable zoom:** remove the `zoom` key from config', "- **Different axis:** `zoom: { type: 'xy' | 'x' | 'y' }`"].join(
    '\n',
  ),
  extractCurrentValue: config => readNested(config, 'zoom'),
};

const EMPTY_STATE_TARGET: ChartConfigTarget = {
  configPath: 'config.emptyState',
  label: 'Empty-state config',
  reason: 'The empty state shows when `[empty]="true"` on the chart and reads its content from `config.emptyState`.',
  commonEdits: [
    "- **Title / description:** `emptyState: { title: '...', description: '...' }`",
    "- **Variant:** `emptyState: { variant: 'default' | 'error' }`",
    "- **Action button:** `emptyState: { actionLabel: 'Retry', onAction: () => ... }`",
  ].join('\n'),
  extractCurrentValue: config => readNested(config, 'emptyState'),
};

const CHART_ROOT_TARGET: ChartConfigTarget = {
  configPath: 'config',
  label: 'Chart config',
  reason:
    'The chart visualisation is fully driven by its `[config]` input — series, axes, plot options all live there. Edits via CX-Visual inputs would be overwritten on the next config change.',
  commonEdits: [
    "- **Series data / type:** `config.series = [{ type: 'line', data: [...] }]`",
    '- **Axes:** `config.xAxis`, `config.yAxis`',
    '- **Plot options per series type:** `config.plotOptions.{line|column|...}`',
  ].join('\n'),
  extractCurrentValue: config => config,
};

/** Map specific blocked tag → which slice of config it represents. */
const TAG_TO_TARGET: Record<string, ChartConfigTarget> = {
  'cxui-chart-legend': LEGEND_TARGET,
  'cxui-chart-legend-table': LEGEND_TARGET,
  'cxui-chart-legend-item': LEGEND_TARGET,
  'cxui-chart-tooltip': TOOLTIP_TARGET,
  'cxui-chart-tooltip-body': TOOLTIP_TARGET,
  'cxui-chart-tooltip-series-item': TOOLTIP_TARGET,
  'cxui-chart-tooltip-pinned-controls': TOOLTIP_TARGET,
  'cxui-chart-zoom': ZOOM_TARGET,
  'cxui-chart-zoom-overlay': ZOOM_TARGET,
  'cxui-chart-empty-state': EMPTY_STATE_TARGET,
  'cxui-chart-skeleton': CHART_ROOT_TARGET,
  'cxui-chart-actions': CHART_ROOT_TARGET,
  'cxui-chart-context-menu': CHART_ROOT_TARGET,
  'cxui-chart-stat': CHART_ROOT_TARGET,
  'cxui-chart-stat-body': CHART_ROOT_TARGET,
  'cxui-chart-stat-header': CHART_ROOT_TARGET,
  'cxui-chart': CHART_ROOT_TARGET,
};

function resolveTarget(blockingTag: string): ChartConfigTarget | null {
  if (TAG_TO_TARGET[blockingTag]) return TAG_TO_TARGET[blockingTag];
  if (blockingTag.startsWith('cxui-chart')) return CHART_ROOT_TARGET;
  return null;
}

function readNested(obj: unknown, key: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined;
  return (obj as Record<string, unknown>)[key];
}

/** Walks up from the blocking ancestor to find the enclosing `<cxui-chart>`. */
function findEnclosingChart(blockingAncestor: Element): Element | null {
  if (blockingAncestor.tagName.toLowerCase() === 'cxui-chart') return blockingAncestor;
  let cur: Element | null = blockingAncestor.parentElement;
  while (cur && cur !== document.body) {
    if (cur.tagName.toLowerCase() === 'cxui-chart') return cur;
    cur = cur.parentElement;
  }
  return null;
}

/**
 * Builds a markdown prompt for the designer to paste into Claude when they
 * want to edit a chart configuration via source. Returns null when the
 * blocking ancestor is not a chart sub-component this module knows how to
 * handle (e.g. cxui-graph — graphs have a different config shape and will
 * get their own prompt builder if/when designers actually need it).
 */
export function buildChartConfigPrompt(blockingAncestor: Element): string | null {
  const blockingTag = blockingAncestor.tagName.toLowerCase();
  const target = resolveTarget(blockingTag);
  if (!target) return null;

  const chartEl = findEnclosingChart(blockingAncestor);
  const chartInstance = chartEl ? getCxuiInstance(chartEl) : null;
  const config = chartInstance ? getSignalValue(chartInstance, 'config') : undefined;
  const currentValue = config !== undefined ? target.extractCurrentValue(config) : undefined;

  const currentValueBlock =
    currentValue !== undefined
      ? '## Current value\n\n```ts\n' + safeStringify(currentValue) + '\n```\n\n'
      : '_Current `' + target.configPath + '` value could not be read at runtime._\n\n';

  const chartHint = chartEl
    ? `- Parent chart selector: \`${describeChartElement(chartEl)}\``
    : '- _Could not locate the enclosing `<cxui-chart>` element._';

  const url = window.location.href;

  return `# CX-Visual chart-config edit request

The designer picked \`<${blockingTag}>\` inside a chart on \`${url}\`. ${target.reason}

## What to do

Find the component that renders this chart (the file with \`<cxui-chart [config]="...">\` in its template) and edit \`${target.configPath}\` in the corresponding TypeScript file.

${chartHint}

${currentValueBlock}## Common edits

${target.commonEdits}

## Rules

1. Find the source by searching for \`<cxui-chart\` and matching the surrounding context (component name, route, page title) — there may be many \`<cxui-chart>\` instances; narrow with class names from the ancestor chain or by data values in the current config.
2. Edit the TypeScript \`config\` object on the component class (or wherever the config is assembled). Do NOT edit \`<cxui-chart-legend>\` / \`<cxui-chart-tooltip>\` markup directly — those are internal renderers.
3. If a key needs to be removed entirely (e.g. hiding the legend), prefer setting it to \`false\` over deleting the property — keeps history clean and types happy.
4. Report the file path and the before/after value of \`${target.configPath}\` so the designer can verify.
`;
}

function describeChartElement(el: Element): string {
  const id = el.id ? `#${el.id}` : '';
  const cls = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 3);
  const clsStr = cls.length ? '.' + cls.join('.') : '';
  return `${el.tagName.toLowerCase()}${id}${clsStr}`;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, jsonReplacer, 2);
  } catch {
    return String(value);
  }
}

function jsonReplacer(_key: string, val: unknown): unknown {
  if (typeof val === 'function') return '[function]';
  if (val && typeof val === 'object') {
    if (val instanceof Element) return `[Element <${val.tagName.toLowerCase()}>]`;
    if (val instanceof HTMLElement) return `[HTMLElement <${val.tagName.toLowerCase()}>]`;
  }
  return val;
}
