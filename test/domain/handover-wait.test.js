import { describe, expect, it } from 'vitest';
import { HandoverWait } from '../../src/domain/handover-wait.js';
import { at, fixAt, KM_PER_POINT, makeRelay, offCourse } from '../fixtures/relay.js';

describe('HandoverWait', () => {
  const relay = makeRelay();
  const { schedule, course, states, tuning } = relay;
  const segs = schedule.segments;
  const wait = new HandoverWait(schedule, course, states, tuning);
  const ctx = (minutes, extra) => ({ now: at(minutes), planned: schedule.at(at(minutes)), paceKmh: 9, runner: null, vehicle: null, ...extra });

  it('knows which leg is coming', () => {
    expect(wait.upcoming(segs[4])).toBe(segs[4]);
    expect(wait.upcoming(segs[3])).toBe(segs[4]);
    expect(wait.upcoming(segs[1])).toBeNull();
    expect(wait.upcoming(segs[2])).toBeNull();
    expect(wait.upcoming(null)).toBeNull();
  });

  it('has nothing to say without a runner or a leg coming', () => {
    expect(wait.check(ctx(245))).toBeNull();
    expect(wait.check(ctx(100, { runner: fixAt(150, at(100)) }))).toBeNull();
  });

  it('keeps the runner waiting while the runner coming in is short of the start', () => {
    const r = wait.check(ctx(245, { runner: fixAt(150, at(245)) }));
    expect(r.state).toMatchObject({ seg: segs[4], state: 'waiting', reached: 200, at: 150, wait: { handover: 200 } });
    const hours = (50 * KM_PER_POINT) / 9;
    expect(r.state.wait.eta.getTime()).toBeCloseTo(at(245).getTime() + hours * 3600000, -3);
  });

  it('uses the pace it is given for the time the runner will arrive', () => {
    const r = wait.check(ctx(245, { runner: fixAt(150, at(245)), paceKmh: 18 }));
    expect(r.state.wait.eta.getTime()).toBeCloseTo(at(245).getTime() + ((50 * KM_PER_POINT) / 18) * 3600000, -3);
  });

  it('lets the leg start once the runner coming in reaches the start', () => {
    expect(wait.check(ctx(245, { runner: fixAt(199, at(245)) }))).toBeNull();
  });

  it('starts the leg early when the runner arrives during the drive to it', () => {
    expect(wait.check(ctx(220, { runner: fixAt(199, at(220)) }))).toEqual({ leg: segs[4] });
  });

  it('says nothing during the drive while the runner is still far off and no vehicle is waiting', () => {
    expect(wait.check(ctx(220, { runner: fixAt(150, at(220)) }))).toBeNull();
  });

  describe('at the finish', () => {
    const finish = segs[6];

    it('waits for the last runner while the finish is due', () => {
      expect(wait.check(ctx(335, { runner: fixAt(450, at(335)) })).state).toMatchObject({ seg: finish, state: 'waiting', wait: { handover: 480 } });
    });

    it('keeps waiting past the end of the timeline while the last runner is still coming in', () => {
      const r = wait.check(ctx(360, { leg: finish, runner: fixAt(450, at(360)) }));
      expect(r.state).toMatchObject({ seg: finish, state: 'waiting' });
    });

    it('lets them run in once the last runner reaches the start, however late', () => {
      expect(wait.check(ctx(360, { leg: finish, runner: fixAt(480, at(360)) }))).toBeNull();
    });

    it('has nothing to wait for past the end of the timeline without the finish in play', () => {
      expect(wait.check(ctx(360, { leg: null, runner: fixAt(450, at(360)) }))).toBeNull();
      expect(wait.overdueFinish(segs[5], finish)).toBeNull();
      expect(wait.overdueFinish(null, segs[4])).toBeNull();
    });
  });

  it('takes the parked vehicle as the handover point near the start', () => {
    const vehicle = { ...offCourse(190, 0.1), time: at(220), parked: true };
    const r = wait.check(ctx(220, { runner: fixAt(150, at(220)), vehicle }));
    expect(r.state).toMatchObject({ state: 'waiting', wait: { handover: 190 } });
  });

  it('counts the runner reaching the parked vehicle as the handover', () => {
    const vehicle = { ...offCourse(190, 0.1), time: at(245), parked: true };
    expect(wait.check(ctx(245, { runner: fixAt(189, at(245)), vehicle }))).toBeNull();
    expect(wait.check(ctx(220, { runner: fixAt(189, at(220)), vehicle }))).toEqual({ leg: segs[4] });
  });

  it('ignores a vehicle that is not parked, or is parked off the course', () => {
    const moving = { ...offCourse(190, 0), time: at(245), parked: false };
    expect(wait.check(ctx(245, { runner: fixAt(150, at(245)), vehicle: moving })).state.wait.handover).toBe(200);
    expect(wait.vehicleAtStart(segs[4], { ...offCourse(190, 2) })).toBeNull();
  });

  it('only looks for the vehicle within three kilometres of the leg\'s start', () => {
    expect(wait.vehicleAtStart(segs[4], offCourse(225, 0))).toBe(225);
    expect(wait.vehicleAtStart(segs[4], offCourse(260, 0))).toBeNull();
  });
});
