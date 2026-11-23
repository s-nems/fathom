import { useContext } from "react";
import type { Ship } from "@/data/api/types";
import ship2 from "@/assets/art/ship2.webp";
import ship3 from "@/assets/art/ship3.webp";
import ship4 from "@/assets/art/ship4.webp";
import ship5 from "@/assets/art/ship5.webp";
import { BoardDetailContext } from "./Board";
import { CELL, HALF_CELL } from "./boardUnits";

/** How a ship is drawn: afloat, lost, about to be placed, or not allowed where it is. */
export type ShipTone = "afloat" | "sunk" | "ghost" | "illegal";

/** The deck plan engraved for each ship size. A size without one is drawn as a plain hull. */
export const SHIP_ART: Readonly<Record<number, string>> = { 2: ship2, 3: ship3, 4: ship4, 5: ship5 };

const PLATE_INSET = 1.1;
const PLATE_RADIUS = 2.4;
const ART_INSET = PLATE_INSET + 0.5;
/** Height of a deck plan in a cell. The patrol boat is drawn a little lower than the others. */
const ART_HEIGHT = 7.6;
const SMALL_ART_HEIGHT = 7.2;
const SMALL_SHIP = 2;
const QUARTER_TURN = 90;

/** A hull of `length` units lying along x in one row of cells, with its bow to the right. */
export function hullPath(length: number): string {
  return `M3.4 1.7H${length - 5}Q${length - 2} 2 ${length - 1.2} 5Q${length - 2} 8 ${length - 5} 8.3H3.4Q1.2 8.3 1.2 6.3V3.7Q1.2 1.7 3.4 1.7Z`;
}

/** Puts a ship drawn along x where it lies: turned down for a vertical one. */
function placed(ship: Ship): string {
  const x = ship.x * CELL;
  const y = ship.y * CELL;
  return ship.direction === "HORIZONTAL"
    ? `translate(${x} ${y})`
    : `translate(${x + CELL} ${y}) rotate(${QUARTER_TURN})`;
}

function Vessel({ ship, art }: { ship: Ship; art: string }) {
  const length = ship.size * CELL;
  const height = ship.size === SMALL_SHIP ? SMALL_ART_HEIGHT : ART_HEIGHT;
  return (
    <g className="vessel">
      <rect
        className="plate"
        x={PLATE_INSET}
        y={PLATE_INSET}
        width={length - 2 * PLATE_INSET}
        height={CELL - 2 * PLATE_INSET}
        rx={PLATE_RADIUS}
      />
      <image
        href={art}
        x={ART_INSET}
        y={HALF_CELL - height / 2}
        width={length - 2 * ART_INSET}
        height={height}
        preserveAspectRatio="none"
      />
    </g>
  );
}

/** Ships of one tone. A full board shows engraved deck plans, a small one plain hulls. */
export function ShipsLayer({ ships, tone = "afloat" }: { ships: Ship[]; tone?: ShipTone }) {
  const full = useContext(BoardDetailContext) === "full";
  return (
    <g className={`ship-${tone}`} aria-hidden="true">
      {ships.map((ship) => {
        const art = full ? SHIP_ART[ship.size] : undefined;
        return (
          <g key={`${ship.x}-${ship.y}-${ship.direction}`} transform={placed(ship)}>
            {art === undefined ? (
              <path className="hull" d={hullPath(ship.size * CELL)} />
            ) : (
              <Vessel ship={ship} art={art} />
            )}
          </g>
        );
      })}
    </g>
  );
}
