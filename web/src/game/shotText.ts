import type { ShotRecord, ShotResult } from "@/data/api/types";

export const RESULT_LABEL: Record<ShotResult, string> = { MISS: "miss", HIT: "hit", SUNK: "sunk" };

/** How much a shot result says about a sunk ship: its size alone, or a few words around it. */
export type ShotTextLength = "short" | "long";

/** "miss", "hit", or what was sunk: "sunk 3" in a list, "sunk a ship of 3" in a sentence. */
export function shotResultText(shot: ShotRecord, length: ShotTextLength = "short"): string {
  const label = RESULT_LABEL[shot.result];
  if (shot.sunk === null) return label;
  return length === "short" ? `${label} ${shot.sunk.size}` : `${label} a ship of ${shot.sunk.size}`;
}

/** The class that colours the text of a shot result, see `controls.css`. */
export const RESULT_CLASS: Record<ShotResult, string> = { MISS: "shot-miss", HIT: "shot-hit", SUNK: "shot-sunk" };
