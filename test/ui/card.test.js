import { describe, expect, it } from 'vitest';
import { Card } from '../../src/ui/card.js';

function fakeViews() {
  const calls = {};
  return {
    calls,
    status: { render: (...a) => { calls.status = a; } },
    progress: { render: (...a) => { calls.progress = a; } },
    next: { render: (...a) => { calls.next = a; } },
    meta: { render: (...a) => { calls.meta = a; } },
    timeline: { render: (...a) => { calls.timeline = a; } },
  };
}

describe('Card', () => {
  it('renders every part with the moment and activity', () => {
    const views = fakeViews();
    const card = new Card(views);
    const now = new Date();
    const fix = { lat: 1, lng: 2 };
    const act = { wait: null };
    card.render(now, fix, act);
    expect(views.calls.status).toEqual([now, act]);
    expect(views.calls.progress).toEqual([now, act, null, null]);
    expect(views.calls.next).toEqual([now, act, null]);
    expect(views.calls.meta).toEqual([now, fix, act]);
    expect(views.calls.timeline).toEqual([act]);
  });

  it('prefers a waiting eta for the next arrival', () => {
    const views = fakeViews();
    const card = new Card(views);
    const now = new Date();
    const eta = new Date(now.getTime() + 1000);
    const act = { wait: { eta } };
    card.render(now, {}, act, { arrival: new Date(now.getTime() + 2000) }, new Date(now.getTime() + 3000));
    expect(views.calls.next[2]).toBe(eta);
  });

  it('falls back to the leg end when there is no waiting eta', () => {
    const views = fakeViews();
    const card = new Card(views);
    const now = new Date();
    const legEnd = new Date(now.getTime() + 3000);
    const act = { wait: null };
    card.render(now, {}, act, { arrival: new Date(now.getTime() + 2000) }, legEnd);
    expect(views.calls.next[2]).toBe(legEnd);
  });

  it('falls back to the trip arrival when there is no eta or leg end', () => {
    const views = fakeViews();
    const card = new Card(views);
    const now = new Date();
    const arrival = new Date(now.getTime() + 2000);
    const act = { wait: null };
    card.render(now, {}, act, { arrival }, null);
    expect(views.calls.next[2]).toBe(arrival);
  });
});
