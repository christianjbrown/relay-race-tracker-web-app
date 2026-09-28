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
    look: { render: (...a) => { calls.look = a; } },
    rewind: { render: (...a) => { calls.rewind = a; } },
    celebration: { render: (...a) => { calls.celebration = a; } },
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
    expect(views.calls.progress).toEqual([now, act, null, null, null]);
    expect(views.calls.next).toEqual([now, act, null]);
    expect(views.calls.meta).toEqual([now, fix, act]);
    expect(views.calls.look).toEqual([fix, act]);
    expect(views.calls.rewind).toEqual([act]);
    expect(views.calls.timeline).toEqual([act]);
    expect(views.calls.celebration).toEqual([act]);
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

  it('waits for the runner coming in when they will reach the leg after the vehicle', () => {
    const views = fakeViews();
    const now = new Date();
    const arrival = new Date(now.getTime() + 2000);
    const handover = new Date(now.getTime() + 5000);
    new Card(views).render(now, {}, { wait: null }, { arrival }, null, handover);
    expect(views.calls.next[2]).toEqual(handover);
  });

  it('keeps the vehicle arrival when the runner coming in will be there first', () => {
    const views = fakeViews();
    const now = new Date();
    const arrival = new Date(now.getTime() + 5000);
    new Card(views).render(now, {}, { wait: null }, { arrival }, null, new Date(now.getTime() + 2000));
    expect(views.calls.next[2]).toEqual(arrival);
  });

  it('uses the handover alone before the vehicle has an arrival', () => {
    const views = fakeViews();
    const now = new Date();
    const handover = new Date(now.getTime() + 5000);
    new Card(views).render(now, {}, { wait: null }, null, null, handover);
    expect(views.calls.next[2]).toEqual(handover);
  });
});
