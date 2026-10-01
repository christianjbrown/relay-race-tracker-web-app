// The timeline: the schedule laid along the course, and what the clock says is happening.
import { ActivityStates, ClockActivity } from '../domain/activity-states.js';
import { Course } from '../domain/course.js';
import { decodePolyline } from '../domain/geo.js';
import { LegPlacer } from '../domain/leg-placer.js';
import { Schedule } from '../domain/schedule.js';

export function buildTimeline(route, segments) {
  const schedule = new Schedule(segments);
  const course = new Course(route.polylines.flatMap(decodePolyline));
  new LegPlacer(course).place(schedule);
  const states = new ActivityStates(schedule);
  return { schedule, course, states, plannedActivity: new ClockActivity(schedule, states) };
}
