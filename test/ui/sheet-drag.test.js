// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { SheetDrag } from '../../src/ui/sheet-drag.js';

function stubBox(el, { offsetTop = 0, offsetHeight = 0 } = {}) {
  Object.defineProperty(el, 'offsetTop', { value: offsetTop, configurable: true });
  Object.defineProperty(el, 'offsetHeight', { value: offsetHeight, configurable: true });
  el.setPointerCapture = () => {};
}

function fakeWin(innerWidth) {
  const listeners = {};
  return { innerWidth, addEventListener: (type, fn) => { listeners[type] = fn; }, trigger: (type) => listeners[type](), listeners };
}

function fakeSchedule(isOpen = false) {
  return { open: isOpen, isOpen() { return this.open; }, show(open) { this.open = open; } };
}

function pointerEvent(type, { clientY, pointerId = 1 } = {}) {
  const e = new Event(type);
  Object.assign(e, { clientY, pointerId, preventDefault: () => { e.prevented = true; } });
  return e;
}

function makeDrag({ narrow = true, scheduleOpen = false } = {}) {
  document.body.innerHTML = '<div id="card"><div class="grip"></div></div>';
  const card = document.getElementById('card');
  const grip = document.querySelector('.grip');
  stubBox(card, { offsetTop: 500, offsetHeight: 300 });
  stubBox(grip, { offsetTop: 250, offsetHeight: 20 });
  const schedule = fakeSchedule(scheduleOpen);
  const win = fakeWin(narrow ? 500 : 1000);
  const changes = [];
  const drag = new SheetDrag(card, [grip], schedule, () => changes.push(true), win);
  return { drag, card, grip, schedule, win, changes };
}

