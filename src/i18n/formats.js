/** Times, durations and distances in the reader's language and the event's time zone. */
export class Formats {
  constructor(tag, timeZone, words) {
    this.words = words;
    this.clock = new Intl.DateTimeFormat(tag, { timeZone, hour: '2-digit', minute: '2-digit' });
    this.weekday = new Intl.DateTimeFormat(tag, { timeZone, weekday: 'short' });
    this.dayKeyFormat = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
    this.zone = new Intl.DateTimeFormat(tag, { timeZone, timeZoneName: 'short' });
    this.relative = new Intl.RelativeTimeFormat(tag, { numeric: 'auto' });
    this.number = new Intl.NumberFormat(tag, { minimumFractionDigits: 0, maximumFractionDigits: 1 });
    this.fixed = new Intl.NumberFormat(tag, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  time(d) {
    return this.clock.format(d);
  }

  /** "Sat 03:00". */
  dayTime(d) {
    return `${this.weekday.format(d)} ${this.time(d)}`;
  }

  /** "2027-05-15", in the event's time zone. */
  dayKey(d) {
    return this.dayKeyFormat.format(d);
  }

  /** "19:00" when it is today, "Sat 03:00" when it is not. */
  when(d, now) {
    return this.dayKey(d) === this.dayKey(now) ? this.time(d) : this.dayTime(d);
  }

  duration(ms) {
    const mins = Math.max(0, Math.round(ms / 60000));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h === 0 ? this.words.minutes(m) : this.words.hours(h, m);
  }

  ago(date, now) {
    const secs = Math.round((date - now) / 1000);
    const abs = Math.abs(secs);
    if (abs < 60) return this.relative.format(0, 'minute');
    if (abs < 3600) return this.relative.format(Math.round(secs / 60), 'minute');
    if (abs < 86400) return this.relative.format(Math.round(secs / 3600), 'hour');
    return this.relative.format(Math.round(secs / 86400), 'day');
  }

  /** A distance as it is written in the reader's language: "39.5", "39,5". */
  km(n) {
    return this.number.format(n);
  }

  /** A distance with exactly one decimal, for a figure that counts down. */
  kmFixed(n) {
    return this.fixed.format(n);
  }

  /** The time zone's short name at a moment: "CEST", "MESZ". */
  zoneName(d) {
    return this.zone.formatToParts(d).find((p) => p.type === 'timeZoneName').value;
  }
}
