export type Modifier = '+2' | '+4' | '+6' | '+8' | '+10' | 'x2';

export const NUMBER_CARDS: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const MODIFIERS: readonly Modifier[] = ['+2', '+4', '+6', '+8', '+10', 'x2'];

export interface RoundResult {
  score: number;
  busted: boolean;
  flip7Bonus: boolean;
}

const FLIP7_BONUS = 15;
const FLIP7_COUNT = 7;

/**
 * Flip 7 round score:
 * - duplicate number card → bust, 0 points
 * - sum of number cards, doubled by x2, plus bonus modifiers
 * - seven unique number cards → +15
 */
export function scoreRound(numbers: number[], modifiers: Modifier[]): RoundResult {
  const busted = new Set(numbers).size !== numbers.length;
  if (busted) return { score: 0, busted: true, flip7Bonus: false };

  let score = numbers.reduce((sum, n) => sum + n, 0);
  if (modifiers.includes('x2')) score *= 2;
  for (const m of modifiers) {
    if (m !== 'x2') score += Number(m.slice(1));
  }
  const flip7Bonus = numbers.length === FLIP7_COUNT;
  if (flip7Bonus) score += FLIP7_BONUS;
  return { score, busted: false, flip7Bonus };
}
