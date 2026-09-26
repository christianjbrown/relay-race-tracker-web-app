import { localise } from './language.js';

/**
 * The words for a segment: which leg, which stop, where the vehicle is
 * going. A segment's own `label` in the schedule wins over all of them.
 * Each kind has its own wording, so a new kind is a new entry.
 */
export class SegmentDescriber {
  constructor(words, formats, code) {
    this.code = code;
    const name = (place) => localise(place.name, code);
    this.kinds = {
      run: (seg) => (seg.finish ? words.finishLeg : words.leg(seg.leg, name(seg.from), name(seg.to), formats.km(seg.km))),
      drive: (seg) => `→ ${name(seg.to)}`,
      sleep: (seg) => name(seg.at),
      free: (seg) => (seg.at ? name(seg.at) : words.freeNote),
    };
  }

  describe(seg) {
    if (seg.label) return localise(seg.label, this.code);
    const describe = this.kinds[seg.kind];
    if (!describe) throw new Error(`No words for a "${seg.kind}" segment.`);
    return describe(seg);
  }
}
