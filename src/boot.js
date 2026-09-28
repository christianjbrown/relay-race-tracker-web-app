// The composition root: the one place that reads the site's files, makes
// every part of the page and connects them. Nothing else calls `new` on a
// collaborator or reaches for a browser global.
import { App } from './app.js';
import { readSchedule } from './config/schedule-check.js';
import { readSiteConfig } from './config/site-config.js';
import { Activity } from './domain/activity.js';
import { ActivityStates, ClockActivity } from './domain/activity-states.js';
import { Convoy } from './domain/convoy.js';
import { Course } from './domain/course.js';
import { DriveArrival } from './domain/drive-arrival.js';
import { DriveEta } from './domain/drive-eta.js';
import { DriveGuess, Estimator, RunGuess, StopGuess } from './domain/estimator.js';
import { decodePolyline } from './domain/geo.js';
import { HandoverSpotter } from './domain/handover-spotter.js';
import { HandoverWait } from './domain/handover-wait.js';
import { IncomingRunner } from './domain/incoming-runner.js';
import { Journey } from './domain/journey.js';
import { DrivePieces, RunPieces, StopPieces } from './domain/journey-pieces.js';
import { LegFinish } from './domain/leg-finish.js';
import { LegPlacer } from './domain/leg-placer.js';
import { LegProgress } from './domain/leg-progress.js';
import { RunnerLocator } from './domain/runner-locator.js';
import { RelaySummary } from './domain/relay-summary.js';
import { RunnerPace } from './domain/runner-pace.js';
import { RunningGroup } from './domain/running-group.js';
import { RunnerProjection } from './domain/runner-projection.js';
import { Schedule } from './domain/schedule.js';
import { Formats } from './i18n/formats.js';
import { localise, pickLanguage, preferredLanguages } from './i18n/language.js';
import { LOCALES } from './i18n/locales/index.js';
import { SegmentDescriber } from './i18n/segment-describer.js';
import { siteWords } from './i18n/site-words.js';
import { CourseLayer } from './maps/google/course-layer.js';
import { GoogleDirections } from './maps/google/directions.js';
import { loadGoogleMaps } from './maps/google/loader.js';
import { MAP_STYLES } from './maps/google/map-styles.js';
import { StreetView } from './maps/google/street-view.js';
import { makePlaceLabel, makeRunnerMarker, makeVehicleMarker } from './maps/google/overlays.js';
import { Painter } from './maps/google/painter.js';
import { createMap, GoogleMapSurface } from './maps/google/surface.js';
import { ChronoraceFeed } from './services/chronorace-feed.js';
import { JsonStorage } from './services/json-storage.js';
import { PageClock } from './services/page-clock.js';
import { RoadRouter } from './services/road-router.js';
import { TrackerPoller } from './services/tracker-poller.js';
import { BadgeChoice } from './ui/badge-choice.js';
import { makeBadges } from './ui/badges.js';
import { Birthday } from './ui/birthday.js';
import { Card } from './ui/card.js';
import { CardLabels } from './ui/card-labels.js';
import { Elements } from './ui/dom.js';
import { MapPadding } from './ui/map-padding.js';
import { LookHint } from './ui/look-hint.js';
import { Celebration } from './ui/celebration.js';
import { Fireworks } from './ui/fireworks.js';
import { MapView } from './ui/map-view.js';
import { MetaView } from './ui/meta-view.js';
import { NextView } from './ui/next-view.js';
import { DriveProgress, ProgressView, RunProgress, TimeProgress, WaitingProgress } from './ui/progress.js';
import { RunnerClick } from './ui/runner-click.js';
import { RunnerSpot } from './ui/runner-spot.js';
import { SchedulePanel } from './ui/schedule-panel.js';
import { SheetDrag } from './ui/sheet-drag.js';
import { StatusView } from './ui/status-view.js';
import { chooseTheme } from './ui/theme.js';
import { TimelineView } from './ui/timeline-view.js';
import { ViewControls } from './ui/view-controls.js';

