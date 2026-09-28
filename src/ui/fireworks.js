// In CSS pixels and milliseconds. A rocket climbs for about a second;
// sparks fall more gently, and fly out further on a bigger screen.
const CLIMB_MS = 1100;
const SPARK_GRAVITY = 0.00008;
const SPARKS = 70;
const LAUNCH_EVERY_MS = 450;

/**
 * Fireworks over the whole page: rockets rise from the bottom and burst
 * into sparks in the site's own colours. They keep going until they are
 * stopped, and never start for somebody who has asked for less motion.
 */
export class Fireworks {
  constructor(canvas, win, colours, random = Math.random) {
    this.canvas = canvas;
    this.win = win;
    this.colours = colours;
    this.random = random;
    this.running = false;
    this.rockets = [];
    this.sparks = [];
  }

  start() {
    if (this.running || this.win.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.ctx = this.canvas.getContext('2d');
    this.width = null;
    this.running = true;
    this.started = null;
    this.last = null;
    this.launched = 0;
    this.win.requestAnimationFrame((t) => this.frame(t));
  }

  stop() {
    this.running = false;
    this.rockets = [];
    this.sparks = [];
    if (this.width) this.ctx.clearRect(0, 0, this.width, this.height);
  }

  /**
   * Matches the canvas to the size it is shown at, in device pixels, so a
   * burst stays round however the screen is shaped or turned. Changing the
   * size clears the canvas and its scale, so only when the size changes.
   */
  fit() {
    const width = this.canvas.clientWidth || this.win.innerWidth;
    const height = this.canvas.clientHeight || this.win.innerHeight;
    if (width === this.width && height === this.height) return;
    const ratio = this.win.devicePixelRatio || 1;
    this.width = width;
    this.height = height;
    this.canvas.width = Math.round(width * ratio);
    this.canvas.height = Math.round(height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  frame(t) {
    if (!this.running) return;
    this.fit();
    this.started ??= t;
    const dt = Math.min(50, t - (this.last ?? t));
    this.last = t;
    if (t - this.started >= this.launched * LAUNCH_EVERY_MS) this.launch();
    this.move(dt);
    this.draw();
    this.win.requestAnimationFrame((next) => this.frame(next));
  }

  launch() {
    this.launched += 1;
    const x = this.width * (0.15 + this.random() * 0.7);
    // Rise to somewhere in the top half, then burst.
    const rise = this.height - this.height * (0.1 + this.random() * 0.35);
    const gravity = (2 * rise) / (CLIMB_MS * CLIMB_MS);
    const vy = -gravity * CLIMB_MS;
    this.rockets.push({ x, y: this.height, vx: (this.random() - 0.5) * 0.05, vy, gravity, colour: this.pick() });
  }

  move(dt) {
    for (const r of this.rockets) {
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      r.vy += r.gravity * dt;
    }
    for (const r of this.rockets.filter((rocket) => rocket.vy >= 0)) this.burst(r);
    this.rockets = this.rockets.filter((r) => r.vy < 0);
    for (const s of this.sparks) {
      s.px = s.x;
      s.py = s.y;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += SPARK_GRAVITY * dt;
      s.life -= dt;
    }
    this.sparks = this.sparks.filter((s) => s.life > 0);
  }

  burst(rocket) {
    for (let i = 0; i < SPARKS; i++) {
      const angle = (i / SPARKS) * Math.PI * 2;
      const speed = Math.min(this.width, this.height) * (0.00025 + this.random() * 0.00035);
      const life = 900 + this.random() * 700;
      this.sparks.push({ x: rocket.x, y: rocket.y, px: rocket.x, py: rocket.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, full: life, colour: rocket.colour });
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (const r of this.rockets) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = r.colour;
      ctx.fillRect(r.x - 1.5, r.y - 1.5, 3, 3);
    }
    for (const s of this.sparks) {
      ctx.globalAlpha = s.life / s.full;
      ctx.strokeStyle = s.colour;
      ctx.beginPath();
      ctx.moveTo(s.px, s.py);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  pick() {
    return this.colours[Math.floor(this.random() * this.colours.length)];
  }
}
