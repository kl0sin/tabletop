import { describe, expect, it } from 'vitest';
import { esc } from './dom';

describe('esc', () => {
  it('escapes HTML special characters', () => {
    expect(esc(`<b>"Ala" & 'Ola'</b>`)).toBe(
      '&lt;b&gt;&quot;Ala&quot; &amp; &#39;Ola&#39;&lt;/b&gt;',
    );
  });
  it('leaves plain text alone', () => {
    expect(esc('Żółć 7')).toBe('Żółć 7');
  });
});
