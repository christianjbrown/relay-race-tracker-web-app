/**
 * What the runner is actually doing: the timeline, corrected by the
 * trackers. The clock decides everything the trackers cannot, and
 * everything at all when there is no fresh runner position to go on.
 */
export class Activity {
  constructor(schedule, states, { waits, legs, arrivals }, tuning) {
    this.schedule = schedule;
    this.states = states;
    this.waits = waits;
    this.legs = legs;
    this.arrivals = arrivals;
    this.tuning = tuning;
  }

  /**
   * `runner` is the runner tracker's fix; `vehicleWaiting` the vehicle's
   * when it is parked with the team; `vehicle` the vehicle's in any case,
   * with `parked` set once two polls agree it has not moved.
   */
  at(now, { runner = null, vehicleWaiting = null, vehicle = null, paceKmh = this.tuning.jogKmh } = {}) {
    const fresh = (fix) => (fix && now - fix.time <= this.tuning.staleMs ? fix : null);
    const planned = this.schedule.at(now);
    const ctx = { now, planned, paceKmh, runner: fresh(runner), vehicleWaiting: fresh(vehicleWaiting), vehicle: fresh(vehicle) };

    let leg = this.legInPlay(planned, now);
    const wait = this.waits.check(ctx);
    if (wait?.state) return wait.state;
    if (wait?.leg) leg = wait.leg;

    const onLeg = leg && ctx.runner ? this.legs.check(leg, ctx) : null;
    if (onLeg) return onLeg;
    if (!planned) return this.states.outside(now);
    return this.arrivals.check(planned, ctx) ?? this.states.of(planned, 'planned');
  }

  /** The leg the timeline says is on, or the last one if its time is up but it may be running long. */
  legInPlay(planned, now) {
    if (planned?.kind === 'run') return planned;
    const last = this.schedule.lastRunStartedBy(now);
    return last && now >= last.end && now - last.end < this.tuning.maxOverrunMs ? last : null;
  }
}
