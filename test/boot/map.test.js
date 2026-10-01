// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { browserStorage, buildRouter } from '../../src/boot/map.js';
import { BODY, assemble, fakeMapsFor, makeWin } from '../fakes/page.js';

beforeEach(() => {
  document.documentElement.removeAttribute('data-theme');
  document.body.innerHTML = BODY;
});

describe('buildMap', () => {
  it('loads the library, makes the map and draws the course and its places', async () => {
    const p = await assemble();
    expect(p.maps.made.polylines.length).toBeGreaterThan(0);
    for (const key of ['map', 'surface', 'router', 'spot']) expect(p[key]).toBeTruthy();
  });
});

describe('browserStorage', () => {
  it('hands back the window\'s localStorage', () => {
    const win = makeWin();
    expect(browserStorage(win)).toBe(win.localStorage);
  });

  it('hands back null when the browser refuses it', () => {
    const win = makeWin();
    Object.defineProperty(win, 'localStorage', { get() { throw new Error('blocked'); } });
    expect(browserStorage(win)).toBeNull();
  });
});

describe('buildRouter', () => {
  it('builds a router over the maps directions service', () => {
    const router = buildRouter(makeWin(), fakeMapsFor(), { now: () => new Date() });
    expect(typeof router.onReady).toBe('function');
  });
});
