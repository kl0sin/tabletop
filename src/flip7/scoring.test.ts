import { describe, expect, it } from 'vitest';
import { MODIFIERS, NUMBER_CARDS, scoreRound } from './scoring';

describe('scoreRound', () => {
  it('scores zero for no cards', () => {
    expect(scoreRound([], [])).toEqual({ score: 0, busted: false, flip7Bonus: false });
  });

  it('sums number cards', () => {
    expect(scoreRound([3, 5, 12], [])).toEqual({ score: 20, busted: false, flip7Bonus: false });
  });

  it('busts on a duplicate number and scores zero even with modifiers', () => {
    expect(scoreRound([3, 3, 7], ['+10', 'x2'])).toEqual({
      score: 0,
      busted: true,
      flip7Bonus: false,
    });
  });

  it('doubles only the number sum with x2', () => {
    expect(scoreRound([5, 6], ['x2']).score).toBe(22);
  });

  it('adds bonus modifiers after doubling', () => {
    expect(scoreRound([5], ['x2', '+4']).score).toBe(14);
    expect(scoreRound([5], ['+4', '+2']).score).toBe(11);
  });

  it('adds 15 for seven unique number cards', () => {
    const r = scoreRound([0, 1, 2, 3, 4, 5, 6], []);
    expect(r).toEqual({ score: 21 + 15, busted: false, flip7Bonus: true });
  });

  it('applies x2 before the flip 7 bonus', () => {
    expect(scoreRound([0, 1, 2, 3, 4, 5, 6], ['x2']).score).toBe(42 + 15);
  });

  it('does not award the bonus for seven cards containing a duplicate', () => {
    expect(scoreRound([1, 1, 2, 3, 4, 5, 6], []).busted).toBe(true);
  });

  it('exposes the card sets', () => {
    expect(NUMBER_CARDS).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(MODIFIERS).toEqual(['+2', '+4', '+6', '+8', '+10', 'x2']);
  });
});
