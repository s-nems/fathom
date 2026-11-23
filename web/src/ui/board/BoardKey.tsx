import type { ReactNode } from "react";
import { HEAT_GRADIENT } from "./heatColour";
import { CELL } from "./boardUnits";
import { ShotMark } from "./MarksLayer";
import { hullPath, type ShipTone } from "./ShipsLayer";

const KEY_SHIP_CELLS = 3;
const SHIP_PX = { width: 33, height: 11 };
const MARK_PX = 12;
const HALF = CELL / 2;

/** A small sample of how a ship of that tone is drawn. */
export function KeyShip({ tone }: { tone: ShipTone }) {
  const length = KEY_SHIP_CELLS * CELL;
  return (
    <svg className="bd" {...SHIP_PX} viewBox={`0 0 ${length} ${CELL}`} aria-hidden="true">
      <g className={`ship-${tone}`}>
        <path className="hull" d={hullPath(length)} />
      </g>
    </svg>
  );
}

export function KeyMark({ hit }: { hit: boolean }) {
  return (
    <svg className="bd" width={MARK_PX} height={MARK_PX} viewBox={`0 0 ${CELL} ${CELL}`} aria-hidden="true">
      <ShotMark hit={hit} cx={HALF} cy={HALF} />
    </svg>
  );
}

export function KeyRing({ kind }: { kind: "latest" | "chosen" }) {
  return (
    <svg className="bd" width={MARK_PX} height={MARK_PX} viewBox={`0 0 ${CELL} ${CELL}`} aria-hidden="true">
      <rect className={`ring-${kind}`} x={1} y={1} width={CELL - 2} height={CELL - 2} rx={1.2} />
    </svg>
  );
}

/** The heat ramp between the words for its two ends. */
export function HeatRamp({ low, high }: { low: ReactNode; high: ReactNode }) {
  return (
    <>
      <span>{low}</span>
      <span className="ramp" style={{ background: HEAT_GRADIENT }} aria-hidden="true" />
      <span>{high}</span>
    </>
  );
}
