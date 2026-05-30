import { describe, expect, it, beforeEach } from 'vitest';

import { detectPageMode } from './activation';

function makeBody(html: string): void {
  document.body.innerHTML = html;
}

describe('detectPageMode', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns "full" when window.ng is available and cxui markers exist', async () => {
    makeBody('<cxui-badge>x</cxui-badge>');
    const mode = await detectPageMode({ probeNg: async () => true });
    expect(mode).toBe('full');
  });

  it('returns "readonly" when cxui markers exist but no window.ng', async () => {
    makeBody('<cxui-badge>x</cxui-badge>');
    const mode = await detectPageMode({ probeNg: async () => false });
    expect(mode).toBe('readonly');
  });

  it('returns "inactive" when no cxui markers', async () => {
    makeBody('<div>hello</div>');
    const mode = await detectPageMode({ probeNg: async () => true });
    expect(mode).toBe('inactive');
  });

  it('matches button[cxuiButton] as a cxui marker', async () => {
    makeBody('<button cxuiButton>x</button>');
    const mode = await detectPageMode({ probeNg: async () => true });
    expect(mode).toBe('full');
  });
});
