import { describe, expect, it } from 'vitest';
import { CelebrationMessage } from '../../src/ui/celebration-message.js';
import { Formats } from '../../src/i18n/formats.js';
import { LOCALES } from '../../src/i18n/locales/index.js';

describe('CelebrationMessage', () => {
  const summary = { km: () => 232.9, ms: () => (3 * 24 + 2) * 3600000 + 45 * 60000 };
  const say = (code, tag) => {
    const words = LOCALES[code].words({ name: 'Sam', vehicle: 'bus' });
    return new CelebrationMessage(words, new Formats(tag, 'Europe/Brussels', words), summary);
  };

  it('congratulates the runner with how far their team went and for how long, in whole hours', () => {
    const en = say('en', 'en-GB');
    expect(en.title()).toBe('Congratulations Sam! 🎉');
    expect(en.text()).toBe('Your team ran 232.9 km across 3 days and 2 hours.');
    expect(en.close()).toBe('Back to the map');
  });

  it('says it in German too', () => {
    const de = say('de', 'de-DE');
    expect(de.title()).toBe('Glückwunsch Sam! 🎉');
    expect(de.text()).toBe('Euer Team ist über 3 Tage und 2 Stunden hinweg 232,9 km gelaufen.');
    expect(de.close()).toBe('Zurück zur Karte');
  });
});
