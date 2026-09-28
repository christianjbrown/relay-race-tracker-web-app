/** A line on the card saying the runner's face opens Street View, shown whenever it does. */
export class LookHint {
  constructor(els, words, streetView) {
    this.els = els;
    this.words = words;
    this.streetView = streetView;
  }

  render(fix, act) {
    const look = this.els.get('look');
    look.textContent = this.words.lookAround;
    look.hidden = !this.streetView.of(act, fix);
  }
}
