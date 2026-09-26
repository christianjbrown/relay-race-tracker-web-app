import { describe, expect, it } from 'vitest';
import { RunnerLocator } from '../../src/domain/runner-locator.js';
import { makeRelay, point } from '../fixtures/relay.js';

describe('RunnerLocator', () => {
  const { schedule, course, states } = makeRelay();
  const locator = new RunnerLocator(schedule, course);
  const live = { runner: { lat: 1, lng: 1 }, vehicle: { lat: 2, lng: 2 } };
  const segs = schedule.segments;

  it('puts the runner on the finish line once it is over', () => {
    expect(locator.where({ state: 'finished' }, live)).toEqual({ ...point(500), finished: true });
  });

  it('uses the tracker for how the relay starts, before it does', () => {
    expect(locator.where({ state: 'before' }, live)).toBe(live.runner);
    const drivesFirst = makeRelay({ segments: schedule.segments.slice(1).map((s) => ({ ...s, start: s.start.toISOString(), end: s.end.toISOString() })) });
    expect(new RunnerLocator(drivesFirst.schedule, course).where({ state: 'before' }, live)).toBe(live.vehicle);
  });

  it('keeps the runner with the vehicle while waiting', () => {
    expect(locator.where(states.of(segs[4], 'waiting'), live)).toBe(live.vehicle);
  });

  it('uses the runner tracker on a leg and the vehicle otherwise', () => {
    expect(locator.where(states.of(segs[0], 'running'), live)).toBe(live.runner);
    expect(locator.where(states.of(segs[2], 'planned'), live)).toBe(live.vehicle);
  });
});
