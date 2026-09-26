import { describe, expect, it, vi } from 'vitest';
import { TrackerList } from '../../../tools/lib/tracker-list.js';

describe('TrackerList', () => {
  it('logs that there are no trackers', async () => {
    const feed = { config: async () => ({}) };
    const log = vi.fn();
    await new TrackerList(() => feed, log).run('42');
    expect(log).toHaveBeenCalledWith('Chronorace event 42 has no trackers.');
  });

  it('lists trackers with their last position, sorted by bib', async () => {
    const time = new Date('2027-05-15T09:00:00Z');
    const feed = {
      config: async () => ({
        Trackers: {
          a: { Bib: 'RUN', DisplayName: 'Runner', DeviceId: 'd1' },
          b: { Bib: 'BUS', DisplayName: 'Bus', DeviceId: 'd2' },
        },
      }),
      positions: async () => ({ d1: { time } }),
    };
    const log = vi.fn();
    await new TrackerList(() => feed, log).run('42');
    const rows = log.mock.calls.map((c) => c[0]);
    expect(rows[0]).toContain('Bib');
    // BUS sorts before RUN
    expect(rows[1]).toContain('BUS');
    expect(rows[2]).toContain('RUN');
    expect(rows[2]).toContain(time.toISOString());
    expect(rows[1]).toContain('no position yet');
  });

  it('uses an empty name when a tracker has no DisplayName', async () => {
    const feed = {
      config: async () => ({ Trackers: { a: { Bib: 'RUN', DeviceId: 'd1' } } }),
      positions: async () => ({}),
    };
    const log = vi.fn();
    await new TrackerList(() => feed, log).run('42');
    const header = log.mock.calls[0][0];
    const row = log.mock.calls[1][0];
    const nameCol = header.indexOf('Name');
    expect(row.slice(nameCol, nameCol + 'Device'.length).trim().startsWith('D')).toBe(false);
  });

  it('still lists trackers when positions() fails', async () => {
    const feed = {
      config: async () => ({ Trackers: { a: { Bib: 'RUN', DisplayName: 'Runner', DeviceId: 'd1' } } }),
      positions: async () => {
        throw new Error('down');
      },
    };
    const log = vi.fn();
    await new TrackerList(() => feed, log).run('42');
    expect(log.mock.calls[1][0]).toContain('no position yet');
  });
});
