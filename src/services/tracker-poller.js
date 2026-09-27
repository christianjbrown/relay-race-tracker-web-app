/**
 * Asks the feed where the runner and vehicle trackers are. Whichever the
 * feed cannot give - the whole feed failing, or one tracker missing from
 * it - is logged and left to be estimated from the timeline, so the page
 * always shows the runner somewhere and says when it is a guess. A real
 * position is kept through a failed request until it goes stale, since one
 * request timing out says nothing about where the tracker is.
 */
export class TrackerPoller {
  constructor(feed, bibs, handovers, logger) {
    this.feed = feed;
    this.bibs = bibs; // { runner, vehicle }
    this.handovers = handovers;
    this.logger = logger;
    this.devices = null;
    this.live = { runner: null, vehicle: null };
    this.guessed = new Set();
  }

  async poll() {
    this.guessed.clear();
    try {
      this.devices ??= await this.feed.devicesByBib();
      const fixes = await this.feed.positions();
      for (const which of ['runner', 'vehicle']) this.take(which, fixes[this.devices[this.bibs[which]]]);
      if (!this.guessed.has('vehicle')) this.handovers.observe(this.live.vehicle, this.others(fixes));
    } catch (e) {
      this.logger.error('Chronorace request failed; estimating positions from the timeline.', e);
      this.devices = null;
      this.guessed.add('runner').add('vehicle');
    }
  }

  take(which, fix) {
    if (fix) {
      this.live[which] = fix;
      return;
    }
    this.logger.error(`Chronorace has no position for tracker ${this.bibs[which]}; estimating it from the timeline.`);
    this.guessed.add(which);
  }

  /** Every other tracker in the event: the rest of the team's vehicles and runners. */
  others(fixes) {
    const mine = new Set([this.devices[this.bibs.runner], this.devices[this.bibs.vehicle]]);
    return Object.entries(fixes).filter(([id]) => !mine.has(id)).map(([, fix]) => fix);
  }

  /**
   * Puts estimates in for whichever trackers the last poll could not give,
   * unless the real position from before is still fresh.
   */
  fillGuesses(estimate, now, staleMs) {
    for (const which of this.guessed) {
      const held = this.live[which];
      if (!held || held.estimated || now - held.time > staleMs) this.live[which] = estimate;
    }
  }

  /** The vehicle's real position, or null when it is estimated or stale. */
  liveVehicle(now, staleMs) {
    const v = this.live.vehicle;
    return !v || v.estimated || now - v.time > staleMs ? null : v;
  }

  /** The runner tracker's real fix, or null when it is estimated. */
  liveRunner() {
    const r = this.live.runner;
    return r && !r.estimated ? r : null;
  }
}
