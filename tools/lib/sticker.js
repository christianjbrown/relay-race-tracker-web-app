const BG = '#f4f1ec';
const SIZE = 800;  // every photo is worked at this size, so the border looks the same on any of them
const PAD = 90;    // room round the photo for the border
const GROW = 22;   // how far the border reaches past the outline
const SMOOTH = 22; // how much of the outline's detail the border ignores

/**
 * The runner's face as a die-cut sticker: the photo inside a white border
 * that is grown round it and smoothed into one clean curve. A Gaussian
 * spreads evenly in every direction, so a low threshold on one is a round
 * growth, and a heavy blur thresholded at the middle rounds off every wisp
 * of hair and every notch.
 *
 * A cut-out photo (with transparency) keeps its outline; any other photo is
 * cropped to a circle first.
 */
export class Sticker {
  constructor(canvas) {
    this.canvas = canvas;
  }

  /** The sticker, as a square canvas. */
  make(photo) {
    const subject = this.cutOut(photo);
    const side = SIZE + 2 * PAD;
    const square = this.canvas.createCanvas(side, side);
    square.getContext('2d').drawImage(subject, PAD + (SIZE - subject.width) / 2, PAD + (SIZE - subject.height) / 2);

    let border = this.threshold(this.alpha(square), 40);
    border = this.threshold(this.blur(border, GROW), 8);
    border = this.threshold(this.blur(border, SMOOTH), 128);
    border = this.blur(border, 2); // an anti-aliased edge

    const out = this.canvas.createCanvas(side, side);
    const ctx = out.getContext('2d');
    ctx.drawImage(border, 0, 0);
    ctx.drawImage(square, 0, 0);
    return out;
  }

  /** The photo at working size: trimmed to its outline if it is a cut-out, or cropped to a circle if not. */
  cutOut(photo) {
    const probe = this.canvas.createCanvas(photo.width, photo.height);
    probe.getContext('2d').drawImage(photo, 0, 0);
    const box = this.opaqueBox(probe);
    const cutout = box.seeThrough;
    const src = cutout ? box : this.centreSquare(photo);
    const scale = SIZE / Math.max(src.w, src.h);
    const out = this.canvas.createCanvas(Math.round(src.w * scale), Math.round(src.h * scale));
    const ctx = out.getContext('2d');
    if (!cutout) {
      ctx.beginPath();
      ctx.arc(out.width / 2, out.height / 2, out.width / 2, 0, Math.PI * 2);
      ctx.clip();
    }
    ctx.drawImage(photo, src.x, src.y, src.w, src.h, 0, 0, out.width, out.height);
    return out;
  }

  centreSquare(photo) {
    const side = Math.min(photo.width, photo.height);
    return { x: (photo.width - side) / 2, y: (photo.height - side) / 2, w: side, h: side };
  }

  /** The box round everything not fully transparent, and whether any of the photo is see-through at all. */
  opaqueBox(canvas) {
    const { width, height } = canvas;
    const data = canvas.getContext('2d').getImageData(0, 0, width, height).data;
    let [x0, y0, x1, y1] = [width, height, -1, -1];
    let seeThrough = false;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const a = data[(y * width + x) * 4 + 3];
        if (a < 255) seeThrough = true;
        if (a === 0) continue;
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
    }
    if (x1 < 0) throw new Error('The photo is completely transparent.');
    return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, seeThrough };
  }

  /** A white canvas whose opacity is this canvas's. */
  alpha(canvas) {
    return this.mapAlpha(canvas, (a) => a);
  }

  threshold(canvas, level) {
    return this.mapAlpha(canvas, (a) => (a > level ? 255 : 0));
  }

  mapAlpha(canvas, fn) {
    const { width, height } = canvas;
    const out = this.canvas.createCanvas(width, height);
    const src = canvas.getContext('2d').getImageData(0, 0, width, height);
    const ctx = out.getContext('2d');
    const img = ctx.createImageData(width, height);
    for (let i = 0; i < src.data.length; i += 4) {
      img.data[i] = 255;
      img.data[i + 1] = 255;
      img.data[i + 2] = 255;
      img.data[i + 3] = fn(src.data[i + 3]);
    }
    ctx.putImageData(img, 0, 0);
    return out;
  }

  blur(canvas, radius) {
    const out = this.canvas.createCanvas(canvas.width, canvas.height);
    const ctx = out.getContext('2d');
    ctx.filter = `blur(${radius}px)`;
    ctx.drawImage(canvas, 0, 0);
    return out;
  }
}

/** The sticker at the sizes the page uses: its face on the map, the favicon, and the home-screen icon. */
export class Icons {
  constructor(canvas) {
    this.canvas = canvas;
  }

  /** PNGs by file name. A home-screen icon is a filled square, so the sticker sits on the page colour there. */
  make(sticker) {
    return {
      'avatar.png': this.resize(sticker, 256),
      'favicon.png': this.resize(sticker, 64),
      'apple-touch-icon.png': this.resize(sticker, 180, BG),
    };
  }

  resize(image, size, background = null) {
    const out = this.canvas.createCanvas(size, size);
    const ctx = out.getContext('2d');
    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, size, size);
    }
    ctx.drawImage(image, 0, 0, size, size);
    return out.toBuffer('image/png');
  }
}
