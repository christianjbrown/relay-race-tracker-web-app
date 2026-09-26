import { describe, expect, it } from 'vitest';
import { Birthday } from '../../src/ui/birthday.js';
import { Formats } from '../../src/i18n/formats.js';

describe('Birthday', () => {
  const formats = new Formats('en-GB', 'Europe/Brussels', {});

  it('is true on the runner\'s birthday in the event time zone', () => {
    const birthday = new Birthday('05-15', formats);
    expect(birthday.on(new Date('2027-05-15T09:00:00+02:00'))).toBe(true);
  });

  it('is false on any other day', () => {
    const birthday = new Birthday('05-15', formats);
    expect(birthday.on(new Date('2027-05-16T09:00:00+02:00'))).toBe(false);
  });

  it('is false when there is no birthday to watch for', () => {
    const birthday = new Birthday(null, formats);
    expect(birthday.on(new Date('2027-05-15T09:00:00+02:00'))).toBe(false);
  });
});
