/**
 * What clicking the runner's face does: out on a leg it opens Street View
 * where they are, in a new tab; otherwise the map follows them.
 */
export class RunnerClick {
  constructor(win, place, follow) {
    this.win = win;
    this.place = place;
    this.follow = follow;
  }

  click() {
    const url = this.place();
    if (url) this.win.open(url, '_blank', 'noopener');
    else this.follow();
  }
}
