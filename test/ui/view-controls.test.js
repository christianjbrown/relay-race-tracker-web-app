import { describe, expect, it } from 'vitest';
import { ViewControls } from '../../src/ui/view-controls.js';

function fakeElement() {
  return { listeners: {}, addEventListener(type, fn) { this.listeners[type] = fn; } };
}

function fakeEls(elements) {
  return { get: (id) => elements[id] };
}

function fakeSurface() {
  return { dragHandler: null, onDragStart(fn) { this.dragHandler = fn; } };
}

function fakeWin() {
  const listeners = {};
  return {
    listeners,
    addEventListener(type, fn) { listeners[type] = fn; },
    raf: [],
    cancelled: [],
    requestAnimationFrame(fn) { this.raf.push(fn); return this.raf.length; },
    cancelAnimationFrame(id) { this.cancelled.push(id); },
    ResizeObserver: class {
      constructor(cb) { this.cb = cb; }

      observe(el) { this.constructor.observed = el; }
    },
  };
}

function makeControls(view = {}) {
  const card = fakeElement();
  const els = fakeEls({ centre: fakeElement(), overview: fakeElement(), card });
  const surface = fakeSurface();
  const win = fakeWin();
  return { els, card, surface, win, controls: new ViewControls(els, view, surface, win) };
}

describe('ViewControls', () => {
  it('follows the runner when centre is clicked', () => {
    let followed = false;
    const { els, controls } = makeControls({ follow: () => { followed = true; } });
    controls.bind();
    els.get('centre').listeners.click();
    expect(followed).toBe(true);
  });

  it('shows the whole route when overview is clicked', () => {
    let overviewed = false;
    const { els, controls } = makeControls({ overview: () => { overviewed = true; } });
    controls.bind();
    els.get('overview').listeners.click();
    expect(overviewed).toBe(true);
  });

  it('releases the map from following when the reader drags it', () => {
    let released = false;
    const { surface, controls } = makeControls({ release: () => { released = true; } });
    controls.bind();
    surface.dragHandler();
    expect(released).toBe(true);
  });

  it('re-fits the map on window resize', () => {
    let applied = 0;
    const { win, controls } = makeControls({ apply: () => { applied += 1; } });
    controls.watchCard();
    win.listeners.resize();
    expect(applied).toBe(1);
  });

  it('observes the card element for size changes', () => {
    const { card, win, controls } = makeControls({ apply: () => {} });
    controls.watchCard();
    expect(win.ResizeObserver.observed).toBe(card);
  });

  it('applies via requestAnimationFrame only once the observed size actually changes', () => {
    let applied = 0;
    let capturedCallback;
    const win = fakeWin();
    win.ResizeObserver = class {
      constructor(cb) { capturedCallback = cb; }

      observe() {}
    };
    const els = fakeEls({ centre: fakeElement(), overview: fakeElement(), card: fakeElement() });
    const controls = new ViewControls(els, { apply: () => { applied += 1; } }, fakeSurface(), win);
    controls.watchCard();

    capturedCallback([{ contentRect: { width: 100.4, height: 200.6 } }]);
    expect(win.raf).toHaveLength(1);
    win.raf[0]();
    expect(applied).toBe(1);

    // Same rounded size again: no new frame queued, nothing cancelled.
    capturedCallback([{ contentRect: { width: 100.4, height: 200.6 } }]);
    expect(win.raf).toHaveLength(1);

    // A different size cancels the pending frame and queues a new one.
    capturedCallback([{ contentRect: { width: 101, height: 200 } }]);
    expect(win.raf).toHaveLength(2);
    expect(win.cancelled).toContain(1);
  });
});
