import { describe, expect, it } from 'vitest';
import { RunnerProjection } from '../../src/domain/runner-projection.js';
import { at, fixAt, KM_PER_POINT, makeRelay } from '../fixtures/relay.js';

describe('RunnerProjection', () => {
  const { schedule, course, tuning } = makeRelay();
  const projection = new RunnerProjection(schedule, course, tuning);
  const pointsIn = (minutes, kmh) => Math.round((kmh * (minutes / 60)) / KM_PER_POINT);

  it('leaves a recent fix alone', () => {
    const fix = fixAt(150, at(220), 1);
    expect(projection.of(fix, at(220), 10)).toBe(fix);
  });

  it('has nothing to project without a fix', () => {
    expect(projection.of(null, at(220), 10)).toBeNull();
  });

  it('carries a quiet fix on along the course at the pace given', () => {
    const p = projection.of(fixAt(150, at(220), 10), at(220), 10);
    expect(course.nearestIndex(p)).toBeCloseTo(150 + pointsIn(10, 10), -1);
    expect(p.time).toEqual(at(220));
    expect(p.projected).toEqual({ since: at(210), kmh: 10 });
  });

  it('holds short of the next handover', () => {
    const p = projection.of(fixAt(190, at(230), 30), at(230), 10);
    expect(course.km[course.nearestIndex(p)]).toBeCloseTo(course.km[200] - tuning.holdShortKm, 0);
  });

  it('never goes back from the fix when it is already inside the hold', () => {
    const p = projection.of(fixAt(198, at(230), 5), at(230), 10);
    expect(course.nearestIndex(p)).toBe(198);
  });

  it('holds short of the end of our own leg too', () => {
    const p = projection.of(fixAt(290, at(280), 30), at(280), 10);
    expect(course.km[course.nearestIndex(p)]).toBeCloseTo(course.km[300] - tuning.holdShortKm, 0);
  });

  it('holds short of the finish after the last leg has started', () => {
    const p = projection.of(fixAt(499, at(340), 5), at(340), 10);
    expect(course.nearestIndex(p)).toBe(499);
    const end = projection.of(fixAt(490, at(340), 10), at(340), 10);
    expect(course.km[course.nearestIndex(end)]).toBeCloseTo(course.totalKm - tuning.holdShortKm, 0);
  });

  it('stays put at the end of the course', () => {
    expect(course.nearestIndex(projection.of(fixAt(500, at(340), 5), at(340), 10))).toBe(500);
  });

  it('gives up once the tracker has been quiet for too long', () => {
    const fix = fixAt(150, at(220), 61);
    expect(projection.of(fix, at(220), 10)).toBe(fix);
  });

  it('looks for the fix from the start of the course before the first leg', () => {
    expect(projection.whereOnCourse(fixAt(5, at(-10)))).toBe(5);
  });
});
