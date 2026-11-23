import type { ReactNode } from "react";

/** Plain for a state, live for something under way, hit for something that went wrong or struck. */
export type PillTone = "plain" | "live" | "hit";

export function Pill({ tone = "plain", children }: { tone?: PillTone; children: ReactNode }) {
  return <span className={tone === "plain" ? "pill" : `pill pill-${tone}`}>{children}</span>;
}
