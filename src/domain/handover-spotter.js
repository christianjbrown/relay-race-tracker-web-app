import { kmApart } from './geo.js';

/**
 * Tells a vehicle parked at a handover from one that has only stopped. At a
 * handover the team's vehicles gather - the crew coming off, the crew going
 * on, the spares - and none of them moves until the runner arrives.
 */
export class HandoverSpotter {
  constructor(tuning) {
    this.tuning = tuning;
    this.previous = null;
    // true once two polls agree the vehicle has not moved, false once they
    // say it has, and null before there have been two.
    this.still = null;
    this.others = [];
  }

  /** Takes one poll's fixes: the vehicle's own, and every other tracker's. */
  observe(vehicle, others) {
    if (this.previous && vehicle.time > this.previous.time) {
      this.still = kmApart(this.previous, vehicle) <= this.tuning.parkedKm;
    }
    this.previous = vehicle;
    this.others = others;
  }

  /** Whether the vehicle is parked with the team, as it is at a handover. */
  parked(vehicle, now) {
    const company = this.others.some((o) => now - o.time <= this.tuning.staleMs && kmApart(o, vehicle) <= this.tuning.clusterKm);
    // Before a second poll there is no telling whether it has moved; the
    // company of the other vehicles is enough on its own until then.
    return company && this.still !== false;
  }
}
