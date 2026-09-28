import { describe, expect, it } from 'vitest';
import { DriveArrival } from '../../src/domain/drive-arrival.js';
import { ActivityStates } from '../../src/domain/activity-states.js';
import { Schedule } from '../../src/domain/schedule.js';
import { at, makeRelay, relaySegments } from '../fixtures/relay.js';

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

  it('gives up on the drive an hour after its planned end', () => {
    const { segs, arrivals } = setup();
    expect(arrivals.check(segs[2], { now: at(90 + 60), vehicle: near(10) })).toBeNull();
    expect(arrivals.check(segs[2], { now: at(90 + 59), vehicle: near(10) })).toMatchObject({ state: 'overrun' });
  });

  it('keeps a drive going while the vehicle is still on the road', () => {
    const { segs, arrivals } = setup();
    expect(arrivals.check(segs[1], { now: at(70), vehicle: near(5) })).toBeNull();
    expect(arrivals.check(segs[1], { now: at(70), vehicle: null })).toBeNull();
  });

  it('starts the stop early once the vehicle is there ahead of time', () => {
    const { segs, arrivals } = setup();
    expect(arrivals.check(segs[1], { now: at(70), vehicle: near(0.1) })).toMatchObject({ seg: segs[2], state: 'planned' });
    expect(arrivals.check(segs[1], { now: at(75), vehicle: near(10) })).toMatchObject({ seg: segs[2], state: 'planned' });
  });

  it('never starts a leg or another drive early', () => {
    const segments = relaySegments();
    const hotel = segments[1].to;
    segments.splice(2, 0, { start: segments[2].start, end: segments[2].start, kind: 'drive', from: hotel, to: hotel });
    const { schedule, states, tuning } = makeRelay({ segments });
    const arrivals = new DriveArrival(schedule, states, tuning);
    const segs = schedule.segments;
    expect(arrivals.check(segs[1], { now: at(70), vehicle: near(0) })).toBeNull();
    expect(arrivals.check(segs[4], { now: at(220), vehicle: { ...segs[4].to, parked: true } })).toBeNull();
    const last = new Schedule([{ start: segments[1].start, end: segments[1].end, kind: 'drive', from: hotel, to: hotel }]);
    expect(new DriveArrival(last, new ActivityStates(last), tuning).check(last.segments[0], { now: at(70), vehicle: near(0) })).toBeNull();
  });
});
