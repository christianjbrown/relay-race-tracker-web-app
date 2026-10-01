// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { loadSiteData } from '../../src/boot/site-data.js';
import { buildTimeline } from '../../src/boot/timeline.js';
import { makeWin } from '../fakes/page.js';

describe('buildTimeline', () => {
  it('lays the schedule along the course and answers what is planned at a moment', async () => {
    const site = await loadSiteData(makeWin());
    const { schedule, course, states, plannedActivity } = buildTimeline(site.route, site.segments);
    expect(schedule.segments.length).toBe(site.segments.length);
    expect(course.points.length).toBeGreaterThan(1);
    expect(states).toBeTruthy();
    const first = schedule.segments[0];
    expect(plannedActivity.at(first.start)).toBeTruthy();
  });
});
