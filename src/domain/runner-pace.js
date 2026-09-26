import { clamp } from './geo.js';

const HOUR = 3600 * 1000;

/**
 * The pace of whoever is being timed - our runner on a leg, or the runner
 * coming in while ours waits - from how far along the course they have come
 * while the page has watched, blended with a planned pace until there is
 * enough of it to trust. It starts again for each new stint, so one
 * runner's pace is never used for another's.
 *
 * Seen pace is progress along the course over everything watched of the
 * stint. Adding up straight-line hops between fixes counted GPS jitter as
 * distance, and trusting a single minute turned a pause at a runner change
 * into walking pace.
 */
export class RunnerPace {
  constructor(tuning) {
    this.tuning = tuning;
    this.samples = [];
    this.stint = null;
  }

  /** One poll's position: when (ms), and how far along the course in km. */
  observe(time, km) {
    const last = this.samples[this.samples.length - 1];
    if (last && time <= last.time) return;
    this.samples.push({ time, km });
  }

  /** Starts again when a different stint is being timed. */
  follow(stint) {
    if (stint === this.stint) return;
    this.stint = stint;
    this.samples = [];
  }

  /** Whether the page has watched long enough to say anything. */
  watched() {
    return this.span() >= this.tuning.paceWindowMs;
  }

  span() {
    const n = this.samples.length;
    return n < 2 ? 0 : this.samples[n - 1].time - this.samples[0].time;
  }

  /** The planned pace, moved towards the seen pace the longer it has been seen. */
  kmh(planned) {
    if (!this.watched()) return planned;
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const seen = clamp((last.km - first.km) / (this.span() / HOUR), this.tuning.paceMinKmh, this.tuning.paceMaxKmh);
    const trust = Math.min(1, this.span() / this.tuning.paceTrustMs);
    return trust * seen + (1 - trust) * planned;
  }
}
