import { describe, expect, it, vi } from 'vitest';
import { Journey } from '../../src/domain/journey.js';
import { DrivePieces, RunPieces, StopPieces } from '../../src/domain/journey-pieces.js';
import { at, makeRelay, offCourse, point } from '../fixtures/relay.js';

const fakeRouter = (roads = {}) => ({
  get: vi.fn((a, b) => roads[`${a.name ?? 'x'}>${b.name ?? 'x'}`] ?? null),
  trip: vi.fn(() => null),
});

describe('Journey', () => {
  const { schedule, states } = makeRelay();

  it('asks each kind\'s builder for its pieces, saying what is done and what is to come', () => {
    const seen = [];
    const builder = { pieces: (seg, i, ctx) => { seen.push([i, ctx.done, ctx.todo, ctx.nowAt]); return [{ i }]; } };
    const journey = new Journey(schedule, { run: builder, drive: builder, sleep: builder, free: builder });
    const pieces = journey.pieces(at(100), states.of(schedule.segments[2], 'planned'), null);
    expect(pieces).toHaveLength(7);
    expect(seen[1]).toEqual([1, true, false, 2]);
    expect(seen[2]).toEqual([2, false, false, 2]);
    expect(seen[3]).toEqual([3, false, true, 2]);
  });

  it('refuses a kind it cannot draw', () => {
    const journey = new Journey(schedule, {});
    expect(() => journey.pieces(at(0), states.outside(at(-1)), null)).toThrow('No way to draw a "run" segment');
  });
});

describe('RunPieces', () => {
  const { schedule, course } = makeRelay();
  const leg = schedule.segments[0];
  const run = new RunPieces(course);

  it('draws a finished or future leg whole, faded when it is to come', () => {
    expect(run.pieces(leg, 0, { done: true, todo: false })).toEqual([{ kind: 'run', path: course.slice(0, 100), faded: false }]);
    expect(run.pieces(leg, 0, { done: false, todo: true })[0].faded).toBe(true);
  });

  it('splits the leg going on at where the runner has reached', () => {
    const [done, todo] = run.pieces(leg, 0, { now: at(30), act: { reached: 40, end: 90 }, done: false, todo: false });
    expect(done.path).toEqual(course.slice(0, 40));
    expect(todo).toEqual({ kind: 'run', path: course.slice(40, 90), faded: true });
  });

  it('splits by time when there is no tracker', () => {
    const [done, todo] = run.pieces(leg, 0, { now: at(30), act: {}, done: false, todo: false });
    // Half the time gone, so about half of the leg's hundred points done.
    expect(done.path.length).toBeGreaterThanOrEqual(51);
    expect(done.path.length).toBeLessThanOrEqual(52);
    expect(todo.path.at(-1)).toEqual(point(100));
  });
});

describe('DrivePieces', () => {
  const { schedule, course, tuning } = makeRelay();
  const segs = schedule.segments;
  const drive = segs[1];

  it('draws a drive on the road, or straight when the road is not known yet', () => {
    const road = [drive.from, { lat: 50.12, lng: 4.02 }, drive.to];
    const pieces = new DrivePieces(course, fakeRouter({ 'Town A>Hotel': road }), tuning);
    expect(pieces.pieces(drive, 1, { act: {}, segs, nowAt: 4, done: true, todo: false })).toEqual([{ kind: 'drive', path: road, faded: false }]);
    const straight = new DrivePieces(course, fakeRouter(), tuning);
    expect(straight.pieces(drive, 1, { act: {}, segs, nowAt: 0, done: false, todo: true })).toEqual([{ kind: 'drive', path: [drive.from, drive.to], faded: true }]);
  });

  it('starts the drive after the leg going on where that leg really ends', () => {
    const router = fakeRouter();
    const pieces = new DrivePieces(course, router, tuning);
    const [piece] = pieces.pieces(drive, 1, { act: { end: 105 }, segs, nowAt: 0, done: false, todo: true });
    expect(piece.path[0]).toMatchObject({ name: 'Town A', ...point(105) });
    const [same] = pieces.pieces(drive, 1, { act: { end: 100 }, segs, nowAt: 0, done: false, todo: true });
    expect(same.path[0]).toBe(drive.from);
    const [other] = pieces.pieces(segs[3], 3, { act: { end: 105 }, segs, nowAt: 2, done: false, todo: true });
    expect(other.path[0]).toBe(segs[3].from);
    const [before] = pieces.pieces(drive, 1, { act: { end: 105 }, segs, nowAt: -1, done: false, todo: true });
    expect(before.path[0]).toBe(drive.from);
  });

  it('draws the drive going on behind and ahead of a vehicle on the road', () => {
    const road = [drive.from, { lat: 50.12, lng: 4.02 }, drive.to];
    const pieces = new DrivePieces(course, fakeRouter({ 'Town A>Hotel': road }), tuning);
    const vehicle = { lat: 50.121, lng: 4.021 };
    const [behind, ahead] = pieces.pieces(drive, 1, { act: {}, vehicle, segs, nowAt: 1, done: false, todo: false });
    expect(behind).toEqual({ kind: 'drive', path: [road[0], road[1], vehicle], faded: false });
    expect(ahead).toEqual({ kind: 'drive', path: [vehicle, road[2]], faded: true });
  });

  it('routes again through a vehicle that has left the guessed road', () => {
    const vehicle = offCourse(120, 5);
    const behindRoad = [drive.from, { lat: 50.11, lng: 4.07 }];
    const aheadRoad = [{ lat: 50.12, lng: 4.07 }, drive.to];
    const router = fakeRouter();
    router.get.mockImplementation((a, b) => (b.name === 'Hotel' ? null : behindRoad));
    router.trip.mockReturnValue({ path: aheadRoad });
    const [behind, ahead] = new DrivePieces(course, router, tuning).soFar(drive, vehicle);
    expect(behind.path).toEqual([...behindRoad, vehicle]);
    expect(ahead.path).toEqual([vehicle, ...aheadRoad]);
    expect(router.trip).toHaveBeenCalledWith({ lat: +vehicle.lat.toFixed(2), lng: +vehicle.lng.toFixed(2) }, drive.to, { live: true });
  });

  it('joins a vehicle off the road straight to the ends while no route is known', () => {
    const vehicle = offCourse(120, 5);
    const [behind, ahead] = new DrivePieces(course, fakeRouter(), tuning).soFar(drive, vehicle);
    expect(behind.path).toEqual([drive.from, vehicle]);
    expect(ahead.path).toEqual([vehicle, drive.to]);
  });
});

describe('StopPieces', () => {
  it('draws a stop as a titled dot', () => {
    const seg = { kind: 'sleep', at: { name: 'Hotel', lat: 1, lng: 2 } };
    const stops = new StopPieces({ describe: (s) => `at ${s.at.name}` });
    expect(stops.pieces(seg, 2, { todo: true })).toEqual([{ kind: 'sleep', spot: seg.at, faded: true, title: 'at Hotel' }]);
  });
});
