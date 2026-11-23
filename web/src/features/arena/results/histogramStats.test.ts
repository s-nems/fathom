import { describe, expect, it } from "vitest";
import { histogramStats, occupiedRange } from "./histogramStats";

describe("stats of a histogram", () => {
  it("should read the games, the middle one and both ends", () => {
    // given: one game of 3 shots, two of 5, one of 8
    const histogram = [0, 0, 0, 1, 0, 2, 0, 0, 1];

    // when
    const stats = histogramStats(histogram);

    // then
    expect(stats).toEqual({ games: 4, median: 5, fastest: 3, slowest: 8 });
  });

  it("should have nothing to say about no games", () => {
    // given
    const histogram = [0, 0, 0];

    // when
    const stats = histogramStats(histogram);

    // then
    expect(stats).toBeNull();
  });

  it("should find the shot counts a histogram covers", () => {
    // given
    const histogram = [0, 0, 4, 0, 1, 0];

    // when
    const range = occupiedRange(histogram);

    // then
    expect(range).toEqual({ first: 2, last: 4 });
    expect(occupiedRange([0, 0])).toBeNull();
  });
});
