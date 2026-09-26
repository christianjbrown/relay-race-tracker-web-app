import { localise } from './language.js';

/**
 * The page's words in one language for this site: the locale's, with the
 * runner's name and vehicle in them, and the site's own title in place of
 * "Where is <name>?" when the config gives one.
 */
export function siteWords(locales, config, code) {
  const words = locales[code].words({ name: config.name, vehicle: config.vehicle });
  return config.title ? { ...words, title: localise(config.title, code) } : words;
}
