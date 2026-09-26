import { describe, expect, it, vi } from 'vitest';
import { CHRONORACE_API, ChronoraceFeed } from '../../src/services/chronorace-feed.js';

const answer = (body, status = 200) => Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });

describe('ChronoraceFeed', () => {
  it('reads the event\'s configuration and maps each tracker label to its device', async () => {
    const http = vi.fn(() => answer({ Trackers: { x: { Bib: 'RUN', DeviceId: 'd1' }, y: { Bib: 'VAN1', DeviceId: 'd2' } } }));
    const feed = new ChronoraceFeed('123', http);
    expect(await feed.devicesByBib()).toEqual({ RUN: 'd1', VAN1: 'd2' });
    expect(http).toHaveBeenCalledWith(`${CHRONORACE_API}/config/123`, { cache: 'no-store' });
  });

  it('copes with an event with no trackers', async () => {
    expect(await new ChronoraceFeed('1', () => answer({})).devicesByBib()).toEqual({});
  });

  it('reads the latest fixes, taking times without a zone as UTC', async () => {
    const http = vi.fn(() => answer({
      d1: { Lat: 50.1, Lon: 4.2, Time: '2027-05-15T08:00:00' },
      d2: { Lat: 51, Lon: 5, Time: '2027-05-15T10:00:00+02:00' },
    }));
    const fixes = await new ChronoraceFeed('9', http, 'https://api.test').positions();
    expect(http).toHaveBeenCalledWith('https://api.test/get/9', { cache: 'no-store' });
    expect(fixes.d1).toEqual({ lat: 50.1, lng: 4.2, time: new Date('2027-05-15T08:00:00Z') });
    expect(fixes.d2.time).toEqual(new Date('2027-05-15T08:00:00Z'));
  });

  it('fails on an error answer', async () => {
    await expect(new ChronoraceFeed('9', () => answer(null, 500), 'https://api.test').config()).rejects.toThrow('https://api.test/config/9 answered 500');
  });
});
