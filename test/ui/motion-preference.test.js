import { describe, expect, it, vi } from 'vitest';
import { MotionPreference } from '../../src/ui/motion-preference.js';

describe('MotionPreference', () => {
  it('asks the browser whether less motion was asked for', () => {
    const matchMedia = vi.fn(() => ({ matches: true }));
    expect(new MotionPreference({ matchMedia }).reduced()).toBe(true);
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(new MotionPreference({ matchMedia: () => ({ matches: false }) }).reduced()).toBe(false);
  });
});
