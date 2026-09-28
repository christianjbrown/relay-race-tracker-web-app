/**
 * The card over the map: what the runner is doing, how far through it they
 * are, what comes next, how fresh the position is, whether their face opens
 * Street View, the rewind once it is over, the whole schedule, and the
 * congratulations at the end.
 */
export class Card {
  constructor({ status, progress, next, meta, look, rewind, timeline, celebration }) {
    this.status = status;
    this.progress = progress;
    this.next = next;
    this.meta = meta;
    this.look = look;
    this.rewind = rewind;
    this.timeline = timeline;
    this.celebration = celebration;
  }

  /**
   * `trip` is the vehicle's live arrival on a drive; `legEnd` when the
   * runner's leg will end at their own pace; `handover` when the runner
   * coming in reaches the leg a drive leads to. Any may be null.
   */
  render(now, fix, act, trip = null, legEnd = null, handover = null) {
    this.status.render(now, act);
    this.progress.render(now, act, trip, legEnd);
    // A leg after a drive starts once both are there: ours, and the runner handing over.
    const arrival = act.wait?.eta ?? legEnd ?? latest(trip?.arrival, handover);
    this.next.render(now, act, arrival);
    this.meta.render(now, fix, act);
    this.look.render(fix, act);
    this.rewind.render(act);
    this.timeline.render(act);
    this.celebration.render(act);
  }
}

function latest(...times) {
  return times.filter(Boolean).reduce((a, b) => (b > a ? b : a), null);
}
