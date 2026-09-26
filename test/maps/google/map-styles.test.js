import { describe, expect, it } from 'vitest';
import { MAP_STYLES } from '../../../src/maps/google/map-styles.js';

describe('MAP_STYLES', () => {
  it('has a frozen light and dark style array', () => {
    expect(Object.isFrozen(MAP_STYLES)).toBe(true);
    expect(Array.isArray(MAP_STYLES.light)).toBe(true);
    expect(Array.isArray(MAP_STYLES.dark)).toBe(true);
    expect(MAP_STYLES.light.length).toBeGreaterThan(0);
    expect(MAP_STYLES.dark.length).toBeGreaterThan(0);
  });
});
