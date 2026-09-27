import { describe, expect, it } from 'vitest';
import { IncomingRunner } from '../../src/domain/incoming-runner.js';
import { at, fixAt, KM_PER_POINT, makeRelay } from '../fixtures/relay.js';

describe('IncomingRunner', () => {
  const { schedule, course, tuning, states } = makeRelay();
  const segs = schedule.segments;
  const incoming = new IncomingRunner(schedule, course, tuning);
  const driving = states.of(segs[3], 'planned');

  it('places the runner coming in while ours is driven to a leg', () => {
    expect(incoming.place(driving, fixAt(150, at(220)), at(220))).toEqual({ leg: segs[4], index: 4, at: 150, time: at(220) });
  });

  it('has nothing to place away from a drive to a leg', () => {
    expect(incoming.place(states.of(segs[2], 'planned'), fixAt(150, at(100)), at(100))).toBeNull();
    expect(incoming.place(states.of(segs[1], 'planned'), fixAt(150, at(70)), at(70))).toBeNull();
  });

  it('has nothing to place without a fresh runner fix', () => {
    expect(incoming.place(driving, null, at(220))).toBeNull();
    expect(incoming.place(driving, fixAt(150, at(220), 20), at(220))).toBeNull();
  });

  it('times the runner coming in to the start of the leg from their last fix', () => {
    const arrival = incoming.arrival({ leg: segs[4], at: 150, time: at(215) }, 10);
    expect(arrival.getTime()).toBeCloseTo(at(215).getTime() + ((50 * KM_PER_POINT) / 10) * 3600000, -3);
  });

  it('says the time of the fix once the runner coming in is at or past the start', () => {
    expect(incoming.arrival({ leg: segs[4], at: 210, time: at(220) }, 10)).toEqual(at(220));
  });
});
