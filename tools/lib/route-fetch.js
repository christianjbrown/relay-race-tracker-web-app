import path from 'node:path';

/**
 * Fetches the course from Chronorace once and keeps it with the site. The
 * course does not change during the event, so it is kept rather than
 * fetched by every visitor: one request here instead of one per page load,
 * and the page keeps working if Chronorace takes the event down afterwards.
 */
export class RouteFetch {
  constructor(files, feedFor, log) {
    this.files = files;
    this.feedFor = feedFor; // eventId => ChronoraceFeed
    this.log = log;
  }

  async run({ site, track }) {
    const config = JSON.parse(await this.files.readText(path.join(site, 'config.json')));
    const eventId = config.chronorace?.eventId;
    if (!eventId) throw new Error(`${site}/config.json has no chronorace.eventId.`);
    const { Tracks: tracks = [] } = await this.feedFor(eventId).config();
    if (tracks.length === 0) throw new Error(`Chronorace event ${eventId} has no course.`);
    const chosen = track == null ? tracks[0] : tracks.find((t, i) => t.Name === track || String(i) === track);
    if (!chosen) throw new Error(`Chronorace event ${eventId} has no course called "${track}". It has: ${tracks.map((t) => t.Name).join(', ')}.`);
    if (tracks.length > 1 && track == null) this.log(`The event has ${tracks.length} courses (${tracks.map((t) => t.Name).join(', ')}); using the first. Choose another with --track.`);
    const file = path.join(site, 'route.json');
    await this.files.write(file, JSON.stringify({ name: chosen.Name, polylines: chosen.Polylines }));
    this.log(`Wrote ${file}: ${chosen.Name}.`);
  }
}
