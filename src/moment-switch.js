/**
 * Which moment the page shows: the live one, or the one the rewind is on.
 * Both answer the same three questions - draw yourself, where is the
 * runner, and what does Street View show there - so the rest of the page
 * asks this and never needs to know which it is talking to.
 */
export class MomentSwitch {
  constructor(live, replay, rewind) {
    this.live = live;
    this.replay = replay;
    this.rewind = rewind;
    this.view = null;
    this.sheet = null;
  }

  /** The map view and the sheet, which are made after the page because they ask it where the runner is. */
  attach(view, sheet) {
    this.view = view;
    this.sheet = sheet;
  }

  current() {
    return this.rewind.time ? this.replay : this.live;
  }

  render() {
    this.current().render();
    this.sheet?.refresh();
  }

  /** Draws the moment, and keeps the map on the runner when it is following them. */
  show() {
    this.render();
    if (this.view?.following()) this.view.centre();
  }

  where() {
    return this.current().where();
  }

  lookAround() {
    return this.current().lookAround();
  }
}
