import { describe, expect, it } from 'vitest';
import { decodePolyline } from '../../../src/domain/geo.js';
import { formatRoute, publishedRoute, readRoute } from '../../../tools/lib/route-file.js';

const points = [{ lat: 51.2254, lng: 2.9186 }, { lat: -33.86785, lng: 151.20732 }];

describe('formatRoute', () => {
  it('writes one point per line, and reads back as the same route', () => {
    const text = formatRoute('Course "A"', points);
    expect(text).toBe('{\n  "name": "Course \\"A\\"",\n  "points": [\n    { "lat": 51.2254, "lng": 2.9186 },\n    { "lat": -33.86785, "lng": 151.20732 }\n  ]\n}\n');
    expect(JSON.parse(text)).toEqual({ name: 'Course "A"', points });
  });
});

describe('readRoute', () => {
  it('gives back the name and points', () => {
    expect(readRoute({ name: 'A', points }, 'r.json')).toEqual({ name: 'A', points });
    expect(readRoute({ points }, 'r.json').name).toBe('');
  });

  it('needs at least two points', () => {
    expect(() => readRoute(null, 'r.json')).toThrow('r.json needs "points"');
    expect(() => readRoute({ polylines: ['x'] }, 'r.json')).toThrow('needs "points"');
    expect(() => readRoute({ points: [points[0]] }, 'r.json')).toThrow('at least two');
  });

  it('says which point is wrong', () => {
    expect(() => readRoute({ points: [points[0], { lat: 91, lng: 0 }] }, 'r.json')).toThrow('r.json: point 2 needs a "lat" between -90 and 90');
    expect(() => readRoute({ points: [points[0], { lat: 0, lng: '4' }] }, 'r.json')).toThrow('point 2');
    expect(() => readRoute({ points: [null, points[0]] }, 'r.json')).toThrow('point 1');
    expect(() => readRoute({ points: [points[0], { lat: NaN, lng: 0 }] }, 'r.json')).toThrow('point 2');
  });
});

describe('publishedRoute', () => {
  it('encodes the points as one polyline that decodes back to them', () => {
    const published = publishedRoute({ name: 'A', points });
    expect(published.name).toBe('A');
    expect(decodePolyline(published.polylines[0])).toEqual(points);
  });
});