describe('SheetDrag', () => {
  it('starts untucked', () => {
    const { drag, schedule } = makeDrag({ scheduleOpen: false });
    expect(drag.level()).toBe(1);
    schedule.show(true);
    expect(drag.level()).toBe(2);
  });

  it('sets the level, clamped to 0-2, showing or hiding the schedule and tucking the card', () => {
    const { drag, card, schedule, changes } = makeDrag();
    drag.setLevel(2);
    expect(drag.level()).toBe(2);
    expect(schedule.open).toBe(true);
    expect(card.classList.contains('tucked')).toBe(false);
    expect(changes).toHaveLength(1);

    drag.setLevel(-5);
    expect(drag.level()).toBe(0);
    expect(schedule.open).toBe(false);
    expect(card.classList.contains('tucked')).toBe(true);

    drag.setLevel(9);
    expect(drag.level()).toBe(2);
  });

  it('computes the offset from the last grip, never negative', () => {
    const { drag } = makeDrag();
    // card offsetHeight 300, grip offsetTop 250 + offsetHeight 20 + 12 = 282; 300-282=18
    expect(drag.offset()).toBe(18);
  });

  it('floors the offset at zero when the grip covers the whole card', () => {
    const { drag, card, grip } = makeDrag();
    stubBox(card, { offsetTop: 500, offsetHeight: 100 });
    stubBox(grip, { offsetTop: 250, offsetHeight: 20 });
    expect(drag.offset()).toBe(0);
  });

  it('gives the resting top as the card top, plus the offset once tucked', () => {
    const { drag, card } = makeDrag();
    expect(drag.restingTop()).toBe(card.offsetTop);
    drag.setLevel(0);
    expect(drag.restingTop()).toBe(card.offsetTop + drag.offset());
  });

  it('sets the tuck custom property to the offset, or zero when not tucked', () => {
    const { drag, card } = makeDrag();
    drag.setLevel(0);
    expect(card.style.getPropertyValue('--tuck')).toBe(`${drag.offset()}px`);
    drag.setLevel(1);
    expect(card.style.getPropertyValue('--tuck')).toBe('0px');
  });

  it('un-tucks on resize back to a wide screen', () => {
    const { drag, card, win } = makeDrag({ narrow: true });
    drag.bind();
    drag.setLevel(0);
    win.innerWidth = 1000;
    win.trigger('resize');
    expect(drag.level()).toBe(1);
    expect(card.classList.contains('tucked')).toBe(false);
  });

  it('does nothing on resize when not tucked, or still narrow', () => {
    const { drag, win } = makeDrag({ narrow: true });
    drag.bind();
    win.trigger('resize'); // still narrow, not tucked: no-op either way
    expect(drag.level()).toBe(1);

    drag.setLevel(0);
    win.innerWidth = 300; // still narrow
    win.trigger('resize');
    expect(drag.level()).toBe(0);
  });

  it('ignores pointerdown on a wide screen, so the card behaves as a side panel', () => {
    const { drag, grip } = makeDrag({ narrow: false });
    drag.bind();
    const e = pointerEvent('pointerdown', { clientY: 100 });
    grip.dispatchEvent(e);
    expect(e.prevented).toBeUndefined();
  });

  it('taps a grip to step the level up, and back down from the top', () => {
    const { drag, grip } = makeDrag({ narrow: true, scheduleOpen: false });
    drag.bind();
    grip.dispatchEvent(pointerEvent('pointerdown', { clientY: 100 }));
    grip.dispatchEvent(pointerEvent('pointerup', { clientY: 102 })); // within tap threshold
    expect(drag.level()).toBe(2);

    grip.dispatchEvent(pointerEvent('pointerdown', { clientY: 100 }));
    grip.dispatchEvent(pointerEvent('pointerup', { clientY: 100 }));
    expect(drag.level()).toBe(1); // tapping at the top steps back down
  });

  it('drags up to raise a level and down to lower it', () => {
    const { drag, grip } = makeDrag({ narrow: true, scheduleOpen: false });
    drag.bind();
    grip.dispatchEvent(pointerEvent('pointerdown', { clientY: 100 }));
    grip.dispatchEvent(pointerEvent('pointermove', { clientY: 60 })); // dragged up
    grip.dispatchEvent(pointerEvent('pointerup', { clientY: 60 }));
    expect(drag.level()).toBe(2);

    grip.dispatchEvent(pointerEvent('pointerdown', { clientY: 100 }));
    grip.dispatchEvent(pointerEvent('pointermove', { clientY: 140 })); // dragged down
    grip.dispatchEvent(pointerEvent('pointerup', { clientY: 140 }));
    expect(drag.level()).toBe(1);
  });

  it('follows the finger while dragging, tucking further from wherever it started', () => {
    const { drag, card, grip } = makeDrag({ narrow: true });
    drag.bind();
    grip.dispatchEvent(pointerEvent('pointerdown', { clientY: 100 }));
    grip.dispatchEvent(pointerEvent('pointermove', { clientY: 150 }));
    expect(card.style.getPropertyValue('--tuck')).toBe(`${Math.min(drag.offset(), 50)}px`);
    expect(card.classList.contains('dragging')).toBe(true);
    grip.dispatchEvent(pointerEvent('pointerup', { clientY: 150 }));
    expect(card.classList.contains('dragging')).toBe(false);
  });

  it('follows the finger from the tucked offset when already tucked', () => {
    const { drag, card, grip } = makeDrag({ narrow: true });
    drag.bind();
    drag.setLevel(0);
    const tuckedOffset = drag.offset();
    grip.dispatchEvent(pointerEvent('pointerdown', { clientY: 100 }));
    grip.dispatchEvent(pointerEvent('pointermove', { clientY: 90 })); // dragged up by 10, from the tucked offset
    expect(card.style.getPropertyValue('--tuck')).toBe(`${Math.min(tuckedOffset, Math.max(0, tuckedOffset - 10))}px`);
  });

  it('ignores pointermove and pointerup with no pointerdown first', () => {
    const { drag, grip } = makeDrag({ narrow: true });
    drag.bind();
    expect(() => grip.dispatchEvent(pointerEvent('pointermove', { clientY: 60 }))).not.toThrow();
    const before = drag.level();
    grip.dispatchEvent(pointerEvent('pointerup', { clientY: 60 }));
    expect(drag.level()).toBe(before);
  });

  it('also ends the drag on pointercancel', () => {
    const { drag, grip } = makeDrag({ narrow: true });
    drag.bind();
    grip.dispatchEvent(pointerEvent('pointerdown', { clientY: 100 }));
    grip.dispatchEvent(pointerEvent('pointercancel', { clientY: 100 }));
    expect(drag.level()).toBe(2);
  });
});
