import type { ShotResult } from "@/data/api/types";
import { cellPoint } from "@/game/board";
import { CELL, HALF_CELL } from "./boardUnits";

const CROSS_ARM = 2.2;
const MISS_RADIUS = 1.4;

/** A miss is an open circle and a hit a cross with a halo, told apart by shape as well as colour. */
export function ShotMark({ hit, cx, cy }: { hit: boolean; cx: number; cy: number }) {
  if (!hit) return <circle className="miss" cx={cx} cy={cy} r={MISS_RADIUS} />;
  const reach = 2 * CROSS_ARM;
  const cross = `M${cx - CROSS_ARM} ${cy - CROSS_ARM}l${reach} ${reach}M${cx + CROSS_ARM} ${cy - CROSS_ARM}l${-reach} ${reach}`;
  return (
    <>
      <path className="hit-halo" d={cross} />
      <path className="hit" d={cross} />
    </>
  );
}

/** The mark of every shot a board has taken. */
export function MarksLayer({ marks }: { marks: Map<number, ShotResult> }) {
  return (
    <g aria-hidden="true">
      {[...marks].map(([index, result]) => {
        const { x, y } = cellPoint(index);
        return <ShotMark key={index} hit={result !== "MISS"} cx={x * CELL + HALF_CELL} cy={y * CELL + HALF_CELL} />;
      })}
    </g>
  );
}
