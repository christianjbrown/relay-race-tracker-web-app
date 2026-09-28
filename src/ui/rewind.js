const STEPS = 1000;
const MINUTE = 60 * 1000;

/**
 * Rewinding the relay once it is over: a slider across the whole timeline
 * that picks the moment the page shows, and a button back to the end. It
 * is part of the card, and comes up the first time the card shows the
 * relay finished. `time` is null while the page shows the present.
 */
export class Rewind {
  constructor(els, words, formats, schedule) {
    this.els = els;
    this.words = words;
    this.formats = formats;
    this.from = schedule.first.start.getTime();
    this.to = schedule.last.end.getTime();
    this.time = null;
    this.offered = false;
    this.listeners = [];
  }

  bind() {
    const range = this.els.get('rewind-range');
    range.min = '0';
    range.max = String(STEPS);
    range.value = String(STEPS);
    this.els.get('rewind-label').textContent = this.words.rewind;
    this.els.get('rewind-live').textContent = this.words.rewindEnd;
    range.addEventListener('input', () => this.go(this.timeAt(Number(range.value))));
    this.els.get('rewind-live').addEventListener('click', () => {
      range.value = String(STEPS);
      this.go(null);
    });
  }

  /** Called with nothing each time the moment shown changes. */
  listen(fn) {
    this.listeners.push(fn);
  }

  /** Shows the slider once the relay is over, and not before. */
  render({ state }) {
    if (this.offered || state !== 'finished') return;
    this.offered = true;
    this.els.get('rewind').hidden = false;
  }

  /** The moment a slider position stands for, to the minute. */
  timeAt(value) {
    const t = this.from + ((this.to - this.from) * value) / STEPS;
    return new Date(Math.round(t / MINUTE) * MINUTE);
  }

  go(time) {
    this.time = time;
    this.els.get('rewind-time').textContent = time ? this.formats.dayTime(time) : '';
    this.els.get('rewind-live').hidden = !time;
    for (const fn of this.listeners) fn();
  }
}
