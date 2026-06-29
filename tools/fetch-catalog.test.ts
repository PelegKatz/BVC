import { describe, expect, it } from 'vitest';

import { resolveWorkspaceRoot } from './fetch-catalog';

describe('fetch-catalog', () => {
  it('uses CX_VISUAL_WORKSPACE_ROOT env var when set', () => {
    expect(resolveWorkspaceRoot({ CX_VISUAL_WORKSPACE_ROOT: '/foo/bar' })).toBe('/foo/bar');
  });
  it('falls back to ~/Desktop/cx-web-workspace', () => {
    expect(resolveWorkspaceRoot({ HOME: '/Users/peleg' })).toBe('/Users/peleg/Desktop/cx-web-workspace');
  });
  it('throws if neither env is set', () => {
    expect(() => resolveWorkspaceRoot({})).toThrow(/cannot resolve workspace root/);
  });
});
