// In CSS pixels and milliseconds. A rocket climbs for about a second;
// sparks fall more gently, and fly out further on a bigger screen.
const CLIMB_MS = 1100;
const SPARK_GRAVITY = 0.00008;
const SPARKS = 70;
const LAUNCH_EVERY_MS = 450;
const LONGEST_STEP_MS = 50;

/**
 * The fireworks themselves, without drawing them: rockets launched from
 * the bottom at a steady beat, each climbing to somewhere in the top half
 * and bursting into a ring of sparks in one of the given colours.
 */
export class FireworksShow {
  constructor(colours, random = Math.random) {
    this.colours = colours;
    this.random = random;
    this.reset();
  }

  reset() {
    this.rockets = [];
    this.sparks = [];
    this.started = null;
    this.last = null;
    this.launched = 0;
  }

  /** The area the show fills. */
  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  /** Moves everything on to time `t`, launching a rocket whenever one is due. */
  tick(t) {
    this.started ??= t;
    // A tab left in the background comes back to one long step; take it as a short one.
    const dt = Math.min(LONGEST_STEP_MS, t - (this.last ?? t));
    this.last = t;
    if (t - this.started >= this.launched * LAUNCH_EVERY_MS) this.launch();
    this.move(dt);
  }

  launch() {
    this.launched += 1;
    const x = this.width * (0.15 + this.random() * 0.7);
    const rise = this.height - this.height * (0.1 + this.random() * 0.35);
    const gravity = (2 * rise) / (CLIMB_MS * CLIMB_MS);
    this.rockets.push({ x, y: this.height, vx: (this.random() - 0.5) * 0.05, vy: -gravity * CLIMB_MS, gravity, colour: this.pick() });
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

  pick() {
    return this.colours[Math.floor(this.random() * this.colours.length)];
  }
}
