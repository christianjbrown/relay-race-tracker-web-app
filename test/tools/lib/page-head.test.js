import { describe, expect, it } from 'vitest';
import { readSiteConfig } from '../../../src/config/site-config.js';
import { LOCALES } from '../../../src/i18n/locales/index.js';
import { fillTemplate, PageHead } from '../../../tools/lib/page-head.js';

const baseRaw = {
  name: 'Sam',
  timezone: 'Europe/Brussels',
  event: { name: 'Coast Relay', from: 'Ostend', to: 'Brussels' },
  chronorace: { eventId: '0', runnerTracker: 'RUN', vehicleTracker: 'VAN1' },
  site: { url: 'https://www.example.com/' },
  mapsApiKey: '',
};

function config(overrides = {}) {
  return readSiteConfig({ ...baseRaw, ...overrides }, Object.keys(LOCALES));
}

const segments = [
  { start: '2027-05-15T09:00:00+02:00', end: '2027-05-15T10:00:00+02:00' },
  { start: '2027-05-16T09:00:00+02:00', end: '2027-05-16T12:00:00+02:00' },
];

describe('PageHead', () => {
  it('uses the site\'s own title, per language, everywhere the title goes', () => {
    const head = new PageHead(config({ languages: ['en', 'de'], title: { en: 'Sam on the road', de: 'Sam unterwegs' } }), segments, LOCALES);
    const html = head.render('abc123');
    expect(html).toContain('<title>Sam on the road · Sam unterwegs – Coast Relay</title>');
    expect(html).toContain('<meta property="og:site_name" content="Sam on the road">');
    expect(html).toContain('<meta property="og:title" content="Sam on the road · Sam unterwegs">');
    expect(html).not.toContain('Where is Sam?');
  });

  it('renders title, canonical, og tags and hreflang for two languages', () => {
    const head = new PageHead(config({ languages: ['en', 'de'], site: { url: baseRaw.site.url, indexable: true } }), segments, LOCALES);
    const html = head.render('abc123');
    expect(html).toContain('<title>Where is Sam? · Wo ist Sam? – Coast Relay</title>');
    expect(html).toContain('<link rel="canonical" href="https://www.example.com/">');
    expect(html).toContain('hreflang="en"');
    expect(html).toContain('hreflang="de"');
    expect(html).toContain('hreflang="x-default"');
    expect(html).toContain('og:image" content="https://www.example.com/og-card.png?v=abc123"');
    expect(html).toContain('og:locale:alternate');
    expect(html).not.toContain('noindex');
  });

  it('omits hreflang for a single language', () => {
    const head = new PageHead(config({ languages: ['en'] }), segments, LOCALES);
    const html = head.render('v1');
    expect(html).not.toContain('hreflang');
    expect(html).not.toContain('og:locale:alternate');
  });

  it('adds noindex when the site is not indexable', () => {
    const head = new PageHead(config({ languages: ['en'], site: { url: baseRaw.site.url, indexable: false } }), segments, LOCALES);
    expect(head.render('v1')).toContain('name="robots" content="noindex"');
  });

  it('omits noindex when the site is indexable', () => {
    const head = new PageHead(config({ languages: ['en'], site: { url: baseRaw.site.url, indexable: true } }), segments, LOCALES);
    expect(head.render('v1')).not.toContain('noindex');
  });

  it('escapes html in titles and descriptions', () => {
    const head = new PageHead(config({ languages: ['en'], event: { name: 'A & B', from: 'X', to: 'Y' } }), segments, LOCALES);
    expect(head.render('v1')).toContain('A &#38; B');
  });

  it('embeds structured data with dates and locations, safe for a script tag', () => {
    const head = new PageHead(config({ languages: ['en'] }), segments, LOCALES);
    const html = head.render('v1');
    const match = html.match(/<script type="application\/ld\+json">(.*)<\/script>/);
    const data = JSON.parse(match[1]);
    expect(data.about.startDate).toBe('2027-05-15T09:00:00+02:00');
    expect(data.about.endDate).toBe('2027-05-16T12:00:00+02:00');
    expect(data.about.location[0].name).toBe('Ostend');
    expect(html).not.toContain('</script><script>evil');
  });

  it('escapes a closing script tag inside structured data', () => {
    const head = new PageHead(config({ languages: ['en'], event: { name: '</script><script>evil</script>', from: 'X', to: 'Y' } }), segments, LOCALES);
    expect(head.render('v1')).not.toMatch(/<\/script>[^<]*<script>evil/);
  });
});

describe('fillTemplate', () => {
  it('fills every placeholder', () => {
    expect(fillTemplate('<a>{{x}}</a><b>{{y}}</b>', { x: '1', y: '2' })).toBe('<a>1</a><b>2</b>');
  });

  it('throws on an unknown placeholder', () => {
    expect(() => fillTemplate('{{missing}}', {})).toThrow('{{missing}}');
  });
});
