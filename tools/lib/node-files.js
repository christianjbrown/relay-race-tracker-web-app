import { access, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

/** The file system, as the build and the tools use it. */
export const nodeFiles = Object.freeze({
  read: (file) => readFile(file),
  readText: (file) => readFile(file, 'utf8'),
  async write(file, data) {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, data);
  },
  async copy(from, to) {
    await mkdir(path.dirname(to), { recursive: true });
    await cp(from, to, { recursive: true });
  },
  exists: (file) => access(file).then(() => true, () => false),
  /** Empties a folder, so nothing from an earlier build is left behind. */
  async clear(dir) {
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });
  },
  /** Replaces a folder with a copy of another. */
  async replace(from, to) {
    await rm(to, { recursive: true, force: true });
    await mkdir(path.dirname(to), { recursive: true });
    await cp(from, to, { recursive: true });
  },
});
