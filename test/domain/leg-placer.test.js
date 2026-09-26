import { describe, expect, it } from 'vitest';
import { makeRelay, place, point } from '../fixtures/relay.js';

describe('LegPlacer', () => {
  const { schedule } = makeRelay();
  const [leg1, driveOff, , driveOn, leg2, , finish] = schedule.segments;

  it('puts each leg on the stretch of course it covers', () => {
    expect(leg1.span).toEqual([0, 100]);
    expect(leg2.span).toEqual([200, 300]);
  });

  it('runs the finish to the end of the course', () => {
    expect(finish.span).toEqual([480, 500]);
  });

  it('looks for each leg from where the last one ended', () => {
    expect(leg1.searchFrom).toBe(0);
    expect(leg2.searchFrom).toBe(100);
    expect(finish.searchFrom).toBe(300);
  });

  it('joins drives to the legs either side of them', () => {
    expect(driveOff.from).toEqual({ ...place(100, 'Town A') });
    expect(driveOn.to).toEqual({ name: 'Town B', ...point(200) });
    // The ends that meet a rest are left where they were.
    expect(driveOff.to.name).toBe('Hotel');
    expect(driveOn.from.name).toBe('Hotel');
  });

  it('never looks behind the last leg, even when a later place is nearer the start', () => {
    const segments = [
      { start: '2027-05-15T09:00:00+02:00', end: '2027-05-15T10:00:00+02:00', kind: 'run', leg: 1, km: 5, from: place(100), to: place(200) },
      { start: '2027-05-15T10:00:00+02:00', end: '2027-05-15T11:00:00+02:00', kind: 'run', leg: 2, km: 5, from: place(10), to: place(300) },
    ];
    const relay = makeRelay({ segments });
    expect(relay.schedule.segments[1].span).toEqual([200, 300]);
  });
});
