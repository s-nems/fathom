import type { ReactNode } from "react";

/** Something is being computed. Says what, next to a spinner. */
export function Waiting({ children }: { children: ReactNode }) {
  return (
    <p className="waiting" role="status">
      <span className="spin" aria-hidden="true" />
      {children}
    </p>
  );
}
