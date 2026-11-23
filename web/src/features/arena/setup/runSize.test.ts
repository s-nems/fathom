import { describe, expect, it } from "vitest";
import { DEFAULT_GAMES, gamesInRun, runSize } from "./runSize";

describe("size of a run", () => {
  it("should count a game for every shooter, layout source and repetition", () => {
    // given
    const shooters = 4;
    const layouts = 2;

    // when
    const games = gamesInRun(shooters, layouts, DEFAULT_GAMES);

    // then
    expect(games).toBe(160);
  });

  it("should call the default run small and a full table of a thousand games large", () => {
    // given
    const runs = [gamesInRun(4, 2, 20), gamesInRun(4, 2, 100), gamesInRun(9, 5, 1000)];

    // when
    const sizes = runs.map(runSize);

    // then
    expect(sizes).toEqual(["small", "medium", "large"]);
  });
});
