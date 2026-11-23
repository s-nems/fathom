import { describe, expect, it } from "vitest";
import { descending } from "./order";

describe("descending", () => {
  it("should order by a number, highest first, and leave the input alone", () => {
    // given
    const items = [{ id: "2" }, { id: "10" }, { id: "1" }];

    // when
    const ordered = descending(items, (item) => Number(item.id));

    // then
    expect(ordered.map((item) => item.id)).toEqual(["10", "2", "1"]);
    expect(items.map((item) => item.id)).toEqual(["2", "10", "1"]);
  });

  it("should order by a text and keep the order of equal keys", () => {
    // given
    const items = [
      { at: "2026-11-21", name: "a" },
      { at: "2026-11-22", name: "b" },
      { at: "2026-11-21", name: "c" },
    ];

    // when
    const ordered = descending(items, (item) => item.at);

    // then
    expect(ordered.map((item) => item.name)).toEqual(["b", "a", "c"]);
  });
});
