import { clamp, shareOf } from '../domain/geo.js';

const LATE_MS = 5 * 60 * 1000;

/**
 * How far through what is going on the runner is, as a bar and two labels.
 * Each measure below answers only the situations it `fits`; the first that
 * fits is used, and time through the segment is the measure of last resort.
 * Each gives `{ share, left, right, late }`.
 */

/** Waiting to take over: how far the relay has come towards the runner since their last leg. */
export class WaitingProgress {
  constructor(course, words, formats) {
    this.course = course;
    this.words = words;
    this.formats = formats;
  }

  fits({ act }) {
    return act.state === 'waiting' && Boolean(act.wait);
  }

  measure({ now, act }) {
    const km = this.course.km;
    const from = km[act.seg.searchFrom];
    const share = (km[act.at] - from) / (km[act.wait.handover] - from);
    return {
      share: clamp(share, 0, 1),
      left: this.words.runnerAway(this.formats.duration(act.wait.eta - now)),
      right: (act.seg.finish ? this.words.startsAbout : this.words.takesOver)(this.formats.when(act.wait.eta, now)),
      late: false,
    };
  }
}

/** A drive with the vehicle live: Google's estimate from where it is, not the timeline's times. */
export class DriveProgress {
  constructor(words, formats) {
    this.words = words;
    this.formats = formats;
  }

  fits({ act, trip }) {
    return act.seg.kind === 'drive' && Boolean(trip);
  }

  measure({ now, act, trip }) {
    const share = trip.share ?? Math.min(1, (now - act.seg.start) / (trip.arrival - act.seg.start));
    return {
      share: Math.max(0, share),
      left: this.words.etaLeft(this.formats.duration(trip.arrival - now)),
      right: this.words.arrives(this.formats.when(trip.arrival, now)),
      late: false,
    };
  }
}

/**
 * A leg the tracker is following: distance, not time. How much of the leg
 * is behind the runner, how far is left, and when it will be done.
 */
export class RunProgress {
  constructor(course, words, formats) {
    this.course = course;
    this.words = words;
    this.formats = formats;
  }

  fits({ act }) {
    return act.seg.kind === 'run' && (act.state === 'running' || act.state === 'overrun');
  }

  measure({ now, act, legEnd }) {
    const [a] = act.seg.span;
    const b = act.end ?? act.seg.span[1];
    const w = this.words;
    // Measured from the runner, not the leg: a runner still short of the
    // leg's start has further to go than the leg is long.
    const left = w.kmLeft(this.formats.kmFixed(Math.max(0, this.course.between(act.at, b))));
    const share = this.course.between(a, act.reached) / this.course.between(a, b);
    const planned = this.formats.when(act.seg.end, now);
    if (legEnd) {
      // At the runner's own pace; late when that is more than five minutes past the plan.
      return { share, left, right: w.finishesAbout(this.formats.when(legEnd, now)), late: legEnd - act.seg.end > LATE_MS };
    }
    const overrun = act.state === 'overrun';
    return { share, left, right: overrun ? w.overrun(planned) : w.plannedUntil(planned), late: overrun };
  }
}

/** Anything else: time through the segment, by the timeline. */
export class TimeProgress {
  constructor(words, formats) {
    this.words = words;
    this.formats = formats;
  }

  fits() {
    return true;
  }

  measure({ now, act }) {
    return {
      share: shareOf(act.seg, now),
      left: this.words.left(this.formats.duration(act.seg.end - now)),
      right: this.words.ends(this.formats.when(act.seg.end, now)),
      late: act.state === 'overrun',
    };
  }
}

/** The progress bar, drawn by whichever measure fits. */
export class ProgressView {
  constructor(els, colours, measures) {
    this.els = els;
    this.colours = colours;
    this.measures = measures;
  }

  render(now, act, trip, legEnd) {
    const box = this.els.get('progress');
    box.hidden = !act.seg;
    if (!act.seg) return;
    const ctx = { now, act, trip, legEnd };
    const { share, left, right, late } = this.measures.find((m) => m.fits(ctx)).measure(ctx);
    const fill = this.els.get('progress-fill');
    fill.style.setProperty('--fill', this.colours[act.seg.kind]);
    fill.style.width = `${(share * 100).toFixed(1)}%`;
    this.els.get('progress-left').textContent = left;
    const end = this.els.get('progress-end');
    end.textContent = right;
    end.classList.toggle('late', late);
  }
}
