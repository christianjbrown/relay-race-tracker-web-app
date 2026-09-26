// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { Elements } from '../../src/ui/dom.js';

describe('Elements', () => {
  it('finds an element by id', () => {
    document.body.innerHTML = '<div id="map"></div>';
    const els = new Elements(document);
    expect(els.get('map')).toBe(document.getElementById('map'));
  });

  it('throws when the id is missing from the page', () => {
    document.body.innerHTML = '';
    const els = new Elements(document);
    expect(() => els.get('nope')).toThrow('The page has no #nope.');
  });

  it('creates a new element of the given tag', () => {
    const els = new Elements(document);
    const li = els.create('li');
    expect(li.tagName).toBe('LI');
  });
});
