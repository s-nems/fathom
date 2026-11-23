import { BOARD_SIZE, cellPoint, type Point } from "@/game/board";

/** What a map of ship placements says in numbers. Every share is of the fleets counted. */
export interface LayoutFacts {
  /** Mean share over the cells on the rim of the board. */
  edge: number;
  /** Mean share over all other cells. */
  inner: number;
  most: { cell: Point; share: number };
  least: { cell: Point; share: number };
}

const LAST = BOARD_SIZE - 1;

const onEdge = ({ x, y }: Point): boolean => x === 0 || y === 0 || x === LAST || y === LAST;

const mean = (values: number[]): number =>
  values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

/** The facts of `shares[cell]`, the share of fleets with a ship on the cell. */
export function layoutFacts(shares: number[]): LayoutFacts {
  const cells = shares.map((share, index) => ({ cell: cellPoint(index), share }));
  const byShare = [...cells].sort((one, other) => one.share - other.share);
  return {
    edge: mean(cells.filter(({ cell }) => onEdge(cell)).map(({ share }) => share)),
    inner: mean(cells.filter(({ cell }) => !onEdge(cell)).map(({ share }) => share)),
    most: byShare[byShare.length - 1],
    least: byShare[0],
  };
}
