/**
 * The runner's own timeline: every leg, drive, rest and stretch of free
 * time, in order. Times are read from ISO strings with their offsets.
 */
export class Schedule {
  constructor(segments) {
    if (!segments.length) throw new Error('The schedule has no segments.');
    this.segments = segments.map((s) => ({ ...s, start: new Date(s.start), end: new Date(s.end) }));
  }

  get first() { return this.segments[0]; }

  get last() { return this.segments[this.segments.length - 1]; }

  /** The segment going on at this moment, or null outside the timeline. */
  at(now) {
    return this.segments.find((s) => s.start <= now && now < s.end) ?? null;
  }

  indexOf(segment) {
    return this.segments.indexOf(segment);
  }

  after(segment) {
    return this.segments[this.indexOf(segment) + 1] ?? null;
  }

  before(segment) {
    return this.segments[this.indexOf(segment) - 1] ?? null;
  }

  /** Which kind of segment the runner is in: the timeline's, or the nearest end of it outside it. */
  kindAt(now) {
    const current = this.at(now);
    if (current) return current.kind;
    return now < this.first.start ? this.first.kind : this.last.kind;
  }

  /** Every place on the timeline, for fitting the map around the lot. */
  places() {
    return this.segments.flatMap((s) => [s.from, s.to, s.at]).filter(Boolean);
  }

  /** The last leg that has started by this moment, or null. */
  lastRunStartedBy(now) {
    return [...this.segments].reverse().find((s) => s.kind === 'run' && s.start <= now) ?? null;
  }
}
