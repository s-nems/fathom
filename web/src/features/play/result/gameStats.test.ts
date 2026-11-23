import { describe, expect, it } from "vitest";
import type { GameRecord, Player, ShotRecord, ShotResult } from "@/data/api/types";
import { playerStats } from "./gameStats";

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

describe("stats of a player", () => {
  it("should count shots, hits and ships sunk of that player only", () => {
    // given
    const game = gameOf([
      shot("ONE", "HIT"),
      shot("TWO", "MISS"),
      shot("ONE", "SUNK"),
      shot("ONE", "MISS"),
      shot("ONE", "MISS"),
    ]);

    // when
    const stats = playerStats(game, "ONE");

    // then
    expect(stats).toEqual({ shots: 4, hits: 2, shipsSunk: 1, accuracy: 0.5 });
  });

  it("should give a player without shots an accuracy of zero", () => {
    // given
    const game = gameOf([]);

    // when
    const stats = playerStats(game, "TWO");

    // then
    expect(stats.accuracy).toBe(0);
  });
});
