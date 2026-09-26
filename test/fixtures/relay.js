import { resolveTuning } from '../../src/config/tuning.js';
import { ActivityStates } from '../../src/domain/activity-states.js';
import { Course } from '../../src/domain/course.js';
import { LegPlacer } from '../../src/domain/leg-placer.js';
import { Schedule } from '../../src/domain/schedule.js';

/**
 * A relay on a straight course due north from 50°N 4°E: point i is at
 * latitude 50 + i/1000, so points are about 111 m apart and point i is
 * about i * 0.1112 km along. 501 points, about 55.6 km in all.
 */
export const COURSE_POINTS = 501;
export const KM_PER_POINT = 0.1112;
export const point = (i) => ({ lat: 50 + i / 1000, lng: 4 });
export const place = (i, name = `P${i}`) => ({ name, ...point(i) });
/** A position `km` east of course point i, off the course. */
export const offCourse = (i, km) => ({ lat: 50 + i / 1000, lng: 4 + km / (111.2 * Math.cos(((50 + i / 1000) * Math.PI) / 180)) });

export const T0 = new Date('2027-05-15T09:00:00+02:00');
export const at = (minutes) => new Date(T0.getTime() + minutes * 60000);
const iso = (minutes) => at(minutes).toISOString();

/**
 * The schedule, in minutes after T0 (09:00 CEST, 15 May 2027):
 *   0  leg 1, points 0-100, 60 min       (index 0)
 *   60 drive to the hotel, 30 min        (index 1)
 *   90 rest at the hotel, 120 min        (index 2)
 *  210 drive to leg 2, 30 min            (index 3)
 *  240 leg 2, points 200-300, 60 min     (index 4)
 *  300 free time, 30 min                 (index 5)
 *  330 the finish, points 480-500, 15 min (index 6)
 */
export function relaySegments() {
  const hotel = { name: 'Hotel', lat: 50.15, lng: 4.05 };
  return [
    { start: iso(0), end: iso(60), kind: 'run', leg: 1, km: 11.1, from: place(0, 'Start'), to: place(100, 'Town A') },
    { start: iso(60), end: iso(90), kind: 'drive', from: place(100, 'Town A'), to: hotel },
    { start: iso(90), end: iso(210), kind: 'sleep', at: hotel },
    { start: iso(210), end: iso(240), kind: 'drive', from: hotel, to: place(200, 'Town B') },
    { start: iso(240), end: iso(300), kind: 'run', leg: 2, km: 11.1, from: place(200, 'Town B'), to: place(300, 'Town C') },
    { start: iso(300), end: iso(330), kind: 'free', at: place(480, 'Meeting point') },
    { start: iso(330), end: iso(345), kind: 'run', finish: true, from: place(480, 'Meeting point'), to: place(500, 'Finish') },
  ];
}

export function makeCourse() {
  return new Course(Array.from({ length: COURSE_POINTS }, (_, i) => point(i)));
}

/** A placed relay: the schedule with its legs on the course, plus tuning and states. */
export function makeRelay({ segments = relaySegments(), tuning = {} } = {}) {
  const course = makeCourse();
  const schedule = new Schedule(segments);
  new LegPlacer(course).place(schedule);
  return { course, schedule, tuning: resolveTuning(tuning), states: new ActivityStates(schedule) };
}

/** A tracker fix at course point i, `ageMinutes` old at `now`. */
export const fixAt = (i, now, ageMinutes = 0) => ({ ...point(i), time: new Date(now.getTime() - ageMinutes * 60000) });
