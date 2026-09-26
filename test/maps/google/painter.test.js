import { describe, expect, it } from 'vitest';
import { Painter } from '../../../src/maps/google/painter.js';
import { fakeMaps } from '../../fakes/google-maps.js';

const theme = { halo: '#halo', blank: '#blank' };
const colours = { run: '#run', drive: '#drive', sleep: '#sleep', free: '#free' };

describe('Painter', () => {
  describe('paint', () => {
    it('draws a solid line for a piece with a path that is not faded', () => {
      const maps = fakeMaps();
      const map = {};
      const painter = new Painter(maps, map, theme, colours);

      painter.paint([{ kind: 'run', path: [{ lat: 1, lng: 1 }] }]);

      expect(maps.made.polylines).toHaveLength(2);
      expect(maps.made.polylines[0].opts).toMatchObject({ strokeColor: theme.halo, strokeWeight: 9 });
      expect(maps.made.polylines[1].opts).toMatchObject({ strokeColor: colours.run, strokeWeight: 5 });
      expect(maps.made.polylines[0].map).toBe(map);
    });

    it('draws a dashed line for a faded piece with a path', () => {
      const maps = fakeMaps();
      const painter = new Painter(maps, {}, theme, colours);

      painter.paint([{ kind: 'drive', path: [{ lat: 1, lng: 1 }], faded: true }]);

      expect(maps.made.polylines).toHaveLength(1);
      expect(maps.made.polylines[0].opts.icons[0].icon.strokeColor).toBe(colours.drive);
    });

    it('draws a stop marker, larger for a non-free kind', () => {
      const maps = fakeMaps();
      const painter = new Painter(maps, {}, theme, colours);

      painter.paint([{ kind: 'sleep', spot: { lat: 1, lng: 1 }, title: 'Hotel' }]);

      expect(maps.made.markers).toHaveLength(1);
      expect(maps.made.markers[0].opts).toMatchObject({ title: 'Hotel', zIndex: 5 });
      expect(maps.made.markers[0].opts.icon).toMatchObject({ scale: 8, fillColor: colours.sleep, strokeColor: theme.halo });
    });

    it('draws a smaller stop marker for free time', () => {
      const maps = fakeMaps();
      const painter = new Painter(maps, {}, theme, colours);

      painter.paint([{ kind: 'free', spot: { lat: 1, lng: 1 } }]);

      expect(maps.made.markers[0].opts.icon.scale).toBe(5);
    });

    it('draws a faded stop as a blank ring in the segment colour', () => {
      const maps = fakeMaps();
      const painter = new Painter(maps, {}, theme, colours);

      painter.paint([{ kind: 'run', spot: { lat: 1, lng: 1 }, faded: true }]);

      expect(maps.made.markers[0].opts.zIndex).toBe(4);
      expect(maps.made.markers[0].opts.icon).toMatchObject({ fillColor: theme.blank, strokeColor: colours.run });
    });

    it('skips pieces with neither a path nor a spot', () => {
      const maps = fakeMaps();
      const painter = new Painter(maps, {}, theme, colours);

      painter.paint([{ kind: 'run' }]);

      expect(maps.made.polylines).toHaveLength(0);
      expect(maps.made.markers).toHaveLength(0);
    });

    it('clears everything it drew before painting again', () => {
      const maps = fakeMaps();
      const map = {};
      const painter = new Painter(maps, map, theme, colours);

      painter.paint([{ kind: 'run', spot: { lat: 1, lng: 1 } }]);
      const first = maps.made.markers[0];
      expect(first.map).toBe(map);

      painter.paint([]);

      expect(first.map).toBeNull();
      expect(painter.drawn).toEqual([]);
    });
  });
});
