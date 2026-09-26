import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { nodeCanvas } from '../../../tools/lib/canvas.js';
import { CARD_HEIGHT, CARD_WIDTH, OgCard } from '../../../tools/lib/og-card.js';

const canvas = nodeCanvas();

function fakeCourse(points) {
  return {
    points,
    slice: (a, b) => points.slice(Math.min(a, b), Math.max(a, b) + 1),
  };
}

async function avatar() {
  const buf = await readFile(path.join(import.meta.dirname, '..', '..', '..', 'example-site', 'photo.png'));
  return canvas.loadImage(buf);
}

function facts(subtitle) {
  return {
    title: 'Where is Sam?',
    subtitle,
    event: 'Coast Relay',
    route: 'Ostend to Brussels · live',
    stats: [
      ['3', 'legs for Sam'],
      ['30 km', 'Sam’s share'],
      ['45 km', 'relay course'],
      ['15–18', 'May 2027'],
    ],
  };
}

describe('OgCard', () => {
  it('draws a 1200x630 png with a subtitle, legs, a rest stop and both ends', async () => {
    const points = [
      { lat: 50, lng: 4 },
      { lat: 50.2, lng: 4.1 },
      { lat: 50.4, lng: 4.3 },
      { lat: 50.6, lng: 4.4 },
    ];
    const course = fakeCourse(points);
    const schedule = {
      segments: [
        { kind: 'run', finish: false, span: [0, 1] },
        { kind: 'drive' },
        { kind: 'sleep', at: points[1] },
        { kind: 'run', finish: true, span: [2, 3] },
      ],
    };
    const card = new OgCard(canvas).draw({ facts: facts('Wo ist Sam?'), course, schedule, avatar: await avatar() });
    const img = await canvas.loadImage(card);
    expect(img.width).toBe(CARD_WIDTH);
    expect(img.height).toBe(CARD_HEIGHT);
  });

  it('draws without a subtitle', async () => {
    const points = [{ lat: 50, lng: 4 }, { lat: 50.1, lng: 4.2 }];
    const course = fakeCourse(points);
    const schedule = { segments: [{ kind: 'run', finish: false, span: [0, 1] }] };
    const card = new OgCard(canvas).draw({ facts: facts(null), course, schedule, avatar: await avatar() });
    const img = await canvas.loadImage(card);
    expect(img.width).toBe(CARD_WIDTH);
  });

  it('shrinks text that would not otherwise fit the square', async () => {
    const points = [{ lat: 50, lng: 4 }, { lat: 50.1, lng: 4.2 }];
    const course = fakeCourse(points);
    const schedule = { segments: [] };
    const longFacts = facts('A very much longer subtitle than the card is wide enough to hold at full size');
    longFacts.title = 'An extremely long title that will not fit at the starting font size no matter what';
    longFacts.event = 'A very long event name that also needs shrinking to fit inside the card square';
    longFacts.route = 'A very long route description that needs shrinking too, from somewhere to somewhere else entirely';
    longFacts.stats[0] = ['1234567890 km an extremely long number', 'a very long label for this statistic that will not fit'];
    const card = new OgCard(canvas).draw({ facts: longFacts, course, schedule, avatar: await avatar() });
    const img = await canvas.loadImage(card);
    expect(img.width).toBe(CARD_WIDTH);
  });

  it('projects a course whose points share a latitude', async () => {
    const points = [{ lat: 50, lng: 4 }, { lat: 50, lng: 4.5 }];
    const course = fakeCourse(points);
    const schedule = { segments: [] };
    const card = new OgCard(canvas).draw({ facts: facts(null), course, schedule, avatar: await avatar() });
    expect((await canvas.loadImage(card)).width).toBe(CARD_WIDTH);
  });

  it('projects a course whose points share a longitude', async () => {
    const points = [{ lat: 50, lng: 4 }, { lat: 50.5, lng: 4 }];
    const course = fakeCourse(points);
    const schedule = { segments: [] };
    const card = new OgCard(canvas).draw({ facts: facts(null), course, schedule, avatar: await avatar() });
    expect((await canvas.loadImage(card)).width).toBe(CARD_WIDTH);
  });
});
