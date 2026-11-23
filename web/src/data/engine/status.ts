/** Whether the engine can be called: nothing asked yet, loading on its first worker, ready, or failed to load. */
export type EngineStatus =
  { state: "idle" } | { state: "loading" } | { state: "ready" } | { state: "failed"; message: string };

/** A value that tells its listeners when it changes, in the shape `useSyncExternalStore` takes. */
export class Observable<T> {
  private readonly listeners = new Set<() => void>();

  constructor(private value: T) {}

  get = (): T => this.value;

  set(value: T): void {
    this.value = value;
    this.listeners.forEach((listener) => listener());
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
}
