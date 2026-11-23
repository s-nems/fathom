import { describe, expect, it } from "vitest";
import type { Player } from "@/data/api/types";
import { firstShooterOptions, isFirstShooter, toPlayer, type FirstShooter } from "./firstShooter";

describe("first shooter", () => {
  it.each<[string | undefined, boolean]>([
    ["random", true],
    ["ONE", true],
    ["TWO", true],
    ["one", false],
    ["", false],
    [undefined, false],
  ])("should tell whether %s names who shoots first: %s", (value, expected) => {
    // given
    const written = value;

    // when
    const known = isFirstShooter(written);

    // then
    expect(known).toBe(expected);
  });

  it.each<[FirstShooter, Player | null]>([
    ["random", null],
    ["ONE", "ONE"],
    ["TWO", "TWO"],
  ])("should ask the engine for %s as %s", (first, expected) => {
    // given
    const chosen = first;

    // when
    const player = toPlayer(chosen);

    // then
    expect(player).toBe(expected);
  });

  it("should offer the draw first and then both sides by name", () => {
    // given
    const one = "fathom";
    const two = "density";

    // when
    const options = firstShooterOptions(one, two);

    // then
    expect(options).toEqual([
      { value: "random", label: "Random" },
      { value: "ONE", label: "fathom" },
      { value: "TWO", label: "density" },
    ]);
  });
});
