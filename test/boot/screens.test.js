// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildDrawing } from '../../src/boot/drawing.js';
import { buildMarkers } from '../../src/boot/markers.js';
import { buildApp, buildReplay, buildScreen } from '../../src/boot/screens.js';
import { buildTracking } from '../../src/boot/tracking.js';
import { BODY, assemble } from '../fakes/page.js';

beforeEach(() => {
  document.documentElement.removeAttribute('data-theme');
  document.body.innerHTML = BODY;
});

async function parts() {
  const p = await assemble();
  const markers = buildMarkers(p.win, { ...p, badges: p.ui.badges, words: p.language.words });
  const tracking = buildTracking(p.win, p.config);
  const drawing = buildDrawing({ ...p, describer: p.ui.describer });
  return { ...p, markers, tracking, drawing };
}

describe('screens', () => {
  it('builds the live app, the replay and a switch between them', async () => {
    const p = await parts();
    const app = buildApp(p);
    const replay = buildReplay(p);
    expect(app.clock).toBe(p.clock);
    expect(typeof replay.render).toBe('function');

    const listen = vi.spyOn(p.ui.rewind, 'listen');
    const onReady = vi.spyOn(p.router, 'onReady');
    const screen = buildScreen(app, replay, p);
    expect(typeof screen.render).toBe('function');
    expect(listen).toHaveBeenCalledOnce();
    expect(onReady).toHaveBeenCalledOnce();
  });
});
