import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(listener: () => void): () => void {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

/** Whether the visitor asked the system for less motion. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches);
}
