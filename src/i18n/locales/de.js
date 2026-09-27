const VEHICLES = {
  bus: { noun: 'Bus', aboard: 'im Bus' },
  van: { noun: 'Van', aboard: 'im Van' },
  car: { noun: 'Auto', aboard: 'im Auto' },
};

/** Names ending in an s sound take an apostrophe in the genitive; the rest take an s. */
const genitive = (name) => (/(s|ß|x|z|ce)$/i.test(name) ? `${name}’` : `${name}s`);

/** German. Every string that names somebody takes the name it is given. */
export default {
  code: 'de',
  tag: 'de-DE',
  region: 'DE',
  ogLocale: 'de_DE',
  vehicles: Object.keys(VEHICLES),
  words({ name, vehicle }) {
    const v = VEHICLES[vehicle];
    return {
      title: `Wo ist ${name}?`,
      birthday: `Alles Gute zum Geburtstag, ${name}!`,
      kinds: { run: 'Laufen/Radfahren', drive: 'Fahrt', sleep: 'Ausruhen', free: 'Freizeit' },
      course: 'Übrige Strecke',
      planned: 'Gestrichelt: kommt noch',
      headline: {
        run: `${name} ist dran`,
        drive: `${name} ist ${v.aboard}`,
        sleep: `${name} ruht sich aus`,
        free: `${name} hat frei`,
        before: `${name} startet bald`,
        waiting: `${name} ist ${v.aboard}`,
        after: `${name} ist im Ziel!`,
        finding: `Suche ${name} …`,
      },
      leg: (n, from, to, km) => `Etappe ${n} · ${from} → ${to} · ${km} km`,
      finishLeg: 'Gemeinsamer Zieleinlauf',
      freeNote: 'Freizeit',
      hours: (h, m) => (m ? `${h} Std. ${m} Min.` : `${h} Std.`),
      minutes: (m) => `${m} Min.`,
      left: (d) => `noch ${d}`,
      ends: (t) => `bis ${t}`,
      nextUp: (what, t) => (t ? `Danach: <strong>${what}</strong> ab ${t}` : `Danach: <strong>${what}</strong>`),
      kmLeft: (km) => `noch ${km} km`,
      plannedUntil: (t) => `geplant bis ${t}`,
      finishesAbout: (t) => `fertig ca. ${t}`,
      overrun: (t) => `geplant bis ${t} – dauert länger`,
      etaLeft: (d) => `noch ca. ${d}`,
      waitingDetail: (leg) => `Wartet auf die Übergabe · ${leg}`,
      runnerAway: (d) => `Läufer noch ca. ${d} entfernt`,
      takesOver: (t) => `Übergabe ca. ${t}`,
      arrives: (t) => `Ankunft ca. ${t}`,
      lastFix: (ago) => `GPS ${ago}`,
      stale: 'Tracker evtl. aus',
      noFix: 'Noch keine GPS-Position',
      retrying: 'Die Karte hat nicht geladen – neuer Versuch …',
      estimated: 'Chronorace gerade nicht erreichbar – Position anhand des Zeitplans geschätzt',
      projected: (since, kmh) => `Läufer-Tracker seit ${since} still – Position mit ${kmh} km/h hochgerechnet`,
      follow: `${name} folgen`,
      overview: 'Ganze Strecke',
      schedule: 'Zeitplan',
      sheet: 'Details ein- oder ausblenden',
      vehicle: v.noun,
      scheduleTitle: (zone) => `Zeitplan (${zone})`,
      mapLabel: `Karte mit ${genitive(name)} Position`,
      description: (event, from, to) => `${name} live verfolgen beim ${event}, von ${from} nach ${to}: jede Etappe, jede Fahrt, jeder Halt.`,
      imageAlt: (from, to) => `${name} neben einer Karte der Staffel von ${from} nach ${to}, mit den Etappen markiert`,
      route: (from, to) => `${from} nach ${to} · live`,
      legsFor: `Etappen für ${name}`,
      share: `${genitive(name)} Anteil`,
      relayCourse: 'Staffelstrecke',
    };
  },
};
