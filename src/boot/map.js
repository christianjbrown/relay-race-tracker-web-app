// The map: Google's library loaded, the course drawn on it and the road router that asks Google's directions.
import { localise } from '../i18n/language.js';
import { GoogleDirections } from '../maps/google/directions.js';
import { loadGoogleMaps } from '../maps/google/loader.js';
import { MAP_STYLES } from '../maps/google/map-styles.js';
import { CourseLayer } from '../maps/google/course-layer.js';
import { makePlaceLabel } from '../maps/google/overlays.js';
import { createMap, GoogleMapSurface } from '../maps/google/surface.js';
import { JsonStorage } from '../services/json-storage.js';
import { RoadRouter } from '../services/road-router.js';
import { RunnerSpot } from '../ui/runner-spot.js';

/** Browser storage, which can refuse to exist at all. */
export function browserStorage(win) {
  try {
    return win.localStorage;
  } catch {
    return null;
  }
}

export function buildRouter(win, maps, realClock) {
  return new RoadRouter(new GoogleDirections(maps, new maps.DirectionsService()), new JsonStorage(browserStorage(win)), realClock, win.console);
}

/** Loads the map library, makes the map and draws the course and its places on it. */
export async function buildMap(win, { config, language, timeline, theme, els, realClock }) {
  const { course, schedule } = timeline;
  const maps = await loadGoogleMaps(win, { key: config.mapsApiKey, language: language.code, region: language.locale.region });
  const map = createMap(maps, els.get('map'), MAP_STYLES[theme.name], course.at(0));
  const surface = new GoogleMapSurface(maps, map);
  const router = buildRouter(win, maps, realClock);
  const spot = new RunnerSpot();
  const layer = new CourseLayer(maps, map, theme, makePlaceLabel(maps, win.document, spot));
  layer.draw(course.points);
  layer.labelStops(course.points, schedule.segments, (place) => localise(place.name, language.code));
  return { maps, map, surface, router, spot };
}
