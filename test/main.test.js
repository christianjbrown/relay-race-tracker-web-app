import { afterEach, describe, expect, it, vi } from 'vitest';

describe('main', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('starts the page against the real window', async () => {
    const meta = { hidden: true, classList: { add: vi.fn() }, textContent: '' };
    const win = {
      fetch: vi.fn(() => Promise.reject(new Error('offline'))),
      document: { getElementById: vi.fn(() => meta) },
      console: { error: vi.fn() },
      location: { search: '' },
      setTimeout: vi.fn(),
    };
    vi.stubGlobal('window', win);

    await import('../src/main.js');
    // start() runs boot() asynchronously; let its rejection settle.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(win.console.error).toHaveBeenCalled();
    expect(meta.hidden).toBe(false);
    expect(win.setTimeout).toHaveBeenCalled();
  });
});
