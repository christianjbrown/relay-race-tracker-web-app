/**
 * Works out, once, which stretch of the course each of the runner's legs
 * covers, and joins each drive to the legs either side of it.
 */
export class LegPlacer {
  constructor(course) {
    this.course = course;
  }

  place(schedule) {
    let from = 0;
    for (const seg of schedule.segments) {
      if (seg.kind !== 'run') continue;
      const a = this.course.nearestIndex(seg.from, from);
      // The finish is run in together from a meeting point to the line.
      seg.span = [a, seg.finish ? this.course.lastIndex : this.course.nearestIndex(seg.to, a)];
      // Where to start looking for the runner on this leg: the end of the
      // last one, so a tracker still short of the start reads as short of it.
      seg.searchFrom = from;
      from = seg.span[1];
    }
    this.joinDrives(schedule);
  }

  /**
   * A drive that picks the runner up from a leg starts where that leg ends
   * on the course, and one that drops them off for a leg ends where it
   * starts, rather than at the town centre each place was looked up by,
   * which can be a kilometre or more away and left a gap on the map.
   */
  joinDrives(schedule) {
    for (const seg of schedule.segments) {
      if (seg.kind !== 'drive') continue;
      const before = schedule.before(seg);
      const after = schedule.after(seg);
      if (before?.kind === 'run') seg.from = { ...seg.from, ...this.course.at(before.span[1]) };
      if (after?.kind === 'run') seg.to = { ...seg.to, ...this.course.at(after.span[0]) };
    }
  }
}
