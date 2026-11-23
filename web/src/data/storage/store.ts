/** Something kept under an id. */
export interface Kept {
  id: string;
}

/** A place that keeps values of one kind by their id. */
export interface Store<T extends Kept> {
  list(): Promise<T[]>;
  get(id: string): Promise<T | undefined>;
  put(value: T): Promise<void>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

/** A store that lasts as long as the page. It stands in when the browser gives no storage. */
export class MemoryStore<T extends Kept> implements Store<T> {
  private readonly values = new Map<string, T>();

  async list(): Promise<T[]> {
    return [...this.values.values()];
  }

  async get(id: string): Promise<T | undefined> {
    return this.values.get(id);
  }

  async put(value: T): Promise<void> {
    this.values.set(value.id, value);
  }

  async delete(id: string): Promise<void> {
    this.values.delete(id);
  }

  async clear(): Promise<void> {
    this.values.clear();
  }
}
