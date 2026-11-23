import { describe, expect, it } from "vitest";
import type { Ending, GameResult, Player } from "@/data/api/types";
import { outcomeOf } from "./outcome";

const resultOf = (winner: Player, ending: Ending | null): GameResult => ({
  winner,
  ending,
  shots: { ONE: 40, TWO: 40 },
});

describe("outcome of a game against the bot", () => {
  it("should read as a win when the human sank the fleet", () => {
    // given
    const result = resultOf("ONE", "FLEET_SUNK");

    // when
    const outcome = outcomeOf(result);

    // then
    expect(outcome).toEqual({ tone: "won", title: "You won", detail: "The enemy fleet is at the bottom." });
  });

  it("should name a forfeit of the human as the reason of a loss", () => {
    // given
    const endings: Ending[] = ["FLEET_SUNK", "ILLEGAL_MOVES", "TIME_LIMIT"];

    // when
    const details = endings.map((ending) => outcomeOf(resultOf("TWO", ending)).detail);

    // then
    expect(details).toEqual([
      "The bot sank your fleet first.",
      "You forfeited with illegal moves.",
      "You ran out of time.",
    ]);
  });

  it("should name a forfeit of the bot as the reason of a win", () => {
    // given
    const result = resultOf("ONE", "TIME_LIMIT");

    // when
    const outcome = outcomeOf(result);

    // then
    expect(outcome.detail).toBe("The bot ran out of time.");
  });

  it("should say so when the game is over without a result", () => {
    // given
    const result = null;

    // when
    const outcome = outcomeOf(result);

    // then
    expect(outcome).toEqual({ tone: "none", title: "No result", detail: "The game ended without a result." });
  });
});
