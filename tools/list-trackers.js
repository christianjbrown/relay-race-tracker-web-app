// npm run trackers -- <Chronorace event id>
import { ChronoraceFeed } from '../src/services/chronorace-feed.js';
import { processIo, runCli } from './lib/cli.js';
import { TrackerList } from './lib/tracker-list.js';

const list = new TrackerList((id) => new ChronoraceFeed(id, (...args) => fetch(...args)), processIo.log);

await runCli(async (o, [eventId]) => {
  if (!eventId) throw new Error('Usage: npm run trackers -- <Chronorace event id>');
  await list.run(eventId);
}, process.argv.slice(2), {}, processIo);
