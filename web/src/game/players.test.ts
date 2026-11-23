import { describe, expect, it } from "vitest";
import type { GameRecord } from "@/data/api/types";
import { isHumanGame, opponentOf, sideNames } from "./players";

function gameOf(one: string, two: string): GameRecord {
  return { title: "sample", players: { ONE: one, TWO: two }, fleets: { ONE: [], TWO: [] }, shots: [], result: null };
}

describe("players", () => {
  it("should call two bots One and Two and say what each plays like", () => {
    // given
    const game = gameOf("fathom / fathom", "shuffled / density");

    // when
    const names = sideNames(game);

    // then
    expect(names.ONE).toEqual({ short: "One", detail: "fathom / fathom", fleet: "Fleet of One" });
    expect(names.TWO).toEqual({ short: "Two", detail: "shuffled / density", fleet: "Fleet of Two" });
  });

  it("should call the sides You and Bot when the human played", () => {
    // given
    const game = gameOf("you", "fathom / fathom");

    // when
    const names = sideNames(game);

    // then
    expect(isHumanGame(game)).toBe(true);
    expect(names.ONE).toEqual({ short: "You", detail: "", fleet: "Your fleet" });
    expect(names.TWO).toEqual({ short: "Bot", detail: "fathom / fathom", fleet: "Bot's fleet" });
  });

  it("should name the other side as the opponent", () => {
    // given
    const players = ["ONE", "TWO"] as const;

    // when
    const opponents = players.map(opponentOf);

    // then
    expect(opponents).toEqual(["TWO", "ONE"]);
  });
});
