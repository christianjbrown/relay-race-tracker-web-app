/** Whether a moment falls on the runner's birthday ("MM-DD") in the event's time zone. */
export class Birthday {
  constructor(monthDay, formats) {
    this.monthDay = monthDay;
    this.formats = formats;
  }

  on(d) {
    return Boolean(this.monthDay) && this.formats.dayKey(d).endsWith(`-${this.monthDay}`);
  }
}
