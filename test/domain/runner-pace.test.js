import { describe, expect, it } from 'vitest';
import { resolveTuning } from '../../src/config/tuning.js';
import { RunnerPace } from '../../src/domain/runner-pace.js';

const MIN = 60000;

describe('RunnerPace', () => {
  const tuning = resolveTuning();

  it('uses the planned pace until it has watched for a minute', () => {
    const pace = new RunnerPace(tuning);
    expect(pace.watched()).toBe(false);
    expect(pace.kmh(9)).toBe(9);
    pace.observe(0, 0);
    pace.observe(30000, 0.1);
    expect(pace.span()).toBe(30000);
    expect(pace.kmh(9)).toBe(9);
  });

  it('ignores a fix no newer than the last one', () => {
    const pace = new RunnerPace(tuning);
    pace.observe(MIN, 1);
    pace.observe(MIN, 2);
    pace.observe(0, 3);
    expect(pace.samples).toEqual([{ time: MIN, km: 1 }]);
  });

  it('blends towards the seen pace, and trusts it fully after twenty minutes', () => {
    const pace = new RunnerPace(tuning);
    pace.observe(0, 0);
    pace.observe(10 * MIN, 2); // 12 km/h, half trusted
    expect(pace.kmh(8)).toBeCloseTo(10, 10);
    pace.observe(20 * MIN, 4);
    expect(pace.kmh(8)).toBeCloseTo(12, 10);
  });

  it('holds the seen pace between walking and a sprint', () => {
    const slow = new RunnerPace(tuning);
    slow.observe(0, 0);
    slow.observe(20 * MIN, 0);
    expect(slow.kmh(9)).toBe(3);
    const fast = new RunnerPace(tuning);
    fast.observe(0, 0);
    fast.observe(20 * MIN, 20);
    expect(fast.kmh(9)).toBe(20);
  });

  it('starts again for a new stint, and not for the same one', () => {
    const pace = new RunnerPace(tuning);
    pace.follow('a');
    pace.observe(0, 0);
    pace.follow('a');
    expect(pace.samples).toHaveLength(1);
    pace.follow('b');
    expect(pace.samples).toHaveLength(0);
    expect(pace.stint).toBe('b');
  });
});
