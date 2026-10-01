// Data loading: the site's files, read and checked, and the page's language.
import { readSchedule } from '../config/schedule-check.js';
import { readSiteConfig } from '../config/site-config.js';
import { Formats } from '../i18n/formats.js';
import { pickLanguage, preferredLanguages } from '../i18n/language.js';
import { LOCALES } from '../i18n/locales/index.js';
import { siteWords } from '../i18n/site-words.js';

/** The site's three files, as the build published them next to the page. */
export async function loadSite(http, base = 'data/') {
  const get = async (name) => {
    const res = await http(`${base}${name}`);
    if (!res.ok) throw new Error(`${base}${name} answered ${res.status}`);
    return res.json();
  };
  const [config, schedule, route] = await Promise.all([get('config.json'), get('schedule.json'), get('route.json')]);
  return { config, schedule, route };
}

/** The page's language, words and formats, from the reader's preferences and the site's languages. */
export function speak(win, config) {
  const code = pickLanguage(preferredLanguages(win.location.search, win.navigator), config.languages);
  const locale = LOCALES[code];
  const words = siteWords(LOCALES, config, code);
  return { code, locale, words, formats: new Formats(locale.tag, config.timezone, words) };
}

/** Reads the site's files, checks them and works out the page's language. */
export async function loadSiteData(win) {
  const site = await loadSite((...args) => win.fetch(...args));
  const config = readSiteConfig(site.config, Object.keys(LOCALES));
  const segments = readSchedule(site.schedule);
  return { config, segments, route: site.route, language: speak(win, config) };
}
