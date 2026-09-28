// @vitest-environment happy-dom
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { boot, loadSite, start } from '../src/boot.js';
import { fakeMaps, flatProjection } from './fakes/google-maps.js';
import { publishedRoute } from '../tools/lib/route-file.js';

const TEMPLATE = fs.readFileSync(path.resolve(__dirname, '../index.template.html'), 'utf8');
const BODY = TEMPLATE.match(/<body>([\s\S]*)<\/body>/)[1].replace(/<script[\s\S]*?<\/script>/, '');

const SITE_DIR = path.resolve(__dirname, '../example-config');
const config = JSON.parse(fs.readFileSync(path.join(SITE_DIR, 'config.json'), 'utf8'));
const schedule = JSON.parse(fs.readFileSync(path.join(SITE_DIR, 'schedule.json'), 'utf8'));
// The page downloads the route as the build publishes it: encoded.
const route = publishedRoute(JSON.parse(fs.readFileSync(path.join(SITE_DIR, 'route.json'), 'utf8')));

function jsonResponse(body, ok = true, status = 200) {
  return { ok, status, json: async () => body };
}

function chronoraceConfig() {
  return { Trackers: { a: { Bib: 'RUN', DeviceId: 'd1' }, b: { Bib: 'VAN1', DeviceId: 'd2' } } };
}

function chronoracePositions() {
  const now = new Date().toISOString();
  return { d1: { Lat: 51.2, Lon: 2.9, Time: now }, d2: { Lat: 51.21, Lon: 2.91, Time: now } };
}

/** A fetch stub answering the site's own files and the Chronorace API. */
function makeFetch({ siteOk = true, siteStatus = 404 } = {}) {
  return vi.fn(async (url) => {
    if (String(url).endsWith('data/config.json')) return jsonResponse(config, siteOk, siteStatus);
    if (String(url).endsWith('data/schedule.json')) return jsonResponse(schedule, siteOk, siteStatus);
    if (String(url).endsWith('data/route.json')) return jsonResponse(route, siteOk, siteStatus);
    if (String(url).includes('/api/gps/config/0')) return jsonResponse(chronoraceConfig());
    if (String(url).includes('/api/gps/get/0')) return jsonResponse(chronoracePositions());
    throw new Error(`Unexpected fetch: ${url}`);
  });
}

function memoryStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v),
  };
}

class FakeResizeObserver {
  observe() {}
}

/**
 * The real document, except its `head` swallows the Google Maps script
 * rather than really appending it - happy-dom would otherwise try (and
 * fail) to fetch it, since JS file loading is disabled in the test
 * environment.
 */
function makeDocument() {
  const fakeHead = { appendChild: () => {} };
  return new Proxy(document, {
    get(target, prop, receiver) {
      if (prop === 'createElement') {
        return (tag) => (tag === 'script' ? {} : target.createElement(tag));
      }
      if (prop === 'head') return fakeHead;
      const value = Reflect.get(target, prop, receiver);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

function makeWin({ search = '', fetch = makeFetch(), localStorage = memoryStorage(), innerWidth = 1200 } = {}) {
  return {
    document: makeDocument(),
    location: { search, reload: vi.fn() },
    navigator: { languages: ['en'] },
    fetch,
    localStorage,
    console: { error: vi.fn(), warn: vi.fn(), log: vi.fn(), info: vi.fn() },
    Date,
    setTimeout: (...args) => setTimeout(...args),
    setInterval: (...args) => setInterval(...args),
    ResizeObserver: FakeResizeObserver,
    requestAnimationFrame: (fn) => setTimeout(fn, 0),
    cancelAnimationFrame: (id) => clearTimeout(id),
    addEventListener: () => {},
    innerWidth,
    innerHeight: 800,
  };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

/** A fake maps namespace whose maps come with panes and a projection already set, so overlays can draw on them. */
function readyMaps() {
  const maps = fakeMaps();
  const RealMap = maps.Map;
  maps.Map = class AutoMap extends RealMap {
    constructor(el, opts) {
      super(el, opts);
      this.panes = {
        floatPane: document.createElement('div'),
        overlayLayer: document.createElement('div'),
        overlayMouseTarget: document.createElement('div'),
      };
      // In the live DOM tree, not just held in memory, so overlays that get
      // added to them can be found and clicked like the rest of the page.
      Object.values(this.panes).forEach((pane) => el.appendChild(pane));
      this.projection = flatProjection;
    }
  };
  return maps;
}

async function completeMapLoad(win, maps = readyMaps()) {
  await tick();
  win.google = { maps };
  win.__relayTrackerMapsReady();
  await tick();
  return maps;
}

beforeEach(() => {
  document.documentElement.removeAttribute('data-theme');
  document.body.innerHTML = BODY;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('loadSite', () => {
  it('reads config, schedule and route from the given base', async () => {
    const fetch = makeFetch();
    const site = await loadSite(fetch);
    expect(site.config).toEqual(config);
    expect(site.schedule).toEqual(schedule);
    expect(site.route).toEqual(route);
    expect(fetch).toHaveBeenCalledWith('data/config.json');
  });

  it('throws when a file does not come back ok', async () => {
    const fetch = makeFetch({ siteOk: false, siteStatus: 500 });
    await expect(loadSite(fetch)).rejects.toThrow('data/config.json answered 500');
  });
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
