import { describe, expect, it } from 'vitest';
import { ConfigError, readSiteConfig } from '../../src/config/site-config.js';

const valid = () => ({
  name: 'Sam',
  timezone: 'Europe/Brussels',
  event: { name: 'Relay', from: 'Ostend', to: { en: 'Brussels', de: 'Brüssel' } },
  chronorace: { eventId: '42', runnerTracker: 'RUN', vehicleTracker: 'VAN1' },
  site: { url: 'https://example.com/sam' },
  mapsApiKey: 'key',
});

const problems = (raw) => {
  try {
    readSiteConfig(raw, ['en', 'de']);
  } catch (e) {
    expect(e).toBeInstanceOf(ConfigError);
    return e.problems;
  }
  return [];
};

describe('readSiteConfig', () => {
  it('fills in the defaults', () => {
    const c = readSiteConfig(valid(), ['en', 'de']);
    expect(c).toMatchObject({ emoji: '🏃', birthday: null, vehicle: 'bus', languages: ['en'], site: { url: 'https://example.com/sam', indexable: false } });
    expect(c.tuning.jogKmh).toBe(9);
    expect(Object.isFrozen(c)).toBe(true);
  });

  it('keeps what is given', () => {
    const c = readSiteConfig({ ...valid(), emoji: '🚴', birthday: '09-25', vehicle: 'van', languages: ['de', 'en'], site: { url: 'http://x.test/', indexable: true }, tuning: { jogKmh: 10 } }, ['en', 'de']);
    expect(c).toMatchObject({ emoji: '🚴', birthday: '09-25', vehicle: 'van', languages: ['de', 'en'], site: { indexable: true } });
    expect(c.tuning.jogKmh).toBe(10);
  });

  it('treats an empty birthday as none', () => {
    expect(readSiteConfig({ ...valid(), birthday: '' }, ['en']).birthday).toBeNull();
  });

  it('reports everything wrong at once', () => {
    const found = problems({});
    expect(found).toHaveLength(10);
    expect(found[0]).toMatch(/"name"/);
    expect(problems(null)).toHaveLength(10);
  });

  it('checks each field', () => {
    expect(problems({ ...valid(), name: { en: 'Sam' } })[0]).toMatch(/"name"/);
    expect(problems({ ...valid(), timezone: 'Mars/Olympus' })[0]).toMatch(/"timezone"/);
    expect(problems({ ...valid(), timezone: 5 })[0]).toMatch(/"timezone"/);
    expect(problems({ ...valid(), event: { name: {}, from: 'a', to: 'b' } })[0]).toMatch(/"event.name"/);
    expect(problems({ ...valid(), event: { name: 'x', from: { en: '' }, to: 'b' } })[0]).toMatch(/"event.from"/);
    expect(problems({ ...valid(), event: { name: 'x', from: 'a', to: ['b'] } })[0]).toMatch(/"event.to"/);
    expect(problems({ ...valid(), event: { name: 'x', from: 'a', to: null } })[0]).toMatch(/"event.to"/);
    expect(problems({ ...valid(), chronorace: { eventId: 42, runnerTracker: 'R', vehicleTracker: 'V' } })[0]).toMatch(/eventId/);
    expect(problems({ ...valid(), site: { url: 'ftp://x' } })[0]).toMatch(/"site.url"/);
    expect(problems({ ...valid(), site: { url: 'not a url' } })[0]).toMatch(/"site.url"/);
    expect(problems({ ...valid(), mapsApiKey: null })[0]).toMatch(/"mapsApiKey"/);
    expect(problems({ ...valid(), vehicle: 'boat' })[0]).toMatch(/"vehicle"/);
    expect(problems({ ...valid(), languages: [] })[0]).toMatch(/"languages"/);
    expect(problems({ ...valid(), languages: 'en' })[0]).toMatch(/"languages"/);
    expect(problems({ ...valid(), languages: ['fr'] })[0]).toMatch(/"languages"/);
    expect(problems({ ...valid(), birthday: '9-25' })[0]).toMatch(/"birthday"/);
    expect(problems({ ...valid(), tuning: { nope: 1 } })[0]).toMatch(/Unknown tuning/);
  });

  it('says what to fix in its message', () => {
    expect(() => readSiteConfig({ ...valid(), vehicle: 'boat' }, ['en'])).toThrow('config.json needs fixing:\n- "vehicle" must be one of bus, van, car.');
  });
});
