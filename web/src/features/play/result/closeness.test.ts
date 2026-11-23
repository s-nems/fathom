import { describe, expect, it } from "vitest";
import type { Ending, GameRecord, Player, ShotRecord } from "@/data/api/types";
import { closeness } from "./closeness";

const FLEET_SIZE = 5;

const sinking = (player: Player): ShotRecord => ({
  player,
  x: 0,
  y: 0,
  result: "SUNK",
  sunk: null,
  weights: null,
  millis: null,
  at: null,
});

const gameOf = (winner: Player, ending: Ending, shots: ShotRecord[]): GameRecord => ({
  title: "sample",
  players: { ONE: "You", TWO: "fathom" },
  fleets: { ONE: [], TWO: [] },
  shots,
  result: { winner, ending, shots: { ONE: 0, TWO: 0 } },
});

describe("closeness", () => {
  it("should say how many ships the bot had sunk when the human won", () => {
    // given
    const game = gameOf("ONE", "FLEET_SUNK", [sinking("TWO"), sinking("TWO"), sinking("ONE")]);

    // when
    const text = closeness(game, true, FLEET_SIZE);

    // then
    expect(text).toBe("The bot had sunk 2 of your 5 ships.");
  });

  it("should say how many ships the human had sunk when the bot won", () => {
    // given
    const game = gameOf("TWO", "FLEET_SUNK", [sinking("ONE"), sinking("TWO")]);

    // when
    const text = closeness(game, false, FLEET_SIZE);

    // then
    expect(text).toBe("You had sunk 1 of its 5 ships.");
  });

  it("should say how the game ended when no fleet was sunk", () => {
    // given
    const game = gameOf("ONE", "TIME_LIMIT", [sinking("TWO")]);

    // when
    const text = closeness(game, true, FLEET_SIZE);

    // then
    expect(text).toBe("The bot ran out of time.");
  });
});
