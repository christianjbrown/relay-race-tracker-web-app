import { describe, expect, it } from 'vitest';
import { resolveTuning } from '../../src/config/tuning.js';
import { Convoy } from '../../src/domain/convoy.js';
import { HandoverSpotter } from '../../src/domain/handover-spotter.js';
import { at, offCourse } from '../fixtures/relay.js';

const fix = (i, minutes, km = 0) => ({ ...offCourse(i, km), time: at(minutes) });

describe('HandoverSpotter', () => {
  const tuning = resolveTuning();
  const spotter = () => new HandoverSpotter(tuning, new Convoy(tuning), new Convoy(tuning));

  it('knows nothing about stillness before two polls', () => {
    const s = spotter();
    s.observe(fix(10, 0), []);
    expect(s.still).toBeNull();
  });

  it('calls the vehicle still when it has not moved between polls, and moving when it has', () => {
    const s = spotter();
    s.observe(fix(10, 0), []);
    s.observe(fix(10, 1, 0.05), []);
    expect(s.still).toBe(true);
    s.observe(fix(20, 2), []);
    expect(s.still).toBe(false);
  });

  it('keeps its view when a poll brings no newer fix', () => {
    const s = spotter();
    s.observe(fix(10, 1), []);
    s.observe(fix(10, 2), []);
    s.observe(fix(50, 2), []);
    expect(s.still).toBe(true);
  });

  it('sees the vehicle parked with the team when a fresh tracker is beside it and it has not moved', () => {
    const s = spotter();
    const van = fix(10, 0);
    s.observe(van, [fix(10, 0, 0.1)]);
    expect(s.parked(van, at(1))).toBe(true);
    s.observe(fix(10, 1), [fix(10, 1, 0.1)]);
    expect(s.parked(van, at(1))).toBe(true);
  });

  it('does not count company that is far away or stale', () => {
    const s = spotter();
    const van = fix(10, 30);
    s.observe(van, [fix(10, 30, 0.5), fix(10, 0)]);
    expect(s.parked(van, at(30))).toBe(false);
  });

  it('does not count a vehicle that has moved, whatever its company', () => {
    const s = spotter();
    s.observe(fix(10, 0), []);
    const van = fix(30, 1);
    s.observe(van, [fix(30, 1)]);
    expect(s.parked(van, at(1))).toBe(false);
  });

  describe('at a roadside stop', () => {
    const tag = (f, id) => ({ ...f, id });

    it('does not count a second vehicle that drove there beside ours', () => {
      const s = spotter();
      s.observe(fix(10, 0), [tag(fix(10, 0, 0.05), 'bus1')]);
      s.observe(fix(20, 1), [tag(fix(20, 1, 0.05), 'bus1')]);
      const van = fix(20, 2);
      s.observe(van, [tag(fix(20, 2, 0.05), 'bus1')]);
      expect(s.parked(van, at(2))).toBe(false);
    });

    it('does not count a crew member running with the runner', () => {
      const s = spotter();
      const van = fix(20, 0);
      s.observe(van, [tag(fix(18, 0), 'crew')], fix(18, 0));
      s.observe(fix(20, 1), [tag(fix(19, 1), 'crew')], fix(19, 1));
      s.observe(fix(20, 2), [tag(fix(20, 2), 'crew')], fix(20, 2));
      expect(s.parked(van, at(2))).toBe(false);
    });

    it('still counts a vehicle that was parked there before ours arrived', () => {
      const s = spotter();
      s.observe(fix(10, 0), [tag(fix(20, 0, 0.05), 'bus3')]);
      s.observe(fix(20, 1), [tag(fix(20, 1, 0.05), 'bus3')]);
      const van = fix(20, 2);
      s.observe(van, [tag(fix(20, 2, 0.05), 'bus3')], fix(20, 2));
      expect(s.parked(van, at(2))).toBe(true);
    });
  });
});
