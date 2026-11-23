import { expect, it } from "vitest";
import { messageOf } from "./failure";

const FALLBACK = "It failed.";

it("should say what an error says", () => {
  // given
  const cause = new RangeError("Too many games.");

  // when
  const message = messageOf(cause, FALLBACK);

  // then
  expect(message).toBe("Too many games.");
});

it("should fall back for a thrown value that is not an error", () => {
  // given
  const cause = "boom";

  // when
  const message = messageOf(cause, FALLBACK);

  // then
  expect(message).toBe(FALLBACK);
});
