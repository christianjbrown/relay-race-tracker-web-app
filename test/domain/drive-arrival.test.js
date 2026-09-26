import { describe, expect, it } from 'vitest';
import { DriveArrival } from '../../src/domain/drive-arrival.js';
import { at, makeRelay } from '../fixtures/relay.js';

describe('DriveArrival', () => {
  const setup = () => {
    const { schedule, states, tuning } = makeRelay();
    return { segs: schedule.segments, arrivals: new DriveArrival(schedule, states, tuning) };
  };
  const hotel = { lat: 50.15, lng: 4.05 };
  const near = (km, parked = false) => ({ lat: hotel.lat + km / 111.2, lng: hotel.lng, parked });

  it('only speaks for a stop after a drive, with a vehicle to go on', () => {
    const { segs, arrivals } = setup();
    expect(arrivals.check(segs[0], { now: at(10), vehicle: near(5) })).toBeNull();
    expect(arrivals.check(segs[1], { now: at(70), vehicle: near(5) })).toBeNull();
    expect(arrivals.check(segs[5], { now: at(310), vehicle: near(5) })).toBeNull();
    expect(arrivals.check(segs[2], { now: at(100), vehicle: null })).toBeNull();
  });

  it('keeps the drive going until the vehicle is at the door', () => {
    const { segs, arrivals } = setup();
    expect(arrivals.check(segs[2], { now: at(100), vehicle: near(5) })).toMatchObject({ seg: segs[1], state: 'overrun' });
    expect(arrivals.check(segs[2], { now: at(100), vehicle: near(0.1) })).toBeNull();
  });

  it('counts a vehicle parked nearby as arrived, but not one still moving', () => {
    const { segs, arrivals } = setup();
    expect(arrivals.check(segs[2], { now: at(100), vehicle: near(0.8) })).toMatchObject({ state: 'overrun' });
    expect(arrivals.check(segs[2], { now: at(100), vehicle: near(0.8, true) })).toBeNull();
  });

  it('stays arrived when the vehicle goes out again', () => {
    const { segs, arrivals } = setup();
    arrivals.check(segs[2], { now: at(100), vehicle: near(0) });
    expect(arrivals.check(segs[2], { now: at(120), vehicle: near(10) })).toBeNull();
  });

  it('gives up on the drive after four hours', () => {
    const { segs, arrivals } = setup();
    expect(arrivals.check(segs[2], { now: at(90 + 240), vehicle: near(10) })).toBeNull();
    expect(arrivals.check(segs[2], { now: at(90 + 239), vehicle: near(10) })).toMatchObject({ state: 'overrun' });
  });
});
