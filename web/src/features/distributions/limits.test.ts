import { describe, expect, it } from "vitest";
import { FLEETS, GAMES, within, type Bounds } from "./limits";

const BOUNDS: Bounds = { initial: 50, min: 10, max: 200 };

describe("limits", () => {
  it("should keep a number inside the bounds as it is", () => {
    // given
    const value = 120;

    // when
    const kept = within(value, BOUNDS);

    // then
    expect(kept).toBe(120);
  });

  it("should raise a number below the bounds to the smallest", () => {
    // given
    const value = 3;

    // when
    const kept = within(value, BOUNDS);

    // then
    expect(kept).toBe(BOUNDS.min);
  });

  it("should lower a number above the bounds to the largest", () => {
    // given
    const value = 5_000;

    // when
    const kept = within(value, BOUNDS);

    // then
    expect(kept).toBe(BOUNDS.max);
  });

  it("should round a fraction to a whole number", () => {
    // given
    const value = 20.6;

    // when
    const kept = within(value, BOUNDS);

    // then
    expect(kept).toBe(21);
  });

  it("should start the fields of the view inside their bounds", () => {
    // given
    const fields = [FLEETS, GAMES];

    // when
    const starts = fields.map((bounds) => within(bounds.initial, bounds));

    // then
    expect(starts).toEqual(fields.map((bounds) => bounds.initial));
  });
});
