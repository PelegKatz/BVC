import type { RpcRequest, RpcResponse } from './protocol';

declare global {
  interface Window {
    ng?: {
      getComponent(el: Element): object | null;
      getDirectives(el: Element): object[];
      applyChanges(cmp: object): void;
    };
  }
}

interface CxuiInstanceField {
  set?: (value: unknown) => void;
}

function findElement(selector: string): Element {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`selector matched no element: ${selector}`);
  return el;
}

function readSignal(instance: object, name: string): unknown {
  const cmp = instance as Record<string, unknown>;
  const sig = cmp[name];
  if (typeof sig === 'function') return (sig as () => unknown)();
  return undefined;
}

function writeSignal(instance: object, name: string, value: unknown): boolean {
  const cmp = instance as Record<string, unknown>;
  const cap = name.charAt(0).toUpperCase() + name.slice(1);
  for (const key of [`setEffective${cap}`, `set${cap}`]) {
    const fn = cmp[key];
    if (typeof fn === 'function') {
      (fn as (v: unknown) => void).call(cmp, value);
      return true;
    }
  }
  for (const key of [`_${name}Override`, `_directive${cap}`, `_effective${cap}`, name]) {
    const sig = cmp[key] as CxuiInstanceField | undefined;
    if (typeof sig?.set === 'function') {
      sig.set(value);
      return true;
    }
  }
  return false;
}

export async function __TEST_handleMessage(req: RpcRequest): Promise<RpcResponse> {
  try {
    if (req.op === 'has-ng') {
      return { bvc: 'response', id: req.id, ok: true, result: typeof window.ng === 'object' };
    }
    const ng = window.ng;
    if (!ng) throw new Error('window.ng absent');
    const el = findElement(req.args.selector as string);
    if (req.op === 'get-component-name') {
      const cmp = ng.getComponent(el);
      return { bvc: 'response', id: req.id, ok: true, result: cmp ? cmp.constructor.name : null };
    }
    if (req.op === 'get-signal') {
      const cmp = ng.getComponent(el);
      if (!cmp) throw new Error('no component on element');
      return { bvc: 'response', id: req.id, ok: true, result: readSignal(cmp, req.args.signalName as string) };
    }
    if (req.op === 'set-signal') {
      const cmp = ng.getComponent(el);
      if (!cmp) throw new Error('no component on element');
      const ok = writeSignal(cmp, req.args.signalName as string, req.args.value);
      if (!ok) throw new Error('signal not writable');
      ng.applyChanges(cmp);
      return { bvc: 'response', id: req.id, ok: true, result: 'set' };
    }
    if (req.op === 'apply-changes') {
      const cmp = ng.getComponent(el);
      if (cmp) ng.applyChanges(cmp);
      return { bvc: 'response', id: req.id, ok: true };
    }
    throw new Error(`unknown op: ${req.op}`);
  } catch (err) {
    return { bvc: 'response', id: req.id, ok: false, error: String((err as Error).message ?? err) };
  }
}

export function installBridge(onMessage?: (req: RpcRequest) => void): void {
  window.addEventListener('message', async (e: MessageEvent) => {
    if (e.source !== window) return;
    const data = e.data as Partial<RpcRequest> | undefined;
    if (!data || data.bvc !== 'request' || typeof data.id !== 'number' || typeof data.op !== 'string') return;
    onMessage?.(data as RpcRequest);
    const res = await __TEST_handleMessage(data as RpcRequest);
    window.postMessage(res, '*');
  });
}

installBridge();
console.log('[cx-visual] page-world bridge installed');
