// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { buildDrawing } from '../../src/boot/drawing.js';
import { BODY, assemble } from '../fakes/page.js';

beforeEach(() => {
  document.documentElement.removeAttribute('data-theme');
  document.body.innerHTML = BODY;
});

describe('buildDrawing', () => {
  it('builds the estimator, journey, painter and relay ending the live page and the rewind share', async () => {
    const p = await assemble();
    const drawing = buildDrawing({ ...p, describer: p.ui.describer });
    expect(Object.keys(drawing).sort()).toEqual(['ending', 'estimator', 'journey', 'painter']);
    for (const part of Object.values(drawing)) expect(part).toBeTruthy();
  });
});
