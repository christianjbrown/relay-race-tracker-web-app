// How the map is framed around the card: its padding, the draggable sheet and the view buttons.
import { MapPadding } from '../ui/map-padding.js';
import { MapView } from '../ui/map-view.js';
import { SheetDrag } from '../ui/sheet-drag.js';
import { ViewControls } from '../ui/view-controls.js';

/**
 * `stage` already holds the screen; the map view is put on it here, so
 * the parts that were made before it can reach it.
 */
export function buildView(win, { ui, timeline, surface, stage }) {
  const { els, schedulePanel } = ui;
  const { course, schedule } = timeline;
  const cardEl = els.get('card');
  const padding = new MapPadding(cardEl, win);
  const view = new MapView(surface, padding, schedulePanel, win, [...course.points, ...schedule.places()], () => stage.screen.where());
  stage.view = view;
  const sheet = new SheetDrag(cardEl, [els.get('toggle'), cardEl.querySelector('.status')], schedulePanel, () => view.apply(), win);
  sheet.bind();
  padding.useSheet(sheet);
  view.useSheet(sheet);
  stage.screen.attach(view, sheet);
  const controls = new ViewControls(els, view, surface, win);
  controls.bind();
  return { view, sheet, controls };
}
