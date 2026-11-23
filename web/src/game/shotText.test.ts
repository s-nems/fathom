import { describe, expect, it } from "vitest";
import type { ShotRecord, ShotResult } from "@/data/api/types";
import { RESULT_CLASS, shotResultText } from "./shotText";

describe("shot result in words", () => {
  const shot = (result: ShotResult, sunkSize: number | null): ShotRecord => ({
    player: "ONE",
    x: 0,
    y: 0,
    result,
    sunk: sunkSize === null ? null : { x: 0, y: 0, direction: "HORIZONTAL", size: sunkSize },
    weights: null,
    millis: null,
    at: null,
  });

  it.each<[ShotResult, number | null, string, string]>([
    ["MISS", null, "miss", "miss"],
    ["HIT", null, "hit", "hit"],
    ["SUNK", 3, "sunk 3", "sunk a ship of 3"],
    ["SUNK", null, "sunk", "sunk"],
  ])("should say %s with a ship of %s as %s in short and %s in long", (result, size, short, long) => {
    // given
    const record = shot(result, size);

    // when
    const texts = [shotResultText(record), shotResultText(record, "long")];

    // then
    expect(texts).toEqual([short, long]);
  });

  it("should have a class of its own for every result", () => {
    // given
    const results: ShotResult[] = ["MISS", "HIT", "SUNK"];

    // when
    const classes = results.map((result) => RESULT_CLASS[result]);

    // then
    expect(classes).toEqual(["shot-miss", "shot-hit", "shot-sunk"]);
  });
});
