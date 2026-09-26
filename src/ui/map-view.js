import { isNarrow } from './layout.js';

const FOLLOW_MIN_ZOOM = 11;
const FOLLOW_ZOOM = 13;

/**
 * What the map is showing: 'route', the whole course; 'follow', the runner
 * kept centred; or 'free', wherever the reader has dragged it, which
 * nothing moves. `surface` is the map itself; `locate()` says where the
 * runner is.
 */
export class MapView {
  constructor(surface, padding, schedule, win, routePoints, locate) {
    this.surface = surface;
    this.padding = padding;
    this.schedule = schedule; // { show(open) }
    this.win = win;
    this.routePoints = routePoints;
    this.locate = locate;
    this.mode = 'route';
    this.sheet = null;
  }

  useSheet(sheet) {
    this.sheet = sheet;
  }

  following() {
    return this.mode === 'follow';
  }

  release() {
    this.mode = 'free';
  }

  follow() {
    this.mode = 'follow';
    this.makeRoomForMap();
    if (this.surface.getZoom() < FOLLOW_MIN_ZOOM) this.surface.setZoom(FOLLOW_ZOOM);
    this.centre();
  }

  overview() {
    this.mode = 'route';
    this.makeRoomForMap();
    this.showWholeRoute();
  }

  /** Everything worth seeing: the course end to end, every stop, and the runner. */
  showWholeRoute() {
    const pos = this.locate();
    this.surface.fitBounds(pos ? [...this.routePoints, pos] : this.routePoints, this.padding.get());
  }

  centre() {
    const pos = this.locate();
    if (!pos) return;
    this.surface.panTo(pos);
    const pad = this.padding.get();
    this.surface.panBy((pad.left - pad.right) / -2, (pad.bottom - pad.top) / 2);
  }

  /** Puts the view back after the card changes size. */
  apply() {
    // Pulled up to the schedule, the map is all but hidden: leave it where
    // it was, rather than fit the route into the strip above the card.
    if (this.sheet?.level() === 2 && isNarrow(this.win)) return;
    if (this.mode === 'follow') this.centre();
    else if (this.mode === 'route') this.showWholeRoute();
  }

  /** On a phone the open schedule covers most of the map, so asking to look at the map puts it away. */
  makeRoomForMap() {
    if (isNarrow(this.win)) this.schedule.show(false);
  }
}
