const NAMES = { run: '--run', drive: '--drive', sleep: '--sleep', free: '--free', accent: '--accent' };

/**
 * The site's colours as CSS custom properties, written into the page's head
 * so the page is drawn in them from the first paint. The colours are
 * checked as "#rrggbb" before they get here.
 */
export function paletteStyle(colours) {
  const rules = Object.entries(NAMES).map(([key, name]) => `${name}: ${colours[key]};`).join(' ');
  return `  <style>:root { ${rules} }</style>`;
}
