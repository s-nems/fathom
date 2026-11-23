import { onScale, robustScale } from "@/lib/scale";
import { cumulativeHeat, shares } from "./heat";
import { clamp, PERCENT } from "@/lib/number";

/** A heat map ready to draw: where each cell sits on the ramp, what is printed in it, and the shares at the ends. */
export interface HeatMap {
  /** The share behind every cell, 0..1. */
  shares: number[];
  /** Where every cell sits on the colour ramp, 0..1. */
  values: number[];
  /** The share of every cell as a whole percentage. */
  printed: string[];
  /** The shares the two ends of the ramp stand for. */
  low: number;
  high: number;
}

const wholePercent = (share: number): string => String(Math.round(share * PERCENT));

/**
 * The map of `counts[cell]` fleets out of `fleets` with a ship on the cell. The ramp spans the shares that
 * occur, without outliers, because the differences between cells are small next to the shares themselves.
 */
export function layoutMap(counts: number[], fleets: number): HeatMap {
  const cells = shares(counts, fleets);
  const scale = robustScale(cells);
  return {
    shares: cells,
    values: cells.map((share) => onScale(share, scale)),
    printed: cells.map(wholePercent),
    low: scale.low,
    high: scale.high,
  };
}

/** One map per ship size of a layout answer, the longest ship first. */
export function sizeMaps(bySize: Record<string, number[]>, fleets: number): { size: number; map: HeatMap }[] {
  return Object.entries(bySize)
    .map(([size, counts]) => ({ size: Number(size), map: layoutMap(counts, fleets) }))
    .sort((one, other) => other.size - one.size);
}

/** The map of the games that fired at each cell within their first `shots` shots. The ramp runs from none to all. */
export function shooterMap(turns: number[][], shots: number, games: number): HeatMap {
  const cells = shares(cumulativeHeat(turns, shots), games);
  return { shares: cells, values: cells, printed: cells.map(wholePercent), low: 0, high: 1 };
}

/** The milestones a game of that many shots reaches. */
export const reached = (milestones: readonly number[], shots: number): number[] =>
  milestones.filter((milestone) => milestone <= shots);

/** A number of shots kept between one and the longest game. */
export const withinGame = (shots: number, longest: number): number => clamp(shots, 1, longest);
