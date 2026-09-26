import { describe, expect, it } from 'vitest';
import { LOCALES } from '../../src/i18n/locales/index.js';
import { siteWords } from '../../src/i18n/site-words.js';

describe('siteWords', () => {
  const base = { name: 'Sam', vehicle: 'van', title: null };

  it('uses the locale\'s words with the runner\'s name and vehicle', () => {
    const words = siteWords(LOCALES, base, 'de');
    expect(words.title).toBe('Wo ist Sam?');
    expect(words.headline.drive).toBe('Sam ist im Van');
  });

  it('puts the site\'s own title in place of the locale\'s', () => {
    expect(siteWords(LOCALES, { ...base, title: 'Sam on the road' }, 'en').title).toBe('Sam on the road');
    const both = { ...base, title: { en: 'Sam on the road', de: 'Sam unterwegs' } };
    expect(siteWords(LOCALES, both, 'de').title).toBe('Sam unterwegs');
    expect(siteWords(LOCALES, both, 'en').headline.run).toBe('Sam’s turn');
  });
});
