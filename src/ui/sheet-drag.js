import { isNarrow } from './layout.js';

const TAP_PX = 8;

/**
 * On a phone the card is a sheet with three levels: tucked down to its
 * headline so the map gets the screen, the card as it opens, and pulled up
 * with the schedule showing. Dragging a grip moves it a level the way it
 * was pulled; a tap steps it up, and back down from the top. Dragging
 * starts only on the grips, so the rest of the card still scrolls. On
 * anything wider the card is a side panel and none of this applies.
 */
export class SheetDrag {
  constructor(card, grips, schedule, onChange, win) {
    this.card = card;
    this.grips = grips;
    this.schedule = schedule; // { isOpen(), show(open) }
    this.onChange = onChange;
    this.win = win;
    this.tucked = false;
  }

  bind() {
    this.win.addEventListener('resize', () => {
      if (!isNarrow(this.win) && this.tucked) this.setLevel(1);
    });
    this.grips.forEach((grip) => this.bindGrip(grip));
  }

  /** 0 tucked, 1 as it opens, 2 pulled up with the schedule. */
  level() {
    if (this.tucked) return 0;
    return this.schedule.isOpen() ? 2 : 1;
  }

  setLevel(level) {
    const n = Math.max(0, Math.min(2, level));
    this.schedule.show(n === 2);
    this.tucked = n === 0;
    this.card.classList.toggle('tucked', this.tucked);
    this.refresh();
    this.onChange();
  }

  /** How far down the card goes when tucked: all of it but the headline. */
  offset() {
    const keep = this.grips[this.grips.length - 1];
    const visible = keep.offsetTop + keep.offsetHeight + 12;
    return Math.max(0, this.card.offsetHeight - visible);
  }

  /** Where the card's top will be once it has finished sliding, whatever it is doing now. */
  restingTop() {
    return this.card.offsetTop + (this.tucked ? this.offset() : 0);
  }

  /** The card's height changes as its words do, so the tucked offset follows. */
  refresh() {
    this.card.style.setProperty('--tuck', `${this.tucked ? this.offset() : 0}px`);
  }

  bindGrip(grip) {
    let startY = null;
    let dy = 0;
    grip.addEventListener('pointerdown', (e) => {
      if (!isNarrow(this.win)) return;
      e.preventDefault(); // or a mouse drag selects the headline instead
      startY = e.clientY;
      dy = 0;
      this.card.classList.add('dragging');
      grip.setPointerCapture(e.pointerId);
    });
    grip.addEventListener('pointermove', (e) => {
      if (startY === null) return;
      dy = e.clientY - startY;
      // Follow the finger downwards; upwards the card grows on release.
      const from = this.tucked ? this.offset() : 0;
      this.card.style.setProperty('--tuck', `${Math.min(this.offset(), Math.max(0, from + dy))}px`);
    });
    const end = () => {
      if (startY === null) return;
      startY = null;
      this.card.classList.remove('dragging');
      const now = this.level();
      if (Math.abs(dy) < TAP_PX) this.setLevel(now === 2 ? 1 : now + 1);
      else this.setLevel(dy > 0 ? now - 1 : now + 1);
    };
    grip.addEventListener('pointerup', end);
    grip.addEventListener('pointercancel', end);
  }
}
