import { has } from './storage';

export interface GameEntry {
  id: string;
  name: string;
  description: string;
  /** Path relative to the site base, with trailing slash. */
  path: string;
  /** Emoji shown on the dashboard tile. */
  icon: string;
  /** Optional: true when the instance has an unfinished session to resume. */
  hasActiveGame?: () => boolean;
}

export const games: GameEntry[] = [
  {
    id: 'flip7',
    name: 'Flip 7',
    description: 'Licznik punktów i historia rozgrywek',
    path: 'flip7/',
    icon: '🃏',
    hasActiveGame: () => has('flip7:current'),
  },
  {
    id: 'picker',
    name: 'Kto zaczyna?',
    description: 'Połóżcie palce, telefon losuje',
    path: 'picker/',
    icon: '👆',
  },
];
