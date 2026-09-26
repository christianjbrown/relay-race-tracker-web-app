import { describe, expect, it } from 'vitest';
import { makeBadges } from '../../src/ui/badges.js';

describe('makeBadges', () => {
  it('gives the runner emoji for running', () => {
    const badges = makeBadges('🏃', 'bus');
    expect(badges.run).toBe('🏃');
  });

  it('picks the vehicle emoji for driving', () => {
    expect(makeBadges('🏃', 'bus').drive).toBe('🚌');
    expect(makeBadges('🏃', 'van').drive).toBe('🚐');
    expect(makeBadges('🏃', 'car').drive).toBe('🚗');
  });

  it('has fixed emoji for sleep, free, finished and waiting', () => {
    const badges = makeBadges('🏃', 'bus');
    expect(badges.sleep).toBe('💤');
    expect(badges.free).toBe('🕹️');
    expect(badges.finished).toBe('🏁');
    expect(badges.waiting).toBe('⏳');
  });

  it('freezes the result', () => {
    const badges = makeBadges('🏃', 'bus');
    expect(Object.isFrozen(badges)).toBe(true);
  });
});
