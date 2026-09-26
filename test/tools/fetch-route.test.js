import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const repoRoot = path.join(import.meta.dirname, '..', '..');
const exampleSite = path.join(repoRoot, 'example-site');

describe('tools/fetch-route.js', () => {
  let dir;
  const originalArgv = process.argv;

  afterEach(async () => {
    process.argv = originalArgv;
    process.exitCode = undefined;
    vi.unstubAllGlobals();
    if (dir) await rm(dir, { recursive: true, force: true });
    dir = undefined;
    vi.restoreAllMocks();
  });

  it('fetches the course from Chronorace and writes route.json', async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'fetch-route-cli-'));
    const site = path.join(dir, 'site');
    await cp(exampleSite, site, { recursive: true });
    process.argv = ['node', 'fetch-route.js', '--site', site];
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ Tracks: [{ Name: 'Example course', Polylines: ['_p~iF~ps|U_ulLnnqC'] }] }),
    })));

    await import(/* @vite-ignore */ `../../tools/fetch-route.js?${Math.random()}`);

    expect(process.exitCode).toBeUndefined();
    const written = JSON.parse(await readFile(path.join(site, 'route.json'), 'utf8'));
    expect(written).toEqual({ name: 'Example course', points: [{ lat: 38.5, lng: -120.2 }, { lat: 40.7, lng: -120.95 }] });
  });
});
