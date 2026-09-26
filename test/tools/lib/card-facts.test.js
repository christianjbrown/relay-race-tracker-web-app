import { describe, expect, it } from 'vitest';
import { readSiteConfig } from '../../../src/config/site-config.js';
import { LOCALES } from '../../../src/i18n/locales/index.js';
import { cardFacts, dateStat } from '../../../tools/lib/card-facts.js';

const baseRaw = {
  name: 'Sam',
  timezone: 'Europe/Brussels',
  event: { name: 'Coast Relay', from: 'Ostend', to: 'Brussels' },
  chronorace: { eventId: '0', runnerTracker: 'RUN', vehicleTracker: 'VAN1' },
  site: { url: 'https://example.com/' },
  mapsApiKey: '',
};

function config(overrides = {}) {
  return readSiteConfig({ ...baseRaw, ...overrides }, Object.keys(LOCALES));
}

function schedule({ start, end, segments }) {
  return {
    segments,
    first: { start: new Date(start) },
    last: { end: new Date(end) },
  };
}

describe('cardFacts', () => {
  it('describes the facts in the first language, with a subtitle when there are two', () => {
    const c = config({ languages: ['en', 'de'] });
    const s = schedule({
      start: '2027-05-15T09:00:00+02:00',
      end: '2027-05-16T12:00:00+02:00',
      segments: [
        { kind: 'run', km: 10 },
        { kind: 'run', km: 20 },
        { kind: 'run', finish: true, km: 1 },
        { kind: 'drive' },
      ],
    });
    const facts = cardFacts(c, s, { totalKm: 47 }, LOCALES);
    expect(facts.title).toBe('Where is Sam?');
    expect(facts.subtitle).toBe('Wo ist Sam?');
    expect(facts.event).toBe('Coast Relay');
    expect(facts.route).toBe('Ostend to Brussels · live');
    expect(facts.stats[0]).toEqual(['2', 'legs for Sam']);
    expect(facts.stats[1]).toEqual(['30 km', 'Sam’s share']);
    expect(facts.stats[2]).toEqual(['45 km', 'relay course']);
  });

  it('has no subtitle with a single language', () => {
    const c = config({ languages: ['en'] });
    const s = schedule({ start: '2027-05-15T09:00:00+02:00', end: '2027-05-15T12:00:00+02:00', segments: [{ kind: 'run', km: 5 }] });
    const facts = cardFacts(c, s, { totalKm: 5 }, LOCALES);
    expect(facts.subtitle).toBeNull();
  });

  it('localises text fields to the first language', () => {
    const c = config({ languages: ['de', 'en'], event: { name: { en: 'Coast Relay', de: 'Küstenstaffel' }, from: 'Ostend', to: 'Brussels' } });
    const s = schedule({ start: '2027-05-15T09:00:00+02:00', end: '2027-05-15T12:00:00+02:00', segments: [{ kind: 'run', km: 5 }] });
    const facts = cardFacts(c, s, { totalKm: 5 }, LOCALES);
    expect(facts.event).toBe('Küstenstaffel');
  });
});

describe('dateStat', () => {
  it('shows one day when start and end are the same', () => {
    const d = new Date('2027-05-15T09:00:00+02:00');
    expect(dateStat(d, d, 'en-GB', 'Europe/Brussels')).toEqual(['15', 'May 2027']);
  });

  it('shows a day range within one month', () => {
    const start = new Date('2027-05-15T09:00:00+02:00');
    const end = new Date('2027-05-18T09:00:00+02:00');
    expect(dateStat(start, end, 'en-GB', 'Europe/Brussels')).toEqual(['15–18', 'May 2027']);
  });

  it('shows a day-month range across months', () => {
    const start = new Date('2027-09-30T09:00:00+02:00');
    const end = new Date('2027-10-02T09:00:00+02:00');
    expect(dateStat(start, end, 'en-GB', 'Europe/Brussels')).toEqual(['30 Sept – 2 Oct', '2027']);
  });
});
