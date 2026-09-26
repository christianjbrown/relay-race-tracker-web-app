import { describe, expect, it } from 'vitest';
import { JsonStorage } from '../../src/services/json-storage.js';

describe('JsonStorage', () => {
  it('keeps and gives back values as JSON', () => {
    const backing = new Map();
    const storage = new JsonStorage({ getItem: (k) => backing.get(k) ?? null, setItem: (k, v) => backing.set(k, v) });
    storage.write('a', { b: [1, 2] });
    expect(backing.get('a')).toBe('{"b":[1,2]}');
    expect(storage.read('a')).toEqual({ b: [1, 2] });
    expect(storage.read('missing')).toBeNull();
  });

  it('shrugs off storage that is missing, full or holding nonsense', () => {
    const missing = new JsonStorage(null);
    expect(missing.read('a')).toBeNull();
    expect(() => missing.write('a', 1)).not.toThrow();
    const broken = new JsonStorage({ getItem: () => '{nope', setItem: () => { throw new Error('full'); } });
    expect(broken.read('a')).toBeNull();
    expect(() => broken.write('a', 1)).not.toThrow();
  });
});
