const HOUR = 3600 * 1000;

/**
 * The runner coming in while ours is driven to the next leg, or waits at a
 * stop before it. The drive says when ours gets to the start, and the stop
 * when it was planned to end, but the leg cannot begin until the runner
 * before hands over, and they can be well behind the timeline.
 */
export class IncomingRunner {
  constructor(schedule, course, tuning) {
    this.schedule = schedule;
    this.course = course;
    this.tuning = tuning;
  }

  /**
   * { leg, index, at, time, notBefore } while a drive or a stop leads to a
   * leg and the runner tracker is fresh: the leg, its place in the
   * timeline, where and when the tracker last put the runner coming in on
   * the course, and, after a stop, the stop's planned end. Otherwise null.
   */
  place(act, runner, now) {
    if (!act.seg || act.kind === 'run' || !runner || now - runner.time > this.tuning.staleMs) return null;
    const leg = this.schedule.after(act.seg);
    if (leg?.kind !== 'run') return null;
    const at = this.course.nearestIndex(runner, leg.searchFrom, leg.span[1]);
    // A stop lasts at least as long as it was planned to; only a drive hands over as soon as both are there.
    const notBefore = act.kind === 'drive' ? null : act.seg.end;
    return { leg, index: this.schedule.indexOf(leg), at, time: runner.time, notBefore };
  }

  /**
   * When the runner coming in reaches the leg's start at this pace, counted
   * from the fix rather than from now, so a tracker that goes quiet for a
   * few minutes does not push the time later on every redraw. Never before
   * the end of a stop that leads to the leg.
   */
  arrival({ leg, at, time, notBefore = null }, paceKmh) {
    const left = Math.max(0, this.course.between(at, leg.span[0]));
    const reached = new Date(time.getTime() + (left / paceKmh) * HOUR);
    return notBefore && notBefore > reached ? notBefore : reached;
  }
}
