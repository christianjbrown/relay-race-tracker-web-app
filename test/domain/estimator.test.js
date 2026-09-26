import { describe, expect, it } from 'vitest';
import { DriveGuess, Estimator, RunGuess, StopGuess } from '../../src/domain/estimator.js';
import { at, makeRelay, point } from '../fixtures/relay.js';

describe('Estimator', () => {
  const { schedule, course } = makeRelay();
  const road = { get: () => null };
  const estimator = new Estimator(schedule, course, { run: new RunGuess(course), drive: new DriveGuess(road), sleep: new StopGuess(), free: new StopGuess() });

  it('puts the runner at the start before the relay and the finish after it', () => {
    expect(estimator.at(at(-5))).toEqual({ ...point(0), time: at(-5), estimated: true });
    expect(estimator.at(at(999))).toMatchObject(point(500));
  });

  it('divides a leg\'s time equally along it', () => {
    expect(estimator.at(at(30)).lat).toBeCloseTo(point(50).lat, 2);
  });

  it('divides a drive\'s time along its road, or straight without one', () => {
    const p = estimator.at(at(75));
    expect(p.lat).toBeCloseTo((point(100).lat + 50.15) / 2, 6);
    const drive = schedule.segments[1];
    const path = [drive.from, { lat: 50.1, lng: 4.05 }, drive.to];
    expect(new DriveGuess({ get: () => path }).at(drive, 0.999)).toMatchObject({ lng: expect.closeTo(4.05, 3) });
  });

  it('puts the runner at the stop during a rest or free time', () => {
    expect(estimator.at(at(100))).toEqual({ lat: 50.15, lng: 4.05, time: at(100), estimated: true });
  });

  it('refuses a kind it cannot place', () => {
    expect(() => new Estimator(schedule, course, {}).at(at(30))).toThrow('No way to place a "run" segment');
  });
});