const RETRY_MS = 15000;

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

/** Browser storage, which can refuse to exist at all. */
function browserStorage(win) {
  try {
    return win.localStorage;
  } catch {
    return null;
  }
}

/** Everything the card needs, drawn once from the clock alone while the map loads. */
function buildCard(els, page) {
  const { words, formats, badges, describer, schedule, course, config } = page;
  const { colours } = config;
  return new Card({
    status: new StatusView(els, words, badges, describer, page.birthday),
    progress: new ProgressView(els, colours, [
      new WaitingProgress(course, words, formats),
      new DriveProgress(words, formats),
      new RunProgress(course, words, formats),
      new TimeProgress(words, formats),
    ]),
    next: new NextView(els, words, formats, badges, describer, schedule, colours),
    meta: new MetaView(els, words, formats, config.tuning.staleMs),
    look: new LookHint(els, words, page.streetView),
    timeline: new TimelineView(els, words, formats, badges, describer, schedule, colours),
    celebration: page.celebration,
  });
}

/** The page's language, words and formats, from the reader's preferences and the site's languages. */
function speak(win, config) {
  const code = pickLanguage(preferredLanguages(win.location.search, win.navigator), config.languages);
  const locale = LOCALES[code];
  const words = siteWords(LOCALES, config, code);
  return { code, locale, words, formats: new Formats(locale.tag, config.timezone, words) };
}

