/**
 * The finish, once the team set off for it late. The start and the finish
 * line can be too close together on the course to tell apart, so once the
 * last runner reaches the start the tracker looks as if it has already
 * finished. After a late start the finish is taken to last as long as it
 * was planned to, from the moment the page saw the wait for the last
 * runner end. A page that never saw that wait has nothing to go on and
 * leaves the finish to the trackers.
 */
export class LateFinish {
  constructor(schedule, states) {
    this.finish = schedule.segments.find((seg) => seg.finish) ?? null;
    this.states = states;
    this.waited = false;
    this.startedAt = null;
  }

  /** The activity as it stands, or the finish still being run after a late start. */
  hold(act, now) {
    const finish = this.finish;
    if (!finish) return act;
    if (act.seg === finish && act.state === 'waiting') {
      this.waited = true;
      return act;
    }
    if (this.waited && !this.startedAt) this.startedAt = now;
    if (!this.startedAt || now - this.startedAt >= finish.end - finish.start) return act;
    // Still inside the planned time of a finish that set off late: not over, and not running long either.
    return this.states.of(finish, 'running', act.seg === finish ? { reached: act.reached, at: act.at, end: act.end } : {});
  }
}
