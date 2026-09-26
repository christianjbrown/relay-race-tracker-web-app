/**
 * The card over the map: what the runner is doing, how far through it they
 * are, what comes next, how fresh the position is, and the whole schedule.
 */
export class Card {
  constructor({ status, progress, next, meta, timeline }) {
    this.status = status;
    this.progress = progress;
    this.next = next;
    this.meta = meta;
    this.timeline = timeline;
  }

  /**
   * `trip` is the vehicle's live arrival on a drive; `legEnd` when the
   * runner's leg will end at their own pace. Either may be null.
   */
  render(now, fix, act, trip = null, legEnd = null) {
    this.status.render(now, act);
    this.progress.render(now, act, trip, legEnd);
    const arrival = act.wait?.eta ?? legEnd ?? trip?.arrival ?? null;
    this.next.render(now, act, arrival);
    this.meta.render(now, fix, act);
    this.timeline.render(act);
  }
}
