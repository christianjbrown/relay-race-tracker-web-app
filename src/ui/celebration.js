/**
 * The congratulations once the relay is over, with fireworks behind them.
 * They come up once a page load, whether the page was open as the team
 * crossed the line or opened afterwards, and go away when closed.
 */
export class Celebration {
  constructor(els, message, fireworks) {
    this.els = els;
    this.message = message;
    this.fireworks = fireworks;
    this.shown = false;
  }

  bind() {
    this.els.get('celebration-close').addEventListener('click', () => this.close());
  }

  render({ state }) {
    if (state !== 'finished' || this.shown) return;
    this.shown = true;
    this.els.get('celebration-title').textContent = this.message.title();
    this.els.get('celebration-text').textContent = this.message.text();
    this.els.get('celebration-close').textContent = this.message.close();
    this.els.get('celebration').hidden = false;
    this.fireworks.start();
  }

  close() {
    this.els.get('celebration').hidden = true;
    this.fireworks.stop();
  }
}
