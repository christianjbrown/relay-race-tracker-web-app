import { describe, expect, it, vi } from 'vitest';
import { DriveEta } from '../../src/domain/drive-eta.js';
import { at } from '../fixtures/relay.js';

describe('DriveEta', () => {
  const seg = { from: { lat: 50, lng: 4 }, to: { lat: 51, lng: 5 } };
  const vehicle = { lat: 50.456, lng: 4.567 };

  it('waits for Google\'s estimate from where the vehicle is', () => {
    const router = { trip: vi.fn(() => null) };
    expect(new DriveEta(router).estimate(seg, vehicle, at(0))).toBeNull();
    expect(router.trip).toHaveBeenCalledWith({ lat: 50.46, lng: 4.57 }, seg.to, { live: true });
  });

  it('gives the arrival and how much of the drive is behind', () => {
    const router = { trip: vi.fn((a, b, opts) => (opts?.live ? { seconds: 600, metres: 2500 } : { metres: 10000 })) };
    const eta = new DriveEta(router).estimate(seg, vehicle, at(0));
    expect(eta.arrival).toEqual(at(10));
    expect(eta.share).toBe(0.75);
  });

  it('holds the share between 0 and 1, and leaves it out without the whole drive', () => {
    const longer = { trip: (a, b, opts) => (opts?.live ? { seconds: 60, metres: 20000 } : { metres: 10000 }) };
    expect(new DriveEta(longer).estimate(seg, vehicle, at(0)).share).toBe(0);
    const partial = { trip: (a, b, opts) => (opts?.live ? { seconds: 60, metres: 1 } : null) };
    expect(new DriveEta(partial).estimate(seg, vehicle, at(0)).share).toBeNull();
  });
});
