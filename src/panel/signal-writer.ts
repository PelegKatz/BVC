// Angular signal input access via window.ng dev globals.
//
// In the extension this module runs in the ISOLATED content-script world, where
// `window.ng` is undefined — so getCxuiInstance returns null and signal writes
// no-op. That's intentional: per D8 the primary live-edit path is the catalog
// class-map swap, and signal RPC (via the MAIN-world page bridge) is a
// Storybook-only secondary path added in a follow-up. We use a local typed
// view of `window.ng` rather than a global Window augmentation, which would
// clash with the page-world bridge's own declaration.

interface NgDevTools {
  getComponent(el: Element): object | null;
  getDirectives(el: Element): object[];
  markDirty(cmp: object): void;
  applyChanges(cmp: object): void;
}

function ngDevTools(): NgDevTools | undefined {
  return (window as unknown as { ng?: NgDevTools }).ng;
}

interface SignalNode {
  value: unknown;
  version: number;
}

/** Returns the first Cxui* component or directive instance found on el. */
export function getCxuiInstance(el: Element): object | null {
  const ng = ngDevTools();
  if (!ng) return null;

  const cmp = ng.getComponent(el);
  if (cmp && isCxuiCtor(cmp)) return cmp;

  for (const d of ng.getDirectives(el)) {
    if (isCxuiCtor(d)) return d;
  }
  return null;
}

function isCxuiCtor(instance: object): boolean {
  return instance.constructor.name.startsWith('Cxui');
}

/**
 * Read the current value of a signal input.
 *
 * Prefer the effective resolved value (e.g. `_effectiveColor`, `_variant`) when
 * available — it reflects directive overrides like `_directiveColor` that the
 * raw input signal doesn't see. Falls back to the input signal itself.
 */
export function getSignalValue(instance: object, signalName: string): unknown {
  const cap = signalName.charAt(0).toUpperCase() + signalName.slice(1);
  const cmp = instance as Record<string, unknown>;

  for (const key of [`_effective${cap}`, `_${signalName}`]) {
    const sig = cmp[key];
    if (typeof sig === 'function') {
      try {
        return (sig as () => unknown)();
      } catch {
        /* try next */
      }
    }
  }

  const signal = cmp[signalName];
  if (typeof signal === 'function') {
    try {
      return (signal as () => unknown)();
    } catch {
      /* non-signal field */
    }
  }
  return undefined;
}

/**
 * Write a new value to an Angular signal input.
 *
 * Strategy: try imperative override entry points first, then the input's own
 * .set() if writable, then fall back to direct reactive-node mutation. Runs
 * in both Storybook and the web-app — Storybook stories whose templates don't
 * bind the input from args (e.g. CxuiButton's AllStates, which iterates with
 * a @for loop variable) need this path because notifyStorybookArgs alone
 * never reaches the rendered button.
 *
 * Returns true if the write was handled.
 */
