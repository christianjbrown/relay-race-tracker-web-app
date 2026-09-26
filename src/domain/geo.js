// Flat-earth geometry, which is plenty over the few kilometres any one
// question here spans. Positions are plain { lat, lng } objects throughout.

const KM_PER_DEGREE = 111.2;

/** How far a degree of longitude is, relative to a degree of latitude, at this latitude. */
export const lngScale = (lat) => Math.cos((lat * Math.PI) / 180);

/** Straight-line distance in km between two positions. */
export const kmApart = (a, b) => Math.hypot(a.lat - b.lat, (a.lng - b.lng) * lngScale(a.lat)) * KM_PER_DEGREE;

export const lerp = (a, b, t) => a + (b - a) * t;

export const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

/** How far through a segment of the timeline a moment is, from 0 to 1. */
export const shareOf = (seg, now) => clamp((now - seg.start) / (seg.end - seg.start), 0, 1);

/** The point a given share of the way along a path. */
export function alongPath(path, t) {
  if (path.length === 1) return path[0];
  const k = lngScale(path[0].lat);
  const lengths = [];
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const d = Math.hypot(path[i].lat - path[i - 1].lat, (path[i].lng - path[i - 1].lng) * k);
    lengths.push(d);
    total += d;
  }
  let left = t * total;
  const lastHop = lengths.length - 1;
  for (let i = 0; i < lastHop; i++) {
    if (left <= lengths[i]) return pointOnHop(path[i], path[i + 1], lengths[i], left);
    left -= lengths[i];
  }
  return pointOnHop(path[lastHop], path[lastHop + 1], lengths[lastHop], left);
}

function pointOnHop(a, b, length, into) {
  const f = length ? Math.min(1, into / length) : 0;
  return { lat: lerp(a.lat, b.lat, f), lng: lerp(a.lng, b.lng, f) };
}

/** The nearest point of a path to a position: which hop it is on, and how far away in km. */
export function nearestOnPath(path, pos) {
  const k = lngScale(pos.lat);
  let best = { index: 0, km: Infinity };
  for (let i = 0; i < path.length - 1; i++) {
    const ax = path[i].lng * k;
    const ay = path[i].lat;
    const dx = path[i + 1].lng * k - ax;
    const dy = path[i + 1].lat - ay;
    const len = dx * dx + dy * dy;
    const t = len ? clamp(((pos.lng * k - ax) * dx + (pos.lat - ay) * dy) / len, 0, 1) : 0;
    const km = Math.hypot(ax + t * dx - pos.lng * k, ay + t * dy - pos.lat) * KM_PER_DEGREE;
    if (km < best.km) best = { index: i, km };
  }
  return best;
}

/** Decodes a Google encoded polyline, as Chronorace stores its courses. */
export function decodePolyline(encoded) {
  const points = [];
  let i = 0;
  let lat = 0;
  let lng = 0;
  const next = () => {
    let result = 0;
    let shift = 0;
    let b;
    do {
      b = encoded.charCodeAt(i++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (i < encoded.length) {
    lat += next();
    lng += next();
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

/** Rounds a position to about a kilometre, so a moving vehicle asks for a new route every kilometre or so, not every poll. */
export const roundToKm = (p) => ({ lat: +p.lat.toFixed(2), lng: +p.lng.toFixed(2) });

/** Encodes positions as a Google encoded polyline, to five decimal places: the compact form the page downloads. */
export function encodePolyline(points) {
  let out = '';
  let lastLat = 0;
  let lastLng = 0;
  const put = (delta) => {
    let v = delta < 0 ? ~(delta << 1) : delta << 1;
    while (v >= 0x20) {
      out += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      v >>= 5;
    }
    out += String.fromCharCode(v + 63);
  };
  for (const p of points) {
    const lat = Math.round(p.lat * 1e5);
    const lng = Math.round(p.lng * 1e5);
    put(lat - lastLat);
    put(lng - lastLng);
    lastLat = lat;
    lastLng = lng;
  }
  return out;
}
