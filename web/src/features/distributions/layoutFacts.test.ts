import { describe, expect, it } from "vitest";
import { CELL_COUNT, cellIndex, cellPoint } from "@/game/board";
import { layoutFacts } from "./layoutFacts";

describe("facts of a layout map", () => {
  it("should average the rim and the inside apart", () => {
    // given: every rim cell covered in half the fleets, every inner cell in a tenth
    const shares = Array.from({ length: CELL_COUNT }, (_, index) => {
      const { x, y } = cellPoint(index);
      return x === 0 || y === 0 || x === 9 || y === 9 ? 0.5 : 0.1;
    });

    // when
    const facts = layoutFacts(shares);

    // then
    expect(facts.edge).toBeCloseTo(0.5, 10);
    expect(facts.inner).toBeCloseTo(0.1, 10);
  });

  it("should name the cell covered most and the one covered least", () => {
    // given
    const shares = new Array<number>(CELL_COUNT).fill(0.2);
    shares[cellIndex(9, 3)] = 0.6;
    shares[cellIndex(4, 4)] = 0.05;

    // when
    const facts = layoutFacts(shares);

    // then
    expect(facts.most).toEqual({ cell: { x: 9, y: 3 }, share: 0.6 });
    expect(facts.least).toEqual({ cell: { x: 4, y: 4 }, share: 0.05 });
  });
});
