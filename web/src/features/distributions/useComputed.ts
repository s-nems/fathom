import { useEffect, useRef, useState } from "react";
import { failureMessage } from "@/lib/useAsync";

/** How long the options have to rest before the engine is asked, so that typing a number asks once. */
export const COMPUTE_DELAY_MS = 350;
const AT_ONCE_MS = 0;

/** How long a question waits before it is asked. The first one has nothing to wait for. */
export const delayBefore = (answered: boolean): number => (answered ? COMPUTE_DELAY_MS : AT_ONCE_MS);

/** The answer on screen and whether a newer one is on its way. */
export interface Computed<T> {
  /** The last answer that arrived. It stays while a newer one is computed. */
  data: T | undefined;
  /** Whether `data` answers the question asked now. */
  busy: boolean;
  error: string | null;
}

/**
 * Asks again whenever `key` changes, once the key has rested. The first question is asked at once. Only the
 * answer to the latest key is kept: a question the key moved on from is cancelled through its signal, and
 * whatever it still answers is dropped.
 */
export function useComputed<T>(key: string, task: (signal: AbortSignal) => Promise<T>): Computed<T> {
  const [answer, setAnswer] = useState<{ key: string; data: T } | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const taskRef = useRef(task);
  taskRef.current = task;
  const answered = useRef(false);

  useEffect(() => {
    const asked = new AbortController();
    const timer = setTimeout(() => {
      taskRef.current(asked.signal).then(
        (data) => {
          if (asked.signal.aborted) return;
          answered.current = true;
          setAnswer({ key, data });
        },
        (cause: unknown) => {
          if (!asked.signal.aborted) setFailure({ key, message: failureMessage(cause) });
        },
      );
    }, delayBefore(answered.current));
    return () => {
      clearTimeout(timer);
      asked.abort();
    };
  }, [key]);

  const error = failure?.key === key ? failure.message : null;
  return { data: answer?.data, busy: answer?.key !== key && error === null, error };
}
