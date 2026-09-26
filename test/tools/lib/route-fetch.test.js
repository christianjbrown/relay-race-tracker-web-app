import { describe, expect, it, vi } from 'vitest';
import { RouteFetch } from '../../../tools/lib/route-fetch.js';
import { decodePolyline } from '../../../src/domain/geo.js';
import { formatRoute } from '../../../tools/lib/route-file.js';

// Two real encoded polylines: Google's example course, and its first point alone.
const A = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
const B = '_p~iF~ps|U';

function files(overrides = {}) {
  return {
    readText: vi.fn(async () => JSON.stringify({ chronorace: { eventId: '42' } })),
    write: vi.fn(async () => {}),
    ...overrides,
  };
}

describe('RouteFetch', () => {
  it('throws when config.json has no chronorace.eventId', async () => {
    const f = files({ readText: vi.fn(async () => JSON.stringify({})) });
    const rf = new RouteFetch(f, () => {}, vi.fn());
    await expect(rf.run({ site: 'site' })).rejects.toThrow('has no chronorace.eventId');
  });

  it('throws when the event has no tracks', async () => {
    const feedFor = vi.fn(() => ({ config: async () => ({ Tracks: [] }) }));
    const rf = new RouteFetch(files(), feedFor, vi.fn());
    await expect(rf.run({ site: 'site' })).rejects.toThrow('has no course');
  });

  it('picks the first track when none named and none index-given', async () => {
    const tracks = [{ Name: 'A', Polylines: [A] }, { Name: 'B', Polylines: [B] }];
    const feedFor = vi.fn(() => ({ config: async () => ({ Tracks: tracks }) }));
    const log = vi.fn();
    const f = files();
    const rf = new RouteFetch(f, feedFor, log);
    await rf.run({ site: 'site' });
    expect(f.write).toHaveBeenCalledWith('site/route.json', formatRoute(decodePolyline(A)));
    expect(log).toHaveBeenCalledWith(expect.stringContaining('2 courses (A, B)'));
  });

  it('picks a track by name', async () => {
    const tracks = [{ Name: 'A', Polylines: [A] }, { Name: 'B', Polylines: [B] }];
    const feedFor = vi.fn(() => ({ config: async () => ({ Tracks: tracks }) }));
    const f = files();
    const rf = new RouteFetch(f, feedFor, vi.fn());
    await rf.run({ site: 'site', track: 'B' });
    expect(f.write).toHaveBeenCalledWith('site/route.json', formatRoute(decodePolyline(B)));
  });

  it('picks a track by index', async () => {
    const tracks = [{ Name: 'A', Polylines: [A] }, { Name: 'B', Polylines: [B] }];
    const feedFor = vi.fn(() => ({ config: async () => ({ Tracks: tracks }) }));
    const f = files();
    const rf = new RouteFetch(f, feedFor, vi.fn());
    await rf.run({ site: 'site', track: '1' });
    expect(f.write).toHaveBeenCalledWith('site/route.json', formatRoute(decodePolyline(B)));
  });

  it('throws for an unknown track', async () => {
    const tracks = [{ Name: 'A', Polylines: [A] }];
    const feedFor = vi.fn(() => ({ config: async () => ({ Tracks: tracks }) }));
    const rf = new RouteFetch(files(), feedFor, vi.fn());
    await expect(rf.run({ site: 'site', track: 'Z' })).rejects.toThrow('no course called "Z". It has: A');
  });

  it('does not log a note when a track was chosen explicitly', async () => {
    const tracks = [{ Name: 'A', Polylines: [A] }, { Name: 'B', Polylines: [B] }];
    const feedFor = vi.fn(() => ({ config: async () => ({ Tracks: tracks }) }));
    const log = vi.fn();
    const rf = new RouteFetch(files(), feedFor, log);
    await rf.run({ site: 'site', track: 'A' });
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Wrote'));
  });

  it('defaults Tracks to an empty list when missing', async () => {
    const feedFor = vi.fn(() => ({ config: async () => ({}) }));
    const rf = new RouteFetch(files(), feedFor, vi.fn());
    await expect(rf.run({ site: 'site' })).rejects.toThrow('has no course');
  });
});
