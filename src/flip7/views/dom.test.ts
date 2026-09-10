import { describe, expect, it } from 'vitest';
import { esc, plural } from './dom';

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

describe('plural', () => {
  const rounds = (n: number) => plural(n, 'runda', 'rundy', 'rund');
  it('handles Polish plural forms', () => {
    expect(rounds(1)).toBe('1 runda');
    expect(rounds(2)).toBe('2 rundy');
    expect(rounds(4)).toBe('4 rundy');
    expect(rounds(5)).toBe('5 rund');
    expect(rounds(11)).toBe('11 rund');
    expect(rounds(12)).toBe('12 rund');
    expect(rounds(14)).toBe('14 rund');
    expect(rounds(22)).toBe('22 rundy');
    expect(rounds(25)).toBe('25 rund');
    expect(rounds(0)).toBe('0 rund');
  });
});
