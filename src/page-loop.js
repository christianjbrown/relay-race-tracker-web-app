const REDRAW_MS = 30 * 1000;

/** Keeps polling the trackers and redrawing the page: the clock moves even when the trackers do not. */
export class PageLoop {
  constructor(trackers, screen, timers, tuning) {
    this.trackers = trackers;
    this.screen = screen;
    this.timers = timers;
    this.tuning = tuning;
  }

  run() {
    this.timers.setInterval(() => this.poll(), this.tuning.pollMs);
    this.timers.setInterval(() => this.screen.render(), REDRAW_MS);
  }

  async poll() {
    await this.trackers.poll();
    this.screen.show();
  }
}
