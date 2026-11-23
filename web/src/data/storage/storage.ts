import type { Run, StoredGame } from "../api/types";
import { IndexedDbStore, openDatabase } from "./indexedDb";
import { MemoryStore, type Store } from "./store";

const DATABASE = "fathom-studio";
const VERSION = 1;
const RUNS = "runs";
const GAMES = "games";

/** What the page keeps between visits. `persistent` is false when the browser gave no storage. */
export interface Storage {
  runs: Store<Run>;
  games: Store<StoredGame>;
  persistent: boolean;
}

const inMemory = (): Storage => ({ runs: new MemoryStore(), games: new MemoryStore(), persistent: false });

/**
 * Opens the storage of this browser. Without IndexedDB, as in some private windows, everything is kept in
 * memory and lost with the page.
 */
export async function openStorage(factory: IDBFactory | undefined): Promise<Storage> {
  if (factory === undefined) return inMemory();
  try {
    const database = await openDatabase(factory, DATABASE, VERSION, [RUNS, GAMES]);
    return { runs: new IndexedDbStore(database, RUNS), games: new IndexedDbStore(database, GAMES), persistent: true };
  } catch {
    return inMemory();
  }
}
