import { kmApart } from './geo.js';

/**
 * The trackers travelling with one other: the second of a team's vehicles
 * driving beside the first, or a crew member running with the runner. A
 * tracker joins by being beside the leader on two polls in a row and moving
 * between them, and leaves once it is no longer beside it. So a vehicle
 * parked at a handover before the leader got there never joins, however
 * long they stand together.
 */
export class Convoy {
  constructor(tuning) {
    this.tuning = tuning;
    this.leader = null;
    this.seen = new Map();
    this.members = new Set();
  }

  /** Takes one poll's fixes: the leader's, and every other tracker's with its `id`. */
  observe(leader, others) {
    const members = new Set();
    for (const other of others) {
      if (kmApart(other, leader) > this.tuning.clusterKm) continue;
      if (this.members.has(other.id) || this.joins(other)) members.add(other.id);
    }
    this.members = members;
    this.leader = leader;
    this.seen = new Map(others.map((o) => [o.id, o]));
  }

  /** Beside the leader on the poll before as well, and moved since. */
  joins(other) {
    const before = this.seen.get(other.id);
    if (!before || !this.leader) return false;
    return kmApart(before, this.leader) <= this.tuning.clusterKm && kmApart(before, other) > this.tuning.convoyMovedKm;
  }

  has(id) {
    return this.members.has(id);
  }
}
