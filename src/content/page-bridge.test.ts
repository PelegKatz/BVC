import { describe, expect, it } from 'vitest';

import { rpc, __TEST_resetCounter } from './page-bridge';

describe('rpc client', () => {
  // jsdom's window.postMessage sets event.source to null, which the bridge's
  // `e.source !== window` guard rejects; in a real browser source === window.
  // Dispatch the MessageEvent directly with source: window to simulate that.
  const respond = (data: unknown): void => {
    window.dispatchEvent(new MessageEvent('message', { data, source: window }));
  };

  it('resolves on a matching response', async () => {
    __TEST_resetCounter();
    const promise = rpc('has-ng', {});
    setTimeout(() => respond({ bvc: 'response', id: 1, ok: true, result: true }), 0);
    await expect(promise).resolves.toBe(true);
  });

  it('rejects on error response', async () => {
    __TEST_resetCounter();
    const promise = rpc('set-signal', { selector: 'cxui-badge', signalName: 'color', value: 'blue' });
    setTimeout(() => respond({ bvc: 'response', id: 1, ok: false, error: 'boom' }), 0);
    await expect(promise).rejects.toThrow('boom');
  });

  it('times out if no response', async () => {
    __TEST_resetCounter();
    const promise = rpc('has-ng', {}, { timeoutMs: 50 });
    await expect(promise).rejects.toThrow(/timeout/i);
  });
});
