import { createRequire } from 'node:module';
import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';

const require = createRequire(import.meta.url);

/**
 * Inter, from the npm package rather than the system, so the share card
 * looks the same wherever it is built. Each subset is its own family, and
 * text asks for them in turn, so a name like Łódź still has every letter.
 */
const SUBSETS = ['latin', 'latin-ext'];

export const FONTS = Object.freeze({
  regular: SUBSETS.map((s) => `"Card ${s} 400"`).join(', '),
  bold: SUBSETS.map((s) => `"Card ${s} 700"`).join(', '),
});

let registered = false;

function registerFonts() {
  if (registered) return;
  for (const subset of SUBSETS) {
    for (const weight of [400, 700]) {
      GlobalFonts.registerFromPath(require.resolve(`@fontsource/inter/files/inter-${subset}-${weight}-normal.woff2`), `Card ${subset} ${weight}`);
    }
  }
  registered = true;
}

/** The drawing surface the image tools are given: a canvas maker, an image loader, and the fonts. */
export function nodeCanvas() {
  registerFonts();
  return { createCanvas, loadImage, fonts: FONTS };
}
