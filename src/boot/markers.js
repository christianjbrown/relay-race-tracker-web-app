// The three markers on the map: the runner, the support vehicle and the running group.
import { RunnerClick } from '../ui/runner-click.js';
import { makeRunnerMarker, makeVehicleMarker } from '../maps/google/overlays.js';

/**
 * `stage` holds the screen and the map view, which are made after the
 * markers; a click reaches them through it once they exist.
 */
export function buildMarkers(win, { maps, map, spot, config, badges, words, stage }) {
  const runnerClick = new RunnerClick(win, () => stage.screen.lookAround(), () => stage.view.follow());
  const RunnerMarker = makeRunnerMarker(maps, win.document);
  const runnerMarker = new RunnerMarker({ avatar: 'avatar.png', alt: config.name, colours: config.colours, badges, onClick: () => runnerClick.click(), spot });
  runnerMarker.setMap(map);
  const VehicleMarker = makeVehicleMarker(maps, win.document);
  const vehicleMarker = new VehicleMarker(`${badges.drive} ${words.vehicle}`);
  vehicleMarker.setMap(map);
  const groupMarker = new VehicleMarker(badges.run, 'group-marker');
  groupMarker.setMap(map);
  return { runnerMarker, vehicleMarker, groupMarker };
}
