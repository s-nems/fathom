import { describe, expect, it } from "vitest";
import type { PlayState } from "@/data/api/types";
import { SAVED_PLAY_KEY, SavedPlay, type PlayStore } from "./savedPlay";

const PLAY: PlayState = {
  request: { fleet: [], opponent: { layout: "fathom", shooter: "fathom" }, seed: 7, firstShooter: null },
  shots: [{ x: 2, y: 3 }],
  game: {
    title: "sample",
    players: { ONE: "You", TWO: "fathom" },
    fleets: { ONE: [], TWO: [] },
    shots: [],
    result: null,
  },
  yourTurn: true,
  over: false,
};

class MemoryStore implements PlayStore {
  readonly items = new Map<string, string>();
  getItem = (key: string) => this.items.get(key) ?? null;
  setItem = (key: string, value: string) => void this.items.set(key, value);
  removeItem = (key: string) => void this.items.delete(key);
}

const refusing = (): PlayStore => {
  throw new Error("The storage is not allowed.");
};

describe("saved play", () => {
  it("should read back the game under way that was written", () => {
    // given
    const store = new MemoryStore();
    new SavedPlay(() => store).write(PLAY);

    // when
    const restored = new SavedPlay(() => store).read();

    // then
    expect(restored).toEqual(PLAY);
  });

  it("should have no game before one was written", () => {
    // given
    const saved = new SavedPlay(() => new MemoryStore());

    // when
    const restored = saved.read();

    // then
    expect(restored).toBeNull();
  });

  it("should forget the game when it is cleared", () => {
    // given
    const saved = new SavedPlay(() => new MemoryStore());
    saved.write(PLAY);

    // when
    saved.clear();

    // then
    expect(saved.read()).toBeNull();
  });

  it("should not restore what is not a game", () => {
    // given
    const store = new MemoryStore();
    const texts = ["not json", "null", '{"request":{},"shots":[]}', JSON.stringify({ ...PLAY, shots: "none" })];

    // when
    const restored = texts.map((text) => {
      store.setItem(SAVED_PLAY_KEY, text);
      return new SavedPlay(() => store).read();
    });

    // then
    expect(restored).toEqual([null, null, null, null]);
  });

  it("should not restore a game that is over", () => {
    // given
    const store = new MemoryStore();
    store.setItem(SAVED_PLAY_KEY, JSON.stringify({ ...PLAY, over: true }));

    // when
    const restored = new SavedPlay(() => store).read();

    // then
    expect(restored).toBeNull();
  });

  it("should keep nothing and not fail when the browser refuses the storage", () => {
    // given
    const saved = new SavedPlay(refusing);

    // when
    saved.write(PLAY);
    saved.clear();
    const restored = saved.read();

    // then
    expect(restored).toBeNull();
  });

  it("should drop the older state when the newer one cannot be written", () => {
    // given
    const store = new MemoryStore();
    const saved = new SavedPlay(() => store);
    saved.write(PLAY);
    store.setItem = () => {
      throw new Error("The quota is used up.");
    };

    // when
    saved.write({ ...PLAY, shots: [...PLAY.shots, { x: 4, y: 4 }] });

    // then
    expect(saved.read()).toBeNull();
  });
});
