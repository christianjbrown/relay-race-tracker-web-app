import { describe, expect, it } from 'vitest';
import { Course } from '../../src/domain/course.js';
import { KM_PER_POINT, makeCourse, point } from '../fixtures/relay.js';

describe('Course', () => {
  const course = makeCourse();

  it('needs at least two points', () => {
    expect(() => new Course([point(0)])).toThrow('at least two points');
  });

  it('measures the distance along it', () => {
    expect(course.km[0]).toBe(0);
    expect(course.km[100]).toBeCloseTo(100 * KM_PER_POINT, 3);
    expect(course.totalKm).toBeCloseTo(500 * KM_PER_POINT, 3);
    expect(course.lastIndex).toBe(500);
  });

  it('finds the nearest point, within a range', () => {
    expect(course.nearestIndex({ lat: 50.1004, lng: 4.001 })).toBe(100);
    expect(course.nearestIndex(point(50), 100, 200)).toBe(100);
    expect(course.nearestIndex(point(450), 100, 200)).toBe(200);
  });

  it('finds the first point at least a distance along', () => {
    expect(course.indexAtKm(0)).toBe(0);
    expect(course.indexAtKm(KM_PER_POINT * 10.5)).toBe(11);
    expect(course.indexAtKm(10000)).toBe(500);
  });

  it('measures between points, negative going back', () => {
    expect(course.between(10, 20)).toBeCloseTo(10 * KM_PER_POINT, 3);
    expect(course.between(20, 10)).toBeCloseTo(-10 * KM_PER_POINT, 3);
  });

  it('slices either way round, ends included', () => {
    expect(course.slice(3, 5)).toEqual([point(3), point(4), point(5)]);
    expect(course.slice(5, 3)).toEqual([point(3), point(4), point(5)]);
  });

  it('gives a copy of a point', () => {
    const p = course.at(7);
    expect(p).toEqual(point(7));
    expect(p).not.toBe(course.points[7]);
  });
});
