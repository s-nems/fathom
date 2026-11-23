import { describe, expect, it } from "vitest";
import { defaultContestant, pick } from "./catalogue";

describe("pick from the catalogue", () => {
  it.each<[string[], string | undefined, string]>([
    [["random", "fathom", "density"], "density", "density"],
    [["random", "fathom", "density"], "gone", "fathom"],
    [["random", "fathom", "density"], undefined, "fathom"],
    [["random", "density"], "gone", "random"],
    [[], "gone", ""],
  ])("should pick from %j with %s wanted: %s", (names, wanted, expected) => {
    // given
    const offered = names;

    // when
    const picked = pick(offered, wanted);

    // then
    expect(picked).toBe(expected);
  });

  it("should fall back to the name it is given before the first entry", () => {
    // given
    const names = ["shuffled", "sequential"];

    // when
    const picked = pick(names, "gone", "sequential");

    // then
    expect(picked).toBe("sequential");
  });

  it("should start a contestant as the bot with its own layout", () => {
    // given
    const catalogue = {
      layouts: ["sequential", "fathom"],
      shooters: ["random", "fathom"],
      boardSize: 10,
      fleet: [5, 4],
    };

    // when
    const contestant = defaultContestant(catalogue);

    // then
    expect(contestant).toEqual({ layout: "fathom", shooter: "fathom" });
  });
});
