/**
 * Connects the page to the map view: the two buttons, dragging the map,
 * and the card changing size - when the schedule opens, on rotation and on
 * resize - each of which re-fits the map around whatever room is left.
 */
export class ViewControls {
  constructor(els, view, surface, win) {
    this.els = els;
    this.view = view;
    this.surface = surface;
    this.win = win;
  }

  bind() {
    this.els.get('centre').addEventListener('click', () => this.view.follow());
    this.els.get('overview').addEventListener('click', () => this.view.overview());
    this.surface.onDragStart(() => this.view.release());
  }

  watchCard() {
    let frame = 0;
    let last = '';
    new this.win.ResizeObserver(([entry]) => {
      const size = `${Math.round(entry.contentRect.width)}x${Math.round(entry.contentRect.height)}`;
      if (size === last) return;
      last = size;
      this.win.cancelAnimationFrame(frame);
      frame = this.win.requestAnimationFrame(() => this.view.apply());
    }).observe(this.els.get('card'));
    this.win.addEventListener('resize', () => this.view.apply());
  }
}
