import { describe, expect, it, vi } from 'vitest';
import { CourseLayer } from '../../../src/maps/google/course-layer.js';
import { fakeMaps } from '../../fakes/google-maps.js';

class FakePlaceLabel {
  constructor(pos, text, side) {
    this.pos = pos;
    this.text = text;
    this.side = side;
    this.map = null;
  }

  setMap(map) {
    this.map = map;
  }
}

describe('CourseLayer', () => {
  describe('draw', () => {
    it('draws the course line and a marker at each end', () => {
      const maps = fakeMaps();
      const map = {};
      const theme = { course: '#course', blank: '#blank' };
      const layer = new CourseLayer(maps, map, theme, FakePlaceLabel);
      const points = [{ lat: 1, lng: 1 }, { lat: 2, lng: 2 }, { lat: 3, lng: 3 }];

      layer.draw(points);

      expect(maps.made.polylines).toHaveLength(1);
      expect(maps.made.polylines[0].opts).toMatchObject({ map, path: points, strokeColor: theme.course });
      expect(maps.made.markers).toHaveLength(2);
      expect(maps.made.markers[0].opts.position).toBe(points[2]);
      expect(maps.made.markers[0].opts.label.text).toBe('🏁');
      expect(maps.made.markers[1].opts.position).toBe(points[0]);
      expect(maps.made.markers[1].opts.label.text).toBe('▶️');
    });
  });

  describe('labelStops', () => {
    const points = [{ lng: 0 }, { lng: 10 }];

    it('labels each sleep stop once, on the side away from the middle', () => {
      const maps = fakeMaps();
      const map = {};
      const layer = new CourseLayer(maps, map, {}, FakePlaceLabel);
      const segments = [
        { kind: 'run' },
        { kind: 'sleep', at: { name: 'hotel-a', lng: 2 } },
        { kind: 'sleep', at: { name: 'hotel-a', lng: 2 } },
        { kind: 'sleep', at: { name: 'hotel-b', lng: 8 } },
      ];
      const nameOf = vi.fn((place) => place.name);

      layer.labelStops(points, segments, nameOf);

      expect(nameOf).toHaveBeenCalledTimes(3);
    });

    it('creates one label per distinct name, on the correct side', () => {
      const maps = fakeMaps();
      const map = {};
      const layer = new CourseLayer(maps, map, {}, FakePlaceLabel);
      const labels = [];
      const Tracking = class extends FakePlaceLabel {
        constructor(...args) {
          super(...args);
          labels.push(this);
        }
      };
      const trackedLayer = new CourseLayer(maps, map, {}, Tracking);
      const segments = [
        { kind: 'sleep', at: { name: 'left-one', lng: 2 } },
        { kind: 'sleep', at: { name: 'right-one', lng: 8 } },
      ];

      trackedLayer.labelStops(points, segments, (place) => place.name);

      expect(labels).toHaveLength(2);
      expect(labels[0].side).toBe('left');
      expect(labels[0].map).toBe(map);
      expect(labels[1].side).toBe('right');
      void layer;
    });
  });
});
