import { describe, expect, it } from "vitest";
import { CELL_COUNT } from "@/game/board";
import { cumulativeHeat, longestGame, shares } from "./heat";

function turn(counts: Record<number, number>): number[] {
  const cells = new Array<number>(CELL_COUNT).fill(0);
  for (const [cell, games] of Object.entries(counts)) cells[Number(cell)] = games;
  return cells;
}

const TURNS = [turn({ 0: 3, 5: 1 }), turn({ 0: 1, 7: 3 }), turn({ 5: 4 })];

describe("heat", () => {
  it("should sum the shots of the first turns per cell", () => {
    // given
    const shots = 2;

    // when
    const heat = cumulativeHeat(TURNS, shots);

    // then
    expect(heat[0]).toBe(4);
    expect(heat[5]).toBe(1);
    expect(heat[7]).toBe(3);
  });

  it("should be empty before the first shot and complete past the last", () => {
    // given
    const none = 0;
    const beyond = 50;

    // when
    const before = cumulativeHeat(TURNS, none);
    const after = cumulativeHeat(TURNS, beyond);

    // then
    expect(Math.max(...before)).toBe(0);
    expect(after[5]).toBe(5);
  });

  it("should turn counts into shares of the whole", () => {
    // given
    const counts = [1, 2, 0];

    // when
    const result = shares(counts, 4);

    // then
    expect(result).toEqual([0.25, 0.5, 0]);
  });

  it("should give zero shares when the whole is zero", () => {
    // given
    const counts = [0, 0];

    // when
    const result = shares(counts, 0);

    // then
    expect(result).toEqual([0, 0]);
  });

  it("should take the last turn any game fired in as the longest game", () => {
    // given
    const turns = [...TURNS, turn({}), turn({})];

    // when
    const longest = longestGame(turns);

    // then
    expect(longest).toBe(TURNS.length);
  });

  it("should call the longest game empty when no game fired", () => {
    // given
    const turns = [turn({}), turn({})];

    // when
    const longest = longestGame(turns);

    // then
    expect(longest).toBe(0);
  });
});
