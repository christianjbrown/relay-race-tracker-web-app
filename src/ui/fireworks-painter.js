/** Draws a fireworks show: each rocket as a dot, each spark as a streak that fades as it burns out. */
export class FireworksPainter {
  paint(ctx, show) {
    this.clear(ctx, show);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 1;
    for (const r of show.rockets) {
      ctx.fillStyle = r.colour;
      ctx.fillRect(r.x - 1.5, r.y - 1.5, 3, 3);
    }
    for (const s of show.sparks) {
      ctx.globalAlpha = s.life / s.full;
      ctx.strokeStyle = s.colour;
      ctx.beginPath();
      ctx.moveTo(s.px, s.py);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  clear(ctx, show) {
    ctx.clearRect(0, 0, show.width, show.height);
  }
}
