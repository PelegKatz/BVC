import { describe, expect, it, vi, beforeEach } from 'vitest';

import { installBridge, __TEST_handleMessage } from './signal-bridge';

describe('signal-bridge protocol', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('responds to has-ng when window.ng is present', async () => {
    (globalThis as Record<string, unknown>).ng = { getComponent: vi.fn() };
    const res = await __TEST_handleMessage({ bvc: 'request', id: 1, op: 'has-ng', args: {} });
    expect(res.ok).toBe(true);
    expect(res.result).toBe(true);
  });

  it('responds false to has-ng when window.ng is absent', async () => {
    delete (globalThis as Record<string, unknown>).ng;
    const res = await __TEST_handleMessage({ bvc: 'request', id: 2, op: 'has-ng', args: {} });
    expect(res.ok).toBe(true);
    expect(res.result).toBe(false);
  });

  it('ignores messages not tagged bvc:request', () => {
    const handler = vi.fn();
    installBridge(handler);
    window.dispatchEvent(new MessageEvent('message', { data: { something: 'else' }, source: window }));
    expect(handler).not.toHaveBeenCalled();
  });
});
