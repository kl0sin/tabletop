import { describe, expect, it } from 'vitest';
import { randomIndex, shuffle } from './random';

describe('randomIndex', () => {
  it('always returns an integer in [0, n)', () => {
    for (let i = 0; i < 1000; i++) {
      const r = randomIndex(7);
      expect(Number.isInteger(r)).toBe(true);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(7);
    }
  });

  it('returns 0 for n = 1', () => {
    expect(randomIndex(1)).toBe(0);
  });

  it('throws for n < 1', () => {
    expect(() => randomIndex(0)).toThrow();
  });
});

describe('shuffle', () => {
  it('returns a permutation without mutating the input', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('eventually produces a different order', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const changed = Array.from({ length: 50 }, () => shuffle(input)).some(
      (o) => o.join() !== input.join(),
    );
    expect(changed).toBe(true);
  });
});
