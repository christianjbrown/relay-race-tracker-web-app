import { describe, expect, it } from 'vitest';
import { LateFinish } from '../../src/domain/late-finish.js';
import { at, makeRelay } from '../fixtures/relay.js';

describe('LateFinish', () => {
  const { schedule, states } = makeRelay();
  const finish = schedule.segments[6]; // 330-345, 15 minutes
  const waiting = states.of(finish, 'waiting', { at: 450 });
  const finished = states.outside(at(400));

  it('leaves everything alone when it never saw the team waiting for the last runner', () => {
    const late = new LateFinish(schedule, states);
    expect(late.hold(finished, at(360))).toBe(finished);
  });

  it('passes the wait itself through', () => {
    expect(new LateFinish(schedule, states).hold(waiting, at(350))).toBe(waiting);
  });

  it('keeps the finish running for its planned time from the moment the wait ended', () => {
    const late = new LateFinish(schedule, states);
    late.hold(waiting, at(355));
    expect(late.hold(finished, at(360))).toMatchObject({ seg: finish, state: 'running' });
    expect(late.hold(finished, at(374))).toMatchObject({ seg: finish, state: 'running' });
    expect(late.hold(finished, at(375))).toBe(finished);
  });

  it('keeps where the runner is on the finish, and calls an overrunning finish running', () => {
    const late = new LateFinish(schedule, states);
    late.hold(waiting, at(355));
    const overrun = states.of(finish, 'overrun', { reached: 490, at: 490, end: 500 });
    expect(late.hold(overrun, at(360))).toMatchObject({ state: 'running', reached: 490, at: 490, end: 500 });
  });

  it('does nothing for a relay without a finish leg', () => {
    const relay = makeRelay({ segments: [{ start: at(0).toISOString(), end: at(60).toISOString(), kind: 'run', leg: 1, km: 11, from: { name: 'A', lat: 50, lng: 4 }, to: { name: 'B', lat: 50.1, lng: 4 } }] });
    const late = new LateFinish(relay.schedule, relay.states);
    const act = relay.states.outside(at(90));
    expect(late.hold(act, at(90))).toBe(act);
  });
});
