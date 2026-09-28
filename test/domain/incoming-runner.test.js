import { describe, expect, it } from 'vitest';
import { IncomingRunner } from '../../src/domain/incoming-runner.js';
import { at, fixAt, KM_PER_POINT, makeRelay } from '../fixtures/relay.js';

describe('IncomingRunner', () => {
  const { schedule, course, tuning, states } = makeRelay();
  const segs = schedule.segments;
  const incoming = new IncomingRunner(schedule, course, tuning);
  const driving = states.of(segs[3], 'planned');

  it('places the runner coming in while ours is driven to a leg', () => {
    expect(incoming.place(driving, fixAt(150, at(220)), at(220))).toEqual({ leg: segs[4], index: 4, at: 150, time: at(220), notBefore: null });
  });

  it('places the runner coming in while ours waits at a stop before a leg, no earlier than the stop ends', () => {
    expect(incoming.place(states.of(segs[5], 'planned'), fixAt(400, at(310)), at(310)))
      .toEqual({ leg: segs[6], index: 6, at: 400, time: at(310), notBefore: segs[5].end });
  });

  it('has nothing to place away from a drive or a stop that leads to a leg', () => {
    expect(incoming.place(states.of(segs[2], 'planned'), fixAt(150, at(100)), at(100))).toBeNull();
    expect(incoming.place(states.of(segs[1], 'planned'), fixAt(150, at(70)), at(70))).toBeNull();
    expect(incoming.place(states.of(segs[4], 'running'), fixAt(250, at(270)), at(270))).toBeNull();
    expect(incoming.place(states.outside(at(-10)), fixAt(0, at(-10)), at(-10))).toBeNull();
  });

  it('has nothing to place without a fresh runner fix', () => {
    expect(incoming.place(driving, null, at(220))).toBeNull();
    expect(incoming.place(driving, fixAt(150, at(220), 20), at(220))).toBeNull();
  });

  it('times the runner coming in to the start of the leg from their last fix', () => {
    const arrival = incoming.arrival({ leg: segs[4], at: 150, time: at(215) }, 10);
    expect(arrival.getTime()).toBeCloseTo(at(215).getTime() + ((50 * KM_PER_POINT) / 10) * 3600000, -3);
  });

  it('keeps a stop going until its planned end when the runner coming in is early', () => {
    expect(incoming.arrival({ leg: segs[6], at: 480, time: at(310), notBefore: segs[5].end }, 10)).toEqual(segs[5].end);
  });

  it('ends a stop when the runner coming in gets there, if that is after its planned end', () => {
    const arrival = incoming.arrival({ leg: segs[6], at: 380, time: at(310), notBefore: segs[5].end }, 10);
    expect(arrival.getTime()).toBeCloseTo(at(310).getTime() + ((100 * KM_PER_POINT) / 10) * 3600000, -3);
  });

  it('says the time of the fix once the runner coming in is at or past the start', () => {
    expect(incoming.arrival({ leg: segs[4], at: 210, time: at(220) }, 10)).toEqual(at(220));
  });
});
