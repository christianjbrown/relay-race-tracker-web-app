/**
 * The live page: poll the trackers, work out what the runner is doing, and
 * draw it all - the runner, the vehicle, the journey and the card.
 */
export class App {
  constructor(deps) {
    this.clock = deps.clock;
    this.poller = deps.poller;
    this.estimator = deps.estimator;
    this.activity = deps.activity;
    this.handovers = deps.handovers;
    this.pace = deps.pace;
    this.legFinish = deps.legFinish;
    this.incoming = deps.incoming;
    this.projection = deps.projection;
    this.locator = deps.locator;
    this.streetView = deps.streetView;
    this.journey = deps.journey;
    this.eta = deps.eta;
    this.course = deps.course;
    this.painter = deps.painter;
    this.card = deps.card;
    this.runnerMarker = deps.runnerMarker;
    this.badgeChoice = deps.badgeChoice;
    this.vehicleMarker = deps.vehicleMarker;
    this.group = deps.group;
    this.groupMarker = deps.groupMarker;
    this.birthday = deps.birthday;
    this.tuning = deps.tuning;
  }

  /** Asks the trackers where everyone is. */
  poll() {
    return this.poller.poll();
  }

  /** What the runner is doing now: the timeline, corrected by the trackers. */
  now(now = this.clock.now()) {
    const vehicle = this.poller.liveVehicle(now, this.tuning.staleMs);
    const withTeam = Boolean(vehicle) && this.handovers.parked(vehicle, now);
    return this.activity.at(now, {
      runner: this.runner(now),
      vehicleWaiting: withTeam ? vehicle : null,
      // Parked once two polls agree it has not moved, or at once when the
      // team's other trackers are gathered round it, so a page opened after
      // the vehicle arrived does not show it still driving for a poll.
      vehicle: vehicle ? { ...vehicle, parked: this.handovers.still === true || withTeam } : null,
      paceKmh: this.pace.kmh(this.tuning.jogKmh),
    });
  }

  /** Where the runner is now. */
  where() {
    const now = this.clock.now();
    return this.locator.where(this.now(now), this.live(now));
  }

  /** Street View where the runner is out on a leg now, or null. */
  lookAround() {
    const now = this.clock.now();
    const act = this.now(now);
    return this.streetView.of(act, this.locator.where(act, this.live(now)));
  }

  /** The runner tracker's fix, carried on along the course while it is quiet. */
  runner(now) {
    return this.projection.of(this.poller.liveRunner(), now, this.pace.kmh(this.tuning.jogKmh));
  }

  /** Both trackers, with the runner's as projected when it is quiet. */
  live(now) {
    return { ...this.poller.live, runner: this.runner(now) ?? this.poller.live.runner };
  }

  render() {
    const now = this.clock.now();
    this.poller.fillGuesses(this.estimator.at(now), now, this.tuning.staleMs);
    const act = this.now(now);
    const runner = this.runner(now);
    const incoming = this.incoming.place(act, runner, now);
    this.timePace(act, incoming, Boolean(runner?.projected));
    const fix = this.locator.where(act, this.live(now));
    this.runnerMarker.update(fix, this.badgeChoice.of(act), this.birthday.on(now));
    // Once the relay is over the vehicle is on its own way home, not the team's.
    const vehicle = act.state === 'finished' ? null : this.poller.liveVehicle(now, this.tuning.staleMs);
    // Only where it really is - an estimated vehicle would be a guess on a
    // guess - and not while the runner is out on a leg without it.
    const onLeg = act.kind === 'run' && act.state !== 'waiting';
    this.vehicleMarker.update(onLeg ? null : vehicle);
    this.groupMarker.update(this.group.where(act, runner, now));
    this.painter.paint(this.journey.pieces(now, act, vehicle));
    const trip = act.kind === 'drive' && vehicle ? this.eta.estimate(act.seg, vehicle, now) : null;
    const handover = incoming ? this.incoming.arrival(incoming, this.pace.kmh(this.tuning.jogKmh)) : null;
    this.card.render(now, fix, act, trip, this.legFinish.at(now, act), handover);
  }

  /**
   * A new runner is timed from scratch: ours on a leg, or the one coming in
   * while ours waits or is driven to the leg. The drive and the wait time the
   * same runner, so the pace carries on from one into the other.
   */
  timePace(act, incoming = null, projected = false) {
    const onLeg = act.kind === 'run';
    const stint = onLeg ? `${act.index}:${act.state === 'waiting' ? 'incoming' : 'ours'}` : incoming && `${incoming.index}:incoming`;
    this.pace.follow(stint ?? null);
    const at = onLeg ? act.at : incoming?.at;
    // Only a real fix says how fast they are going; a projected one would
    // only repeat the pace it was projected at.
    const runner = this.poller.liveRunner();
    if (at != null && runner && !projected) this.pace.observe(runner.time.getTime(), this.course.km[at]);
  }
}
