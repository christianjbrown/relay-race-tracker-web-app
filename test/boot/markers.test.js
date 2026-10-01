// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildMarkers } from '../../src/boot/markers.js';
import { BODY, assemble } from '../fakes/page.js';

beforeEach(() => {
  document.documentElement.removeAttribute('data-theme');
  document.body.innerHTML = BODY;
});

describe('buildMarkers', () => {
  it('puts the runner, vehicle and group markers on the map', async () => {
    const p = await assemble();
    const stage = { screen: { lookAround: vi.fn() }, view: { follow: vi.fn() } };
    const markers = buildMarkers(p.win, {
      maps: p.maps, map: p.map, spot: p.spot, config: p.config, badges: p.ui.badges, words: p.language.words, stage,
    });
    expect(Object.keys(markers).sort()).toEqual(['groupMarker', 'runnerMarker', 'vehicleMarker']);
    expect(document.querySelector('.runner')).toBeTruthy();
    expect(document.querySelector('.group-marker')).toBeTruthy();
  });

  it('reaches the screen and the view through the stage when the runner is clicked', async () => {
    const p = await assemble();
    const stage = { screen: { lookAround: vi.fn(() => false) }, view: { follow: vi.fn() } };
    buildMarkers(p.win, {
      maps: p.maps, map: p.map, spot: p.spot, config: p.config, badges: p.ui.badges, words: p.language.words, stage,
    });
    document.querySelector('.runner').dispatchEvent(new Event('click'));
    expect(stage.screen.lookAround.mock.calls.length + stage.view.follow.mock.calls.length).toBeGreaterThan(0);
  });
});
