import type { Cell, Contestant } from "@/data/api/types";

const TIE_SHARE = 0.5;

/** The pair of cells a win share needs, or the names of the ones the run lacks. */
export type WinShareResult =
  { known: true; share: number; mine: Cell; theirs: Cell } | { known: false; missing: CellKey[] };

export interface CellKey {
  shooter: string;
  layout: string;
}

const total = (histogram: number[]): number => histogram.reduce((sum, count) => sum + count, 0);

/**
 * The chance that a game needing `mine` shots beats an independent game needing `theirs` shots.
 * The lower count wins, equal counts count half.
 */
export function winShare(mine: number[], theirs: number[]): number {
  const pairs = total(mine) * total(theirs);
  if (pairs === 0) return Number.NaN;
  let theirsAbove = total(theirs);
  let wins = 0;
  mine.forEach((count, shots) => {
    const ties = theirs[shots] ?? 0;
    theirsAbove -= ties;
    wins += count * (theirsAbove + TIE_SHARE * ties);
  });
  return wins / pairs;
}

export const sameKey = (a: CellKey, b: CellKey): boolean => a.shooter === b.shooter && a.layout === b.layout;

export function findCell(cells: Cell[], key: CellKey): Cell | undefined {
  return cells.find((cell) => sameKey(cell, key));
}

/** A shoots at the fleets of B and B at the fleets of A. */
export function contestantWinShare(cells: Cell[], a: Contestant, b: Contestant): WinShareResult {
  const mineKey = { shooter: a.shooter, layout: b.layout };
  const theirsKey = { shooter: b.shooter, layout: a.layout };
  const mine = findCell(cells, mineKey);
  const theirs = findCell(cells, theirsKey);
  if (mine === undefined || theirs === undefined) {
    const missing = [
      ...(mine === undefined ? [mineKey] : []),
      ...(theirs === undefined && !sameKey(mineKey, theirsKey) ? [theirsKey] : []),
    ];
    return { known: false, missing };
  }
  return { known: true, share: winShare(mine.histogram, theirs.histogram), mine, theirs };
}
