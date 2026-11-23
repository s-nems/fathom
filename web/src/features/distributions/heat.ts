import { CELL_COUNT } from "@/game/board";

/** Per cell, the games in which one of the first `shots` shots went there. */
export function cumulativeHeat(turns: number[][], shots: number): number[] {
  const sums = new Array<number>(CELL_COUNT).fill(0);
  for (const turn of turns.slice(0, Math.max(0, shots))) {
    turn.forEach((games, cell) => {
      sums[cell] += games;
    });
  }
  return sums;
}

/** The number of shots of the longest game: the last turn in which any game fired, counted from one. */
export const longestGame = (turns: number[][]): number =>
  turns.findLastIndex((turn) => turn.some((games) => games > 0)) + 1;

/** Every value as a share of `whole`, all zero when `whole` is not positive. */
export function shares(values: number[], whole: number): number[] {
  return values.map((value) => (whole > 0 ? value / whole : 0));
}
