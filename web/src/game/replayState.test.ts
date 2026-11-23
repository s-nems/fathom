import { describe, expect, it } from "vitest";
import type { GameRecord, Player, Ship, ShotRecord, ShotResult } from "@/data/api/types";
import { cellIndex } from "./board";
import { replayStateAt } from "./replayState";

const PATROL: Ship = { size: 2, x: 0, y: 0, direction: "HORIZONTAL" };

function shot(player: Player, x: number, y: number, result: ShotResult, sunk: Ship | null = null): ShotRecord {
  return { player, x, y, result, sunk, weights: null, millis: 1, at: null };
}

const GAME: GameRecord = {
  title: "sample",
  players: { ONE: "one", TWO: "two" },
  fleets: { ONE: [PATROL], TWO: [PATROL] },
  shots: [shot("ONE", 0, 0, "HIT"), shot("TWO", 5, 5, "MISS"), shot("ONE", 1, 0, "SUNK", PATROL)],
  result: { winner: "ONE", ending: "FLEET_SUNK", shots: { ONE: 2, TWO: 1 } },
};

describe("replay state", () => {
  it("should show empty boards before the first shot", () => {
    // given
    const position = 0;

    // when
    const state = replayStateAt(GAME, position);

    // then
    expect(state.boards.ONE.marks.size).toBe(0);
    expect(state.boards.TWO.marks.size).toBe(0);
    expect(state.latest).toBeNull();
    expect(state.next).toBe(GAME.shots[0]);
  });

  it("should land a shot on the board of the other player", () => {
    // given
    const position = 2;

    // when
    const state = replayStateAt(GAME, position);

    // then
    expect(state.boards.TWO.marks.get(cellIndex(0, 0))).toBe("HIT");
    expect(state.boards.ONE.marks.get(cellIndex(5, 5))).toBe("MISS");
    expect(state.boards.TWO.shotsTaken).toBe(1);
    expect(state.boards.ONE.shotsTaken).toBe(1);
    expect(state.latest).toBe(GAME.shots[1]);
  });

  it("should turn every cell of a sunk ship to sunk", () => {
    // given
    const position = 3;

    // when
    const state = replayStateAt(GAME, position);

    // then
    expect(state.boards.TWO.marks.get(cellIndex(0, 0))).toBe("SUNK");
    expect(state.boards.TWO.marks.get(cellIndex(1, 0))).toBe("SUNK");
    expect(state.boards.TWO.sunk).toEqual([PATROL]);
    expect(state.boards.ONE.sunk).toEqual([]);
    expect(state.next).toBeNull();
  });

  it("should clamp a position beyond the last shot", () => {
    // given
    const position = 99;

    // when
    const state = replayStateAt(GAME, position);

    // then
    expect(state.boards.TWO.shotsTaken).toBe(2);
    expect(state.latest).toBe(GAME.shots[2]);
  });

  it("should count a sunk ship the log does not describe", () => {
    // given
    const game: GameRecord = { ...GAME, shots: [shot("ONE", 4, 4, "SUNK")] };

    // when
    const state = replayStateAt(game, 1);

    // then
    expect(state.boards.TWO.shipsSunk).toBe(1);
    expect(state.boards.TWO.sunk).toEqual([]);
    expect(state.boards.TWO.marks.get(cellIndex(4, 4))).toBe("SUNK");
  });
});
