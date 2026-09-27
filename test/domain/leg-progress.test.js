import { describe, expect, it } from 'vitest';
import { LegProgress } from '../../src/domain/leg-progress.js';
import { at, fixAt, makeRelay, offCourse, place } from '../fixtures/relay.js';

describe('LegProgress', () => {
  const build = (options) => {
    const relay = makeRelay(options);
    return { ...relay, legs: new LegProgress(relay.schedule, relay.course, relay.states, relay.tuning) };
  };
  const { schedule, legs } = build();
  const [leg1, drive1, , , leg2, , finish] = schedule.segments;
  const ctx = (minutes, runnerAt, extra) => ({ now: at(minutes), runner: fixAt(runnerAt, at(minutes)), vehicleWaiting: null, ...extra });

  it('follows the runner along the leg', () => {
    expect(legs.check(leg1, ctx(30, 50))).toMatchObject({ seg: leg1, state: 'running', reached: 50, at: 50, end: 100 });
  });

  it('holds what is reached within the leg', () => {
    expect(legs.check(leg2, ctx(245, 150))).toMatchObject({ state: 'running', reached: 200, at: 150 });
  });

  it('ends a leg early once the runner is well past its end', () => {
    expect(legs.check(leg1, ctx(50, 115))).toMatchObject({ seg: drive1, state: 'planned' });
    expect(legs.check(leg1, ctx(50, 105))).toMatchObject({ state: 'running', reached: 100 });
  });

  it('keeps going past the end when there is nothing after the leg', () => {
    const only = build({ segments: [{ start: at(0).toISOString(), end: at(60).toISOString(), kind: 'run', leg: 1, km: 11, from: place(0), to: place(100) }] });
    const leg = only.schedule.segments[0];
    expect(only.legs.check(leg, ctx(50, 115))).toMatchObject({ state: 'running', reached: 100, at: 115 });
  });

  it('runs long when time is up and the runner is short of the end', () => {
    expect(legs.check(leg1, ctx(70, 80))).toMatchObject({ state: 'overrun', reached: 80, end: 100 });
  });

  it('hands over once time is up and the runner is at the end', () => {
    expect(legs.check(leg1, ctx(70, 98))).toBeNull();
  });

  it('gives the finish line its own zone', () => {
    const wide = build({ tuning: { finishLineKm: 1 } });
    const fin = wide.schedule.segments[6];
    expect(wide.legs.check(fin, ctx(350, 492))).toBeNull();
    expect(legs.check(finish, ctx(350, 492))).toMatchObject({ state: 'overrun' });
  });

  describe('with the vehicle waiting at the end', () => {
    const vehicle = { ...offCourse(105, 0.1), time: at(30) };

    it('ends the leg at the vehicle', () => {
      expect(legs.check(leg1, ctx(30, 50, { vehicleWaiting: vehicle }))).toMatchObject({ state: 'running', reached: 50, end: 105 });
      expect(legs.check(leg1, ctx(70, 50, { vehicleWaiting: vehicle }))).toMatchObject({ state: 'overrun', end: 105 });
    });

    it('hands over when the runner reaches it', () => {
      expect(legs.check(leg1, ctx(30, 104, { vehicleWaiting: vehicle }))).toMatchObject({ seg: drive1, state: 'planned' });
    });

    it('carries on to the end past a vehicle the runner has already gone by', () => {
      const behind = { ...offCourse(60, 0.1), time: at(50) };
      expect(legs.check(leg1, ctx(50, 70, { vehicleWaiting: behind }))).toMatchObject({ state: 'running', reached: 70, end: 100 });
      expect(legs.check(leg1, ctx(70, 70, { vehicleWaiting: behind }))).toMatchObject({ state: 'overrun', end: 100 });
    });

    it('has nothing after the last leg', () => {
      const only = build({ segments: [{ start: at(0).toISOString(), end: at(60).toISOString(), kind: 'run', leg: 1, km: 11, from: place(0), to: place(100) }] });
      expect(only.legs.check(only.schedule.segments[0], ctx(30, 104, { vehicleWaiting: vehicle }))).toBeNull();
    });

    it('ignores a vehicle off the course or near the start, and any at the finish', () => {
      expect(legs.vehicleWaiting(leg1, offCourse(105, 2))).toBeNull();
      expect(legs.vehicleWaiting(leg2, offCourse(150, 0))).toBeNull();
      expect(legs.vehicleWaiting(leg2, offCourse(260, 0))).toBe(260);
      expect(legs.check(finish, ctx(340, 490, { vehicleWaiting: { ...offCourse(495, 0), time: at(340) } }))).toMatchObject({ state: 'running', end: 500 });
    });
  });

  it('looks for the runner no further than a leg\'s length past its end', () => {
    expect(legs.position(leg1, fixAt(400, at(0)))).toBe(200);
    expect(legs.position(finish, fixAt(10, at(0)))).toBe(300);
  });
});
