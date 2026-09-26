import { afterEach, describe, expect, it, vi } from 'vitest';

describe('tools/list-trackers.js', () => {
  const originalArgv = process.argv;

  afterEach(() => {
    process.argv = originalArgv;
    process.exitCode = undefined;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('lists the trackers for the given event id', async () => {
    process.argv = ['node', 'list-trackers.js', '42'];
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ Trackers: { a: { Bib: 'RUN', DisplayName: 'Runner', DeviceId: 'd1' } } }),
    })));

    await import(/* @vite-ignore */ `../../tools/list-trackers.js?${Math.random()}`);

    expect(process.exitCode).toBeUndefined();
    expect(log).toHaveBeenCalledWith(expect.stringContaining('RUN'));
  });

  it('prints a usage error and sets exit code 1 without an event id', async () => {
    process.argv = ['node', 'list-trackers.js'];
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import(/* @vite-ignore */ `../../tools/list-trackers.js?${Math.random()}`);

    expect(error).toHaveBeenCalledWith(expect.stringContaining('Usage: npm run trackers'));
    expect(process.exitCode).toBe(1);
  });
});
