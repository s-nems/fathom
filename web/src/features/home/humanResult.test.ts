import { expect, it } from "vitest";
import type { Player } from "@/data/api/types";
import { humanResult } from "./humanResult";

it.each<[Player | null, string]>([
  ["ONE", "won"],
  ["TWO", "lost"],
  [null, "no result"],
])("should read winner %s as %s for the human", (winner, expected) => {
  // given
  const game = { winner };

  // when
  const result = humanResult(game);

  // then
  expect(result).toBe(expected);
});
