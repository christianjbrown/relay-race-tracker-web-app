import { encodePolyline } from '../../src/domain/geo.js';

const inRange = (v, limit) => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= limit;

/**
 * A site's route.json: the course as a list of points, one per line, so it
 * can be read and edited like the site's other files.
 */
export function formatRoute(name, points) {
  const lines = points.map((p) => `    { "lat": ${p.lat}, "lng": ${p.lng} }`);
  return `{\n  "name": ${JSON.stringify(name)},\n  "points": [\n${lines.join(',\n')}\n  ]\n}\n`;
}

/** Checks a route.json read from a site and gives back { name, points }. */
export function readRoute(raw, file) {
  const points = raw?.points;
  if (!Array.isArray(points) || points.length < 2) throw new Error(`${file} needs "points": a list of at least two { "lat", "lng" } positions.`);
  const bad = points.findIndex((p) => !inRange(p?.lat, 90) || !inRange(p?.lng, 180));
  if (bad !== -1) throw new Error(`${file}: point ${bad + 1} needs a "lat" between -90 and 90 and a "lng" between -180 and 180.`);
  return { name: raw.name ?? '', points };
}

/**
 * The route as the page downloads it: the same points as one encoded
 * polyline, several times smaller than the list, since every visitor fetches it.
 */
export function publishedRoute({ name, points }) {
  return { name, polylines: [encodePolyline(points)] };
}
