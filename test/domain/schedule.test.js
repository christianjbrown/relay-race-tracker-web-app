import { describe, expect, it } from 'vitest';
import { Schedule } from '../../src/domain/schedule.js';
import { at, relaySegments } from '../fixtures/relay.js';

describe('Schedule', () => {
  const schedule = new Schedule(relaySegments());

  it('refuses an empty timeline', () => {
    expect(() => new Schedule([])).toThrow('no segments');
  });

  it('reads times into dates', () => {
    expect(schedule.first.start).toEqual(at(0));
    expect(schedule.last.end).toEqual(at(345));
  });

  it('finds the segment going on at a moment, with its start included and end excluded', () => {
    expect(schedule.at(at(0))).toBe(schedule.segments[0]);
    expect(schedule.at(at(60))).toBe(schedule.segments[1]);
    expect(schedule.at(at(-1))).toBeNull();
    expect(schedule.at(at(345))).toBeNull();
  });

  it('steps before and after a segment', () => {
    const [first, second] = schedule.segments;
    expect(schedule.indexOf(second)).toBe(1);
    expect(schedule.after(first)).toBe(second);
    expect(schedule.before(second)).toBe(first);
    expect(schedule.before(first)).toBeNull();
    expect(schedule.after(schedule.last)).toBeNull();
  });

  it('gives the kind now, or the nearest end outside the timeline', () => {
    expect(schedule.kindAt(at(100))).toBe('sleep');
    expect(schedule.kindAt(at(-10))).toBe('run');
    expect(schedule.kindAt(at(400))).toBe('run');
  });

  it('lists every place', () => {
    expect(schedule.places().map((p) => p.name)).toEqual([
      'Start', 'Town A', 'Town A', 'Hotel', 'Hotel', 'Hotel', 'Town B', 'Town B', 'Town C', 'Meeting point', 'Meeting point', 'Finish',
    ]);
  });

  it('finds the last leg started by a moment', () => {
    expect(schedule.lastRunStartedBy(at(-1))).toBeNull();
    expect(schedule.lastRunStartedBy(at(100))).toBe(schedule.segments[0]);
    expect(schedule.lastRunStartedBy(at(250))).toBe(schedule.segments[4]);
  });
});
