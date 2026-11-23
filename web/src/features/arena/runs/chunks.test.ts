import { describe, expect, it } from "vitest";
import { addCounts, addTables, CHUNK_GAMES, chunkGames, planChunks } from "./chunks";

describe("chunks", () => {
  it("should cover every game once, in order", () => {
    // given
    const games = 45;

    // when
    const chunks = planChunks(games, 20);

    // then
    expect(chunks).toEqual([
      { firstGame: 0, games: 20 },
      { firstGame: 20, games: 20 },
      { firstGame: 40, games: 5 },
    ]);
  });

  it("should plan one chunk for a run smaller than a chunk", () => {
    // given
    const games = 7;
    const size = 20;

    // when
    const chunks = planChunks(games, size);

    // then
    expect(chunks).toEqual([{ firstGame: 0, games: 7 }]);
  });

  it("should plan nothing for no games", () => {
    // given
    const games = 0;
    const size = 20;

    // when
    const chunks = planChunks(games, size);

    // then
    expect(chunks).toEqual([]);
  });

  it("should add counts place by place", () => {
    // given
    const one = [1, 0, 2];
    const other = [0, 3, 4];

    // when
    const sum = addCounts(one, other);

    // then
    expect(sum).toEqual([1, 3, 6]);
  });

  it("should take the first counts as they are when nothing was counted before", () => {
    // given
    const before: number[] = [];
    const counted = [2, 5];

    // when
    const sum = addCounts(before, counted);

    // then
    expect(sum).toEqual([2, 5]);
  });

  it("should give the same sum in whatever order the parts arrive", () => {
    // given
    const parts = [
      [1, 0, 0, 2],
      [0, 4, 0, 1],
      [3, 0, 5, 0],
    ];
    const reversed = [...parts].reverse();

    // when
    const inOrder = parts.reduce(addCounts, []);
    const backwards = reversed.reduce(addCounts, []);

    // then
    expect(backwards).toEqual(inOrder);
    expect(inOrder).toEqual([4, 4, 5, 3]);
  });

  it("should add tables row by row", () => {
    // given
    const one = [
      [1, 0],
      [0, 2],
    ];
    const other = [
      [0, 1],
      [3, 0],
    ];

    // when
    const sum = addTables(one, other);

    // then
    expect(sum).toEqual([
      [1, 1],
      [3, 2],
    ]);
  });

  it("should size the chunks of a short cell so that every worker gets one", () => {
    // given
    const games = 20;
    const workers = 8;

    // when
    const size = chunkGames(games, workers);

    // then
    expect(size).toBe(3);
    expect(planChunks(games, size)).toHaveLength(7);
  });

  it("should keep the usual chunk for a cell with more games than the workers take at once", () => {
    // given
    const games = 1000;
    const workers = 8;

    // when
    const size = chunkGames(games, workers);

    // then
    expect(size).toBe(CHUNK_GAMES);
  });

  it("should never plan an empty chunk", () => {
    // given
    const games = 2;
    const workers = 16;

    // when
    const size = chunkGames(games, workers);

    // then
    expect(size).toBe(1);
  });
});
