import type { Kept, Store } from "./store";

const KEY = "id";

/** The answer of a request to the database, as a promise. */
export function answered<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("The browser refused to store this."));
  });
}

/** Opens the database and creates the object stores it lacks, each keyed by the id of its values. */
export function openDatabase(
  factory: IDBFactory,
  name: string,
  version: number,
  stores: string[],
): Promise<IDBDatabase> {
  const opening = factory.open(name, version);
  opening.onupgradeneeded = () => {
    const database = opening.result;
    for (const store of stores) {
      if (!database.objectStoreNames.contains(store)) database.createObjectStore(store, { keyPath: KEY });
    }
  };
  return answered(opening);
}

/** One object store of an IndexedDB database. */
export class IndexedDbStore<T extends Kept> implements Store<T> {
  constructor(
    private readonly database: IDBDatabase,
    private readonly name: string,
  ) {}

  list(): Promise<T[]> {
    return answered<T[]>(this.objects("readonly").getAll());
  }

  get(id: string): Promise<T | undefined> {
    return answered<T | undefined>(this.objects("readonly").get(id));
  }

  async put(value: T): Promise<void> {
    await answered(this.objects("readwrite").put(value));
  }

  async delete(id: string): Promise<void> {
    await answered(this.objects("readwrite").delete(id));
  }

  async clear(): Promise<void> {
    await answered(this.objects("readwrite").clear());
  }

  private objects(mode: IDBTransactionMode): IDBObjectStore {
    return this.database.transaction(this.name, mode).objectStore(this.name);
  }
}
