const REDRAW_MS = 30 * 1000;

/**
 * The live loop: poll the trackers, work out what the runner is doing, and
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
    this.locator = deps.locator;
    this.journey = deps.journey;
    this.eta = deps.eta;
    this.course = deps.course;
    this.painter = deps.painter;
    this.card = deps.card;
    this.runnerMarker = deps.runnerMarker;
    this.vehicleMarker = deps.vehicleMarker;
    this.birthday = deps.birthday;
    this.tuning = deps.tuning;
    this.timers = deps.timers;
    this.view = null;
    this.sheet = null;
  }

  /** The map view and the sheet, which are made after the app because they ask it where the runner is. */
  attach(view, sheet) {
    this.view = view;
    this.sheet = sheet;
  }

  /** Keeps polling and redrawing: the clock moves even when the trackers do not. */
  run() {
    this.timers.setInterval(() => this.poll(), this.tuning.pollMs);
    this.timers.setInterval(() => this.render(), REDRAW_MS);
  }

  async poll() {
    await this.poller.poll();
    this.render();
    if (this.view?.following()) this.view.centre();
  }

  /** What the runner is doing now: the timeline, corrected by the trackers. */
  now(now = this.clock.now()) {
    const vehicle = this.poller.liveVehicle(now, this.tuning.staleMs);
    return this.activity.at(now, {
      runner: this.poller.liveRunner(),
      vehicleWaiting: vehicle && this.handovers.parked(vehicle, now) ? vehicle : null,
      // Parked only once two polls agree it has not moved; until then, as
      // far as arriving goes, it may still be driving.
      vehicle: vehicle ? { ...vehicle, parked: this.handovers.still === true } : null,
      paceKmh: this.pace.kmh(this.tuning.jogKmh),
    });
  }

  /** Where the runner is now. */
  where() {
    return this.locator.where(this.now(), this.poller.live);
  }

  render() {
    const now = this.clock.now();
    this.poller.fillGuesses(this.estimator.at(now));
    const act = this.now(now);
    this.timePace(act);
    const fix = this.locator.where(act, this.poller.live);
    const badge = { finished: 'finished', waiting: 'drive', before: null }[act.state] ?? act.kind;
    this.runnerMarker.update(fix, badge, this.birthday.on(now));
    const vehicle = this.poller.liveVehicle(now, this.tuning.staleMs);
    // Only where it really is - an estimated vehicle would be a guess on a
    // guess - and not while the runner is out on a leg without it.
    const onLeg = act.kind === 'run' && act.state !== 'waiting';
    this.vehicleMarker.update(onLeg ? null : vehicle);
    this.painter.paint(this.journey.pieces(now, act, vehicle));
    const trip = act.kind === 'drive' && vehicle ? this.eta.estimate(act.seg, vehicle, now) : null;
    this.card.render(now, fix, act, trip, this.legFinish.at(now, act));
    this.sheet?.refresh();
  }

  /** A new runner is timed from scratch: ours on a leg, or the one coming in while ours waits. */
  timePace(act) {
    this.pace.follow(act.kind === 'run' ? `${act.index}:${act.state === 'waiting' ? 'incoming' : 'ours'}` : null);
    const runner = this.poller.liveRunner();
    if (act.kind === 'run' && act.at != null && runner) this.pace.observe(runner.time.getTime(), this.course.km[act.at]);
  }
}
