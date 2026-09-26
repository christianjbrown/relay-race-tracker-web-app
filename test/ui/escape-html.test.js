import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../../src/ui/escape-html.js';

describe('escapeHtml', () => {
  it('escapes the characters that matter to HTML', () => {
    expect(escapeHtml('<b>Tom & "Jerry\'s"</b>')).toBe('&#60;b&#62;Tom &#38; &#34;Jerry&#39;s&#34;&#60;/b&#62;');
  });

  it('leaves plain text alone', () => {
    expect(escapeHtml('Leg 1 · Start → Town A')).toBe('Leg 1 · Start → Town A');
  });

  it('stringifies non-string input first', () => {
    expect(escapeHtml(42)).toBe('42');
  });
});
