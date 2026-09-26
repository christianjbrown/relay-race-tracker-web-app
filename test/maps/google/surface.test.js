import { describe, expect, it } from 'vitest';
import { createMap, GoogleMapSurface } from '../../../src/maps/google/surface.js';
import { fakeMaps } from '../../fakes/google-maps.js';

describe('GoogleMapSurface', () => {
  function setup() {
    const maps = fakeMaps();
    const map = new maps.Map({}, { zoom: 5 });
    return { maps, map, surface: new GoogleMapSurface(maps, map) };
  }

  describe('fitBounds', () => {
    it('extends a bounds with every point and fits the map to it', () => {
      const { map, surface } = setup();
      const points = [{ lat: 1, lng: 1 }, { lat: 2, lng: 2 }];

      surface.fitBounds(points, { top: 10 });

      const [name, boundsPoints, padding] = map.calls[0];
      expect(name).toBe('fitBounds');
      expect(boundsPoints).toEqual(points);
      expect(padding).toEqual({ top: 10 });
    });
  });

  describe('panTo', () => {
    it('pans the map to the position', () => {
      const { map, surface } = setup();
      surface.panTo({ lat: 1, lng: 2 });
      expect(map.calls[0]).toEqual(['panTo', { lat: 1, lng: 2 }]);
    });
  });

  describe('panBy', () => {
    it('pans the map by the offset', () => {
      const { map, surface } = setup();
      surface.panBy(5, -5);
      expect(map.calls[0]).toEqual(['panBy', 5, -5]);
    });
  });

  describe('getZoom', () => {
    it('reads the map zoom', () => {
      const { surface } = setup();
      expect(surface.getZoom()).toBe(5);
    });
  });

  describe('setZoom', () => {
    it('sets the map zoom', () => {
      const { map, surface } = setup();
      surface.setZoom(9);
      expect(map.zoom).toBe(9);
    });
  });

  describe('onDragStart', () => {
    it('listens for dragstart', () => {
      const { map, surface } = setup();
      const fn = () => {};
      surface.onDragStart(fn);
      expect(map.listeners.dragstart).toBe(fn);
    });
  });
});

describe('createMap', () => {
  it('makes a quiet, gesture-friendly map centred where asked', () => {
    const maps = fakeMaps();
    const el = {};
    const styles = [{ elementType: 'geometry' }];
    const center = { lat: 1, lng: 2 };

    const map = createMap(maps, el, styles, center);

    expect(maps.made.maps).toContain(map);
    expect(map.opts).toMatchObject({
      center,
      zoom: 7,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: { position: 'right-top' },
      gestureHandling: 'greedy',
      isFractionalZoomEnabled: true,
      clickableIcons: false,
      mapTypeId: 'roadmap',
      styles,
    });
  });
});
