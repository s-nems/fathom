import { describe, expect, it } from "vitest";
import { grouped, percent, plural, when, wholeNumber } from "./format";

describe("format", () => {
  it("should print a share as a percentage", () => {
    // given
    const share = 0.6349;

    // when
    const text = percent(share);

    // then
    expect(text).toBe("63.5%");
  });

  it("should add the plural ending only when needed", () => {
    // given
    const counts = [0, 1, 2];

    // when
    const texts = counts.map((count) => plural(count, "ship"));

    // then
    expect(texts).toEqual(["0 ships", "1 ship", "2 ships"]);
  });

  it("should keep a number within its bounds and fall back on anything else", () => {
    // given
    const inputs = ["250", "99999", "-4", "abc", "", undefined];

    // when
    const values = inputs.map((input) => wholeNumber(input, 200, 2, 10000));

    // then
    expect(values).toEqual([250, 10000, 2, 200, 200, 200]);
  });

  it("should say when something happened as briefly as it stays clear", () => {
    // given
    const now = new Date(2026, 10, 22, 18, 0);
    const times = [new Date(2026, 10, 22, 14, 2), new Date(2026, 10, 21, 23, 50), new Date(2026, 10, 3, 9, 0)];

    // when
    const texts = times.map((time) => when(time.toISOString(), now));

    // then
    expect(texts).toEqual(["14:02", "yesterday", "3 Nov"]);
  });

  it("should separate the thousands of a count", () => {
    // given
    const count = 45000;

    // when
    const text = grouped(count);

    // then
    expect(text).toBe("45,000");
  });
});
