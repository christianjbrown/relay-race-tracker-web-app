import { localise } from '../../src/i18n/language.js';
import { escapeHtml } from '../../src/ui/escape-html.js';

/**
 * The page's head: its title, description, canonical address, the tags a
 * shared link is previewed from, and structured data for search engines.
 * Link previews never run the page's script, so all of it is written into
 * the HTML at build time.
 */
export class PageHead {
  constructor(config, segments, locales) {
    this.config = config;
    this.segments = segments;
    this.langs = config.languages.map((code) => ({
      code,
      locale: locales[code],
      words: locales[code].words({ name: config.name, vehicle: config.vehicle }),
      text: (value) => localise(value, code),
    }));
  }

  get first() {
    return this.langs[0];
  }

  titles() {
    return this.langs.map((l) => l.words.title);
  }

  descriptions() {
    return this.langs.map((l) => l.words.description(l.text(this.config.event.name), l.text(this.config.event.from), l.text(this.config.event.to)));
  }

  imageAlt() {
    const l = this.first;
    return l.words.imageAlt(l.text(this.config.event.from), l.text(this.config.event.to));
  }

  /** The tags, one per line, for `imageVersion` of the share card. */
  render(imageVersion) {
    const url = this.config.site.url;
    const image = `${url}og-card.png?v=${imageVersion}`;
    const title = this.titles().join(' · ');
    const description = this.descriptions().join(' · ');
    const event = this.first.text(this.config.event.name);
    const tag = (html) => `  ${html}`;
    const meta = (attr, key, value) => tag(`<meta ${attr}="${key}" content="${escapeHtml(value)}">`);
    const lines = [
      tag(`<title>${escapeHtml(`${title} – ${event}`)}</title>`),
      meta('name', 'description', description),
      tag(`<link rel="canonical" href="${escapeHtml(url)}">`),
    ];
    if (this.langs.length > 1) {
      for (const l of this.langs) lines.push(tag(`<link rel="alternate" hreflang="${l.code}" href="${escapeHtml(`${url}?lang=${l.code}`)}">`));
      lines.push(tag(`<link rel="alternate" hreflang="x-default" href="${escapeHtml(url)}">`));
    }
    if (!this.config.site.indexable) lines.push(meta('name', 'robots', 'noindex'));
    lines.push(
      meta('property', 'og:type', 'website'),
      meta('property', 'og:site_name', this.first.words.title),
      meta('property', 'og:title', title),
      meta('property', 'og:description', description),
      meta('property', 'og:url', url),
      meta('property', 'og:image', image),
      meta('property', 'og:image:width', '1200'),
      meta('property', 'og:image:height', '630'),
      meta('property', 'og:image:alt', this.imageAlt()),
      meta('property', 'og:locale', this.first.locale.ogLocale),
      ...this.langs.slice(1).map((l) => meta('property', 'og:locale:alternate', l.locale.ogLocale)),
      meta('name', 'twitter:card', 'summary_large_image'),
      meta('name', 'twitter:title', title),
      meta('name', 'twitter:description', this.descriptions()[0]),
      meta('name', 'twitter:image', image),
      meta('name', 'twitter:image:alt', this.imageAlt()),
      tag(`<script type="application/ld+json">${this.structuredData(url, event)}</script>`),
    );
    return lines.join('\n');
  }

  structuredData(url, event) {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: this.first.words.title,
      description: this.descriptions()[0],
      url,
      inLanguage: this.langs.map((l) => l.locale.tag),
      about: {
        '@type': 'SportsEvent',
        name: event,
        startDate: this.segments[0].start,
        endDate: this.segments[this.segments.length - 1].end,
        location: [
          { '@type': 'Place', name: this.first.text(this.config.event.from) },
          { '@type': 'Place', name: this.first.text(this.config.event.to) },
        ],
      },
    };
    // Safe inside a script element: nothing in it can close the tag.
    return JSON.stringify(data).replace(/</g, '\\u003c');
  }
}

/** Fills the page template's {{placeholders}}; the values are HTML already. */
export function fillTemplate(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, (whole, key) => {
    if (!(key in values)) throw new Error(`The page template asks for {{${key}}}, which the build does not give.`);
    return values[key];
  });
}
