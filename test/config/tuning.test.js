import { describe, expect, it } from 'vitest';
import { DEFAULT_TUNING, resolveTuning } from '../../src/config/tuning.js';

describe('resolveTuning', () => {
  it('turns the defaults into working units', () => {
    const t = resolveTuning();
    expect(t.pollMs).toBe(30000);
    expect(t.staleMs).toBe(15 * 60000);
    expect(t.maxOverrunMs).toBe(4 * 3600000);
    expect(t.maxDriveOverrunMs).toBe(3600000);
    expect(t.paceWindowMs).toBe(60000);
    expect(t.paceTrustMs).toBe(20 * 60000);
    expect(t.jogKmh).toBe(9);
    expect(Object.isFrozen(t)).toBe(true);
  });

  it('takes overrides', () => {
    expect(resolveTuning({ jogKmh: 11, staleMinutes: 5 })).toMatchObject({ jogKmh: 11, staleMs: 300000 });
  });

  it('refuses unknown settings and values that are not positive numbers', () => {
    expect(() => resolveTuning({ jogKph: 9 })).toThrow('Unknown tuning setting: jogKph.');
    expect(() => resolveTuning({ jogKmh: 0 })).toThrow('jogKmh must be a positive number');
    expect(() => resolveTuning({ jogKmh: '9' })).toThrow('jogKmh must be a positive number');
  });

  it('documents every setting it resolves', () => {
    expect(Object.keys(DEFAULT_TUNING)).toHaveLength(Object.keys(resolveTuning()).length);
  });
});
