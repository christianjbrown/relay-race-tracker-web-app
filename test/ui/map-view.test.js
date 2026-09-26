import { describe, expect, it } from 'vitest';
import { MapView } from '../../src/ui/map-view.js';

function fakeSurface(zoom = 8) {
  return {
    zoom,
    calls: [],
    fitBounds(points, pad) { this.calls.push(['fitBounds', points, pad]); },
    panTo(pos) { this.calls.push(['panTo', pos]); },
    panBy(x, y) { this.calls.push(['panBy', x, y]); },
    getZoom() { return this.zoom; },
    setZoom(z) { this.zoom = z; this.calls.push(['setZoom', z]); },
  };
}

function fakeSchedule() {
  return { shown: null, show(open) { this.shown = open; } };
}

const pad = { top: 10, right: 20, bottom: 30, left: 40 };
const padding = { get: () => pad };
const routePoints = [{ lat: 0, lng: 0 }, { lat: 1, lng: 1 }];

describe('MapView', () => {
  it('reports following only in follow mode', () => {
    const view = new MapView(fakeSurface(), padding, fakeSchedule(), { innerWidth: 1000 }, routePoints, () => null);
    expect(view.following()).toBe(false);
    view.follow();
    expect(view.following()).toBe(true);
    view.release();
    expect(view.following()).toBe(false);
  });

  it('follows the runner: zooms in if too far out, centres and pans by the padding gap', () => {
    const surface = fakeSurface(8);
    const pos = { lat: 5, lng: 6 };
    const view = new MapView(surface, padding, fakeSchedule(), { innerWidth: 1000 }, routePoints, () => pos);
    view.follow();
    expect(surface.calls).toContainEqual(['setZoom', 13]);
    expect(surface.calls).toContainEqual(['panTo', pos]);
    expect(surface.calls).toContainEqual(['panBy', (pad.left - pad.right) / -2, (pad.bottom - pad.top) / 2]);
  });

  it('does not zoom in when already close enough', () => {
    const surface = fakeSurface(15);
    const view = new MapView(surface, padding, fakeSchedule(), { innerWidth: 1000 }, routePoints, () => ({ lat: 1, lng: 1 }));
    view.follow();
    expect(surface.calls.find((c) => c[0] === 'setZoom')).toBeUndefined();
  });

  it('does nothing to centre when the runner is not located', () => {
    const surface = fakeSurface(8);
    const view = new MapView(surface, padding, fakeSchedule(), { innerWidth: 1000 }, routePoints, () => null);
    view.follow();
    expect(surface.calls.find((c) => c[0] === 'panTo')).toBeUndefined();
  });

  it('puts away the schedule to make room for the map on a narrow screen', () => {
    const schedule = fakeSchedule();
    const view = new MapView(fakeSurface(), padding, schedule, { innerWidth: 500 }, routePoints, () => null);
    view.follow();
    expect(schedule.shown).toBe(false);
  });

  it('leaves the schedule alone on a wide screen', () => {
    const schedule = fakeSchedule();
    const view = new MapView(fakeSurface(), padding, schedule, { innerWidth: 1000 }, routePoints, () => null);
    view.follow();
    expect(schedule.shown).toBe(null);
  });

  it('shows the whole route including the runner, in overview mode', () => {
    const surface = fakeSurface();
    const pos = { lat: 5, lng: 6 };
    const view = new MapView(surface, padding, fakeSchedule(), { innerWidth: 1000 }, routePoints, () => pos);
    view.overview();
    expect(view.mode).toBe('route');
    expect(surface.calls).toContainEqual(['fitBounds', [...routePoints, pos], pad]);
  });

  it('shows just the route when the runner is not located', () => {
    const surface = fakeSurface();
    const view = new MapView(surface, padding, fakeSchedule(), { innerWidth: 1000 }, routePoints, () => null);
    view.overview();
    expect(surface.calls).toContainEqual(['fitBounds', routePoints, pad]);
  });

  it('re-centres on apply while following', () => {
    const surface = fakeSurface();
    const pos = { lat: 5, lng: 6 };
    const view = new MapView(surface, padding, fakeSchedule(), { innerWidth: 1000 }, routePoints, () => pos);
    view.follow();
    surface.calls = [];
    view.apply();
    expect(surface.calls).toContainEqual(['panTo', pos]);
  });

  it('re-fits the whole route on apply in route mode', () => {
    const surface = fakeSurface();
    const view = new MapView(surface, padding, fakeSchedule(), { innerWidth: 1000 }, routePoints, () => null);
    view.overview();
    surface.calls = [];
    view.apply();
    expect(surface.calls).toContainEqual(['fitBounds', routePoints, pad]);
  });

  it('does nothing on apply while free', () => {
    const surface = fakeSurface();
    const view = new MapView(surface, padding, fakeSchedule(), { innerWidth: 1000 }, routePoints, () => null);
    view.release();
    view.apply();
    expect(surface.calls).toEqual([]);
  });

  it('leaves the map alone on apply when the sheet is pulled up over it on a narrow screen', () => {
    const surface = fakeSurface();
    const view = new MapView(surface, padding, fakeSchedule(), { innerWidth: 500 }, routePoints, () => null);
    view.useSheet({ level: () => 2 });
    view.follow();
    surface.calls = [];
    view.apply();
    expect(surface.calls).toEqual([]);
  });

  it('still applies when the sheet is pulled up but the screen is wide', () => {
    const surface = fakeSurface();
    const view = new MapView(surface, padding, fakeSchedule(), { innerWidth: 1000 }, routePoints, () => null);
    view.useSheet({ level: () => 2 });
    view.overview();
    surface.calls = [];
    view.apply();
    expect(surface.calls).toContainEqual(['fitBounds', routePoints, pad]);
  });
});
