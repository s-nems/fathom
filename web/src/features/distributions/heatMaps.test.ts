import { describe, expect, it } from "vitest";
import { CELL_COUNT } from "@/game/board";
import { layoutMap, reached, shooterMap, sizeMaps, withinGame } from "./heatMaps";

const cells = (fill: number, changes: Record<number, number> = {}): number[] =>
  Array.from({ length: CELL_COUNT }, (_, index) => changes[index] ?? fill);

describe("layout map", () => {
  it("should print the share of fleets as a whole percentage", () => {
    // given: 200 fleets, 50 of them on the first cell and 31 on every other
    const counts = cells(31, { 0: 50 });

    // when
    const map = layoutMap(counts, 200);

    // then
    expect(map.printed[0]).toBe("25");
    expect(map.printed[1]).toBe("16");
    expect(map.shares[0]).toBe(0.25);
  });

  it("should span the ramp over the shares that occur", () => {
    // given: half the cells covered in a tenth of the fleets, half in three tenths
    const counts = Array.from({ length: CELL_COUNT }, (_, index) => (index % 2 === 0 ? 10 : 30));

    // when
    const map = layoutMap(counts, 100);

    // then
    expect(map.low).toBe(0.1);
    expect(map.high).toBe(0.3);
    expect(map.values[0]).toBe(0);
    expect(map.values[1]).toBe(1);
  });

  it("should stay drawable when no fleet was counted", () => {
    // given
    const counts = cells(0);

    // when
    const map = layoutMap(counts, 0);

    // then
    expect(map.printed[0]).toBe("0");
    expect(map.values.every((value) => value >= 0 && value <= 1)).toBe(true);
  });

  it("should list the maps by ship size with the longest first", () => {
    // given
    const bySize = { "2": cells(1), "5": cells(2), "3": cells(3) };

    // when
    const maps = sizeMaps(bySize, 10);

    // then
    expect(maps.map(({ size }) => size)).toEqual([5, 3, 2]);
    expect(maps[0].map.printed[0]).toBe("20");
  });
});

describe("shooter map", () => {
  it("should count the games that fired at a cell within the first shots", () => {
    // given: 4 games, all open on cell 0, then 3 go to cell 1 and 1 to cell 2
    const turns = [cells(0, { 0: 4 }), cells(0, { 1: 3, 2: 1 })];

    // when
    const afterOne = shooterMap(turns, 1, 4);
    const afterTwo = shooterMap(turns, 2, 4);

    // then
    expect(afterOne.printed.slice(0, 3)).toEqual(["100", "0", "0"]);
    expect(afterTwo.printed.slice(0, 3)).toEqual(["100", "75", "25"]);
    expect(afterTwo.values[1]).toBe(0.75);
  });
});

describe("shot counts", () => {
  it("should keep the milestones the longest game reaches", () => {
    // given
    const milestones = [5, 15, 30, 50];

    // when
    const kept = reached(milestones, 30);

    // then
    expect(kept).toEqual([5, 15, 30]);
  });

  it("should keep a shot count between one and the longest game", () => {
    // given
    const longest = 64;

    // when
    const counts = [0, 20, 90].map((shots) => withinGame(shots, longest));

    // then
    expect(counts).toEqual([1, 20, 64]);
  });
});
