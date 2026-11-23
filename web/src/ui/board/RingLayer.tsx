import { CELL } from "./boardUnits";

const INSET = 0.9;
const RADIUS = 1.2;

/** A ring around one cell: solid for the latest shot, dashed for the cell about to be chosen. */
export function RingLayer({ x, y, kind }: { x: number; y: number; kind: "latest" | "chosen" }) {
  const box = {
    x: x * CELL + INSET,
    y: y * CELL + INSET,
    width: CELL - 2 * INSET,
    height: CELL - 2 * INSET,
    rx: RADIUS,
  };
  return (
    <g aria-hidden="true">
      <rect className="ring-halo" {...box} />
      <rect className={`ring-${kind}`} {...box} />
    </g>
  );
}
