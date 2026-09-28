const VEHICLES = {
  bus: { noun: 'Bus', aboard: 'in de bus' },
  van: { noun: 'Busje', aboard: 'in het busje' },
  car: { noun: 'Auto', aboard: 'in de auto' },
};

/**
 * Names ending in an s sound take only an apostrophe, names ending in a
 * vowel an apostrophe and an s, and the rest just an s: Thomas', Angela's, Sams.
 */
const possessiveOf = (name) => {
  if (/(s|x|z|ce|sh)$/i.test(name)) return `${name}’`;
  if (/[aeiouy]$/i.test(name)) return `${name}’s`;
  return `${name}s`;
};

const unit = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** "3 dagen", "3 dagen en 2 uur": the parts that are not nought, joined as a sentence would. */
function span(d, h) {
  const parts = [d && unit(d, 'dag', 'dagen'), h && unit(h, 'uur', 'uur')].filter(Boolean);
  return parts.length ? parts.join(' en ') : unit(0, 'uur', 'uur');
}

/** Dutch. Every string that names somebody takes the name it is given. */
export default {
  code: 'nl',
  tag: 'nl-NL',
  region: 'NL',
  ogLocale: 'nl_NL',
  vehicles: Object.keys(VEHICLES),
  words({ name, vehicle }) {
    const v = VEHICLES[vehicle];
    const possessive = possessiveOf(name);
    return {
      title: `Waar is ${name}?`,
      birthday: `Gefeliciteerd met je verjaardag, ${name}!`,
      kinds: { run: 'Lopen/Fietsen', drive: 'Rijden', sleep: 'Rusten', free: 'Vrije tijd' },
      course: 'Rest van het parcours',
      planned: 'Gestreept: nog te gaan',
      headline: {
        run: `${name} is aan de beurt`,
        drive: `${name} zit ${v.aboard}`,
        sleep: `${name} rust uit`,
        free: `${name} heeft vrije tijd`,
        before: `${name} begint zo`,
        waiting: `${name} zit ${v.aboard}`,
        waitingFinish: `${name} wacht op de laatste loper`,
        after: `${name} is binnen!`,
        finding: `${name} zoeken…`,
      },
      leg: (n, from, to, km) => `Etappe ${n} · ${from} → ${to} · ${km} km`,
      finishLeg: 'Samen naar de finish',
      freeNote: 'Vrije tijd',
      hours: (h, m) => (m ? `${h} u ${m} min` : `${h} u`),
      minutes: (m) => `${m} min`,
      left: (d) => `nog ${d}`,
      ends: (t) => `tot ${t}`,
      nextUp: (what, t) => (t ? `Daarna: <strong>${what}</strong> om ${t}` : `Daarna: <strong>${what}</strong>`),
      kmLeft: (km) => `nog ${km} km`,
      plannedUntil: (t) => `gepland tot ${t}`,
      finishesAbout: (t) => `klaar rond ${t}`,
      overrun: (t) => `gepland tot ${t} – duurt langer`,
      etaLeft: (d) => `nog ongeveer ${d}`,
      waitingDetail: (leg) => `Wacht op de wissel · ${leg}`,
      waitingFinishDetail: 'Dan samen naar de finish',
      startsAbout: (t) => `start rond ${t}`,
      runnerAway: (d) => `loper nog ongeveer ${d} weg`,
      takesOver: (t) => `wissel rond ${t}`,
      arrives: (t) => `aankomst rond ${t}`,
      lastFix: (ago) => `GPS ${ago}`,
      stale: 'de tracker staat misschien uit',
      noFix: 'Nog geen GPS-positie',
      congratulations: `Gefeliciteerd ${name}!\u00a0🎉`,
      teamRan: (km, time) => `Jullie team liep ${km}\u00a0km, verspreid over ${time}.`,
      backToMap: 'Terug naar de kaart',
      span,
      rewind: 'De estafette terugspoelen',
      rewindEnd: 'Terug naar de finish',
      replaying: 'Herhaling volgens het schema: geplande posities, geen GPS',
      lookAround: `Tik op ${name} op de kaart om rond te kijken in Street View`,
      retrying: 'De kaart is niet geladen – nieuwe poging…',
      estimated: 'Chronorace is nu niet bereikbaar – positie geschat op basis van het schema',
      projected: (since, kmh) => `Lopertracker stil sinds ${since} – positie doorgerekend met ${kmh} km/u`,
      follow: `${name} volgen`,
      overview: 'Hele route',
      schedule: 'Schema',
      sheet: 'Details tonen of verbergen',
      vehicle: v.noun,
      scheduleTitle: (zone) => `Schema (${zone})`,
      mapLabel: `Kaart met de positie van ${name}`,
      description: (event, from, to) => `Volg ${name} live tijdens ${event}, van ${from} naar ${to}: elke etappe, elke rit en elke stop.`,
      imageAlt: (from, to) => `${name} naast een kaart van de estafette van ${from} naar ${to}, met de etappes gemarkeerd`,
      route: (from, to) => `${from} naar ${to} · live`,
      legsFor: `etappes van ${name}`,
      share: `${possessive} deel`,
      relayCourse: 'estafetteparcours',
    };
  },
};
