import { has } from './storage';

export interface GameEntry {
  id: string;
  name: string;
  description: string;
  /** Path relative to the site base, with trailing slash. */
  path: string;
  /** Accent colour used by the dashboard tile (icon ring, gradient). */
  accent: string;
  /** Optional: true when the instance has an unfinished session to resume. */
  hasActiveGame?: () => boolean;
}

export const games: GameEntry[] = [
  {
    id: 'flip7',
    name: 'Flip 7',
    description: 'Licznik punktów i historia rozgrywek',
    path: 'flip7/',
    accent: '#ff5a5f',
    hasActiveGame: () => has('flip7:current'),
  },
  {
    id: 'picker',
    name: 'Kto zaczyna?',
    description: 'Połóżcie palce, telefon losuje',
    path: 'picker/',
    accent: '#4fc3f7',
  },
];
