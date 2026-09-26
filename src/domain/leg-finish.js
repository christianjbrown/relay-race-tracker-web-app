const HOUR = 3600 * 1000;

/**
 * When the runner's leg will end at the pace they are actually going, once
 * the page has watched long enough to know it: the leg's planned pace,
 * moved towards the pace seen along the course.
 */
export class LegFinish {
  constructor(course, pace) {
    this.course = course;
    this.pace = pace;
  }

  /** The expected finish, or null when the card should show the planned time. */
  at(now, act) {
    if (act.kind !== 'run' || (act.state !== 'running' && act.state !== 'overrun')) return null;
    if (!this.pace.watched() || act.at == null) return null;
    const [a, b] = act.seg.span;
    const planned = this.course.between(a, b) / ((act.seg.end - act.seg.start) / HOUR);
    const left = Math.max(0, this.course.between(act.at, act.end ?? b));
    return new Date(now.getTime() + (left / this.pace.kmh(planned)) * HOUR);
  }
}
