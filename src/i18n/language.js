/**
 * Picks the reader's language from what they prefer, in order, among the
 * site's own languages; the site's first language when none of them match.
 */
export function pickLanguage(preferred, available) {
  for (const tag of preferred) {
    const code = String(tag).slice(0, 2).toLowerCase();
    if (available.includes(code)) return code;
  }
  return available[0];
}

/** The reader's preferences: `?lang=` first, so a link can carry one, then the browser's. */
export function preferredLanguages(search, navigator) {
  const asked = new URLSearchParams(search).get('lang');
  const browser = navigator.languages?.length ? navigator.languages : [navigator.language];
  return [asked, ...browser].filter(Boolean);
}

/**
 * A piece of text that may differ by language: a plain string, or an
 * object of strings keyed by language code. Falls back to the first given.
 */
export function localise(value, code) {
  if (value == null || typeof value === 'string') return value;
  return value[code] ?? Object.values(value)[0];
}
