import { describe, expect, it } from 'vitest';
import { Activity } from '../../src/domain/activity.js';
import { DriveArrival } from '../../src/domain/drive-arrival.js';
import { HandoverWait } from '../../src/domain/handover-wait.js';
import { LateFinish } from '../../src/domain/late-finish.js';
import { LegProgress } from '../../src/domain/leg-progress.js';
import { at, fixAt, makeRelay } from '../fixtures/relay.js';

function activity(options) {
  const { schedule, course, states, tuning } = makeRelay(options);
  const act = new Activity(schedule, states, {
    waits: new HandoverWait(schedule, course, states, tuning),
    legs: new LegProgress(schedule, course, states, tuning),
    arrivals: new DriveArrival(schedule, states, tuning),
    lateFinish: new LateFinish(schedule, states),
  }, tuning);
  return { act, segs: schedule.segments };
}

describe('Activity', () => {
  const { act, segs } = activity();

  it('is before or finished outside the timeline', () => {
    expect(act.at(at(-10)).state).toBe('before');
    expect(act.at(at(1000)).state).toBe('finished');
  });

  it('follows the timeline when there is no tracker', () => {
    expect(act.at(at(100))).toMatchObject({ seg: segs[2], state: 'planned' });
    expect(act.at(at(30))).toMatchObject({ seg: segs[0], state: 'planned' });
  });

  it('follows the runner tracker on a leg', () => {
    expect(act.at(at(30), { runner: fixAt(40, at(30)) })).toMatchObject({ seg: segs[0], state: 'running', at: 40 });
  });

  it('ignores a stale runner fix', () => {
    expect(act.at(at(30), { runner: fixAt(40, at(30), 20) })).toMatchObject({ state: 'planned' });
  });

  it('waits for the runner coming in', () => {
    expect(act.at(at(245), { runner: fixAt(150, at(245)) })).toMatchObject({ seg: segs[4], state: 'waiting' });
  });

  it('starts a leg early when the runner arrives during the drive', () => {
    expect(act.at(at(225), { runner: fixAt(205, at(225)) })).toMatchObject({ seg: segs[4], state: 'running' });
  });

  it('keeps a leg going past its time while the tracker is short of the end', () => {
    expect(act.at(at(65), { runner: fixAt(80, at(65)) })).toMatchObject({ seg: segs[0], state: 'overrun' });
  });

  it('lets a long-running leg go after four hours', () => {
    const late = activity({
      segments: [
        { start: at(0).toISOString(), end: at(60).toISOString(), kind: 'run', leg: 1, km: 11, from: { name: 'A', lat: 50, lng: 4 }, to: { name: 'B', lat: 50.1, lng: 4 } },
        { start: at(60).toISOString(), end: at(600).toISOString(), kind: 'free' },
      ],
    });
    expect(late.act.at(at(299), { runner: fixAt(80, at(299)) }).state).toBe('overrun');
    expect(late.act.at(at(300), { runner: fixAt(80, at(300)) })).toMatchObject({ seg: late.segs[1], state: 'planned' });
  });

  it('falls back on the clock once a leg is handed over', () => {
    expect(act.at(at(65), { runner: fixAt(99, at(65)) })).toMatchObject({ seg: segs[1], state: 'planned' });
  });

  it('keeps waiting for the last runner after the finish\'s time, then runs them in', () => {
    // Its own page: seeing the wait is what makes the finish that follows a late one.
    const { act: page, segs: s } = activity();
    expect(page.at(at(360), { runner: fixAt(450, at(360)) })).toMatchObject({ seg: s[6], state: 'waiting' });
    expect(page.at(at(365), { runner: fixAt(485, at(365)) })).toMatchObject({ seg: s[6], state: 'running' });
  });

  it('gives a finish that set off late its full planned time before calling it over', () => {
    const { act: late, segs: s } = activity();
    // The finish is due at 330 and planned to take 15 minutes; the last runner reaches its start at 360.
    expect(late.at(at(355), { runner: fixAt(450, at(355)) })).toMatchObject({ seg: s[6], state: 'waiting' });
    expect(late.at(at(360), { runner: fixAt(500, at(360)) })).toMatchObject({ seg: s[6], state: 'running' });
    expect(late.at(at(374), { runner: fixAt(500, at(374)) })).toMatchObject({ seg: s[6], state: 'running' });
    expect(late.at(at(375), { runner: fixAt(500, at(375)) }).state).toBe('finished');
  });

  it('is finished once the finish is handed over after its time', () => {
    expect(act.at(at(350), { runner: fixAt(500, at(350)) }).state).toBe('finished');
  });

  it('keeps a drive going until the vehicle arrives', () => {
    const vehicle = { lat: 50.2, lng: 4.05, time: at(95), parked: false };
    expect(act.at(at(95), { vehicle })).toMatchObject({ seg: segs[1], state: 'overrun' });
    const stale = { ...vehicle, time: at(60) };
    expect(act.at(at(95), { vehicle: stale })).toMatchObject({ seg: segs[2], state: 'planned' });
  });

  it('uses a vehicle waiting at the end of the leg', () => {
    const waiting = { lat: 50.105, lng: 4, time: at(30) };
    expect(act.at(at(30), { runner: fixAt(50, at(30)), vehicleWaiting: waiting })).toMatchObject({ end: 105 });
  });
});
