const HOUR = 3600 * 1000;

/**
 * Carries the runner tracker forward along the course when it goes quiet
 * while the feed still answers: the fix stops changing, but the runners do
 * not stop running. The position is the last fix moved on at the pace last
 * seen, and it holds short of the next handover, because only a real fix
 * (or the vehicle waiting there) can say a leg has changed hands.
 */
export class RunnerProjection {
  constructor(schedule, course, tuning) {
    this.schedule = schedule;
    this.course = course;
    this.tuning = tuning;
  }

  /**
   * The fix as it is while it is recent, or past the longest the page will
   * guess for; in between, where the runner probably is now, marked
   * `projected` with when the tracker went quiet and the pace used.
   */
  of(fix, now, paceKmh) {
    const quiet = fix ? now - fix.time : 0;
    if (quiet <= this.tuning.quietMs || quiet > this.tuning.maxProjectMs) return fix;
    const at = this.whereOnCourse(fix);
    const km = this.course.km[at];
    const target = Math.max(km, Math.min(km + paceKmh * (quiet / HOUR), this.holdAt(at)));
    return { ...this.course.at(this.course.indexAtKm(target)), time: now, projected: { since: fix.time, kmh: paceKmh } };
  }

  /**
   * Where the fix was on the course, looking from the start of the last of
   * our legs begun by then to the end of the next one, since the course
   * doubles back on itself in places.
   */
  whereOnCourse(fix) {
    const last = this.schedule.lastRunStartedBy(fix.time);
    const next = this.schedule.segments.find((s) => s.kind === 'run' && s.start > fix.time);
    return this.course.nearestIndex(fix, last?.searchFrom ?? 0, next?.span[1] ?? this.course.lastIndex);
  }

  /** How far along the projection may go: short of the next place one of our legs starts or ends. */
  holdAt(at) {
    const ahead = this.schedule.segments
      .filter((s) => s.kind === 'run')
      .flatMap((s) => s.span)
      .map((i) => this.course.km[i])
      .filter((km) => km > this.course.km[at]);
    return (ahead.length ? Math.min(...ahead) : this.course.totalKm) - this.tuning.holdShortKm;
  }
}
