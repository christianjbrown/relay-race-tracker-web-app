import { describe, expect, it } from 'vitest';
import { alongPath, bearing, clamp, decodePolyline, encodePolyline, kmApart, lerp, lngScale, nearestOnPath, roundToKm, shareOf } from '../../src/domain/geo.js';

describe('distances', () => {
  it('measures a degree of latitude as 111.2 km', () => {
    expect(kmApart({ lat: 50, lng: 4 }, { lat: 51, lng: 4 })).toBeCloseTo(111.2, 5);
  });

  it('shortens longitude by the cosine of the latitude', () => {
    expect(lngScale(60)).toBeCloseTo(0.5, 10);
    expect(kmApart({ lat: 60, lng: 4 }, { lat: 60, lng: 5 })).toBeCloseTo(55.6, 5);
  });
});

describe('lerp, clamp and shareOf', () => {
  it('interpolates and clamps', () => {
    expect(lerp(10, 20, 0.25)).toBe(12.5);
    expect(clamp(-1, 0, 1)).toBe(0);
    expect(clamp(2, 0, 1)).toBe(1);
    expect(clamp(0.4, 0, 1)).toBe(0.4);
  });

  it('gives how far through a segment a moment is, held between 0 and 1', () => {
    const seg = { start: new Date(1000), end: new Date(2000) };
    expect(shareOf(seg, new Date(1500))).toBe(0.5);
    expect(shareOf(seg, new Date(500))).toBe(0);
    expect(shareOf(seg, new Date(2500))).toBe(1);
  });
});

describe('alongPath', () => {
  const path = [{ lat: 0, lng: 0 }, { lat: 1, lng: 0 }, { lat: 3, lng: 0 }];

  it('returns the only point of a one-point path', () => {
    expect(alongPath([{ lat: 5, lng: 6 }], 0.7)).toEqual({ lat: 5, lng: 6 });
  });

  it('finds the point a share of the way along, across hops', () => {
    expect(alongPath(path, 0)).toEqual({ lat: 0, lng: 0 });
    expect(alongPath(path, 1 / 6).lat).toBeCloseTo(0.5, 10);
    expect(alongPath(path, 0.5).lat).toBeCloseTo(1.5, 10);
    expect(alongPath(path, 1)).toEqual({ lat: 3, lng: 0 });
  });

  it('stops at the end of the last hop', () => {
    expect(alongPath(path, 2)).toEqual({ lat: 3, lng: 0 });
  });

  it('copes with hops of no length', () => {
    expect(alongPath([{ lat: 1, lng: 1 }, { lat: 1, lng: 1 }], 0.5)).toEqual({ lat: 1, lng: 1 });
  });
});

describe('nearestOnPath', () => {
  const path = [{ lat: 50, lng: 4 }, { lat: 50.1, lng: 4 }, { lat: 50.1, lng: 4.2 }];

  it('finds the nearest hop and how far away it is', () => {
    const near = nearestOnPath(path, { lat: 50.05, lng: 4.01 });
    expect(near.index).toBe(0);
    expect(near.km).toBeCloseTo(0.01 * lngScale(50.05) * 111.2, 5);
    expect(nearestOnPath(path, { lat: 50.12, lng: 4.1 }).index).toBe(1);
  });

  it('measures from the end of a hop past it', () => {
    expect(nearestOnPath(path, { lat: 49.9, lng: 4 }).km).toBeCloseTo(11.12, 5);
  });

  it('handles a hop of no length', () => {
    expect(nearestOnPath([{ lat: 50, lng: 4 }, { lat: 50, lng: 4 }], { lat: 50.01, lng: 4 }).km).toBeCloseTo(1.112, 5);
  });

  it('has nothing to say about a single point', () => {
    expect(nearestOnPath([{ lat: 50, lng: 4 }], { lat: 50, lng: 4 })).toEqual({ index: 0, km: Infinity });
  });
});

describe('decodePolyline', () => {
  it('decodes Google\'s example polyline', () => {
    expect(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@')).toEqual([
      { lat: 38.5, lng: -120.2 },
      { lat: 40.7, lng: -120.95 },
      { lat: 43.252, lng: -126.453 },
    ]);
  });

  it('decodes an empty polyline to no points', () => {
    expect(decodePolyline('')).toEqual([]);
  });
});

describe('roundToKm', () => {
  it('rounds to two decimal places of a degree', () => {
    expect(roundToKm({ lat: 50.12345, lng: 4.98765 })).toEqual({ lat: 50.12, lng: 4.99 });
  });
});

describe('encodePolyline', () => {
  it('encodes Google\'s example polyline', () => {
    expect(encodePolyline([{ lat: 38.5, lng: -120.2 }, { lat: 40.7, lng: -120.95 }, { lat: 43.252, lng: -126.453 }])).toBe('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
  });

  it('rounds to five decimal places, and round-trips', () => {
    const points = [{ lat: 51.256864, lng: 6.746099 }, { lat: 0, lng: 0 }, { lat: -0.00001, lng: 179.99999 }];
    expect(decodePolyline(encodePolyline(points))).toEqual([{ lat: 51.25686, lng: 6.7461 }, { lat: 0, lng: 0 }, { lat: -0.00001, lng: 179.99999 }]);
  });

  it('encodes no points as nothing', () => {
    expect(encodePolyline([])).toBe('');
  });
});

describe('bearing', () => {
  it('reads clockwise from north', () => {
    expect(bearing({ lat: 50, lng: 4 }, { lat: 51, lng: 4 })).toBeCloseTo(0, 5);
    expect(bearing({ lat: 50, lng: 4 }, { lat: 50, lng: 5 })).toBeCloseTo(90, 5);
    expect(bearing({ lat: 50, lng: 4 }, { lat: 49, lng: 4 })).toBeCloseTo(180, 5);
    expect(bearing({ lat: 50, lng: 4 }, { lat: 50, lng: 3 })).toBeCloseTo(270, 5);
  });
});
