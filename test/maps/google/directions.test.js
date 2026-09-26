import { describe, expect, it } from 'vitest';
import { GoogleDirections } from '../../../src/maps/google/directions.js';
import { fakeMaps } from '../../fakes/google-maps.js';

function leg(overrides = {}) {
  return {
    duration: { value: 1000 },
    distance: { value: 5000 },
    ...overrides,
  };
}

function result(legOverrides = {}) {
  return {
    routes: [{
      overview_path: [
        { lat: () => 1, lng: () => 2 },
        { lat: () => 3, lng: () => 4 },
      ],
      legs: [leg(legOverrides)],
    }],
  };
}

describe('GoogleDirections', () => {
  describe('route', () => {
    it('resolves the path, duration and distance on OK', async () => {
      const maps = fakeMaps();
      maps.DirectionsService.answer = () => [result(), 'OK'];
      const directions = new GoogleDirections(maps, new maps.DirectionsService());

      const trip = await directions.route({ origin: { lat: 1, lng: 2 }, destination: { lat: 3, lng: 4 } });

      expect(trip).toEqual({ path: [{ lat: 1, lng: 2 }, { lat: 3, lng: 4 }], seconds: 1000, metres: 5000 });
    });

    it('prefers duration_in_traffic over duration when both are present', async () => {
      const maps = fakeMaps();
      maps.DirectionsService.answer = () => [result({ duration_in_traffic: { value: 1500 } }), 'OK'];
      const directions = new GoogleDirections(maps, new maps.DirectionsService());

      const trip = await directions.route({ origin: {}, destination: {} });

      expect(trip.seconds).toBe(1500);
    });

    it('asks with drivingOptions when a departureTime is given', async () => {
      const maps = fakeMaps();
      let seenAsk = null;
      maps.DirectionsService.answer = (ask) => {
        seenAsk = ask;
        return [result(), 'OK'];
      };
      const directions = new GoogleDirections(maps, new maps.DirectionsService());
      const departureTime = new Date();

      await directions.route({ origin: {}, destination: {}, departureTime });

      expect(seenAsk.drivingOptions).toEqual({ departureTime });
      expect(seenAsk.travelMode).toBe('DRIVING');
    });

    it('leaves out drivingOptions when there is no departureTime', async () => {
      const maps = fakeMaps();
      let seenAsk = null;
      maps.DirectionsService.answer = (ask) => {
        seenAsk = ask;
        return [result(), 'OK'];
      };
      const directions = new GoogleDirections(maps, new maps.DirectionsService());

      await directions.route({ origin: {}, destination: {} });

      expect(seenAsk.drivingOptions).toBeUndefined();
    });

    it('rejects when the status is not OK', async () => {
      const maps = fakeMaps();
      maps.DirectionsService.answer = () => [null, 'ZERO_RESULTS'];
      const directions = new GoogleDirections(maps, new maps.DirectionsService());

      await expect(directions.route({ origin: {}, destination: {} })).rejects.toThrow('Directions answered ZERO_RESULTS');
    });
  });
});
