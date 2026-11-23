import { describe, expect, it } from "vitest";
import type { GameRecord, StoredGame } from "../api/types";
import { GameHistory, MAX_GAMES_KEPT } from "./gameHistory";
import { MemoryStore } from "./store";

const GAME: GameRecord = {
  title: "fathom vs density",
  players: { ONE: "fathom / fathom", TWO: "shuffled / density" },
  fleets: { ONE: [], TWO: [] },
  shots: [{ player: "ONE", x: 0, y: 0, result: "MISS", sunk: null, weights: null, millis: 1, at: null }],
  result: { winner: "TWO", ending: "FLEET_SUNK", shots: { ONE: 1, TWO: 0 } },
};

/** A history whose clock moves a second with every game and whose ids count up. */
function history() {
  let games = 0;
  const store = new MemoryStore<StoredGame>();
  const now = () => new Date(Date.UTC(2026, 10, 22, 10, 0, games));
  return { store, history: new GameHistory(store, now, () => String(++games)) };
}

describe("game history", () => {
  it("should list what it kept, newest first, without the shots", async () => {
    // given
    const { history: games } = history();
    await games.add("BOTS", GAME);
    await games.add("HUMAN", { ...GAME, title: "you vs fathom" });

    // when
    const list = await games.list();

    // then
    expect(list.map((game) => [game.kind, game.title])).toEqual([
      ["HUMAN", "you vs fathom"],
      ["BOTS", "fathom vs density"],
    ]);
    expect(list[1]).toMatchObject({ winner: "TWO", shots: 1 });
  });

  it("should give a kept game back whole", async () => {
    // given
    const { history: games } = history();

    // when
    const kept = await games.add("BOTS", GAME);

    // then
    expect((await games.get(kept.id))?.game).toEqual(GAME);
  });

  it("should drop the oldest games beyond its limit", async () => {
    // given
    const { history: games, store } = history();
    const surplus = 2;

    // when
    for (let game = 0; game < MAX_GAMES_KEPT + surplus; game++) await games.add("BOTS", GAME);

    // then
    const kept = await store.list();
    expect(kept).toHaveLength(MAX_GAMES_KEPT);
    expect(kept.map((game) => Number(game.id)).sort((a, b) => a - b)[0]).toBe(surplus + 1);
  });

  it("should forget one game or all of them", async () => {
    // given
    const { history: games } = history();
    const first = await games.add("BOTS", GAME);
    await games.add("BOTS", GAME);

    // when
    await games.delete(first.id);
    const afterDelete = await games.list();
    await games.clear();

    // then
    expect(afterDelete).toHaveLength(1);
    expect(await games.list()).toEqual([]);
  });
});
