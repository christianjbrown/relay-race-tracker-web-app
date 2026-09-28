import { kmApart } from './geo.js';

/**
 * Tells a vehicle parked at a handover from one that has only stopped. At a
 * handover the team's vehicles gather - the crew coming off, the crew going
 * on, the spares - and none of them moves until the runner arrives. What
 * came along with the vehicle or the runner is not that gathering: a second
 * vehicle driving beside ours, or a crew member running with the runner,
 * is there at every roadside stop.
 */
export class HandoverSpotter {
  constructor(tuning, withVehicle, withRunner) {
    this.tuning = tuning;
    this.withVehicle = withVehicle;
    this.withRunner = withRunner;
    this.previous = null;
    // true once two polls agree the vehicle has not moved, false once they
    // say it has, and null before there have been two.
    this.still = null;
    this.others = [];
  }

  /**
   * Takes one poll's fixes: the vehicle's own, every other tracker's with
   * its `id`, and the runner's when the feed gave it.
   */
  observe(vehicle, others, runner = null) {
    if (this.previous && vehicle.time > this.previous.time) {
      this.still = kmApart(this.previous, vehicle) <= this.tuning.parkedKm;
    }
    this.previous = vehicle;
    this.others = others;
    this.withVehicle.observe(vehicle, others);
    if (runner) this.withRunner.observe(runner, others);
  }

  /** Whether the vehicle is parked with the team, as it is at a handover. */
  parked(vehicle, now) {
    const company = this.others.some((o) => this.waiting(o, now) && kmApart(o, vehicle) <= this.tuning.clusterKm);
    // Before a second poll there is no telling whether it has moved; the
    // company of the other vehicles is enough on its own until then.
    return company && this.still !== false;
  }

  /** A fresh tracker that did not come with the vehicle or the runner. */
  waiting(other, now) {
    return now - other.time <= this.tuning.staleMs && !this.withVehicle.has(other.id) && !this.withRunner.has(other.id);
  }
}
