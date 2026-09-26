/**
 * Every tracker in a Chronorace event, with the label ("Bib") the site's
 * config names it by and when it last reported, so the runner's and the
 * vehicle's can be picked out.
 */
export class TrackerList {
  constructor(feedFor, log) {
    this.feedFor = feedFor;
    this.log = log;
  }

  async run(eventId) {
    const feed = this.feedFor(eventId);
    const config = await feed.config();
    const trackers = Object.values(config.Trackers ?? {});
    if (trackers.length === 0) {
      this.log(`Chronorace event ${eventId} has no trackers.`);
      return;
    }
    const fixes = await feed.positions().catch(() => ({}));
    const rows = trackers
      .map((t) => [t.Bib, t.DisplayName ?? '', t.DeviceId, fixes[t.DeviceId]?.time.toISOString() ?? 'no position yet'])
      .sort((a, b) => a[0].localeCompare(b[0]));
    const table = [['Bib', 'Name', 'Device', 'Last position'], ...rows];
    const widths = table[0].map((_, i) => Math.max(...table.map((r) => r[i].length)));
    for (const row of table) this.log(row.map((cell, i) => cell.padEnd(widths[i])).join('  ').trimEnd());
  }
}
