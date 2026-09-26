import { describe, expect, it } from 'vitest';
import { localise, pickLanguage, preferredLanguages } from '../../src/i18n/language.js';

describe('pickLanguage', () => {
  it('takes the first preference the site speaks, by its language part', () => {
    expect(pickLanguage(['fr-FR', 'de-AT', 'en'], ['en', 'de'])).toBe('de');
    expect(pickLanguage(['EN-us'], ['de', 'en'])).toBe('en');
  });

  it('falls back on the site\'s first language', () => {
    expect(pickLanguage(['fr'], ['de', 'en'])).toBe('de');
    expect(pickLanguage([], ['en'])).toBe('en');
  });
});

describe('preferredLanguages', () => {
  it('puts ?lang= first, then the browser\'s list', () => {
    expect(preferredLanguages('?lang=de', { languages: ['en-GB', 'fr'] })).toEqual(['de', 'en-GB', 'fr']);
  });

  it('falls back on the browser\'s one language, and on nothing', () => {
    expect(preferredLanguages('', { languages: [], language: 'nl' })).toEqual(['nl']);
    expect(preferredLanguages('', {})).toEqual([]);
  });
});

describe('localise', () => {
  it('passes plain text through', () => {
    expect(localise('Gent', 'de')).toBe('Gent');
    expect(localise(null, 'de')).toBeNull();
    expect(localise(undefined, 'de')).toBeUndefined();
  });

  it('picks the language, or the first one given', () => {
    expect(localise({ en: 'Brussels', de: 'Brüssel' }, 'de')).toBe('Brüssel');
    expect(localise({ en: 'Brussels', de: 'Brüssel' }, 'fr')).toBe('Brussels');
  });
});
