const KINDS = ['run', 'drive', 'sleep', 'free'];

const isPlace = (p) => p != null && typeof p === 'object' && Number.isFinite(p.lat) && Number.isFinite(p.lng) && p.name != null;

/** What each kind of segment needs besides its times. */
const NEEDS = {
  run: (s) => [
    [isPlace(s.from) && isPlace(s.to), 'a leg needs "from" and "to" places'],
    [s.finish === true || (Number.isFinite(s.leg) && Number.isFinite(s.km) && s.km > 0), 'a leg needs its number ("leg") and length ("km"), unless it is the "finish"'],
  ],
  drive: (s) => [[isPlace(s.from) && isPlace(s.to), 'a drive needs "from" and "to" places']],
  sleep: (s) => [[isPlace(s.at), 'a rest needs an "at" place']],
  free: (s) => [[s.at == null || isPlace(s.at), 'free time\'s "at" place, when given, needs a name, lat and lng']],
};

/** Everything wrong with a site's schedule.json, reported together. */
export class ScheduleError extends Error {
  constructor(problems) {
    super(`schedule.json needs fixing:\n- ${problems.join('\n- ')}`);
    this.name = 'ScheduleError';
    this.problems = problems;
  }
}

/**
 * Checks a schedule.json: segments in order, each with its times and the
 * places its kind needs. Returns the segments.
 */
export function readSchedule(raw) {
  const segments = raw?.segments;
  if (!Array.isArray(segments) || segments.length === 0) throw new ScheduleError(['"segments" must be a list of one or more segments.']);
  const problems = [];
  let previousEnd = null;
  segments.forEach((s, i) => {
    const where = `segment ${i + 1}`;
    const start = new Date(s.start);
    const end = new Date(s.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      problems.push(`${where}: "start" and "end" must be times with an offset, such as "2027-05-15T09:00:00+02:00"`);
      return;
    }
    if (end <= start) problems.push(`${where}: ends before it starts`);
    // A gap would read as the relay being over, so every moment needs a segment.
    if (previousEnd && start < previousEnd) problems.push(`${where}: starts before the segment before it ends`);
    if (previousEnd && start > previousEnd) problems.push(`${where}: starts after a gap; fill it with free time`);
    previousEnd = end;
    if (!KINDS.includes(s.kind)) {
      problems.push(`${where}: "kind" must be one of ${KINDS.join(', ')}`);
      return;
    }
    for (const [ok, problem] of NEEDS[s.kind](s)) if (!ok) problems.push(`${where}: ${problem}`);
  });
  if (problems.length) throw new ScheduleError(problems);
  return segments;
}
