/**
 * One colour per kind of segment, used on the map, the card, the legend and
 * the share card, and an accent for the page's main button. Each can be
 * changed from the site's config.json under "colours", as "#rrggbb"; the
 * accent follows the running colour unless it is given too.
 */
export const DEFAULT_COLOURS = Object.freeze({ run: '#EB6834', drive: '#E87BA4', sleep: '#5F4D8C', free: '#A9A79C' });

const HEX = /^#[0-9a-f]{6}$/i;

export function resolveColours(overrides = {}) {
  const known = [...Object.keys(DEFAULT_COLOURS), 'accent'];
  const unknown = Object.keys(overrides).filter((k) => !known.includes(k));
  if (unknown.length) throw new Error(`Unknown colour: ${unknown.join(', ')}. The colours are ${known.join(', ')}.`);
  const colours = { ...DEFAULT_COLOURS, ...overrides };
  colours.accent = overrides.accent ?? colours.run;
  for (const [key, value] of Object.entries(colours)) {
    if (typeof value !== 'string' || !HEX.test(value)) throw new Error(`Colour ${key} must be written as "#rrggbb".`);
  }
  return Object.freeze(colours);
}
