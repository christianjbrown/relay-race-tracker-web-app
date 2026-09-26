import { resolveColours } from './colours.js';
import { resolveTuning } from './tuning.js';

const VEHICLES = ['bus', 'van', 'car'];

/** Everything wrong with a site's config.json, reported together. */
export class ConfigError extends Error {
  constructor(problems) {
    super(`config.json needs fixing:\n- ${problems.join('\n- ')}`);
    this.name = 'ConfigError';
    this.problems = problems;
  }
}

const isString = (v) => typeof v === 'string' && v.trim() !== '';

const isText = (v) => isString(v)
  || (v !== null && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length > 0 && Object.values(v).every(isString));

function validTimeZone(zone) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

function validUrl(url) {
  try {
    return ['http:', 'https:'].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

/**
 * Checks a site's config.json and fills in its defaults. `languages` is the
 * list of language codes the page can speak.
 */
export function readSiteConfig(raw, languages) {
  const problems = [];
  const need = (ok, problem) => {
    if (!ok) problems.push(problem);
  };
  const c = raw ?? {};
  need(isString(c.name), '"name" is the runner\'s name, and is required.');
  need(typeof c.timezone === 'string' && validTimeZone(c.timezone), '"timezone" must be an IANA time zone, such as "Europe/Brussels".');
  need(isText(c.event?.name), '"event.name" is required.');
  need(isText(c.event?.from), '"event.from", where the relay starts, is required.');
  need(isText(c.event?.to), '"event.to", where the relay finishes, is required.');
  need(isString(c.chronorace?.eventId), '"chronorace.eventId" is required (as a string).');
  need(isString(c.chronorace?.runnerTracker), '"chronorace.runnerTracker", the Bib of the runner\'s tracker, is required.');
  need(isString(c.chronorace?.vehicleTracker), '"chronorace.vehicleTracker", the Bib of the vehicle\'s tracker, is required.');
  need(typeof c.site?.url === 'string' && validUrl(c.site.url), '"site.url" must be the full address the page is published at.');
  need(typeof c.mapsApiKey === 'string', '"mapsApiKey" must be a string.');
  const vehicle = c.vehicle ?? 'bus';
  need(VEHICLES.includes(vehicle), `"vehicle" must be one of ${VEHICLES.join(', ')}.`);
  const langs = c.languages ?? ['en'];
  need(Array.isArray(langs) && langs.length > 0 && langs.every((l) => languages.includes(l)), `"languages" must list one or more of ${languages.join(', ')}.`);
  need(c.birthday == null || c.birthday === '' || /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(c.birthday), '"birthday" must be MM-DD, or left out.');
  const attempt = (fn) => {
    try {
      return fn();
    } catch (e) {
      problems.push(e.message);
      return null;
    }
  };
  const tuning = attempt(() => resolveTuning(c.tuning));
  const colours = attempt(() => resolveColours(c.colours));
  if (problems.length) throw new ConfigError(problems);

  return Object.freeze({
    name: c.name,
    emoji: c.emoji ?? '🏃',
    birthday: c.birthday || null,
    vehicle,
    languages: langs,
    timezone: c.timezone,
    event: { name: c.event.name, from: c.event.from, to: c.event.to },
    chronorace: { eventId: c.chronorace.eventId, runnerTracker: c.chronorace.runnerTracker, vehicleTracker: c.chronorace.vehicleTracker },
    site: { url: new URL(c.site.url).href, indexable: c.site.indexable === true },
    mapsApiKey: c.mapsApiKey,
    tuning,
    colours,
  });
}
