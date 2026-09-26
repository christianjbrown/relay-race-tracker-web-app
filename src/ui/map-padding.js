import { isNarrow } from './layout.js';

/** Room the card takes out of the map, so what matters sits in what is left. */
export class MapPadding {
  constructor(card, win) {
    this.card = card;
    this.win = win;
    this.sheet = null;
  }

  /** On a phone, the sheet decides where the card will come to rest. */
  useSheet(sheet) {
    this.sheet = sheet;
  }

  get() {
    const box = this.card.getBoundingClientRect();
    const { innerWidth: width, innerHeight: height } = this.win;
    // Where the sheet will come to rest rather than where it is mid-slide:
    // the map is refitted as the sheet starts to move.
    const top = this.sheet ? this.sheet.restingTop() : box.top;
    const pad = isNarrow(this.win)
      // Never less than 160 px of map to fit into, whatever the card does.
      ? { top: 40, right: 56, bottom: Math.min(height - top + 40, height - 200), left: 32 }
      : { top: 40, right: 64, bottom: 40, left: box.right + 40 };
    // Room either side for the stops' names, but only where the route keeps
    // a sensible width: padding wider than the map zooms all the way in.
    const labels = Math.max(0, Math.min(150, (width - pad.left - pad.right - 320) / 2));
    pad.left += labels;
    pad.right += labels;
    return pad;
  }
}
