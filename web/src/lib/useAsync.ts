import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";
import { messageOf } from "./failure";

/** Where a request stands. `idle` means nothing was asked yet, `stale` is the last answer kept during a reload. */
export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading"; stale?: T }
  | { status: "error"; message: string }
  | { status: "ready"; data: T };

const UNKNOWN_FAILURE = "Something went wrong.";

export const failureMessage = (cause: unknown): string => messageOf(cause, UNKNOWN_FAILURE);

/** The answer on screen: the current one, or the last one while a reload is under way. */
export function shownData<T>(state: AsyncState<T>): T | undefined {
  if (state.status === "ready") return state.data;
  return state.status === "loading" ? state.stale : undefined;
}

export interface RunOptions<T> {
  /** Called with the answer, unless a newer request or an unmount replaced this one. */
  onDone?: (data: T) => void;
  /** Keep showing the last answer until the new one arrives. */
  keepData?: boolean;
}

export interface AsyncHandle<T> {
  state: AsyncState<T>;
  run: (task: () => Promise<T>, options?: RunOptions<T>) => void;
  reset: () => void;
}

/** Runs one request at a time and drops the answer of any request a newer one replaced. */
export function useAsync<T>(): AsyncHandle<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: "idle" });
  const latest = useRef(0);

  useEffect(
    () => () => {
      latest.current += 1;
    },
    [],
  );

  const run = useCallback((task: () => Promise<T>, { onDone, keepData = false }: RunOptions<T> = {}) => {
    const ticket = ++latest.current;
    setState((current) => ({ status: "loading", stale: keepData ? shownData(current) : undefined }));
    task().then(
      (data) => {
        if (ticket !== latest.current) return;
        setState({ status: "ready", data });
        onDone?.(data);
      },
      (cause: unknown) => {
        if (ticket === latest.current) setState({ status: "error", message: failureMessage(cause) });
      },
    );
  }, []);

  const reset = useCallback(() => {
    latest.current += 1;
    setState({ status: "idle" });
  }, []);

  return { state, run, reset };
}

/**
 * Loads on mount and again whenever `deps` change. A null task leaves the state idle.
 * `reload` asks again and keeps the last answer on screen meanwhile.
 */
export function useLoad<T>(
  task: (() => Promise<T>) | null,
  deps: DependencyList,
): { state: AsyncState<T>; reload: () => void } {
  const { state, run, reset } = useAsync<T>();
  const [reloads, setReloads] = useState(0);
  const taskRef = useRef(task);
  taskRef.current = task;
  const keepNext = useRef(false);

  useEffect(() => {
    const keepData = keepNext.current;
    keepNext.current = false;
    if (taskRef.current === null) reset();
    else run(taskRef.current, { keepData });
  }, [...deps, reloads, run, reset]);

  const reload = useCallback(() => {
    keepNext.current = true;
    setReloads((count) => count + 1);
  }, []);
  return { state, reload };
}
