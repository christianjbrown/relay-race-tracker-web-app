/**
 * Keeps a canvas the size it is shown at, in device pixels, drawing in CSS
 * pixels, so what is drawn keeps its proportions however the screen is
 * shaped or turned. Resizing clears a canvas and its scale, so it only
 * resizes when the size shown has changed.
 */
export class CanvasFit {
  constructor(canvas, win) {
    this.canvas = canvas;
    this.win = win;
    this.width = null;
    this.height = null;
  }

  /** Fits the canvas; true when that changed its size. */
  fit(ctx) {
    const width = this.canvas.clientWidth || this.win.innerWidth;
    const height = this.canvas.clientHeight || this.win.innerHeight;
    if (width === this.width && height === this.height) return false;
    const ratio = this.win.devicePixelRatio || 1;
    this.width = width;
    this.height = height;
    this.canvas.width = Math.round(width * ratio);
    this.canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return true;
  }
}
