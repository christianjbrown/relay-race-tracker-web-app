/**
 * The relay as the timeline planned it, at the moment the rewind is on:
 * what the runner was doing and where, with no tracker in it at all, since
 * nothing kept the trackers' positions from the time.
 */
export class ScheduleReplay {
  constructor(deps) {
    this.rewind = deps.rewind;
    this.activity = deps.activity;
    this.estimator = deps.estimator;
    this.streetView = deps.streetView;
    this.journey = deps.journey;
    this.painter = deps.painter;
    this.card = deps.card;
    this.runnerMarker = deps.runnerMarker;
    this.badgeChoice = deps.badgeChoice;
    this.vehicleMarker = deps.vehicleMarker;
    this.groupMarker = deps.groupMarker;
    this.birthday = deps.birthday;
  }

  /** Where the timeline puts the runner, marked as a replay rather than a live guess. */
  where() {
    return { ...this.estimator.at(this.rewind.time), replayed: true };
  }

  lookAround() {
    return this.streetView.of(this.activity.at(this.rewind.time), this.where());
  }

  render() {
    const t = this.rewind.time;
    const act = this.activity.at(t);
    const fix = this.where();
    this.runnerMarker.update(fix, this.badgeChoice.of(act), this.birthday.on(t));
    this.vehicleMarker.update(null);
    this.groupMarker.update(null);
    this.painter.paint(this.journey.pieces(t, act, null));
    this.card.render(t, fix, act);
  }
}
