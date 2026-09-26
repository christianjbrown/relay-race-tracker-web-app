import { describe, expect, it } from 'vitest';
import { ClockActivity, timelinePosition } from '../../src/domain/activity-states.js';
import { at, makeRelay } from '../fixtures/relay.js';

describe('ActivityStates', () => {
  const { schedule, states } = makeRelay();

  it('describes a segment with its place and kind, and any extras', () => {
    const seg = schedule.segments[2];
    expect(states.of(seg, 'planned', { at: 3 })).toEqual({ seg, index: 2, kind: 'sleep', state: 'planned', at: 3 });
  });

  it('describes being outside the timeline', () => {
    expect(states.outside(at(-5))).toEqual({ seg: null, index: -1, kind: null, state: 'before' });
    expect(states.outside(at(400)).state).toBe('finished');
  });
});

describe('ClockActivity', () => {
  const { schedule, states } = makeRelay();
  const clock = new ClockActivity(schedule, states);

  it('follows the timeline alone', () => {
    expect(clock.at(at(100))).toMatchObject({ index: 2, state: 'planned' });
    expect(clock.at(at(-1)).state).toBe('before');
    expect(clock.at(at(999)).state).toBe('finished');
  });
});

describe('timelinePosition', () => {
  it('puts before the start before everything, and the finish after it', () => {
    expect(timelinePosition({ state: 'before' }, 7)).toBe(-1);
    expect(timelinePosition({ state: 'finished' }, 7)).toBe(7);
    expect(timelinePosition({ state: 'planned', index: 3 }, 7)).toBe(3);
  });
});
