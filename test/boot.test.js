// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { boot, start } from '../src/boot.js';
import {
  BODY, config, completeMapLoad, jsonResponse, makeFetch, makeWin, readyMaps, tick,
} from './fakes/page.js';

beforeEach(() => {
  document.documentElement.removeAttribute('data-theme');
  document.body.innerHTML = BODY;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('boot', () => {
  it('reads the site, draws the card and starts the map once the library is ready', async () => {
    const win = makeWin();
    const bootPromise = boot(win);

    await completeMapLoad(win);
    const app = await bootPromise;

    expect(app).toBeTruthy();
    expect(document.getElementById('headline').textContent).not.toBe('');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('draws the route straight away, even when Chronorace never answers', async () => {
    const answered = makeFetch();
    // Chronorace hangs; the site's own files still arrive.
    const fetch = vi.fn((url) => (String(url).includes('/api/gps/') ? new Promise(() => {}) : answered(url)));
    const win = makeWin({ search: '?at=2027-05-15T14:00', fetch });
    boot(win);
    const maps = await completeMapLoad(win);

    // The legs and drives are drawn, beyond the course line itself.
    expect(maps.made.polylines.length).toBeGreaterThan(1);
    expect(document.getElementById('headline').textContent).toContain('Sam');
    expect(document.getElementById('meta').textContent).toBe('No GPS position yet');
  });

  it('picks the light theme from the query string', async () => {
    const win = makeWin({ search: '?theme=light' });
    const bootPromise = boot(win);
    await completeMapLoad(win);
    await bootPromise;

    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('previews a moment on the timeline with ?at=', async () => {
    const win = makeWin({ search: '?at=2027-05-15T14:00' });
    const bootPromise = boot(win);
    await completeMapLoad(win);
    const app = await bootPromise;

    expect(app.clock.now().toISOString().slice(0, 10)).toBe('2027-05-15');
  });

  it('requests a live route while driving, and wires up the runner click and the sheet grip', async () => {
    const targetIso = '2027-05-15T12:00:00+02:00';
    const routeCalls = [];
    const maps = readyMaps();
    maps.DirectionsService.answer = (ask) => {
      routeCalls.push(ask);
      return [{
        routes: [{
          overview_path: [
            { lat: () => ask.origin.lat, lng: () => ask.origin.lng },
            { lat: () => ask.destination.lat, lng: () => ask.destination.lng },
          ],
          legs: [{ duration: { value: 600 }, duration_in_traffic: { value: 500 }, distance: { value: 3000 } }],
        }],
      }, 'OK'];
    };

    const baseFetch = makeFetch();
    const fetch = vi.fn(async (url) => {
      if (String(url).includes('/api/gps/get/0')) {
        return jsonResponse({
          d1: { Lat: 51.2, Lon: 2.9, Time: new Date().toISOString() },
          d2: { Lat: 50.95, Lon: 2.87, Time: targetIso },
        });
      }
      return baseFetch(url);
    });

    const win = makeWin({ search: '?at=2027-05-15T12:00', fetch, innerWidth: 400 });
    const bootPromise = boot(win);
    await completeMapLoad(win, maps);
    await bootPromise;

    // A live directions request was made with today's departure time, which
    // only the driving-with-a-tracked-vehicle path asks for.
    const liveCall = routeCalls.find((ask) => ask.drivingOptions);
    expect(liveCall).toBeTruthy();
    expect(Math.abs(liveCall.drivingOptions.departureTime.getTime() - Date.now())).toBeLessThan(5000);

    // Clicking the runner marker follows it, or looks around in Street View on a leg.
    const runnerEl = document.querySelector('.runner');
    expect(runnerEl).toBeTruthy();
    expect(() => runnerEl.dispatchEvent(new Event('click'))).not.toThrow();

    // Sliding the rewind redraws the page at that moment from the timeline.
    const range = document.getElementById('rewind-range');
    range.value = '0';
    range.dispatchEvent(new Event('input'));
    expect(document.getElementById('meta').textContent).toBe('Replaying the schedule: planned positions, not GPS');

    // Tapping the sheet's grip on a narrow layout moves it a level.
    const toggle = document.getElementById('toggle');
    toggle.setPointerCapture ??= () => {};
    toggle.dispatchEvent(new PointerEvent('pointerdown', { clientY: 0, pointerId: 1 }));
    toggle.dispatchEvent(new PointerEvent('pointerup', { clientY: 0, pointerId: 1 }));
    expect(document.getElementById('card').classList.contains('expanded')
      || document.getElementById('card').classList.contains('tucked')).toBe(true);

    // Let the pending live route resolve and tell the app to redraw.
    await tick();
  });

  it('keeps working when localStorage is unavailable', async () => {
    const win = makeWin();
    Object.defineProperty(win, 'localStorage', {
      get() {
        throw new Error('blocked');
      },
    });
    const bootPromise = boot(win);
    await completeMapLoad(win);

    await expect(bootPromise).resolves.toBeTruthy();
  });
});

describe('start', () => {
  it('shows the retry message in the resolved language and reloads after a delay', async () => {
    vi.useFakeTimers();
    const win = makeWin({ fetch: vi.fn(async () => jsonResponse(config, false, 404)) });

    const promise = start(win);
    await vi.runOnlyPendingTimersAsync();
    await promise;

    const meta = document.getElementById('meta');
    expect(meta.hidden).toBe(false);
    expect(meta.classList.contains('stale')).toBe(true);
    expect(meta.textContent).toBe('The map did not load – trying again…');
    expect(win.console.error).toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(15000);
    expect(win.location.reload).toHaveBeenCalled();
  });

  it('falls back to English when the site never loaded far enough to know the words', async () => {
    vi.useFakeTimers();
    const win = makeWin({ fetch: vi.fn(async () => {
      throw new Error('network down');
    }) });

    await start(win);

    const meta = document.getElementById('meta');
    expect(meta.textContent).toBe('The map did not load – trying again…');
  });

  it('does nothing to the page when there is no #meta element', async () => {
    vi.useFakeTimers();
    document.getElementById('meta').remove();
    const win = makeWin({ fetch: vi.fn(async () => {
      throw new Error('network down');
    }) });

    await expect(start(win)).resolves.toBeUndefined();
  });
});
