import { describe, expect, it } from "vitest";
import type { Ship } from "@/data/api/types";
import { placementProblem, remainingSizes, shipAt, shipCells } from "./fleet";

const DESTROYER: Ship = { size: 2, x: 4, y: 4, direction: "HORIZONTAL" };

describe("fleet placement", () => {
  it("should list the cells of a vertical ship downwards", () => {
    // given
    const ship: Ship = { size: 3, x: 2, y: 5, direction: "VERTICAL" };

    // when
    const cells = shipCells(ship);

    // then
    expect(cells).toEqual([
      { x: 2, y: 5 },
      { x: 2, y: 6 },
      { x: 2, y: 7 },
    ]);
  });

  it("should accept a ship on an empty board", () => {
    // given
    const ship: Ship = { size: 5, x: 5, y: 9, direction: "HORIZONTAL" };

    // when
    const problem = placementProblem(ship, []);

    // then
    expect(problem).toBeNull();
  });

  it("should refuse a ship that leaves the board", () => {
    // given
    const ship: Ship = { size: 5, x: 6, y: 0, direction: "HORIZONTAL" };

    // when
    const problem = placementProblem(ship, []);

    // then
    expect(problem).toBe("OFF_BOARD");
  });

  it("should refuse a ship that overlaps another", () => {
    // given
    const ship: Ship = { size: 3, x: 5, y: 3, direction: "VERTICAL" };

    // when
    const problem = placementProblem(ship, [DESTROYER]);

    // then
    expect(problem).toBe("OVERLAP");
  });

  it("should refuse a ship that shares an edge with another", () => {
    // given
    const ship: Ship = { size: 3, x: 6, y: 4, direction: "HORIZONTAL" };

    // when
    const problem = placementProblem(ship, [DESTROYER]);

    // then
    expect(problem).toBe("TOUCHING");
  });

  it("should accept a ship that touches another only at a corner", () => {
    // given
    const ship: Ship = { size: 3, x: 6, y: 5, direction: "HORIZONTAL" };

    // when
    const problem = placementProblem(ship, [DESTROYER]);

    // then
    expect(problem).toBeNull();
  });

  it("should find the ship lying on a cell", () => {
    // given
    const fleet = [DESTROYER];

    // when
    const found = shipAt(fleet, 5, 4);
    const missed = shipAt(fleet, 6, 4);

    // then
    expect(found).toBe(DESTROYER);
    expect(missed).toBeUndefined();
  });

  it("should list the sizes still to place, largest first", () => {
    // given
    const sizes = [2, 5, 4, 4, 3, 2];
    const placed: Ship[] = [DESTROYER, { size: 4, x: 0, y: 0, direction: "VERTICAL" }];

    // when
    const remaining = remainingSizes(sizes, placed);

    // then
    expect(remaining).toEqual([5, 4, 3, 2]);
  });
});
