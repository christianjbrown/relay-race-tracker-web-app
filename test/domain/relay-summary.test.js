import { describe, expect, it } from 'vitest';
import { RelaySummary } from '../../src/domain/relay-summary.js';
import { makeRelay } from '../fixtures/relay.js';

describe('RelaySummary', () => {
  const { schedule } = makeRelay();
  const summary = new RelaySummary(schedule);

  it('adds up the kilometres of the team\'s own legs, leaving out a finish with none given', () => {
    expect(summary.km()).toBeCloseTo(22.2, 5);
  });

  it('takes the whole timeline, first moment to last', () => {
    expect(summary.ms()).toBe(345 * 60000);
  });
});
