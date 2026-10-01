// The card and the parts of the page around it, drawn from the clock alone.
import { SegmentDescriber } from '../i18n/segment-describer.js';
import { StreetView } from '../maps/google/street-view.js';
import { RelaySummary } from '../domain/relay-summary.js';
import { BadgeChoice } from '../ui/badge-choice.js';
import { makeBadges } from '../ui/badges.js';
import { Birthday } from '../ui/birthday.js';
import { Card } from '../ui/card.js';
import { CardLabels } from '../ui/card-labels.js';
import { CanvasFit } from '../ui/canvas-fit.js';
import { Celebration } from '../ui/celebration.js';
import { CelebrationMessage } from '../ui/celebration-message.js';
import { Elements } from '../ui/dom.js';
import { Fireworks } from '../ui/fireworks.js';
import { FireworksPainter } from '../ui/fireworks-painter.js';
import { FireworksShow } from '../ui/fireworks-show.js';
import { LookHint } from '../ui/look-hint.js';
import { MetaView } from '../ui/meta-view.js';
import { MotionPreference } from '../ui/motion-preference.js';
import { NextView } from '../ui/next-view.js';
import {
  DriveProgress, HandoverStopProgress, ProgressView, RunProgress, TimeProgress, WaitingProgress,
} from '../ui/progress.js';
import { Rewind } from '../ui/rewind.js';
import { SchedulePanel } from '../ui/schedule-panel.js';
import { StatusView } from '../ui/status-view.js';
import { TimelineView } from '../ui/timeline-view.js';

/** Everything the card needs, drawn once from the clock alone while the map loads. */
export function buildCard(els, page) {
  const { words, formats, badges, describer, schedule, course, config } = page;
  const { colours } = config;
  return new Card({
    status: new StatusView(els, words, badges, describer, page.birthday),
    progress: new ProgressView(els, colours, [
      new WaitingProgress(course, words, formats),
      new DriveProgress(words, formats),
      new RunProgress(course, words, formats),
      new HandoverStopProgress(words, formats),
      new TimeProgress(words, formats),
    ]),
    next: new NextView(els, words, formats, badges, describer, schedule, colours),
    meta: new MetaView(els, words, formats, config.tuning.staleMs),
    look: new LookHint(els, words, page.streetView),
    rewind: page.rewind,
    timeline: new TimelineView(els, words, formats, badges, describer, schedule, colours),
    celebration: page.celebration,
  });
}

/** The fireworks and the message that goes with them, which the card shows at the finish. */
export function buildCelebration(win, els, page) {
  const { words, formats, schedule, config } = page;
  const canvas = els.get('fireworks');
  const fireworks = new Fireworks(canvas, win, {
    show: new FireworksShow(Object.values(config.colours)),
    painter: new FireworksPainter(),
    fit: new CanvasFit(canvas, win),
    motion: new MotionPreference(win),
  });
  const celebration = new Celebration(els, new CelebrationMessage(words, formats, new RelaySummary(schedule)), fireworks);
  celebration.bind();
  return celebration;
}

/** The page's elements, labels, panels and card. */
export function buildUi(win, { config, language, timeline, theme }) {
  const { code, words, formats } = language;
  const { schedule, course } = timeline;
  const els = new Elements(win.document);
  const describer = new SegmentDescriber(words, formats, code);
  const badges = makeBadges(config.emoji, config.vehicle);
  const birthday = new Birthday(config.birthday, formats);
  new CardLabels(els, words, code, theme, config.colours).render();
  const schedulePanel = new SchedulePanel(els);
  schedulePanel.bind();
  const streetView = new StreetView(course);
  const celebration = buildCelebration(win, els, { words, formats, schedule, config });
  const rewind = new Rewind(els, words, formats, schedule);
  rewind.bind();
  const card = buildCard(els, { words, formats, badges, describer, schedule, course, config, birthday, streetView, celebration, rewind });
  return { els, describer, badges, birthday, schedulePanel, streetView, celebration, rewind, card, badgeChoice: new BadgeChoice() };
}
