import { parseInZone } from './zoned-time.js';

/**
 * The time the page believes it is. `?at=2027-05-15T04:30` previews any
 * moment of the timeline, read in the event's time zone, with live
 * positions: the only way to see a rest or a drive before one happens.
 */
export class PageClock {
  constructor(systemNow, offsetMs = 0) {
    this.systemNow = systemNow;
    this.offsetMs = offsetMs;
  }

  static fromSearch(search, timeZone, systemNow) {
    const at = new URLSearchParams(search).get('at');
    const target = at ? parseInZone(at, timeZone) : null;
    return new PageClock(systemNow, target ? target.getTime() - systemNow() : 0);
  }

  now() {
    return new Date(this.systemNow() + this.offsetMs);
  }
}
