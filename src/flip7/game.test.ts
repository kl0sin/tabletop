import { describe, expect, it } from 'vitest';
import {
  addRound,
  createGame,
  currentDealer,
  isFinished,
  standings,
  totals,
  undoLastRound,
} from './game';

const game = () => createGame(['Ala', 'Bartek', 'Celina'], 200);

describe('createGame', () => {
  it('creates players with stable ids and dealer 0', () => {
    const g = game();
    expect(g.version).toBe(1);
    expect(g.players.map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
    expect(g.players.map((p) => p.name)).toEqual(['Ala', 'Bartek', 'Celina']);
    expect(g.dealerIndex).toBe(0);
    expect(g.rounds).toEqual([]);
    expect(g.target).toBe(200);
    expect(typeof g.id).toBe('string');
    expect(Number.isNaN(Date.parse(g.createdAt))).toBe(false);
  });

  it('throws for fewer than 2 players', () => {
    expect(() => createGame(['Solo'], 200)).toThrow();
  });
});

describe('addRound', () => {
  it('appends the round, sums totals and rotates the dealer', () => {
    const g1 = addRound(game(), { p1: 10, p2: 0, p3: 25 });
    expect(g1.rounds).toHaveLength(1);
    expect(totals(g1)).toEqual({ p1: 10, p2: 0, p3: 25 });
    expect(g1.dealerIndex).toBe(1);
    expect(currentDealer(g1).name).toBe('Bartek');
    const g2 = addRound(addRound(g1, { p1: 1, p2: 1, p3: 1 }), { p1: 1, p2: 1, p3: 1 });
    expect(g2.dealerIndex).toBe(0);
  });

  it('does not mutate the input game', () => {
    const g = game();
    addRound(g, { p1: 1, p2: 2, p3: 3 });
    expect(g.rounds).toEqual([]);
    expect(g.dealerIndex).toBe(0);
  });

  it('throws when a player score is missing', () => {
    expect(() => addRound(game(), { p1: 1, p2: 2 })).toThrow();
  });

  it('finishes the game when someone reaches the target', () => {
    const g = addRound(game(), { p1: 200, p2: 50, p3: 0 });
    expect(isFinished(g)).toBe(true);
    expect(g.winnerId).toBe('p1');
    expect(typeof g.finishedAt).toBe('string');
  });

  it('keeps playing on a tie at the top', () => {
    const g = addRound(game(), { p1: 200, p2: 200, p3: 0 });
    expect(isFinished(g)).toBe(false);
    expect(g.winnerId).toBeUndefined();
  });

  it('picks the highest total, not the first to cross', () => {
    const g = addRound(game(), { p1: 201, p2: 230, p3: 0 });
    expect(g.winnerId).toBe('p2');
  });
});

describe('undoLastRound', () => {
  it('removes the last round, restores dealer and clears the winner', () => {
    const g = addRound(addRound(game(), { p1: 1, p2: 1, p3: 1 }), { p1: 250, p2: 0, p3: 0 });
    expect(isFinished(g)).toBe(true);
    const u = undoLastRound(g);
    expect(u.rounds).toHaveLength(1);
    expect(u.dealerIndex).toBe(1);
    expect(u.winnerId).toBeUndefined();
    expect(u.finishedAt).toBeUndefined();
  });

  it('is a no-op with no rounds', () => {
    const g = game();
    expect(undoLastRound(g)).toEqual(g);
  });
});

describe('standings', () => {
  it('sorts by total descending', () => {
    const g = addRound(game(), { p1: 5, p2: 20, p3: 10 });
    expect(standings(g).map((s) => s.player.id)).toEqual(['p2', 'p3', 'p1']);
    expect(standings(g)[0]!.total).toBe(20);
  });
});
