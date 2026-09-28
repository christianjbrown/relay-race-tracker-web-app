/**
 * Congratulations once the relay is over: fireworks, and what the runner's
 * team did - how far its legs went and how long the whole thing took.
 * It comes up once a page load, whether the page was open as they crossed
 * the line or opened afterwards, and goes away when it is closed.
 */
export class Celebration {
  constructor(els, words, formats, summary, fireworks) {
    this.els = els;
    this.words = words;
    this.formats = formats;
    this.summary = summary;
    this.fireworks = fireworks;
    this.shown = false;
  }

  bind() {
    this.els.get('celebration-close').addEventListener('click', () => this.close());
  }

  render({ state }) {
    if (state !== 'finished' || this.shown) return;
    this.shown = true;
    const w = this.words;
    this.els.get('celebration-title').textContent = w.congratulations;
    // The time reads as one phrase, so a narrow card breaks before it rather than inside it.
    const time = this.formats.span(this.summary.ms()).replaceAll(' ', '\u00a0');
    this.els.get('celebration-text').textContent = w.teamRan(this.formats.km(this.summary.km()), time);
    this.els.get('celebration-close').textContent = w.backToMap;
    this.els.get('celebration').hidden = false;
    this.fireworks.start();
  }

  close() {
    this.els.get('celebration').hidden = true;
    this.fireworks.stop();
  }
}
