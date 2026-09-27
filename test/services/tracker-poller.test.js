import { describe, expect, it, vi } from 'vitest';
import { TrackerPoller } from '../../src/services/tracker-poller.js';

const t = (m) => new Date(Date.UTC(2027, 4, 15, 8, m));

function poller({ devices = { RUN: 'r', VAN1: 'v' }, fixes = {}, fail = false } = {}) {
  const feed = {
    devicesByBib: vi.fn(() => (fail ? Promise.reject(new Error('down')) : Promise.resolve(devices))),
    positions: vi.fn(() => Promise.resolve(fixes)),
  };
  const handovers = { observe: vi.fn() };
  const logger = { error: vi.fn() };
  return { p: new TrackerPoller(feed, { runner: 'RUN', vehicle: 'VAN1' }, handovers, logger), feed, handovers, logger };
}

describe('TrackerPoller', () => {
  const fixes = { r: { lat: 1, lng: 1, time: t(0) }, v: { lat: 2, lng: 2, time: t(0) }, o: { lat: 3, lng: 3, time: t(0) } };

  it('takes both trackers and shows the vehicle\'s company to the handover spotter', async () => {
    const { p, feed, handovers } = poller({ fixes });
    await p.poll();
    await p.poll();
    expect(feed.devicesByBib).toHaveBeenCalledTimes(1);
    expect(p.live).toEqual({ runner: fixes.r, vehicle: fixes.v });
    expect(p.guessed.size).toBe(0);
    expect(handovers.observe).toHaveBeenLastCalledWith(fixes.v, [fixes.o]);
  });

  it('estimates a tracker the feed has no position for', async () => {
    const { p, handovers, logger } = poller({ fixes: { r: fixes.r } });
    await p.poll();
    expect([...p.guessed]).toEqual(['vehicle']);
    expect(logger.error).toHaveBeenCalledWith('Chronorace has no position for tracker VAN1; estimating it from the timeline.');
    expect(handovers.observe).not.toHaveBeenCalled();
  });

  it('estimates both when the feed fails, and asks for the devices again next time', async () => {
    const { p, logger } = poller({ fail: true });
    await p.poll();
    expect([...p.guessed].sort()).toEqual(['runner', 'vehicle']);
    expect(p.devices).toBeNull();
    expect(logger.error).toHaveBeenCalledWith('Chronorace request failed; estimating positions from the timeline.', expect.any(Error));
  });

  it('fills in estimates for what it guessed', async () => {
    const { p } = poller({ fixes: { v: fixes.v } });
    await p.poll();
    const guess = { lat: 9, lng: 9, time: t(1), estimated: true };
    p.fillGuesses(guess, t(1), 60000);
    expect(p.live.runner).toBe(guess);
    expect(p.live.vehicle).toBe(fixes.v);
    expect(p.liveRunner()).toBeNull();
  });

  it('keeps a fresh real position through a failed request, and estimates once it is stale', async () => {
    const feed = {
      devicesByBib: vi.fn(() => Promise.resolve({ RUN: 'r', VAN1: 'v' })),
      positions: vi.fn().mockResolvedValueOnce(fixes).mockRejectedValue(new Error('timed out')),
    };
    const p = new TrackerPoller(feed, { runner: 'RUN', vehicle: 'VAN1' }, { observe: vi.fn() }, { error: vi.fn() });
    await p.poll();
    await p.poll();
    expect([...p.guessed].sort()).toEqual(['runner', 'vehicle']);
    const guess = { lat: 9, lng: 9, estimated: true };

    p.fillGuesses(guess, t(1), 5 * 60000);
    expect(p.live).toEqual({ runner: fixes.r, vehicle: fixes.v });
    expect(p.liveVehicle(t(1), 5 * 60000)).toBe(fixes.v);
    expect(p.liveRunner()).toBe(fixes.r);

    p.fillGuesses(guess, t(6), 5 * 60000);
    expect(p.live).toEqual({ runner: guess, vehicle: guess });
    expect(p.liveVehicle(t(6), 5 * 60000)).toBeNull();
    expect(p.liveRunner()).toBeNull();
  });

  it('gives the live vehicle only when it is real and fresh', async () => {
    const { p } = poller({ fixes });
    expect(p.liveVehicle(t(0), 60000)).toBeNull();
    expect(p.liveRunner()).toBeNull();
    await p.poll();
    expect(p.liveVehicle(t(1), 60000)).toBe(fixes.v);
    expect(p.liveVehicle(t(2), 60000)).toBeNull();
    expect(p.liveRunner()).toBe(fixes.r);
  });
});
