import { localise } from '../../src/i18n/language.js';

/**
 * What the share card says, in the site's first language: who, which
 * event, from where to where, and four numbers - the runner's legs and
 * kilometres, the whole course, and the dates.
 */
export function cardFacts(config, schedule, course, locales) {
  const [first, second] = config.languages.map((code) => ({ code, locale: locales[code], words: locales[code].words({ name: config.name, vehicle: config.vehicle }) }));
  const text = (value) => localise(value, first.code);
  const number = new Intl.NumberFormat(first.locale.tag, { maximumFractionDigits: 0 });
  const legs = schedule.segments.filter((s) => s.kind === 'run' && !s.finish);
  const legKm = legs.reduce((sum, s) => sum + s.km, 0);
  return {
    title: first.words.title,
    subtitle: second ? second.words.title : null,
    event: text(config.event.name),
    route: first.words.route(text(config.event.from), text(config.event.to)),
    stats: [
      [String(legs.length), first.words.legsFor],
      [`${number.format(Math.round(legKm))} km`, first.words.share],
      [`${number.format(Math.round(course.totalKm / 5) * 5)} km`, first.words.relayCourse],
      dateStat(schedule.first.start, schedule.last.end, first.locale.tag, config.timezone),
    ],
  };
}

/** "25–28" over "September 2026"; across months, "30 Sept – 2 Oct" over "2026". */
export function dateStat(start, end, tag, timeZone) {
  const part = (d, opts) => new Intl.DateTimeFormat(tag, { timeZone, ...opts }).format(d);
  const month = (d) => part(d, { year: 'numeric', month: 'long' });
  if (month(start) === month(end)) {
    const days = [part(start, { day: 'numeric' }), part(end, { day: 'numeric' })];
    return [days[0] === days[1] ? days[0] : `${days[0]}–${days[1]}`, month(start)];
  }
  const dayMonth = (d) => part(d, { day: 'numeric', month: 'short' });
  return [`${dayMonth(start)} – ${dayMonth(end)}`, part(end, { year: 'numeric' })];
}
