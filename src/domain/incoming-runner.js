const HOUR = 3600 * 1000;

/**
 * The runner coming in while ours is driven to the next leg. The drive says
 * when ours gets to the start, but the leg cannot begin until the runner
 * before hands over, and they can be well behind the timeline.
 */
export class IncomingRunner {
  constructor(schedule, course, tuning) {
    this.schedule = schedule;
    this.course = course;
    this.tuning = tuning;
  }

  /**
   * { leg, index, at, time } while a drive leads to a leg and the runner
   * tracker is fresh: the leg, its place in the timeline, and where and
   * when the tracker last put the runner coming in on the course.
   * Otherwise null.
   */
  place(act, runner, now) {
    if (act.kind !== 'drive' || !runner || now - runner.time > this.tuning.staleMs) return null;
    const leg = this.schedule.after(act.seg);
    if (leg?.kind !== 'run') return null;
    return { leg, index: this.schedule.indexOf(leg), at: this.course.nearestIndex(runner, leg.searchFrom, leg.span[1]), time: runner.time };
  }

  /**
   * When the runner coming in reaches the leg's start at this pace, counted
   * from the fix rather than from now, so a tracker that goes quiet for a
   * few minutes does not push the time later on every redraw.
   */
  arrival({ leg, at, time }, paceKmh) {
    const left = Math.max(0, this.course.between(at, leg.span[0]));
    return new Date(time.getTime() + (left / paceKmh) * HOUR);
  }
}
