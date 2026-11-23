import { clamp } from "@/lib/number";
/** A part of a run: `games` games from game number `firstGame` on. */
export interface Chunk {
  firstGame: number;
  games: number;
}

/**
 * Games in one call of the engine. Small enough that progress moves and a cancel is felt soon, large enough
 * that the cost of a call does not show.
 */
export const CHUNK_GAMES = 20;

/**
 * Games in a chunk of a cell of `games` games on `workers` workers: small enough that every worker gets a part
 * of a short cell. A game is seeded by its number, so the size of the chunks does not change a result.
 */
export const chunkGames = (games: number, workers: number): number =>
  clamp(Math.ceil(games / Math.max(1, workers)), 1, CHUNK_GAMES);

/** Splits `games` games into chunks of at most `size`, in order and without gaps. */
export function planChunks(games: number, size: number = CHUNK_GAMES): Chunk[] {
  const chunks: Chunk[] = [];
  for (let firstGame = 0; firstGame < games; firstGame += size) {
    chunks.push({ firstGame, games: Math.min(size, games - firstGame) });
  }
  return chunks;
}

/** Adds two lists of counts place by place. The longer one sets the length. */
export function addCounts(one: number[], other: number[]): number[] {
  const [long, short] = one.length >= other.length ? [one, other] : [other, one];
  return long.map((count, index) => count + (short[index] ?? 0));
}

/** Adds two tables of counts row by row, as the turns of a shooter's heat map. */
export function addTables(one: number[][], other: number[][]): number[][] {
  const [long, short] = one.length >= other.length ? [one, other] : [other, one];
  return long.map((row, index) => addCounts(row, short[index] ?? []));
}
