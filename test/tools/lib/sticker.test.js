import { describe, expect, it } from 'vitest';
import { nodeCanvas } from '../../../tools/lib/canvas.js';
import { Icons, Sticker } from '../../../tools/lib/sticker.js';

const canvas = nodeCanvas();
const SIZE = 60;

async function pngOf(draw) {
  const c = canvas.createCanvas(SIZE, SIZE);
  draw(c.getContext('2d'));
  return canvas.loadImage(c.toBuffer('image/png'));
}

/** A cut-out: an opaque circle in the middle, transparent margin around it. */
function cutout() {
  return pngOf((ctx) => {
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ff0000';
    ctx.fill();
  });
}

/** A fully opaque photo, edge to edge. */
function opaquePhoto() {
  return pngOf((ctx) => {
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(0, 0, SIZE, SIZE);
  });
}

/** A fully transparent image. */
function blank() {
  return pngOf(() => {});
}

describe('Sticker', () => {
  it('makes a sticker from a transparent cut-out, keeping its outline', async () => {
    const sticker = new Sticker(canvas).make(await cutout());
    expect(sticker.width).toBe(sticker.height);
    expect(sticker.width).toBeGreaterThan(0);
  });

  it('makes a sticker from an opaque photo, cropping it to a circle', async () => {
    const sticker = new Sticker(canvas).make(await opaquePhoto());
    expect(sticker.width).toBe(sticker.height);
  });

  it('throws when the photo is completely transparent', async () => {
    const photo = await blank();
    expect(() => new Sticker(canvas).make(photo)).toThrow('completely transparent');
  });
});

describe('Icons', () => {
  it('makes the avatar, favicon and apple-touch-icon at their sizes', async () => {
    const sticker = new Sticker(canvas).make(await opaquePhoto());
    const icons = new Icons(canvas).make(sticker);
    expect(Object.keys(icons)).toEqual(['avatar.png', 'favicon.png', 'apple-touch-icon.png']);
    const sized = async (buf) => canvas.loadImage(buf);
    expect((await sized(icons['avatar.png'])).width).toBe(256);
    expect((await sized(icons['favicon.png'])).width).toBe(64);
    expect((await sized(icons['apple-touch-icon.png'])).width).toBe(180);
  });
});
