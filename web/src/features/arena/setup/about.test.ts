import { describe, expect, it } from "vitest";
import type { Catalogue } from "@/data/api/types";
import { aboutShooter, groupsOffered, presetMatching, presetsOf } from "./about";

const CATALOGUE: Catalogue = {
  layouts: ["sequential", "shuffled", "fathom"],
  shooters: ["random", "hunt-target", "density", "fathom", "fathom-any-fleet"],
  boardSize: 10,
  fleet: [3, 2],
};

describe("about the catalogue", () => {
  it("should keep only the names on offer and collect unknown ones last", () => {
    // given
    const groups = [
      { title: "First", names: ["a", "b"] },
      { title: "Second", names: ["c"] },
    ];

    // when
    const shown = groupsOffered(groups, ["b", "new"]);

    // then
    expect(shown).toEqual([
      { title: "First", names: ["b"] },
      { title: "Other", names: ["new"] },
    ]);
  });

  it("should describe a shooter it knows and say nothing about one it does not", () => {
    // given
    const names = ["random", "brand-new"];

    // when
    const texts = names.map(aboutShooter);

    // then
    expect(texts).toEqual(["Shoots at a random open cell.", ""]);
  });

  it("should offer the bot against the baselines first", () => {
    // given
    const catalogue = CATALOGUE;

    // when
    const [first] = presetsOf(catalogue);

    // then
    expect(first).toMatchObject({
      label: "Bot vs baselines",
      shooters: ["fathom", "density", "hunt-target", "random"],
      layouts: ["shuffled", "fathom"],
    });
  });

  it("should find the preset behind a selection whatever its order", () => {
    // given
    const presets = presetsOf(CATALOGUE);

    // when
    const found = presetMatching(presets, ["fathom-any-fleet", "fathom"], ["fathom", "shuffled"]);
    const custom = presetMatching(presets, ["fathom"], ["fathom"]);

    // then
    expect(found?.id).toBe("variants");
    expect(custom).toBeUndefined();
  });
});
