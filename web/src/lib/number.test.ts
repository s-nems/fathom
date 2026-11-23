import { expect, it } from "vitest";
import { clamp } from "./number";

it.each([
  [5, 5],
  [-3, 0],
  [12, 10],
  [0, 0],
  [10, 10],
])("should keep %d between 0 and 10 as %d", (value, expected) => {
  // given
  const min = 0;
  const max = 10;

  // when
  const kept = clamp(value, min, max);

  // then
  expect(kept).toBe(expected);
});

it("should take the lower bound when the bounds cross", () => {
  // given
  const min = 1;
  const max = 0;

  // when
  const kept = clamp(4, min, max);

  // then
  expect(kept).toBe(min);
});
