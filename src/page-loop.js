const REDRAW_MS = 30 * 1000;

/**
 * Keeps polling the trackers and redrawing the page: the clock moves even
 * when the trackers do not. Once the relay is over the polling stops, and
 * only the redrawing goes on.
 */
export class PageLoop {
  constructor(trackers, screen, timers, tuning, ending) {
    this.trackers = trackers;
    this.screen = screen;
    this.timers = timers;
    this.tuning = tuning;
    this.ending = ending;
    this.polling = null;
  }

  run() {
    this.polling = this.timers.setInterval(() => this.poll(), this.tuning.pollMs);
    this.timers.setInterval(() => this.screen.render(), REDRAW_MS);
  }

  async poll() {
    if (this.ending.over) {
      this.timers.clearInterval(this.polling);
      return;
    }
    await this.trackers.poll();
    this.screen.show();
  }
}
