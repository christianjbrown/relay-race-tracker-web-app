/**
 * The relay, once it is definitely over. After the finish the trackers go
 * home with the team: the vehicle drives back to its base and the runner
 * tracker rides along, and following them would put the relay back on the
 * road. So once the relay is over it stays over, and nobody needs to ask
 * the trackers anything again.
 *
 * Definitely over means finished with the runner tracker fresh and agreeing,
 * or so long past the end of the timeline that the trackers are no longer
 * listened to at all. A finish seen only because the tracker went quiet is
 * not trusted: the last runner may still be coming in.
 */
export class RelayEnd {
  constructor(activity, schedule, states, tuning) {
    this.activity = activity;
    this.schedule = schedule;
    this.states = states;
    this.tuning = tuning;
    this.over = false;
  }

  /** What the runner is doing, as `Activity.at` says, until the relay is over, and finished from then on. */
  at(now, fixes = {}) {
    if (this.over) return this.states.outside(now);
    const act = this.activity.at(now, fixes);
    if (act.state === 'finished' && (this.fresh(fixes.runner, now) || this.pastOverrun(now))) this.over = true;
    return act;
  }

  fresh(fix, now) {
    return Boolean(fix) && now - fix.time <= this.tuning.staleMs;
  }

  pastOverrun(now) {
    return now - this.schedule.last.end >= this.tuning.maxOverrunMs;
  }
}
