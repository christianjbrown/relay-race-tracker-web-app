import { describe, expect, it } from 'vitest';
import { MapPadding } from '../../src/ui/map-padding.js';

function fakeCard(top, right) {
  return { getBoundingClientRect: () => ({ top, right }) };
}

describe('MapPadding', () => {
  it('pads for a bottom sheet on a narrow screen, using the card\'s current top', () => {
    const card = fakeCard(100, 300);
    const win = { innerWidth: 500, innerHeight: 800 };
    const pad = new MapPadding(card, win);
    const result = pad.get();
    expect(result.top).toBe(40);
    expect(result.bottom).toBe(600); // capped at height - 200
    expect(result.left).toBe(78); // 32 + 46 of label room
    expect(result.right).toBe(102); // 56 + 46
  });

  it('uses where the sheet will rest, not the card\'s current position, once one is set', () => {
    const card = fakeCard(1000, 300);
    const win = { innerWidth: 500, innerHeight: 2000 };
    const pad = new MapPadding(card, win);
    const withoutSheet = pad.get();
    expect(withoutSheet.bottom).toBe(2000 - 1000 + 40);

    pad.useSheet({ restingTop: () => 1900 });
    const withSheet = pad.get();
    expect(withSheet.bottom).toBe(2000 - 1900 + 40);
  });

  it('pads for a side panel on a wide screen, using the card\'s right edge', () => {
    const card = fakeCard(100, 300);
    const win = { innerWidth: 1000, innerHeight: 600 };
    const pad = new MapPadding(card, win);
    const result = pad.get();
    expect(result.top).toBe(40);
    expect(result.bottom).toBe(40);
    expect(result.left).toBe(340 + 138);
    expect(result.right).toBe(64 + 138);
  });

  it('never lets label room go negative on a tight screen', () => {
    const card = fakeCard(100, 300);
    const win = { innerWidth: 200, innerHeight: 800 };
    const pad = new MapPadding(card, win);
    const result = pad.get();
    expect(result.left).toBe(32);
    expect(result.right).toBe(56);
  });

  it('caps label room at 150px either side on a very wide screen', () => {
    const card = fakeCard(100, 300);
    const win = { innerWidth: 3000, innerHeight: 800 };
    const pad = new MapPadding(card, win);
    const result = pad.get();
    expect(result.left).toBe(340 + 150);
    expect(result.right).toBe(64 + 150);
  });
});
