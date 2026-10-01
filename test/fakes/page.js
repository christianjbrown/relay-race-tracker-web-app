// Shared stand-ins for the page's browser, its site files and Google Maps.
import fs from 'node:fs';
import path from 'node:path';
import { vi } from 'vitest';
import { fakeMaps, flatProjection } from './google-maps.js';
import { buildClocks } from '../../src/boot/clocks.js';
import { buildMap } from '../../src/boot/map.js';
import { loadSiteData } from '../../src/boot/site-data.js';
import { buildTimeline } from '../../src/boot/timeline.js';
import { buildUi } from '../../src/boot/ui.js';
import { chooseTheme } from '../../src/ui/theme.js';
import { publishedRoute } from '../../tools/lib/route-file.js';

const TEMPLATE = fs.readFileSync(path.resolve(__dirname, '../../index.template.html'), 'utf8');
export const BODY = TEMPLATE.match(/<body>([\s\S]*)<\/body>/)[1].replace(/<script[\s\S]*?<\/script>/, '');

const SITE_DIR = path.resolve(__dirname, '../../example-config');
export const config = JSON.parse(fs.readFileSync(path.join(SITE_DIR, 'config.json'), 'utf8'));
export const schedule = JSON.parse(fs.readFileSync(path.join(SITE_DIR, 'schedule.json'), 'utf8'));
// The page downloads the route as the build publishes it: encoded.
export const route = publishedRoute(JSON.parse(fs.readFileSync(path.join(SITE_DIR, 'route.json'), 'utf8')));

export function jsonResponse(body, ok = true, status = 200) {
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
export function makeFetch({ siteOk = true, siteStatus = 404 } = {}) {
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

export function makeWin({ search = '', fetch = makeFetch(), localStorage = memoryStorage(), innerWidth = 1200 } = {}) {
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

export const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

/** A fake maps namespace whose maps come with panes and a projection already set, so overlays can draw on them. */
export function readyMaps() {
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

export async function completeMapLoad(win, maps = readyMaps()) {
  await tick();
  win.google = { maps };
  win.__relayTrackerMapsReady();
  await tick();
  return maps;
}


/** A bare maps namespace, for builders that only construct the directions service. */
export function fakeMapsFor() {
  return fakeMaps();
}

/** The page's parts built one builder at a time, for tests of the builder that comes next. */
export async function assemble(win = makeWin(), { withMap = true } = {}) {
  const site = await loadSiteData(win);
  const { config: checked, language } = site;
  const clocks = buildClocks(win, checked);
  const theme = chooseTheme(win.location.search, win.document.documentElement);
  const timeline = buildTimeline(site.route, site.segments);
  const ui = buildUi(win, { config: checked, language, timeline, theme });
  const parts = { win, config: checked, language, theme, timeline, ui, ...clocks, els: ui.els };
  if (!withMap) return parts;
  const mapPromise = buildMap(win, parts);
  const maps = await completeMapLoad(win);
  return { ...parts, ...(await mapPromise), maps, stage: { screen: null, view: null } };
}
