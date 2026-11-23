import { describe, expect, it } from "vitest";
import { formatHash, hrefOf, parseHash } from "./route";

describe("hash route", () => {
  it("should read the view and its parameters", () => {
    // given
    const hash = "#/replay?seed=3&game=abc";

    // when
    const route = parseHash(hash);

    // then
    expect(route).toEqual({ view: "replay", params: { seed: "3", game: "abc" } });
  });

  it("should fall back to home for an unknown hash", () => {
    // given
    const hashes = ["", "#/nowhere", "#"];

    // when
    const views = hashes.map((hash) => parseHash(hash).view);

    // then
    expect(views).toEqual(["home", "home", "home"]);
  });

  it("should survive a round trip", () => {
    // given
    const route = { view: "arena" as const, params: { run: "a b/c" } };

    // when
    const again = parseHash(formatHash(route));

    // then
    expect(again).toEqual(route);
  });

  it("should leave empty parameters out of a link", () => {
    // given
    const params = { run: "7", cell: undefined, note: "" };

    // when
    const href = hrefOf("arena", params);

    // then
    expect(href).toBe("#/arena?run=7");
  });
});
