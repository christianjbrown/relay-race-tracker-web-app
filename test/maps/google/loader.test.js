import { describe, expect, it } from 'vitest';
import { loadGoogleMaps } from '../../../src/maps/google/loader.js';

function makeWin({ now = 0 } = {}) {
  const scripts = [];
  const timers = [];
  const win = {
    google: undefined,
    document: {
      head: { appendChild: (el) => scripts.push(el) },
      createElement: () => ({}),
    },
    Date: { now: () => win._now },
    setTimeout: (fn) => { timers.push(fn); return timers.length; },
    _now: now,
    _timers: timers,
    _scripts: scripts,
  };
  return win;
}

describe('loadGoogleMaps', () => {
  it('resolves with google.maps once the library is ready', async () => {
    const win = makeWin();
    const promise = loadGoogleMaps(win, { key: 'k', language: 'en', region: 'BE' });

    expect(win._scripts).toHaveLength(1);
    expect(win._scripts[0].src).toContain('key=k');
    expect(win._scripts[0].async).toBe(true);

    win.google = { maps: { Map: function Map() {} } };
    win.__relayTrackerMapsReady();

    await expect(promise).resolves.toBe(win.google.maps);
  });

  it('checks again after a short wait when not yet ready, then resolves', async () => {
    const win = makeWin();
    const promise = loadGoogleMaps(win, { key: 'k', language: 'en', region: 'BE' });

    win.__relayTrackerMapsReady();
    expect(win._timers).toHaveLength(1);

    win.google = { maps: { Map: function Map() {} } };
    win._now += 100;
    win._timers[0]();

    await expect(promise).resolves.toBe(win.google.maps);
  });

  it('gives up after 45 seconds of the callback firing without the library ever existing', async () => {
    const win = makeWin();
    const promise = loadGoogleMaps(win, { key: 'k', language: 'en', region: 'BE' });

    win.__relayTrackerMapsReady();
    expect(win._timers).toHaveLength(1);

    win._now += 45001;
    win._timers[0]();

    await expect(promise).rejects.toThrow('Google Maps did not finish loading');
  });

  it('rejects when the script fails to load', async () => {
    const win = makeWin();
    const promise = loadGoogleMaps(win, { key: 'k', language: 'en', region: 'BE' });

    win._scripts[0].onerror();

    await expect(promise).rejects.toThrow('Google Maps script failed to load');
  });
});
