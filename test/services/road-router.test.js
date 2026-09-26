import { describe, expect, it, vi } from 'vitest';
import { RoadRouter } from '../../src/services/road-router.js';

const a = { name: 'A', lat: 50.123456, lng: 4.1 };
const b = { name: 'B', lat: 50.2, lng: 4.2 };
const trip = { path: [{ lat: 50.1234567, lng: 4.1 }, { lat: 50.2, lng: 4.2 }], seconds: 600, metres: 9000 };

function router({ answer = () => Promise.resolve(trip), stored = null } = {}) {
  const gateway = { route: vi.fn(answer) };
  const storage = { read: vi.fn(() => stored), write: vi.fn() };
  const clock = { now: () => new Date('2027-05-15T10:00:00Z') };
  const logger = { error: vi.fn() };
  return { r: new RoadRouter(gateway, storage, clock, logger), gateway, storage, logger };
}

describe('RoadRouter', () => {
  it('keys a trip by its ends to four decimals, and live trips apart', () => {
    const { r } = router();
    expect(r.key(a, b, false)).toBe('50.1235,4.1000,50.2000,4.2000');
    expect(r.key(a, b, true)).toBe('50.1235,4.1000,50.2000,4.2000:live');
  });

  it('asks once for a road it does not know, and has it ready afterwards', async () => {
    const { r, gateway, storage } = router();
    const ready = vi.fn();
    r.onReady(ready);
    expect(r.get(a, b)).toBeNull();
    expect(r.get(a, b)).toBeNull();
    expect(gateway.route).toHaveBeenCalledTimes(1);
    expect(gateway.route).toHaveBeenCalledWith({ origin: { lat: a.lat, lng: a.lng }, destination: { lat: b.lat, lng: b.lng }, departureTime: null });
    await gateway.route.mock.results[0].value;
    await Promise.resolve();
    expect(ready).toHaveBeenCalled();
    expect(r.get(a, b)).toBe(trip.path);
    expect(storage.write).toHaveBeenCalledWith(`trip:${r.key(a, b, false)}`, { ...trip, path: [[50.12346, 4.1], [50.2, 4.2]] });
  });

  it('asks for live traffic from now, and keeps live trips out of storage', async () => {
    const { r, gateway, storage } = router();
    expect(r.trip(a, b, { live: true })).toBeNull();
    expect(storage.read).not.toHaveBeenCalled();
    expect(gateway.route.mock.calls[0][0].departureTime).toEqual(new Date('2027-05-15T10:00:00Z'));
    await gateway.route.mock.results[0].value;
    await Promise.resolve();
    expect(storage.write).not.toHaveBeenCalled();
    expect(r.trip(a, b, { live: true })).toBe(trip);
  });

  it('takes a stored road without asking', () => {
    const { r, gateway } = router({ stored: { path: [[50, 4], [51, 5]], seconds: 5, metres: 6 } });
    expect(r.trip(a, b)).toEqual({ path: [{ lat: 50, lng: 4 }, { lat: 51, lng: 5 }], seconds: 5, metres: 6 });
    expect(r.trip(a, b).seconds).toBe(5);
    expect(gateway.route).not.toHaveBeenCalled();
  });

  it('logs a failed request and asks again next time', async () => {
    const { r, gateway, logger } = router({ answer: () => Promise.reject(new Error('Directions answered ZERO_RESULTS')) });
    r.get(a, b);
    await r.request('x', a, b, false);
    expect(logger.error).toHaveBeenCalledWith('Directions request failed for A → B: Directions answered ZERO_RESULTS');
    r.get(a, b);
    expect(gateway.route).toHaveBeenCalledTimes(3);
  });

  it('names an unnamed place by its key in the log', async () => {
    const { r, logger } = router({ answer: () => Promise.reject(new Error('no')) });
    await r.request('the-key', { lat: 1, lng: 2 }, { lat: 3, lng: 4 }, false);
    expect(logger.error).toHaveBeenCalledWith('Directions request failed for the-key → : no');
  });
});
