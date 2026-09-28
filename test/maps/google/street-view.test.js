import { describe, expect, it } from 'vitest';
import { StreetView } from '../../../src/maps/google/street-view.js';
import { makeCourse, point } from '../../fixtures/relay.js';

describe('StreetView', () => {
  const view = new StreetView(makeCourse());
  const seg = { span: [0, 100] };
  const leg = (state, at = 50) => ({ kind: 'run', state, at, seg });
  const fix = point(50);

  it('stands where the runner is on the course, facing along it', () => {
    const p = point(50);
    expect(view.of(leg('running'), fix)).toBe(
      `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${p.lat.toFixed(6)},${p.lng.toFixed(6)}&heading=0`,
    );
    expect(view.of(leg('overrun'), fix)).toContain('&heading=0');
  });

  it('faces the way the course came in at its very end', () => {
    const reversed = new StreetView(makeCourse(), 0.05);
    expect(reversed.of(leg('running', 500), fix)).toContain('&heading=0');
  });

  it('finds the runner on the leg from where they are drawn when the tracker has not placed them', () => {
    const p = point(30);
    expect(view.of(leg('planned', null), p)).toContain(`viewpoint=${p.lat.toFixed(6)},${p.lng.toFixed(6)}`);
  });

  it('has nothing to show off a leg, while waiting, or with nowhere to draw the runner', () => {
    expect(view.of({ kind: 'drive', state: 'planned', at: 50 }, fix)).toBeNull();
    expect(view.of(leg('waiting'), fix)).toBeNull();
    expect(view.of(leg('running'), null)).toBeNull();
  });
});
