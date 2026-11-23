import { useEffect, useRef } from "react";

/** Handlers by `KeyboardEvent.key`. A handler runs unless the focused element needs the key itself. */
export type KeyHandlers = Record<string, () => void>;

const TYPING_TARGETS = "input, select, textarea";
const ACTIVATED_BY_SPACE = "button, a, summary, [role='button']";
export const SPACE = " ";

function targetNeedsKey(event: KeyboardEvent): boolean {
  if (!(event.target instanceof Element)) return false;
  if (event.target.closest(TYPING_TARGETS) !== null) return true;
  return event.key === SPACE && event.target.closest(ACTIVATED_BY_SPACE) !== null;
}

/** Listens on the window while the component is mounted. */
export function useKeys(handlers: KeyHandlers): void {
  const current = useRef(handlers);
  current.current = handlers;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const handler = current.current[event.key];
      if (handler === undefined || targetNeedsKey(event)) return;
      event.preventDefault();
      handler();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