/** Reads the site, draws the card, loads the map and starts following the runner. */
export async function boot(win, state = {}) {
  const site = await loadSite((...args) => win.fetch(...args));
  const config = readSiteConfig(site.config, Object.keys(LOCALES));
  const segments = readSchedule(site.schedule);
  const { code, locale, words, formats } = speak(win, config);
  state.words = words;

  const { tuning } = config;
  const search = win.location.search;
  const clock = PageClock.fromSearch(search, config.timezone, () => win.Date.now());
  const theme = chooseTheme(search, win.document.documentElement);
  const schedule = new Schedule(segments);
  const course = new Course(site.route.polylines.flatMap(decodePolyline));
  new LegPlacer(course).place(schedule);
  const states = new ActivityStates(schedule);

  const els = new Elements(win.document);
  const describer = new SegmentDescriber(words, formats, code);
  const badges = makeBadges(config.emoji, config.vehicle);
  const birthday = new Birthday(config.birthday, formats);
  new CardLabels(els, words, code, theme, config.colours).render();
  const schedulePanel = new SchedulePanel(els);
  schedulePanel.bind();
  const streetView = new StreetView(course);
  const fireworks = new Fireworks(els.get('fireworks'), win, Object.values(config.colours));
  const celebration = new Celebration(els, words, formats, new RelaySummary(schedule), fireworks);
  celebration.bind();
  const card = buildCard(els, { words, formats, badges, describer, schedule, course, config, birthday, streetView, celebration });
  card.render(clock.now(), null, new ClockActivity(schedule, states).at(clock.now()));

  const maps = await loadGoogleMaps(win, { key: config.mapsApiKey, language: code, region: locale.region });
  const map = createMap(maps, els.get('map'), MAP_STYLES[theme.name], course.at(0));
  const surface = new GoogleMapSurface(maps, map);
  const realClock = { now: () => new win.Date(win.Date.now()) };
  const router = new RoadRouter(new GoogleDirections(maps, new maps.DirectionsService()), new JsonStorage(browserStorage(win)), realClock, win.console);

  const spot = new RunnerSpot();
  const layer = new CourseLayer(maps, map, theme, makePlaceLabel(maps, win.document, spot));
  layer.draw(course.points);
  layer.labelStops(course.points, schedule.segments, (place) => localise(place.name, code));

  const handovers = new HandoverSpotter(tuning, new Convoy(tuning), new Convoy(tuning));
  const pace = new RunnerPace(tuning);
  const feed = new ChronoraceFeed(config.chronorace.eventId, (...args) => win.fetch(...args));
  const bibs = { runner: config.chronorace.runnerTracker, vehicle: config.chronorace.vehicleTracker };
  let view = null;
  const runnerClick = new RunnerClick(win, () => app.lookAround(), () => view.follow());
  const RunnerMarker = makeRunnerMarker(maps, win.document);
  const runnerMarker = new RunnerMarker({ avatar: 'avatar.png', alt: config.name, colours: config.colours, badges, onClick: () => runnerClick.click(), spot });
  runnerMarker.setMap(map);
  const VehicleMarker = makeVehicleMarker(maps, win.document);
  const vehicleMarker = new VehicleMarker(`${badges.drive} ${words.vehicle}`);
  vehicleMarker.setMap(map);
  const groupMarker = new VehicleMarker(badges.run, 'group-marker');
  groupMarker.setMap(map);

  const app = new App({
    clock,
    poller: new TrackerPoller(feed, bibs, handovers, win.console),
    estimator: new Estimator(schedule, course, { run: new RunGuess(course), drive: new DriveGuess(router), sleep: new StopGuess(), free: new StopGuess() }),
    activity: new Activity(schedule, states, {
      waits: new HandoverWait(schedule, course, states, tuning),
      legs: new LegProgress(schedule, course, states, tuning),
      arrivals: new DriveArrival(schedule, states, tuning),
    }, tuning),
    handovers,
    pace,
    legFinish: new LegFinish(course, pace),
    incoming: new IncomingRunner(schedule, course, tuning),
    projection: new RunnerProjection(schedule, course, tuning),
    locator: new RunnerLocator(schedule, course),
    streetView,
    journey: new Journey(schedule, {
      run: new RunPieces(course),
      drive: new DrivePieces(course, router, tuning),
      sleep: new StopPieces(describer),
      free: new StopPieces(describer),
    }),
    eta: new DriveEta(router),
    course,
    painter: new Painter(maps, map, theme, config.colours),
    card,
    runnerMarker,
    badgeChoice: new BadgeChoice(),
    vehicleMarker,
    group: new RunningGroup(tuning),
    groupMarker,
    birthday,
    tuning,
    timers: win,
  });
  router.onReady(() => app.render());

  const cardEl = els.get('card');
  const padding = new MapPadding(cardEl, win);
  view = new MapView(surface, padding, schedulePanel, win, [...course.points, ...schedule.places()], () => app.where());
  const sheet = new SheetDrag(cardEl, [els.get('toggle'), cardEl.querySelector('.status')], schedulePanel, () => view.apply(), win);
  sheet.bind();
  padding.useSheet(sheet);
  view.useSheet(sheet);
  app.attach(view, sheet);
  const controls = new ViewControls(els, view, surface, win);
  controls.bind();

  // Drawn at once from the timeline; the trackers fill in when Chronorace
  // answers, however long that takes.
  app.render();
  view.showWholeRoute();
  controls.watchCard();
  app.run();
  await app.poll();
  return app;
}

/**
 * Starts the page. If it cannot start - the map library did not load, a
 * file did not arrive - it says so and tries again rather than leaving the
 * card with no map behind it for as long as the tab stays open. A phone on
 * a poor connection is the usual cause, and a second attempt the usual cure.
 */
export function start(win) {
  const state = { words: null };
  return boot(win, state).catch((e) => {
    win.console.error('The page could not start; reloading shortly.', e);
    const meta = win.document.getElementById('meta');
    if (meta) {
      meta.hidden = false;
      meta.classList.add('stale');
      meta.textContent = (state.words ?? LOCALES.en.words({ name: '', vehicle: 'bus' })).retrying;
    }
    win.setTimeout(() => win.location.reload(), RETRY_MS);
  });
}
