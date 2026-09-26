import { describe, expect, it } from 'vitest';
import { parseInZone, zoneOffsetMinutes } from '../../src/services/zoned-time.js';

describe('zoneOffsetMinutes', () => {
  it('gives the offset in summer and winter', () => {
    expect(zoneOffsetMinutes('Europe/Brussels', new Date('2027-07-01T12:00:00Z'))).toBe(120);
    expect(zoneOffsetMinutes('Europe/Brussels', new Date('2027-01-01T12:00:00Z'))).toBe(60);
    expect(zoneOffsetMinutes('America/New_York', new Date('2027-01-01T12:00:00Z'))).toBe(-300);
    expect(zoneOffsetMinutes('UTC', new Date('2027-01-01T12:00:00.600Z'))).toBe(0);
  });
});

describe('parseInZone', () => {
  it('reads a wall-clock time in the zone', () => {
    expect(parseInZone('2027-05-15T04:30', 'Europe/Brussels')).toEqual(new Date('2027-05-15T02:30:00Z'));
    expect(parseInZone('2027-01-15T04:30', 'Europe/Brussels')).toEqual(new Date('2027-01-15T03:30:00Z'));
  });

  it('settles a time either side of a clock change', () => {
    // Clocks go forward at 02:00 on 28 March 2027 in Brussels.
    expect(parseInZone('2027-03-28T03:30', 'Europe/Brussels')).toEqual(new Date('2027-03-28T01:30:00Z'));
    expect(parseInZone('2027-03-28T01:30', 'Europe/Brussels')).toEqual(new Date('2027-03-28T00:30:00Z'));
  });

  it('keeps a time\'s own offset', () => {
    expect(parseInZone('2027-05-15T04:30:00Z', 'Europe/Brussels')).toEqual(new Date('2027-05-15T04:30:00Z'));
    expect(parseInZone('2027-05-15T04:30+05:00', 'Europe/Brussels')).toEqual(new Date('2027-05-14T23:30:00Z'));
  });

  it('gives null for something that is not a time', () => {
    expect(parseInZone('soon', 'Europe/Brussels')).toBeNull();
    expect(parseInZone('soon+01:00', 'Europe/Brussels')).toBeNull();
  });
});
