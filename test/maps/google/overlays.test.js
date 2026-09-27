// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { makePlaceLabel, makeRunnerMarker, makeVehicleMarker } from '../../../src/maps/google/overlays.js';
import { RunnerSpot } from '../../../src/ui/runner-spot.js';
import { fakeMaps, flatProjection } from '../../fakes/google-maps.js';

function fakeMap(maps, { projection = flatProjection, zoom = 10, width = 1000 } = {}) {
  const el = document.createElement('div');
  Object.defineProperty(el, 'clientWidth', { value: width, configurable: true });
  const map = new maps.Map(el, { zoom });
  map.projection = projection;
  map.panes = {
    floatPane: document.createElement('div'),
    overlayLayer: document.createElement('div'),
    overlayMouseTarget: document.createElement('div'),
  };
  return map;
}

describe('makeRunnerMarker', () => {
  it('adds itself into the float pane and removes itself when taken off the map', () => {
    const maps = fakeMaps();
    const RunnerMarker = makeRunnerMarker(maps, document);
    const map = fakeMap(maps);
    const marker = new RunnerMarker({ avatar: 'a.png', alt: 'Sam', colours: {}, badges: {}, onClick: () => {} });

    marker.setMap(map);
    expect(marker.el.parentNode).toBe(map.panes.floatPane);

    marker.setMap(null);
    expect(marker.el.parentNode).toBeNull();
  });

  it('tells the spot where the runner has moved to', () => {
    const maps = fakeMaps();
    const RunnerMarker = makeRunnerMarker(maps, document);
    const spot = new RunnerSpot();
    const marker = new RunnerMarker({ avatar: 'a.png', alt: 'Sam', colours: { run: '#000' }, badges: { run: 'R' }, onClick: () => {}, spot });
    marker.setMap(fakeMap(maps));

    marker.update({ lat: 1, lng: 2 }, 'run', false);

    expect(spot.pos).toEqual({ lat: 1, lng: 2 });
  });

  it('shows the avatar and calls onClick when clicked', () => {
    const maps = fakeMaps();
    const RunnerMarker = makeRunnerMarker(maps, document);
    const onClick = vi.fn();
    const marker = new RunnerMarker({ avatar: 'a.png', alt: 'Sam', colours: {}, badges: {}, onClick });

    const img = marker.el.querySelector('img');
    expect(img.src).toContain('a.png');
    expect(img.alt).toBe('Sam');

    marker.el.dispatchEvent(new Event('click'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('updates position, badge and birthday cake', () => {
    const maps = fakeMaps();
    const RunnerMarker = makeRunnerMarker(maps, document);
    const map = fakeMap(maps);
    const colours = { run: '#run', finished: '#done' };
    const badges = { run: '🏃', finished: '🏁' };
    const marker = new RunnerMarker({ avatar: 'a.png', alt: 'Sam', colours, badges, onClick: () => {} });
    marker.setMap(map);

    marker.update({ lat: 1, lng: 2 }, 'finished', true);

    expect(marker.el.hidden).toBe(false);
    expect(marker.cake.hidden).toBe(false);
    expect(marker.badge.hidden).toBe(false);
    expect(marker.badge.textContent).toBe('🏁');
    expect(marker.badge.style.getPropertyValue('--badge')).toBe('#done');
    expect(marker.el.style.left).toBe('200px');
    expect(marker.el.style.top).toBe('100px');
  });

  it('falls back to the run colour for a badge with no colour of its own', () => {
    const maps = fakeMaps();
    const RunnerMarker = makeRunnerMarker(maps, document);
    const map = fakeMap(maps);
    const colours = { run: '#run' };
    const badges = { drive: '🚌' };
    const marker = new RunnerMarker({ avatar: 'a.png', alt: 'Sam', colours, badges, onClick: () => {} });
    marker.setMap(map);

    marker.update({ lat: 1, lng: 2 }, 'drive', false);

    expect(marker.badge.style.getPropertyValue('--badge')).toBe('#run');
    expect(marker.cake.hidden).toBe(true);
  });

  it('hides itself and clears the badge when there is neither position nor badge', () => {
    const maps = fakeMaps();
    const RunnerMarker = makeRunnerMarker(maps, document);
    const map = fakeMap(maps);
    const marker = new RunnerMarker({ avatar: 'a.png', alt: 'Sam', colours: {}, badges: {}, onClick: () => {} });
    marker.setMap(map);

    marker.update(null, null, false);

    expect(marker.el.hidden).toBe(true);
    expect(marker.badge.hidden).toBe(true);
  });
});

describe('makeVehicleMarker', () => {
  it('adds itself into the overlay mouse target pane and removes itself', () => {
    const maps = fakeMaps();
    const VehicleMarker = makeVehicleMarker(maps, document);
    const map = fakeMap(maps);
    const marker = new VehicleMarker('🚌 bus');

    expect(marker.el.textContent).toBe('🚌 bus');
    marker.setMap(map);
    expect(marker.el.parentNode).toBe(map.panes.overlayMouseTarget);

    marker.setMap(null);
    expect(marker.el.parentNode).toBeNull();
  });

  it('places itself at the given position', () => {
    const maps = fakeMaps();
    const VehicleMarker = makeVehicleMarker(maps, document);
    const map = fakeMap(maps);
    const marker = new VehicleMarker('bus');
    marker.setMap(map);

    marker.update({ lat: 2, lng: 3 });

    expect(marker.el.hidden).toBe(false);
    expect(marker.el.style.left).toBe('300px');
    expect(marker.el.style.top).toBe('200px');
  });

  it('takes a class of its own, for the rest of the team', () => {
    const VehicleMarker = makeVehicleMarker(fakeMaps(), document);
    expect(new VehicleMarker('🏃', 'group-marker').el.className).toBe('group-marker');
    expect(new VehicleMarker('bus').el.className).toBe('vehicle-marker');
  });

  it('hides itself when given no position', () => {
    const maps = fakeMaps();
    const VehicleMarker = makeVehicleMarker(maps, document);
    const map = fakeMap(maps);
    const marker = new VehicleMarker('bus');
    marker.setMap(map);

    marker.update(null);

    expect(marker.el.hidden).toBe(true);
  });
});

describe('makePlaceLabel', () => {
  it('adds itself into the overlay layer and removes itself', () => {
    const maps = fakeMaps();
    const PlaceLabel = makePlaceLabel(maps, document);
    const map = fakeMap(maps);
    const label = new PlaceLabel({ lat: 1, lng: 1 }, 'Hotel', 'left');

    label.setMap(map);
    expect(label.el.parentNode).toBe(map.panes.overlayLayer);
    expect(label.el.textContent).toBe('Hotel');
    expect(label.el.className).toBe('place-label left');

    label.setMap(null);
    expect(label.el.parentNode).toBeNull();
  });

  it('stays hidden when there is no projection', () => {
    const maps = fakeMaps();
    const PlaceLabel = makePlaceLabel(maps, document);
    const map = fakeMap(maps, { projection: null });
    const label = new PlaceLabel({ lat: 1, lng: 1 }, 'Hotel', 'left');

    label.setMap(map);
    label.draw();

    expect(label.el.hidden).toBe(true);
  });

  it('hides on a narrow map at a low zoom, and shows once zoomed in', () => {
    const maps = fakeMaps();
    const PlaceLabel = makePlaceLabel(maps, document);
    const map = fakeMap(maps, { width: 500, zoom: 5 });
    const label = new PlaceLabel({ lat: 1, lng: 1 }, 'Hotel', 'right');
    Object.defineProperty(label.el, 'offsetWidth', { value: 40, configurable: true });

    label.setMap(map);
    label.draw();
    expect(label.el.hidden).toBe(true);

    map.setZoom(9);
    label.draw();
    expect(label.el.hidden).toBe(false);
  });

  it('flips from the right to the left when it would run off the map', () => {
    const maps = fakeMaps();
    const PlaceLabel = makePlaceLabel(maps, document);
    const map = fakeMap(maps, { width: 200 });
    const label = new PlaceLabel({ lat: 0, lng: 1.9 }, 'Hotel', 'right');
    Object.defineProperty(label.el, 'offsetWidth', { value: 40, configurable: true });

    label.setMap(map);
    label.draw();

    expect(label.el.classList.contains('left')).toBe(true);
    expect(label.el.classList.contains('right')).toBe(false);
  });

  it('flips from the left to the right when it would run off the map', () => {
    const maps = fakeMaps();
    const PlaceLabel = makePlaceLabel(maps, document);
    const map = fakeMap(maps, { width: 200 });
    const label = new PlaceLabel({ lat: 0, lng: 0.05 }, 'Hotel', 'left');
    Object.defineProperty(label.el, 'offsetWidth', { value: 40, configurable: true });

    label.setMap(map);
    label.draw();

    expect(label.el.classList.contains('right')).toBe(true);
    expect(label.el.classList.contains('left')).toBe(false);
  });

  it('keeps its side when there is room for it', () => {
    const maps = fakeMaps();
    const PlaceLabel = makePlaceLabel(maps, document);
    const map = fakeMap(maps, { width: 2000 });
    const label = new PlaceLabel({ lat: 0, lng: 5 }, 'Hotel', 'right');
    Object.defineProperty(label.el, 'offsetWidth', { value: 40, configurable: true });

    label.setMap(map);
    label.draw();

    expect(label.el.classList.contains('right')).toBe(true);
    expect(label.el.classList.contains('left')).toBe(false);
  });

  it('steps out past the runner while they are at the stop, and back once they leave', () => {
    const maps = fakeMaps();
    const spot = new RunnerSpot();
    const PlaceLabel = makePlaceLabel(maps, document, spot);
    const map = fakeMap(maps, { width: 2000 });
    const label = new PlaceLabel({ lat: 0, lng: 5 }, 'Hotel', 'right');
    Object.defineProperty(label.el, 'offsetWidth', { value: 40, configurable: true });
    label.setMap(map);

    spot.moveTo({ lat: 0, lng: 5.1 });
    expect(label.el.classList.contains('clear')).toBe(true);

    spot.moveTo({ lat: 0, lng: 6 });
    expect(label.el.classList.contains('clear')).toBe(false);

    spot.moveTo(null);
    expect(label.el.classList.contains('clear')).toBe(false);
  });

  it('counts the step out when deciding whether it fits on its side', () => {
    const maps = fakeMaps();
    const spot = new RunnerSpot();
    const PlaceLabel = makePlaceLabel(maps, document, spot);
    const map = fakeMap(maps, { width: 2000 });
    const label = new PlaceLabel({ lat: 0, lng: 19.2 }, 'Hotel', 'right');
    Object.defineProperty(label.el, 'offsetWidth', { value: 40, configurable: true });
    label.setMap(map);

    label.draw();
    expect(label.el.classList.contains('right')).toBe(true);

    spot.moveTo({ lat: 0, lng: 19.2 });
    expect(label.el.classList.contains('left')).toBe(true);
  });
});
