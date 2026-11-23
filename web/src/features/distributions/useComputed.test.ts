import { describe, expect, it } from "vitest";
import { COMPUTE_DELAY_MS, delayBefore } from "./useComputed";

describe("delay before a question", () => {
  it("should ask the first question at once", () => {
    // given
    const answered = false;

    // when
    const delay = delayBefore(answered);

    // then
    expect(delay).toBe(0);
  });

  it("should let the options rest once there is an answer on screen", () => {
    // given
    const answered = true;

    // when
    const delay = delayBefore(answered);

    // then
    expect(delay).toBe(COMPUTE_DELAY_MS);
  });
});
