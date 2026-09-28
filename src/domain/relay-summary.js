/**
 * What the relay came to for the runner's team: the kilometres of its own
 * legs, and the time from the first moment of the timeline to the last.
 */
export class RelaySummary {
  constructor(schedule) {
    this.schedule = schedule;
  }

  km() {
    return this.schedule.segments.reduce((sum, seg) => sum + (seg.kind === 'run' && seg.km ? seg.km : 0), 0);
  }

  ms() {
    return this.schedule.last.end - this.schedule.first.start;
  }
}
