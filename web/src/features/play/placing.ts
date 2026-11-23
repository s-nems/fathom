import type { Direction, Ship } from "@/data/api/types";
import { BOARD_SIZE, type Point } from "@/game/board";
import { placementProblem, remainingSizes, shipAt, type PlacementProblem } from "@/game/fleet";

/** One row of the fleet tray: the ships of one size and how many of them are on the board. */
export interface TrayRow {
  size: number;
  total: number;
  placed: number;
}

/** The fleet by size, largest first, with the count of ships placed of each. */
export function fleetTray(fleetSizes: number[], placed: Ship[]): TrayRow[] {
  const sizes = [...new Set(fleetSizes)].sort((a, b) => b - a);
  return sizes.map((size) => ({
    size,
    total: fleetSizes.filter((other) => other === size).length,
    placed: placed.filter((ship) => ship.size === size).length,
  }));
}

/** The size placed next: the wanted one while a ship of it is left, else the largest left, null when none is. */
export function sizeToPlace(fleetSizes: number[], placed: Ship[], wanted: number | null): number | null {
  const remaining = remainingSizes(fleetSizes, placed);
  if (wanted !== null && remaining.includes(wanted)) return wanted;
  return remaining[0] ?? null;
}

/** A ship of the size starting at the cell, moved back along its direction until it ends on the board. */
export function shipWithin(size: number, direction: Direction, cell: Point): Ship {
  const lastStart = Math.max(0, BOARD_SIZE - size);
  return direction === "HORIZONTAL"
    ? { size, direction, x: Math.min(cell.x, lastStart), y: cell.y }
    : { size, direction, x: cell.x, y: Math.min(cell.y, lastStart) };
}

/** What a tap on a cell of the placing board would do. */
export type PlacingMove =
  | { kind: "lift"; ship: Ship }
  | { kind: "place"; ship: Ship }
  | { kind: "refuse"; ship: Ship; problem: PlacementProblem }
  | { kind: "none" };

/** A tap on a placed ship lifts it. On open water it places the next ship, when the rules allow it there. */
export function placingMove(placed: Ship[], size: number | null, direction: Direction, cell: Point): PlacingMove {
  const lifted = shipAt(placed, cell.x, cell.y);
  if (lifted !== undefined) return { kind: "lift", ship: lifted };
  if (size === null) return { kind: "none" };
  const ship = shipWithin(size, direction, cell);
  const problem = placementProblem(ship, placed);
  return problem === null ? { kind: "place", ship } : { kind: "refuse", ship, problem };
}
