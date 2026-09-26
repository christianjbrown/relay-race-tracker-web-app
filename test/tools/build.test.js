import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const repoRoot = path.join(import.meta.dirname, '..', '..');
const exampleSite = path.join(repoRoot, 'example-config');

describe('tools/build.js', () => {
  let dir;
  const originalArgv = process.argv;

  afterEach(async () => {
    process.argv = originalArgv;
    process.exitCode = undefined;
    if (dir) await rm(dir, { recursive: true, force: true });
    dir = undefined;
    vi.restoreAllMocks();
  });

  it('builds the given site into the given output folder', async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'build-cli-'));
    const site = path.join(dir, 'site');
    await cp(exampleSite, site, { recursive: true });
    const out = path.join(dir, 'out');
    process.argv = ['node', 'build.js', '--config', site, '--out', out];
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    await import(/* @vite-ignore */ `../../tools/build.js?${Math.random()}`);

    expect(process.exitCode).toBeUndefined();
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Built'));
    await expect(readFile(path.join(out, 'index.html'), 'utf8')).resolves.toContain('<title>');
  });
});
