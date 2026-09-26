import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { nodeFiles } from '../../../tools/lib/node-files.js';

describe('nodeFiles', () => {
  let dir;

  afterEach(async () => {
    if (dir) await nodeFiles.clear(dir).catch(() => {});
  });

  it('reads a file as a buffer and as text', async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'node-files-'));
    const file = path.join(dir, 'a.txt');
    await writeFile(file, 'hello');
    expect(await nodeFiles.read(file)).toBeInstanceOf(Buffer);
    expect(await nodeFiles.readText(file)).toBe('hello');
  });

  it('writes a file, creating its directory', async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'node-files-'));
    const file = path.join(dir, 'nested', 'b.txt');
    await nodeFiles.write(file, 'data');
    expect(readFileSync(file, 'utf8')).toBe('data');
  });

  it('copies a file, creating the destination directory', async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'node-files-'));
    const from = path.join(dir, 'src.txt');
    await writeFile(from, 'x');
    const to = path.join(dir, 'nested', 'dest.txt');
    await nodeFiles.copy(from, to);
    expect(readFileSync(to, 'utf8')).toBe('x');
  });

  it('exists reports true and false', async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'node-files-'));
    const file = path.join(dir, 'c.txt');
    expect(await nodeFiles.exists(file)).toBe(false);
    await writeFile(file, 'x');
    expect(await nodeFiles.exists(file)).toBe(true);
  });

  it('clear empties a folder, creating it if missing', async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'node-files-'));
    const target = path.join(dir, 'out');
    await writeFile(path.join(dir, 'out-marker.txt'), 'keep');
    await nodeFiles.write(path.join(target, 'old.txt'), 'old');
    await nodeFiles.clear(target);
    expect(existsSync(path.join(target, 'old.txt'))).toBe(false);
    expect(existsSync(target)).toBe(true);
  });

  it('replace overwrites a folder with a copy of another', async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'node-files-'));
    const from = path.join(dir, 'from');
    const to = path.join(dir, 'to');
    await nodeFiles.write(path.join(from, 'new.txt'), 'new');
    await nodeFiles.write(path.join(to, 'old.txt'), 'old');
    await nodeFiles.replace(from, to);
    expect(existsSync(path.join(to, 'old.txt'))).toBe(false);
    expect(readFileSync(path.join(to, 'new.txt'), 'utf8')).toBe('new');
  });
});
