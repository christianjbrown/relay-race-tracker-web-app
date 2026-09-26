import { describe, expect, it } from 'vitest';
import { LOCALES } from '../../src/i18n/locales/index.js';

// Every string, with every vehicle, so a word missing from one language shows up here.
const flatten = (words) => Object.entries(words).flatMap(([key, value]) => {
  if (typeof value === 'function') return [[key, value(...Array(value.length).fill('X'))]];
  if (typeof value === 'object') return flatten(value).map(([k, v]) => [`${key}.${k}`, v]);
  return [[key, value]];
});

describe.each(Object.values(LOCALES))('the $code locale', (locale) => {
  it('has every string, for every vehicle, naming the runner where it should', () => {
    for (const vehicle of locale.vehicles) {
      const words = locale.words({ name: 'Sam', vehicle });
      const english = flatten(LOCALES.en.words({ name: 'Sam', vehicle })).map(([k]) => k);
      expect(flatten(words).map(([k]) => k)).toEqual(english);
      for (const [, text] of flatten(words)) expect(text).not.toMatch(/undefined/);
      expect(words.title).toContain('Sam');
      expect(words.headline.drive).toContain('Sam');
    }
  });

  it('says how long in hours and minutes', () => {
    const words = locale.words({ name: 'Sam', vehicle: 'bus' });
    expect(words.hours(2, 0)).not.toBe(words.hours(2, 5));
    expect(words.nextUp('what', null)).not.toBe(words.nextUp('what', '10:00'));
  });

  it('names the three vehicles', () => {
    expect(locale.vehicles).toEqual(['bus', 'van', 'car']);
  });
});

describe('German', () => {
  const de = (name) => LOCALES.de.words({ name, vehicle: 'car' });

  it('puts names ending in an s sound in the genitive with an apostrophe', () => {
    expect(de('Klaus').mapLabel).toBe('Karte mit Klaus’ Position');
    expect(de('Max').share).toBe('Max’ Anteil');
    expect(de('Angelika').mapLabel).toBe('Karte mit Angelikas Position');
  });

  it('says where the runner is in the vehicle', () => {
    expect(de('Sam').headline.drive).toBe('Sam ist im Auto');
  });
});

describe('English', () => {
  it('uses the vehicle\'s own words', () => {
    const words = LOCALES.en.words({ name: 'Sam', vehicle: 'van' });
    expect(words.headline.waiting).toBe('Sam is in the van');
    expect(words.vehicle).toBe('Van');
    expect(words.headline.run).toBe('Sam’s turn');
  });
});
