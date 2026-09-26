import { resolveColours } from '../../src/config/colours.js';
// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import {
  DriveProgress, ProgressView, RunProgress, TimeProgress, WaitingProgress,
} from '../../src/ui/progress.js';
import { Elements } from '../../src/ui/dom.js';
import { LOCALES } from '../../src/i18n/locales/index.js';
import { Formats } from '../../src/i18n/formats.js';
import { makeRelay, at } from '../fixtures/relay.js';

// A palette of the site's own, to show the views use what they are given.
const COLOURS = resolveColours({ run: '#123456', drive: '#234567', sleep: '#345678', free: '#456789' });

const words = LOCALES.en.words({ name: 'Sam', vehicle: 'bus' });
const formats = new Formats('en-GB', 'Europe/Brussels', words);

describe('WaitingProgress', () => {
  const { course, schedule } = makeRelay();
  const measure = new WaitingProgress(course, words, formats);

  it('fits only a waiting activity with a handover in view', () => {
    expect(measure.fits({ act: { state: 'waiting', wait: {} } })).toBe(true);
    expect(measure.fits({ act: { state: 'waiting', wait: null } })).toBe(false);
    expect(measure.fits({ act: { state: 'running', wait: {} } })).toBe(false);
  });

  it('shares how far the relay has come towards the runner', () => {
    const seg = schedule.segments[4];
    const now = at(250);
    const eta = at(290);
    const act = { seg, at: 150, wait: { handover: 200, eta } };
    const result = measure.measure({ now, act });
    expect(result.share).toBeCloseTo(0.5, 5);
    expect(result.left).toBe(words.runnerAway(formats.duration(eta - now)));
    expect(result.right).toBe(words.takesOver(formats.when(eta, now)));
    expect(result.late).toBe(false);
  });

  it('clamps the share to the 0-1 range', () => {
    const seg = schedule.segments[4];
    const before = measure.measure({ now: at(250), act: { seg, at: 90, wait: { handover: 200, eta: at(290) } } });
    expect(before.share).toBe(0);
    const past = measure.measure({ now: at(250), act: { seg, at: 250, wait: { handover: 200, eta: at(290) } } });
    expect(past.share).toBe(1);
  });
});

describe('DriveProgress', () => {
  const measure = new DriveProgress(words, formats);

  it('fits a drive with a live trip', () => {
    expect(measure.fits({ act: { seg: { kind: 'drive' } }, trip: {} })).toBe(true);
    expect(measure.fits({ act: { seg: { kind: 'drive' } }, trip: null })).toBe(false);
    expect(measure.fits({ act: { seg: { kind: 'run' } }, trip: {} })).toBe(false);
  });

  it('uses the trip share when it is given', () => {
    const act = { seg: { start: at(60) } };
    const now = at(70);
    const trip = { share: 0.75, arrival: at(80) };
    const result = measure.measure({ now, act, trip });
    expect(result.share).toBe(0.75);
    expect(result.left).toBe(words.etaLeft(formats.duration(trip.arrival - now)));
    expect(result.right).toBe(words.arrives(formats.when(trip.arrival, now)));
    expect(result.late).toBe(false);
  });

  it('otherwise measures by time towards the estimated arrival', () => {
    const act = { seg: { start: at(60) } };
    const now = at(70);
    const trip = { arrival: at(80) };
    const result = measure.measure({ now, act, trip });
    expect(result.share).toBeCloseTo(0.5, 5);
  });

  it('never reports a negative share', () => {
    const act = { seg: { start: at(60) } };
    const now = at(50);
    const trip = { arrival: at(80) };
    const result = measure.measure({ now, act, trip });
    expect(result.share).toBe(0);
  });
});

