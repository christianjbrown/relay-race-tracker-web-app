/**
 * Driving routes, remembered so a redraw costs no request. A trip is the
 * road, how long it takes and how far it is. Live trips ask for today's
 * traffic from now and are kept only in memory, since traffic is out of
 * date by the next drive; the rest are kept in the browser too.
 *
 * `gateway.route({ origin, destination, departureTime })` resolves to
 * `{ path, seconds, metres }` or rejects; `storage` is a JsonStorage.
 */
export class RoadRouter {
  constructor(gateway, storage, clock, logger) {
    this.gateway = gateway;
    this.storage = storage;
    this.clock = clock;
    this.logger = logger;
    this.cache = new Map();
    this.pending = new Set();
    this.listeners = [];
  }

  /** Called whenever a route arrives, so the map can be drawn again. */
  onReady(fn) {
    this.listeners.push(fn);
  }

  key(a, b, live) {
    return [a.lat, a.lng, b.lat, b.lng].map((n) => n.toFixed(4)).join(',') + (live ? ':live' : '');
  }

  /** The road between two places if known; otherwise null, and it is fetched. */
  get(a, b) {
    return this.trip(a, b)?.path ?? null;
  }

  /** { path, seconds, metres } between two places if known; otherwise null, and it is fetched. */
  trip(a, b, { live = false } = {}) {
    const key = this.key(a, b, live);
    if (this.cache.has(key)) return this.cache.get(key);
    const stored = live ? null : this.storage.read(`trip:${key}`);
    if (stored) {
      const trip = { ...stored, path: stored.path.map(([lat, lng]) => ({ lat, lng })) };
      this.cache.set(key, trip);
      return trip;
    }
    if (!this.pending.has(key)) this.request(key, a, b, live);
    return null;
  }

  request(key, a, b, live) {
    this.pending.add(key);
    const ask = { origin: { lat: a.lat, lng: a.lng }, destination: { lat: b.lat, lng: b.lng }, departureTime: live ? this.clock.now() : null };
    return this.gateway.route(ask).then(
      (trip) => {
        this.pending.delete(key);
        this.cache.set(key, trip);
        if (!live) this.storage.write(`trip:${key}`, { ...trip, path: trip.path.map((p) => [+p.lat.toFixed(5), +p.lng.toFixed(5)]) });
        this.listeners.forEach((fn) => fn());
      },
      (error) => {
        this.pending.delete(key);
        this.logger.error(`Directions request failed for ${a.name ?? key} → ${b.name ?? ''}: ${error.message}`);
      },
    );
  }
}
