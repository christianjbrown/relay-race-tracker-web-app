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
 * not trusted: the last runner may still be coming in. A page opened a
 * while after the end that has never seen the relay going on does not ask
 * the trackers at all, since by then they are already heading home; one
 * that has watched a late finish keeps following it.
 */
export class RelayEnd {
  constructor(activity, schedule, states, tuning) {
    this.activity = activity;
    this.schedule = schedule;
    this.states = states;
    this.tuning = tuning;
    this.over = false;
    this.seenGoing = false;
  }

  /** What the runner is doing, as `Activity.at` says, until the relay is over, and finished from then on. */
  at(now, fixes = {}) {
    if (!this.over && !this.seenGoing && this.since(now) >= this.tuning.finishedAfterMs) this.over = true;
    if (this.over) return this.states.outside(now);
    const act = this.activity.at(now, fixes);
    if (act.state !== 'finished') this.seenGoing = true;
    else if (this.fresh(fixes.runner, now) || this.since(now) >= this.tuning.maxOverrunMs) this.over = true;
    return act;
  }

  fresh(fix, now) {
    return Boolean(fix) && now - fix.time <= this.tuning.staleMs;
  }

  /** How long since the timeline ended; negative before then. */
  since(now) {
    return now - this.schedule.last.end;
  }
}
