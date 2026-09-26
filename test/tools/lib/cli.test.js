import { afterEach, describe, expect, it, vi } from 'vitest';
import { processIo, runCli } from '../../../tools/lib/cli.js';

describe('runCli', () => {
  it('parses options and positionals and calls main', async () => {
    const main = vi.fn();
    const io = { log: vi.fn(), error: vi.fn(), setExitCode: vi.fn() };
    await runCli(main, ['--site', 'foo', 'bar'], { site: { type: 'string' } }, io);
    expect(main).toHaveBeenCalledWith({ site: 'foo' }, ['bar']);
    expect(io.error).not.toHaveBeenCalled();
    expect(io.setExitCode).not.toHaveBeenCalled();
  });

  it('prints a thrown error and sets exit code 1', async () => {
    const main = vi.fn(() => {
      throw new Error('boom');
    });
    const io = { log: vi.fn(), error: vi.fn(), setExitCode: vi.fn() };
    await runCli(main, [], {}, io);
    expect(io.error).toHaveBeenCalledWith('boom');
    expect(io.setExitCode).toHaveBeenCalledWith(1);
  });
});

describe('processIo', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  it('log writes to console.log', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    processIo.log('a', 'b');
    expect(spy).toHaveBeenCalledWith('a', 'b');
  });

  it('error writes to console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processIo.error('oops');
    expect(spy).toHaveBeenCalledWith('oops');
  });

  it('setExitCode sets process.exitCode', () => {
    processIo.setExitCode(1);
    expect(process.exitCode).toBe(1);
  });
});
