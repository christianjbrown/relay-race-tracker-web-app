/** The offset from UTC, in minutes, of a time zone at a given moment. */
export function zoneOffsetMinutes(timeZone, at) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at);
  const n = Object.fromEntries(parts.filter((p) => p.type !== 'literal').map((p) => [p.type, Number(p.value)]));
  const asUtc = Date.UTC(n.year, n.month - 1, n.day, n.hour, n.minute, n.second);
  return Math.round((asUtc - Math.floor(at.getTime() / 1000) * 1000) / 60000);
}

const ZONED = /Z|[+-]\d\d:?\d\d$/;

/**
 * Reads a date and time as the time zone's wall clock, unless it carries
 * its own offset. Returns null when it is not a time at all.
 */
export function parseInZone(text, timeZone) {
  if (ZONED.test(text)) {
    const d = new Date(text);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const naive = new Date(`${text}Z`);
  if (Number.isNaN(naive.getTime())) return null;
  // The offset at the naive guess, then again at the corrected time, which
  // settles it either side of a clock change.
  const first = new Date(naive.getTime() - zoneOffsetMinutes(timeZone, naive) * 60000);
  return new Date(naive.getTime() - zoneOffsetMinutes(timeZone, first) * 60000);
}
