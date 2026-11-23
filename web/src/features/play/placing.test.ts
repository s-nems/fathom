import { describe, expect, it } from "vitest";
import type { Ship } from "@/data/api/types";
import { fleetTray, placingMove, shipWithin, sizeToPlace } from "./placing";

const FLEET = [5, 4, 4, 3, 3, 3, 2, 2, 2, 2];
const CARRIER: Ship = { size: 5, x: 0, y: 0, direction: "HORIZONTAL" };
const CRUISER: Ship = { size: 3, x: 0, y: 2, direction: "HORIZONTAL" };

describe("placing a fleet", () => {
  it("should list the tray by size with the ships placed of each", () => {
    // given
    const placed = [CARRIER, CRUISER];

    // when
    const tray = fleetTray(FLEET, placed);

    // then
    expect(tray).toEqual([
      { size: 5, total: 1, placed: 1 },
      { size: 4, total: 2, placed: 0 },
      { size: 3, total: 3, placed: 1 },
      { size: 2, total: 4, placed: 0 },
    ]);
  });

  it("should place the wanted size while a ship of it is left", () => {
    // given
    const placed = [CARRIER];

    // when
    const size = sizeToPlace(FLEET, placed, 2);

    // then
    expect(size).toBe(2);
  });

  it("should fall back to the largest size left when the wanted one is used up", () => {
    // given
    const placed = [CARRIER];

    // when
    const size = sizeToPlace(FLEET, placed, 5);

    // then
    expect(size).toBe(4);
  });

  it("should have no size to place when the whole fleet is on the board", () => {
    // given
    const placed = FLEET.map((size, row): Ship => ({ size, x: 0, y: row, direction: "HORIZONTAL" }));

    // when
    const size = sizeToPlace(FLEET, placed, null);

    // then
    expect(size).toBeNull();
  });

  it("should move a ship back from the edge until it fits the board", () => {
    // given
    const cell = { x: 8, y: 9 };

    // when
    const across = shipWithin(4, "HORIZONTAL", cell);
    const down = shipWithin(4, "VERTICAL", cell);

    // then
    expect(across).toEqual({ size: 4, direction: "HORIZONTAL", x: 6, y: 9 });
    expect(down).toEqual({ size: 4, direction: "VERTICAL", x: 8, y: 6 });
  });

  it("should lift the ship under the cell", () => {
    // given
    const placed = [CARRIER];

    // when
    const move = placingMove(placed, 4, "HORIZONTAL", { x: 3, y: 0 });

    // then
    expect(move).toEqual({ kind: "lift", ship: CARRIER });
  });

  it("should place the next ship on open water", () => {
    // given
    const placed = [CARRIER];

    // when
    const move = placingMove(placed, 4, "VERTICAL", { x: 7, y: 3 });

    // then
    expect(move).toEqual({ kind: "place", ship: { size: 4, direction: "VERTICAL", x: 7, y: 3 } });
  });

  it("should refuse a ship that would share an edge with another", () => {
    // given
    const placed = [CARRIER];

    // when
    const move = placingMove(placed, 3, "HORIZONTAL", { x: 1, y: 1 });

    // then
    expect(move).toEqual({
      kind: "refuse",
      ship: { size: 3, direction: "HORIZONTAL", x: 1, y: 1 },
      problem: "TOUCHING",
    });
  });

  it("should do nothing on open water when no ship is left to place", () => {
    // given
    const placed = [CARRIER];

    // when
    const move = placingMove(placed, null, "HORIZONTAL", { x: 9, y: 9 });

    // then
    expect(move).toEqual({ kind: "none" });
  });
});
