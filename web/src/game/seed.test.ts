import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SEED, MAX_SEED, MIN_SEED, randomSeed, seedFrom } from "./seed";

describe("seed from a hash parameter", () => {
  it.each<[string | undefined, number]>([
    ["42", 42],
    [undefined, DEFAULT_SEED],
    ["", DEFAULT_SEED],
    ["seven", DEFAULT_SEED],
    ["-5", MIN_SEED],
    ["99999999999", MAX_SEED],
    ["7.6", 8],
  ])("should read %s as %d", (text, expected) => {
    // given
    const written = text;

    // when
    const seed = seedFrom(written);

    // then
    expect(seed).toBe(expected);
  });
});

describe("random seed", () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    [0, MIN_SEED],
    [0.5, Math.floor(MAX_SEED / 2)],
    [0.999999999999, MAX_SEED - 1],
  ])("should turn a draw of %d into the whole seed %d", (draw, expected) => {
    // given
    vi.spyOn(Math, "random").mockReturnValue(draw);

    // when
    const seed = randomSeed();

    // then
    expect(seed).toBe(expected);
  });
});