describe('RunProgress', () => {
  const { course, schedule } = makeRelay();
  const measure = new RunProgress(course, words, formats);

  it('fits a leg the tracker sees as running or overrun', () => {
    expect(measure.fits({ act: { seg: { kind: 'run' }, state: 'running' } })).toBe(true);
    expect(measure.fits({ act: { seg: { kind: 'run' }, state: 'overrun' } })).toBe(true);
    expect(measure.fits({ act: { seg: { kind: 'run' }, state: 'waiting' } })).toBe(false);
    expect(measure.fits({ act: { seg: { kind: 'drive' }, state: 'running' } })).toBe(false);
  });

  it('measures distance behind and left, planned until the end', () => {
    const seg = schedule.segments[0];
    const now = at(30);
    const act = {
      seg, state: 'running', at: 50, reached: 50, end: null,
    };
    const result = measure.measure({ now, act, legEnd: null });
    expect(result.share).toBeCloseTo(0.5, 5);
    expect(result.left).toBe(words.kmLeft(formats.kmFixed(course.between(50, 100))));
    expect(result.right).toBe(words.plannedUntil(formats.when(seg.end, now)));
    expect(result.late).toBe(false);
  });

  it('reports overrun once the plan has run out', () => {
    const seg = schedule.segments[0];
    const now = at(70);
    const act = {
      seg, state: 'overrun', at: 90, reached: 90, end: null,
    };
    const result = measure.measure({ now, act, legEnd: null });
    expect(result.right).toBe(words.overrun(formats.when(seg.end, now)));
    expect(result.late).toBe(true);
  });

  it('uses the leg end at the runner\'s own pace when given, and flags a late finish', () => {
    const seg = schedule.segments[0];
    const now = at(50);
    const act = {
      seg, state: 'running', at: 90, reached: 90, end: null,
    };
    const legEnd = at(70);
    const result = measure.measure({ now, act, legEnd });
    expect(result.right).toBe(words.finishesAbout(formats.when(legEnd, now)));
    expect(result.late).toBe(true);
  });

  it('does not flag a leg end only a little past the plan', () => {
    const seg = schedule.segments[0];
    const now = at(50);
    const act = {
      seg, state: 'running', at: 90, reached: 90, end: null,
    };
    const legEnd = at(62);
    const result = measure.measure({ now, act, legEnd });
    expect(result.late).toBe(false);
  });

  it('measures from the runner rather than the leg when they are short of its start', () => {
    const seg = schedule.segments[4];
    const now = at(235);
    const act = {
      seg, state: 'running', at: 150, reached: 150, end: null,
    };
    const result = measure.measure({ now, act, legEnd: null });
    expect(result.left).toBe(words.kmLeft(formats.kmFixed(course.between(150, 300))));
  });

  it('never reports a negative distance left once the runner is past the leg\'s end', () => {
    const seg = schedule.segments[0];
    const now = at(65);
    const act = {
      seg, state: 'overrun', at: 150, reached: 100, end: null,
    };
    const result = measure.measure({ now, act, legEnd: null });
    expect(result.left).toBe(words.kmLeft(formats.kmFixed(0)));
  });

  it('uses the activity\'s own end for a waiting vehicle that moved the leg end', () => {
    const seg = schedule.segments[0];
    const now = at(30);
    const act = {
      seg, state: 'running', at: 50, reached: 50, end: 90,
    };
    const result = measure.measure({ now, act, legEnd: null });
    expect(result.left).toBe(words.kmLeft(formats.kmFixed(course.between(50, 90))));
  });
});

describe('TimeProgress', () => {
  const measure = new TimeProgress(words, formats);

  it('fits anything', () => {
    expect(measure.fits()).toBe(true);
  });

  it('measures share of the segment by time, planned end and lateness', () => {
    const { schedule } = makeRelay();
    const seg = schedule.segments[2];
    const now = at(150);
    const result = measure.measure({ now, act: { seg, state: 'planned' } });
    expect(result.share).toBeCloseTo(0.5, 5);
    expect(result.left).toBe(words.left(formats.duration(seg.end - now)));
    expect(result.right).toBe(words.ends(formats.when(seg.end, now)));
    expect(result.late).toBe(false);
  });

  it('flags overrun state as late', () => {
    const { schedule } = makeRelay();
    const seg = schedule.segments[2];
    const result = measure.measure({ now: at(150), act: { seg, state: 'overrun' } });
    expect(result.late).toBe(true);
  });
});

describe('ProgressView', () => {
  function makeView(measures) {
    document.body.innerHTML = `
      <div id="progress" hidden>
        <span id="progress-fill"></span>
        <span id="progress-left"></span>
        <span id="progress-end"></span>
      </div>
    `;
    const els = new Elements(document);
    return { view: new ProgressView(els, COLOURS, measures), els };
  }

  it('hides the progress bar when there is no current segment', () => {
    const { view, els } = makeView([{ fits: () => true, measure: () => ({ share: 0, left: '', right: '', late: false }) }]);
    view.render(new Date(), { seg: null }, null, null);
    expect(els.get('progress').hidden).toBe(true);
  });

  it('uses the first measure that fits', () => {
    const skip = { fits: () => false, measure: () => { throw new Error('should not be called'); } };
    const use = {
      fits: () => true,
      measure: () => ({ share: 0.4, left: 'left text', right: 'right text', late: true }),
    };
    const { view, els } = makeView([skip, use]);
    const seg = { kind: 'run' };
    view.render(new Date(), { seg }, 'trip', 'legEnd');
    expect(els.get('progress').hidden).toBe(false);
    expect(els.get('progress-fill').style.getPropertyValue('--fill')).toBe(COLOURS.run);
    expect(els.get('progress-fill').style.width).toBe('40.0%');
    expect(els.get('progress-left').textContent).toBe('left text');
    expect(els.get('progress-end').textContent).toBe('right text');
    expect(els.get('progress-end').classList.contains('late')).toBe(true);
  });

  it('does not mark the end as late when the measure says so', () => {
    const use = { fits: () => true, measure: () => ({ share: 0, left: '', right: '', late: false }) };
    const { view, els } = makeView([use]);
    view.render(new Date(), { seg: { kind: 'drive' } }, null, null);
    expect(els.get('progress-end').classList.contains('late')).toBe(false);
  });
});
