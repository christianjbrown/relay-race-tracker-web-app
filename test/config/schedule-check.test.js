import { describe, expect, it } from 'vitest';
import { readSchedule, ScheduleError } from '../../src/config/schedule-check.js';
import { relaySegments } from '../fixtures/relay.js';

const problems = (segments) => {
  try {
    readSchedule({ segments });
  } catch (e) {
    expect(e).toBeInstanceOf(ScheduleError);
    return e.problems;
  }
  return [];
};

describe('readSchedule', () => {
  it('accepts a good schedule and gives its segments back', () => {
    const segments = relaySegments();
    expect(readSchedule({ segments })).toBe(segments);
  });

  it('needs segments', () => {
    expect(() => readSchedule({})).toThrow('"segments" must be a list');
    expect(() => readSchedule(null)).toThrow(ScheduleError);
    expect(() => readSchedule({ segments: [] })).toThrow(ScheduleError);
  });

  it('needs times with offsets, in order and with no gaps', () => {
    const s = relaySegments();
    expect(problems([{ ...s[0], start: 'soon' }])[0]).toMatch(/segment 1: "start" and "end" must be times/);
    expect(problems([{ ...s[0], end: s[0].start }])[0]).toMatch(/ends before it starts/);
    expect(problems([s[0], { ...s[1], start: s[0].start }])).toContain('segment 2: starts before the segment before it ends');
    expect(problems([s[0], s[2]])).toContain('segment 2: starts after a gap; fill it with free time');
  });

  it('needs a known kind', () => {
    expect(problems([{ ...relaySegments()[0], kind: 'swim' }])[0]).toMatch(/"kind" must be one of run, drive, sleep, free/);
  });

  it('needs the places each kind has', () => {
    const [leg, drive, sleep, , , free, finish] = relaySegments();
    expect(problems([{ ...leg, to: { name: 'x', lat: 'north', lng: 4 } }])[0]).toMatch(/a leg needs "from" and "to"/);
    expect(problems([{ ...leg, km: 0 }])[0]).toMatch(/number \("leg"\) and length/);
    expect(problems([{ ...leg, leg: undefined }])[0]).toMatch(/number \("leg"\) and length/);
    expect(problems([finish])).toEqual([]);
    expect(problems([{ ...drive, from: null }])[0]).toMatch(/a drive needs/);
    expect(problems([{ ...sleep, at: { lat: 1, lng: 2 } }])[0]).toMatch(/a rest needs/);
    expect(problems([{ ...free, at: undefined }])).toEqual([]);
    expect(problems([{ ...free, at: { name: 'x' } }])[0]).toMatch(/free time/);
    expect(problems([{ ...free, at: 'park' }])[0]).toMatch(/free time/);
  });
});
