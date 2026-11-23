import { describe, expect, it } from "vitest";
import type { GameRecord, Player, ShotRecord, ShotResult } from "@/data/api/types";
import { courseOf } from "./afloat";

const shot = (player: Player, result: ShotResult): ShotRecord => ({
  player,
  x: 0,
  y: 0,
  result,
  sunk: null,
  weights: null,
  millis: null,
  at: null,
});

const gameOf = (shots: ShotRecord[]): GameRecord => ({
  title: "sample",
  players: { ONE: "one", TWO: "two" },
  fleets: { ONE: [], TWO: [] },
  shots,
  result: null,
});

describe("course of a game", () => {
  it("should take a cell off the fleet of the player shot at for every hit", () => {
    // given
    const game = gameOf([shot("ONE", "HIT"), shot("TWO", "MISS"), shot("ONE", "SUNK")]);

    // when
    const { afloat } = courseOf(game, 5);

    // then
    expect(afloat.TWO).toEqual([5, 4, 4, 3]);
    expect(afloat.ONE).toEqual([5, 5, 5, 5]);
  });

  it("should note whose ship sank and after which shot", () => {
    // given
    const game = gameOf([shot("ONE", "HIT"), shot("TWO", "SUNK")]);

    // when
    const { sinkings } = courseOf(game, 5);

    // then
    expect(sinkings).toEqual([{ afterShot: 2, owner: "ONE" }]);
  });
});
