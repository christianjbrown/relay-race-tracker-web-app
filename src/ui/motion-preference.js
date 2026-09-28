/** Whether the reader has asked their device for less motion. */
export class MotionPreference {
  constructor(win) {
    this.win = win;
  }

  reduced() {
    return this.win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
