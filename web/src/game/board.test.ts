import { describe, expect, it } from "vitest";
import { cellIndex, cellName, cellPoint, isOnBoard } from "./board";

describe("board coordinates", () => {
  it("should name the top left cell A1", () => {
    // given
    const x = 0;
    const y = 0;

    // when
    const name = cellName(x, y);

    // then
    expect(name).toBe("A1");
  });

  it("should name columns by letter and rows from one", () => {
    // given
    const cells = [
      [9, 0],
      [0, 9],
      [9, 9],
      [2, 3],
    ];

    // when
    const names = cells.map(([x, y]) => cellName(x, y));

    // then
    expect(names).toEqual(["J1", "A10", "J10", "C4"]);
  });

  it("should index cells row by row and convert back", () => {
    // given
    const x = 7;
    const y = 4;

    // when
    const index = cellIndex(x, y);

    // then
    expect(index).toBe(47);
    expect(cellPoint(index)).toEqual({ x, y });
  });

  it("should reject cells outside the board", () => {
    // given
    const outside = [
      [-1, 0],
      [0, -1],
      [10, 0],
      [0, 10],
    ];

    // when
    const answers = outside.map(([x, y]) => isOnBoard(x, y));

    // then
    expect(answers).toEqual([false, false, false, false]);
    expect(isOnBoard(9, 9)).toBe(true);
  });
});
