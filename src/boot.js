// The composition root: the one place that reads the site's files, makes
// every part of the page and connects them. Nothing else calls `new` on a
// collaborator or reaches for a browser global. Each concern has its own
// builder in src/boot/; this file calls them in order.
import { buildClocks } from './boot/clocks.js';
import { buildDrawing } from './boot/drawing.js';
import { buildMap } from './boot/map.js';
import { buildMarkers } from './boot/markers.js';
import { buildApp, buildReplay, buildScreen } from './boot/screens.js';
import { loadSiteData } from './boot/site-data.js';
import { buildTimeline } from './boot/timeline.js';
import { buildTracking } from './boot/tracking.js';
import { buildUi } from './boot/ui.js';
import { buildView } from './boot/view.js';
import { LOCALES } from './i18n/locales/index.js';
import { PageLoop } from './page-loop.js';
import { chooseTheme } from './ui/theme.js';

const RETRY_MS = 15000;

/** Reads the site, draws the card, loads the map and starts following the runner. */
export async function boot(win, state = {}) {
  const { config, segments, route, language } = await loadSiteData(win);
  state.words = language.words;

  const { clock, realClock } = buildClocks(win, config);
  const theme = chooseTheme(win.location.search, win.document.documentElement);
  const timeline = buildTimeline(route, segments);
  const ui = buildUi(win, { config, language, timeline, theme });
  const { els, card } = ui;
  card.render(clock.now(), null, timeline.plannedActivity.at(clock.now()));

  const { maps, map, surface, router, spot } = await buildMap(win, { config, language, timeline, theme, els, realClock });
  // The markers and the screen are made before the map view they reach, so they go through this.
  const stage = { screen: null, view: null };
  const markers = buildMarkers(win, { maps, map, spot, config, badges: ui.badges, words: language.words, stage });
  const tracking = buildTracking(win, config);
  const drawing = buildDrawing({ maps, map, theme, config, timeline, router, describer: ui.describer });
  const app = buildApp({ clock, tracking, drawing, timeline, config, ui, markers, router });
  stage.screen = buildScreen(app, buildReplay({ ui, timeline, drawing, markers }), { ui, router });
  const { view, controls } = buildView(win, { ui, timeline, surface, stage });

  // Drawn at once from the timeline; the trackers fill in when Chronorace
  // answers, however long that takes.
  stage.screen.render();
  view.showWholeRoute();
  controls.watchCard();
  const loop = new PageLoop(app, stage.screen, win, config.tuning, drawing.ending);
  loop.run();
  await loop.poll();
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
