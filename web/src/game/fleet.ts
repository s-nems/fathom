import type { Direction, Ship } from "@/data/api/types";
import { isOnBoard, type Point } from "./board";

/** Why a ship cannot be placed next to the ships already on the board. */
export type PlacementProblem = "OFF_BOARD" | "OVERLAP" | "TOUCHING";

const EDGE_DISTANCE = 1;

export function shipCells(ship: Ship): Point[] {
  const horizontal = ship.direction === "HORIZONTAL";
  return Array.from({ length: ship.size }, (_, i) => ({
    x: ship.x + (horizontal ? i : 0),
    y: ship.y + (horizontal ? 0 : i),
  }));
}

export const turned = (direction: Direction): Direction => (direction === "HORIZONTAL" ? "VERTICAL" : "HORIZONTAL");

export const sameShip = (a: Ship, b: Ship): boolean =>
  a.x === b.x && a.y === b.y && a.size === b.size && a.direction === b.direction;

export function shipAt(fleet: Ship[], x: number, y: number): Ship | undefined {
  return fleet.find((ship) => shipCells(ship).some((cell) => cell.x === x && cell.y === y));
}

const distance = (a: Point, b: Point): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

/** The first rule the ship breaks: on the board, no overlap, no shared edge. Corners may touch. */
export function placementProblem(ship: Ship, others: Ship[]): PlacementProblem | null {
  const cells = shipCells(ship);
  if (!cells.every((cell) => isOnBoard(cell.x, cell.y))) return "OFF_BOARD";
  const taken = others.flatMap(shipCells);
  if (cells.some((cell) => taken.some((other) => distance(cell, other) === 0))) return "OVERLAP";
  if (cells.some((cell) => taken.some((other) => distance(cell, other) === EDGE_DISTANCE))) {
    return "TOUCHING";
  }
  return null;
}

/** The sizes of the fleet not placed yet, largest first. */
export function remainingSizes(fleetSizes: number[], placed: Ship[]): number[] {
  const remaining = [...fleetSizes].sort((a, b) => b - a);
  for (const ship of placed) {
    const at = remaining.indexOf(ship.size);
    if (at >= 0) remaining.splice(at, 1);
  }
  return remaining;
}
