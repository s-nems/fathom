import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";
import { openDatabase, IndexedDbStore } from "./indexedDb";
import { openStorage } from "./storage";
import { MemoryStore, type Store } from "./store";

interface Note {
  id: string;
  text: string;
}

const NOTES = "notes";

const stores: [string, () => Promise<Store<Note>>][] = [
  ["memory", async () => new MemoryStore<Note>()],
  ["IndexedDB", async () => new IndexedDbStore<Note>(await openDatabase(new IDBFactory(), "test", 1, [NOTES]), NOTES)],
];

describe.each(stores)("a store in %s", (_, open) => {
  it("should give back what was put, by id and in the list", async () => {
    // given
    const store = await open();

    // when
    await store.put({ id: "a", text: "first" });
    await store.put({ id: "b", text: "second" });

    // then
    expect(await store.get("a")).toEqual({ id: "a", text: "first" });
    expect((await store.list()).map((note) => note.id).sort()).toEqual(["a", "b"]);
  });

  it("should replace a value put again under the same id", async () => {
    // given
    const store = await open();
    await store.put({ id: "a", text: "first" });

    // when
    await store.put({ id: "a", text: "changed" });

    // then
    expect(await store.list()).toEqual([{ id: "a", text: "changed" }]);
  });

  it("should know nothing of a deleted or missing value", async () => {
    // given
    const store = await open();
    await store.put({ id: "a", text: "first" });

    // when
    await store.delete("a");
    await store.delete("never there");

    // then
    expect(await store.get("a")).toBeUndefined();
    expect(await store.list()).toEqual([]);
  });

  it("should be empty after a clear", async () => {
    // given
    const store = await open();
    await store.put({ id: "a", text: "first" });
    await store.put({ id: "b", text: "second" });

    // when
    await store.clear();

    // then
    expect(await store.list()).toEqual([]);
  });
});

describe("storage", () => {
  it("should keep values between two openings of the same browser", async () => {
    // given
    const browser = new IDBFactory();
    const first = await openStorage(browser);
    await first.games.put({ id: "g", playedAt: "2026-11-22T10:00:00.000Z", kind: "BOTS", game: emptyGame() });

    // when
    const second = await openStorage(browser);

    // then
    expect(second.persistent).toBe(true);
    expect((await second.games.list()).map((game) => game.id)).toEqual(["g"]);
  });

  it("should keep things in memory when the browser has no storage", async () => {
    // given
    const noIndexedDb = undefined;

    // when
    const storage = await openStorage(noIndexedDb);
    await storage.games.put({ id: "g", playedAt: "2026-11-22T10:00:00.000Z", kind: "BOTS", game: emptyGame() });

    // then
    expect(storage.persistent).toBe(false);
    expect(await storage.games.get("g")).toBeDefined();
  });

  it("should keep things in memory when the browser refuses to open its storage", async () => {
    // given
    const refusing = {
      open: () => {
        throw new DOMException("The operation is insecure.", "SecurityError");
      },
    } as unknown as IDBFactory;

    // when
    const storage = await openStorage(refusing);

    // then
    expect(storage.persistent).toBe(false);
  });
});

function emptyGame() {
  return { title: "a vs b", players: { ONE: "a", TWO: "b" }, fleets: { ONE: [], TWO: [] }, shots: [], result: null };
}
