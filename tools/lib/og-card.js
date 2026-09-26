export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

const W = CARD_WIDTH;
const H = CARD_HEIGHT;
const SCALE = 2; // drawn at twice the size and scaled down, for smooth lines
const SQUARE = [(W - H) / 2, (W + H) / 2]; // the middle square, x from and to
const BG = '#f4f1ec';
const INK = '#221f1c';
const SOFT = '#6b665f';
const COURSE = '#cecac3';
const RUN = '#eb6834';
const SLEEP = '#5f4d8c';

/**
 * The 1200x630 picture a shared link shows, drawn from the same data the
 * page uses, so it is the actual route rather than an illustration of one.
 *
 * Everything that matters sits in the middle 630x630, because that is all
 * some places show: Slack's compact layout, and anything else that wants a
 * square, crops the same image from its centre. The wide card's outer
 * thirds carry the numbers, which a square crop can lose.
 */
export class OgCard {
  constructor(canvas) {
    this.canvas = canvas;
  }

  /** `facts` from cardFacts; `course` a Course; `schedule` with its legs placed; `avatar` an image. Returns a PNG. */
  draw({ facts, course, schedule, avatar }) {
    const out = this.canvas.createCanvas(W * SCALE, H * SCALE);
    const ctx = out.getContext('2d');
    ctx.scale(SCALE, SCALE);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    // Faded, so it reads as the setting and the words in front of it lead.
    ctx.globalAlpha = 0.5;
    ctx.drawImage(this.route(course, schedule), 0, 0, W, H);
    ctx.globalAlpha = 1;

    ctx.drawImage(avatar, W / 2 - 100, 72, 200, 200);
    const { regular, bold } = this.canvas.fonts;
    this.centred(ctx, 284, facts.title, bold, 56, INK);
    if (facts.subtitle) this.centred(ctx, 352, facts.subtitle, bold, 36, SOFT);
    this.centred(ctx, 412, facts.event, bold, 28, RUN);
    this.centred(ctx, 456, facts.route, regular, 22, SOFT);

    const left = SQUARE[0] / 2;
    const right = (SQUARE[1] + W) / 2;
    const at = [[left, 170], [left, 350], [right, 170], [right, 350]];
    facts.stats.forEach(([big, small], i) => this.stat(ctx, ...at[i], big, small));

    const final = this.canvas.createCanvas(W, H);
    final.getContext('2d').drawImage(out, 0, 0, W, H);
    return final.toBuffer('image/png');
  }

  /** The course, the runner's legs on it, the rest stops, and the two ends, filling the card's height. */
  route(course, schedule) {
    const layer = this.canvas.createCanvas(W * SCALE, H * SCALE);
    const ctx = layer.getContext('2d');
    ctx.scale(SCALE, SCALE);
    const xy = this.projection(course.points);
    const line = (points, colour, width) => {
      ctx.strokeStyle = colour;
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      points.forEach((p, i) => (i ? ctx.lineTo(...xy(p)) : ctx.moveTo(...xy(p))));
      ctx.stroke();
    };
    const dot = (p, r, fill, stroke) => {
      ctx.beginPath();
      ctx.arc(...xy(p), r, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    };
    line(course.points, COURSE, 8);
    for (const seg of schedule.segments) {
      if (seg.kind === 'run' && !seg.finish) line(course.slice(...seg.span), RUN, 12);
    }
    for (const seg of schedule.segments) if (seg.kind === 'sleep') dot(seg.at, 9, SLEEP);
    dot(course.points[0], 11, BG, INK);
    dot(course.points[course.points.length - 1], 11, BG, INK);
    return layer;
  }

  /** From positions to the card, north up, scaled to fill the height and centred. */
  projection(points) {
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const k = Math.cos(((lats.reduce((a, b) => a + b, 0) / lats.length) * Math.PI) / 180);
    const top = 28;
    const spanX = (Math.max(...lngs) - Math.min(...lngs)) * k || 1e-9;
    const spanY = Math.max(...lats) - Math.min(...lats) || 1e-9;
    const s = Math.min(W / spanX, (H - 2 * top) / spanY);
    const ox = (W - spanX * s) / 2;
    const oy = top + (H - 2 * top - spanY * s) / 2;
    const minLng = Math.min(...lngs);
    const maxLat = Math.max(...lats);
    return (p) => [ox + (p.lng - minLng) * k * s, oy + (maxLat - p.lat) * s];
  }

  /** A line of words across the middle, shrunk to fit the square, with a halo to lift it off the route. */
  centred(ctx, y, text, family, size, colour) {
    ctx.font = this.fit(ctx, text, family, size, SQUARE[1] - SQUARE[0] - 40);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 10;
    ctx.strokeStyle = BG;
    ctx.strokeText(text, W / 2, y);
    ctx.fillStyle = colour;
    ctx.fillText(text, W / 2, y);
  }

  stat(ctx, cx, y, big, small) {
    const width = SQUARE[0] - 30;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = INK;
    ctx.font = this.fit(ctx, big, this.canvas.fonts.bold, 64, width);
    ctx.fillText(big, cx, y);
    ctx.fillStyle = SOFT;
    ctx.font = this.fit(ctx, small, this.canvas.fonts.regular, 22, width);
    ctx.fillText(small, cx, y + 76);
  }

  /** The largest size up to `size` at which the text fits the width. */
  fit(ctx, text, family, size, width) {
    let px = size;
    ctx.font = `${px}px ${family}`;
    while (px > 10 && ctx.measureText(text).width > width) {
      px -= 2;
      ctx.font = `${px}px ${family}`;
    }
    return ctx.font;
  }
}
