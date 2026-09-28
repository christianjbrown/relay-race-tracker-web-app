/**
 * Runs a fireworks show on a canvas, a frame at a time, from when it is
 * started until it is stopped. It never starts for somebody who has asked
 * for less motion.
 */
export class Fireworks {
  constructor(canvas, win, { show, painter, fit, motion }) {
    this.canvas = canvas;
    this.win = win;
    this.show = show;
    this.painter = painter;
    this.fit = fit;
    this.motion = motion;
    this.running = false;
    this.ctx = null;
  }

  start() {
    if (this.running || this.motion.reduced()) return;
    this.ctx ??= this.canvas.getContext('2d');
    this.show.reset();
    this.running = true;
    this.win.requestAnimationFrame((t) => this.frame(t));
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    this.painter.clear(this.ctx, this.show);
    this.show.reset();
  }

  frame(t) {
    if (!this.running) return;
    if (this.fit.fit(this.ctx)) this.show.resize(this.fit.width, this.fit.height);
    this.show.tick(t);
    this.painter.paint(this.ctx, this.show);
    this.win.requestAnimationFrame((next) => this.frame(next));
  }
}
