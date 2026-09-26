import { describe, expect, it } from 'vitest';
import { Formats } from '../../src/i18n/formats.js';
import { LOCALES } from '../../src/i18n/locales/index.js';
import { SegmentDescriber } from '../../src/i18n/segment-describer.js';

describe('SegmentDescriber', () => {
  const words = LOCALES.de.words({ name: 'Sam', vehicle: 'bus' });
  const describer = new SegmentDescriber(words, new Formats('de-DE', 'Europe/Brussels', words), 'de');
  const gent = { name: { en: 'Ghent', de: 'Gent' } };

  it('describes a leg with its number, ends and length', () => {
    expect(describer.describe({ kind: 'run', leg: 2, km: 19.5, from: { name: 'Aalter' }, to: gent })).toBe('Etappe 2 · Aalter → Gent · 19,5 km');
  });

  it('describes the finish', () => {
    expect(describer.describe({ kind: 'run', finish: true })).toBe('Gemeinsamer Zieleinlauf');
  });

  it('describes drives, rests and free time by their places', () => {
    expect(describer.describe({ kind: 'drive', to: gent })).toBe('→ Gent');
    expect(describer.describe({ kind: 'sleep', at: { name: 'Hotel' } })).toBe('Hotel');
    expect(describer.describe({ kind: 'free', at: { name: 'Park' } })).toBe('Park');
    expect(describer.describe({ kind: 'free' })).toBe('Freizeit');
  });

  it('prefers a segment\'s own label', () => {
    expect(describer.describe({ kind: 'sleep', at: { name: 'Hotel' }, label: { en: 'Dinner', de: 'Abendessen' } })).toBe('Abendessen');
  });

  it('refuses a kind it has no words for', () => {
    expect(() => describer.describe({ kind: 'swim' })).toThrow('No words for a "swim" segment');
  });
});
