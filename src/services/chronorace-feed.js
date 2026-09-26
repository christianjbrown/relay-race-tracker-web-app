export const CHRONORACE_API = 'https://prod.chronorace.be/api/gps';

const ZONED = /Z|[+-]\d\d:?\d\d$/;

// Chronorace sometimes stops answering without failing. A request that has
// not answered by then counts as failed, so the page estimates instead of
// waiting, and asks again on the next poll.
export const REQUEST_TIMEOUT_MS = 10000;

/**
 * Chronorace's live GPS feed for one event. The API is not documented;
 * this is what its own live-tracking page asks for.
 */
export class ChronoraceFeed {
  constructor(eventId, http, api = CHRONORACE_API, timeoutMs = REQUEST_TIMEOUT_MS) {
    this.eventId = eventId;
    this.http = http;
    this.api = api;
    this.timeoutMs = timeoutMs;
  }

  /** The event's configuration: its trackers, its course and its times. */
  config() {
    return this.getJson(`${this.api}/config/${this.eventId}`);
  }

  /** Device id for each tracker label ("Bib" in Chronorace's config). */
  async devicesByBib() {
    const config = await this.config();
    const out = {};
    for (const t of Object.values(config.Trackers ?? {})) out[t.Bib] = t.DeviceId;
    return out;
  }

  /** Latest fix per device. Chronorace sends UTC with no zone marker. */
  async positions() {
    const raw = await this.getJson(`${this.api}/get/${this.eventId}`);
    const out = {};
    for (const [id, p] of Object.entries(raw)) {
      out[id] = { lat: p.Lat, lng: p.Lon, time: new Date(ZONED.test(p.Time) ? p.Time : `${p.Time}Z`) };
    }
    return out;
  }

  async getJson(url) {
    const res = await this.http(url, { cache: 'no-store', signal: AbortSignal.timeout(this.timeoutMs) });
    if (!res.ok) throw new Error(`${url} answered ${res.status}`);
    return res.json();
  }
}
