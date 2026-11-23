import { expect, test } from "vitest";
import { settledNumber, typedNumber } from "./numberDraft";

const MIN = 10;
const MAX = 500;
const LAST = 42;

test.each([
  ["10", 10],
  ["500", 500],
  [" 73 ", 73],
])("should take the typed %s as a number", (draft, expected) => {
  // given
  const typed = draft;

  // when
  const value = typedNumber(typed, MIN, MAX);

  // then
  expect(value).toBe(expected);
});

test.each([[""], ["5"], ["501"], ["1.5"], ["1e2"], ["-"], ["abc"]])(
  "should not take the typed '%s' as a number yet",
  (draft) => {
    // given
    const typed = draft;

    // when
    const value = typedNumber(typed, MIN, MAX);

    // then
    expect(value).toBeNull();
  },
);

test.each([
  ["", LAST],
  ["abc", LAST],
  ["5", MIN],
  ["99999999999", MAX],
  ["12.6", 13],
  ["73", 73],
])("should settle the draft '%s' to %d", (draft, expected) => {
  // given
  const left = draft;

  // when
  const value = settledNumber(left, LAST, MIN, MAX);

  // then
  expect(value).toBe(expected);
});
