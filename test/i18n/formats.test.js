import { describe, expect, it } from 'vitest';
import { Formats } from '../../src/i18n/formats.js';
import { LOCALES } from '../../src/i18n/locales/index.js';

const make = (tag, code) => new Formats(tag, 'Europe/Brussels', LOCALES[code].words({ name: 'Sam', vehicle: 'bus' }));

describe('Formats', () => {
  const en = make('en-GB', 'en');
  const de = make('de-DE', 'de');
  const d = new Date('2027-05-15T07:05:00Z'); // 09:05 in Brussels, a Saturday

  it('writes times in the event\'s time zone', () => {
    expect(en.time(d)).toBe('09:05');
    expect(en.dayTime(d)).toBe('Sat 09:05');
    expect(de.dayTime(d)).toMatch(/^Sa\.? 09:05$/);
    expect(en.dayKey(d)).toBe('2027-05-15');
  });

  it('rounds a total to the whole kilometre when it is within a tenth of one', () => {
    expect(en.kmNearWhole(232.9)).toBe('233');
    expect(en.kmNearWhole(100.1)).toBe('100');
    expect(en.kmNearWhole(100.2)).toBe('100.2');
    expect(en.kmNearWhole(99.8)).toBe('99.8');
    expect(de.kmNearWhole(40.3)).toBe('40,3');
  });

  it('writes a long stretch in days, hours and minutes', () => {
    expect(en.span((3 * 1440 + 45) * 60000)).toBe('3 days');
    expect(en.span((3 * 1440 + 150) * 60000)).toBe('3 days and 2 hours');
    expect(en.span(-1)).toBe('0 hours');
  });

  it('leaves the day out when it is today', () => {
    expect(en.when(d, new Date('2027-05-15T20:00:00Z'))).toBe('09:05');
    expect(en.when(d, new Date('2027-05-15T22:30:00Z'))).toBe('Sat 09:05');
  });

  it('writes durations', () => {
    expect(en.duration(5 * 60000)).toBe('5 min');
    expect(en.duration(125 * 60000)).toBe('2 h 5 min');
    expect(en.duration(120 * 60000)).toBe('2 h');
    expect(de.duration(90 * 60000)).toBe('1 Std. 30 Min.');
    expect(en.duration(-5000)).toBe('0 min');
  });

  it('says how long ago', () => {
    const now = new Date('2027-05-15T12:00:00Z');
    const before = (s) => new Date(now.getTime() - s * 1000);
    expect(en.ago(before(20), now)).toBe('this minute');
    expect(en.ago(before(300), now)).toBe('5 minutes ago');
    expect(en.ago(before(7200), now)).toBe('2 hours ago');
    expect(en.ago(before(3 * 86400), now)).toBe('3 days ago');
  });

  it('writes distances the reader\'s way', () => {
    expect(en.km(39.5)).toBe('39.5');
    expect(de.km(39.5)).toBe('39,5');
    expect(en.km(39)).toBe('39');
    expect(en.kmFixed(3)).toBe('3.0');
    expect(de.kmFixed(3.26)).toBe('3,3');
  });

  it('names the time zone', () => {
    expect(en.zoneName(d)).toBe('CEST');
    expect(de.zoneName(d)).toBe('MESZ');
  });
});
