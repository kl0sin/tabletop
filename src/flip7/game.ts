export interface Player {
  id: string;
  name: string;
}

export interface Round {
  scores: Record<string, number>;
}

export interface Game {
  version: 1;
  id: string;
  createdAt: string;
  finishedAt?: string;
  players: Player[];
  target: number;
  dealerIndex: number;
  rounds: Round[];
  winnerId?: string;
}

export function createGame(names: string[], target: number): Game {
  const cleaned = names.map((n) => n.trim()).filter(Boolean);
  if (cleaned.length < 2) throw new Error('Potrzeba co najmniej 2 graczy');
  return {
    version: 1,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    players: cleaned.map((name, i) => ({ id: `p${i + 1}`, name })),
    target,
    dealerIndex: 0,
    rounds: [],
  };
}

export function totals(game: Game): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of game.players) out[p.id] = 0;
  for (const round of game.rounds) {
    for (const p of game.players) out[p.id] = (out[p.id] ?? 0) + (round.scores[p.id] ?? 0);
  }
  return out;
}

function findWinner(game: Game, sums: Record<string, number>): string | undefined {
  const reached = game.players.some((p) => (sums[p.id] ?? 0) >= game.target);
  if (!reached) return undefined;
  const max = Math.max(...game.players.map((p) => sums[p.id] ?? 0));
  const leaders = game.players.filter((p) => sums[p.id] === max);
  return leaders.length === 1 ? leaders[0]!.id : undefined;
}

export function addRound(game: Game, scores: Record<string, number>): Game {
  for (const p of game.players) {
    if (typeof scores[p.id] !== 'number') throw new Error(`Brak wyniku dla gracza ${p.name}`);
  }
  const next: Game = {
    ...game,
    rounds: [...game.rounds, { scores: { ...scores } }],
    dealerIndex: (game.dealerIndex + 1) % game.players.length,
  };
  delete next.winnerId;
  delete next.finishedAt;
  const winnerId = findWinner(next, totals(next));
  if (winnerId) {
    next.winnerId = winnerId;
    next.finishedAt = new Date().toISOString();
  }
  return next;
}

export function undoLastRound(game: Game): Game {
  if (game.rounds.length === 0) return game;
  const n = game.players.length;
  const next: Game = {
    ...game,
    rounds: game.rounds.slice(0, -1),
    dealerIndex: (game.dealerIndex - 1 + n) % n,
  };
  delete next.winnerId;
  delete next.finishedAt;
  return next;
}

export function isFinished(game: Game): boolean {
  return game.winnerId !== undefined;
}

export function currentDealer(game: Game): Player {
  return game.players[game.dealerIndex] ?? game.players[0]!;
}

export function standings(game: Game): { player: Player; total: number }[] {
  const sums = totals(game);
  return game.players
    .map((player) => ({ player, total: sums[player.id] ?? 0 }))
    .sort((a, b) => b.total - a.total);
}
