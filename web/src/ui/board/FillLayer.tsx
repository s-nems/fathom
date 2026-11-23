import { cellPoint } from "@/game/board";
import { CELL } from "./boardUnits";

/** What a filled cell stands for. */
export type FillTone = "miss" | "hit";

/** The gap around a filled cell, so that the water shows as a grid. */
const GAP = 0.8;
const SIDE = CELL - 2 * GAP;

/** Whole cells in one colour, for a board too small to tell a cross from a circle. */
export function FillLayer({ cells, tone }: { cells: readonly number[]; tone: FillTone }) {
  return (
    <g className={`fill-${tone}`} aria-hidden="true">
      {cells.map((cell) => {
        const { x, y } = cellPoint(cell);
        return <rect key={cell} x={x * CELL + GAP} y={y * CELL + GAP} width={SIDE} height={SIDE} />;
      })}
    </g>
  );
}
