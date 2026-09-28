// How the page reads the trackers. Every number can be changed from the
// site's config.json under "tuning", in the units its name gives; these are
// the values that worked on a real relay.
export const DEFAULT_TUNING = Object.freeze({
  // How often Chronorace is asked where everyone is.
  pollSeconds: 30,
  // A tracker that has not reported for this long is probably switched off,
  // and the page says so rather than presenting an old fix as live.
  staleMinutes: 15,
  // Once a leg's planned time is up, a runner this close to its end counts
  // as handed over (the finish line has its own), and a runner this close
  // to its start has handed over to ours. Handover points should be the
  // organisers' own coordinates; town centres need a kilometre or more.
  handoverZoneKm: 0.3,
  finishLineKm: 0.3,
  legStartKm: 0.2,
  // A tracker this far past a leg's end before its time is up means
  // somebody else is carrying it: the leg finished early.
  earlyHandoverKm: 1,
  // A vehicle this far off the road Google guessed for a drive is on
  // another road, and the drive is routed again through where it really is.
  detourKm: 1.5,
  // The surest handover point is the vehicle itself, parked on the course
  // (within vehicleOnCourseKm of it), from vehicleBeforeEndKm short of a
  // leg's planned end to vehicleAfterEndKm past it. The leg ends once the
  // runner is within meetKm of it.
  vehicleOnCourseKm: 0.5,
  vehicleBeforeEndKm: 5,
  vehicleAfterEndKm: 8,
  meetKm: 0.2,
  // Parked with the team: another of the event's trackers within clusterKm,
  // and the vehicle itself not moved more than parkedKm since the last poll.
  clusterKm: 0.15,
  parkedKm: 0.1,
  // A tracker beside the vehicle or the runner on two polls in a row, and
  // moved more than convoyMovedKm between them, is travelling with it and
  // is not a team waiting at a handover. Small enough to catch a walk,
  // big enough for a parked phone's GPS to wander.
  convoyMovedKm: 0.04,
  // A drive is over at the door (atDoorKm), or parked within arrivedKm of
  // where it was going.
  atDoorKm: 0.2,
  arrivedKm: 1,
  // How far from a leg's start the parked vehicle can be and still be where
  // the runner coming in hands over.
  vehicleNearStartKm: 3,
  // A leg the trackers say is still going is believed for this long past
  // its planned end, and no longer. A drive gets much less: a page opened
  // after the vehicle reached the stop and went out again never saw it
  // arrive, and would otherwise keep the runner on the road for hours.
  maxOverrunHours: 4,
  maxDriveOverrunMinutes: 60,
  // Timing a runner starts from a planned pace: an average jog for the
  // runner coming in, the leg's own planned pace for ours. The pace seen
  // along the course takes over as the page watches: nothing is shown
  // before paceWindowSeconds, and it is trusted fully after
  // paceTrustMinutes, clamped between paceMinKmh and paceMaxKmh.
  jogKmh: 9,
  paceWindowSeconds: 60,
  paceTrustMinutes: 20,
  paceMinKmh: 3,
  paceMaxKmh: 20,
  // A runner tracker whose fix has not changed for quietMinutes, while the
  // feed still answers, is carried on along the course at the pace last
  // seen, for up to maxProjectMinutes, and stops holdShortKm before the
  // next handover rather than guess that the leg has changed hands.
  quietMinutes: 2,
  maxProjectMinutes: 60,
  holdShortKm: 0.5,
});

const MINUTE = 60 * 1000;

/** Tuning in the units the code works in: kilometres, km/h and milliseconds. */
export function resolveTuning(overrides = {}) {
  const unknown = Object.keys(overrides).filter((k) => !(k in DEFAULT_TUNING));
  if (unknown.length) throw new Error(`Unknown tuning setting: ${unknown.join(', ')}.`);
  const t = { ...DEFAULT_TUNING, ...overrides };
  for (const [key, value] of Object.entries(t)) {
    if (typeof value !== 'number' || !(value > 0)) throw new Error(`Tuning setting ${key} must be a positive number.`);
  }
  return Object.freeze({
    pollMs: t.pollSeconds * 1000,
    staleMs: t.staleMinutes * MINUTE,
    handoverZoneKm: t.handoverZoneKm,
    finishLineKm: t.finishLineKm,
    legStartKm: t.legStartKm,
    earlyHandoverKm: t.earlyHandoverKm,
    detourKm: t.detourKm,
    vehicleOnCourseKm: t.vehicleOnCourseKm,
    vehicleBeforeEndKm: t.vehicleBeforeEndKm,
    vehicleAfterEndKm: t.vehicleAfterEndKm,
    meetKm: t.meetKm,
    clusterKm: t.clusterKm,
    parkedKm: t.parkedKm,
    convoyMovedKm: t.convoyMovedKm,
    atDoorKm: t.atDoorKm,
    arrivedKm: t.arrivedKm,
    vehicleNearStartKm: t.vehicleNearStartKm,
    maxOverrunMs: t.maxOverrunHours * 60 * MINUTE,
    maxDriveOverrunMs: t.maxDriveOverrunMinutes * MINUTE,
    jogKmh: t.jogKmh,
    paceWindowMs: t.paceWindowSeconds * 1000,
    paceTrustMs: t.paceTrustMinutes * MINUTE,
    paceMinKmh: t.paceMinKmh,
    paceMaxKmh: t.paceMaxKmh,
    quietMs: t.quietMinutes * MINUTE,
    maxProjectMs: t.maxProjectMinutes * MINUTE,
    holdShortKm: t.holdShortKm,
  });
}