export function setSignalValue(el: Element, instance: object, signalName: string, value: unknown): boolean {
  const cap = signalName.charAt(0).toUpperCase() + signalName.slice(1);
  const cmp = instance as Record<string, unknown>;

  // 1. CXUI directives expose internal "override" entry points so external
  //    callers (like CX-Visual) can change props without going through the parent
  //    template binding. We probe for these in priority order:
  //
  //    a) Imperative setter on the prototype — e.g. `setEffectiveSize(s)`,
  //       which writes to whatever signal drives the effective value.
  //    b) Writable internal signal — e.g. `_directiveVariant.set('outline')`,
  //       which acts as an override that the computed `_variant()` falls
  //       through to.
  //
  //    Mutating an input()'s underlying node directly (path 3 below) doesn't
  //    notify downstream computeds via Angular's producer/consumer graph, so
  //    the [class] binding never re-evaluates and the live DOM doesn't
  //    update. Going through these override entry points goes through the
  //    proper reactivity primitives.
  const setterName = `setEffective${cap}`;
  const setter = cmp[setterName];
  if (typeof setter === 'function') {
    try {
      (setter as (v: unknown) => void).call(cmp, value);
      scheduleMarkDirty(el, instance);
      return true;
    } catch {
      /* try next strategy */
    }
  }
  const altSetter = cmp[`set${cap}`];
  if (typeof altSetter === 'function' && altSetter !== cmp.constructor) {
    try {
      (altSetter as (v: unknown) => void).call(cmp, value);
      scheduleMarkDirty(el, instance);
      return true;
    } catch {
      /* try next */
    }
  }
  // Prefer `_<name>Override` over `_directive<Cap>` — the override semantics
  // are reserved for external editors (CX-Visual) and must beat the user-bound
  // input, whereas `_directive<Cap>` is sometimes a low-priority default set
  // by an attribute directive (see CxuiButton._directiveVariant + cxuiIconButton).
  for (const overrideKey of [`_${signalName}Override`, `_directive${cap}`, `_effective${cap}`]) {
    const overrideSig = cmp[overrideKey];
    if (typeof overrideSig === 'function') {
      const s = overrideSig as unknown as Record<string, unknown>;
      if (typeof s['set'] === 'function') {
        try {
          (s['set'] as (v: unknown) => void).call(overrideSig, value);
          scheduleMarkDirty(el, instance);
          return true;
        } catch {
          /* try next */
        }
      }
    }
  }

  // 2. The input signal itself might be writable (model() inputs or future
  //    writable inputs).
  const signal = cmp[signalName];
  if (!signal) return false;
  const s = signal as Record<string, unknown>;
  if (typeof s['set'] === 'function') {
    (s['set'] as (v: unknown) => void)(value);
    scheduleMarkDirty(el, instance);
    return true;
  }

  // 3. Last-ditch internal-node mutation. The read returns the new value but
  //    downstream computeds keep their cached result, so the live DOM stays
  //    stale. We still write the data-attr intent so apply.ts can emit the
  //    right source-edit prompt — partial functionality is better than silent
  //    failure.
  const node = findSignalNode(signal);
  if (node) {
    node.value = value;
    node.version++;
    scheduleMarkDirty(el, instance);
    return true;
  }

  return false;
}

export function isInStorybook(): boolean {
  return typeof (window as unknown as Record<string, unknown>)['__STORYBOOK_ADDONS_CHANNEL__'] !== 'undefined';
}

function findSignalNode(signal: unknown): SignalNode | null {
  if (!signal || typeof signal !== 'function') return null;
  for (const sym of Object.getOwnPropertySymbols(signal as object)) {
    const node = (signal as unknown as Record<symbol, unknown>)[sym];
    if (node !== null && typeof node === 'object' && 'value' in (node as object) && 'version' in (node as object)) {
      return node as SignalNode;
    }
  }
  return null;
}

function scheduleMarkDirty(el: Element, instance: object): void {
  setTimeout(() => {
    const ng = ngDevTools();
    if (!ng) return;
    const target = ng.getComponent(el) ?? instance;
    ng.applyChanges?.(target);
  }, 0);
}

/**
 * When running inside a Storybook iframe, emit updateStoryArgs so the story
 * template re-renders with our new value. This is needed because story
 * templates bind args via `[input]="arg"` which overrides direct signal writes
 * during the next change detection cycle.
 *
 * Safe to call in the web-app — the channel check is a no-op if not in Storybook.
 */
export function notifyStorybookArgs(signalName: string, value: unknown): void {
  const channel = (window as unknown as Record<string, unknown>)['__STORYBOOK_ADDONS_CHANNEL__'] as
    | { emit(event: string, payload: unknown): void }
    | undefined;
  if (!channel) return;

  const storyId = new URLSearchParams(window.location.search).get('id');
  if (!storyId) return;

  channel.emit('updateStoryArgs', {
    storyId,
    updatedArgs: { [signalName]: value },
  });
}
