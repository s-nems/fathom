import { describe, expect, it } from "vitest";
import { CELL_COUNT, CELL_INDICES } from "@/game/board";
import { HUNT_HITS, HUNT_MISSES, PARITY_CELLS, scattered, shooterPicture } from "./thumbData";

const HUNT = [...HUNT_HITS, ...HUNT_MISSES];

describe("scattered cells", () => {
  it("should give the same cells for the same seed", () => {
    // given
    const seed = 5;

    // when
    const once = scattered(seed, 14, CELL_INDICES);
    const again = scattered(seed, 14, CELL_INDICES);

    // then
    expect(again).toEqual(once);
  });

  it("should give different cells of the pool that are not part of the hunt", () => {
    // given
    const count = 20;

    // when
    const cells = scattered(7, count, PARITY_CELLS);

    // then
    expect(new Set(cells).size).toBe(count);
    expect(cells.every((cell) => PARITY_CELLS.includes(cell))).toBe(true);
    expect(cells.some((cell) => HUNT.includes(cell))).toBe(false);
  });

  it("should differ between seeds", () => {
    // given
    const seeds = [3, 5];

    // when
    const [one, other] = seeds.map((seed) => scattered(seed, 14, CELL_INDICES));

    // then
    expect(one).not.toEqual(other);
  });
});

describe("picture of a shooter", () => {
  it("should show a random shooter as misses all over and no heat", () => {
    // given
    const shooter = "random";

    // when
    const picture = shooterPicture(shooter);

    // then
    expect(picture.heat).toBeNull();
    expect(picture.hits).toEqual([]);
    expect(picture.misses).toHaveLength(24);
  });

  it("should show a hunter on the parity cells with its hunt in the middle", () => {
    // given
    const shooter = "hunt-target-parity";

    // when
    const picture = shooterPicture(shooter);

    // then
    expect(picture.hits).toEqual(HUNT_HITS);
    expect(picture.misses).toEqual(expect.arrayContaining([...HUNT_MISSES]));
    expect(
      picture.misses.filter((cell) => !HUNT_MISSES.includes(cell)).every((cell) => PARITY_CELLS.includes(cell)),
    ).toBe(true);
  });

  it("should show a density as a heat of 0..1 on every cell, highest in the middle", () => {
    // given
    const shooter = "density";
    const corner = 0;
    const middle = 44;

    // when
    const { heat } = shooterPicture(shooter);

    // then
    expect(heat).toHaveLength(CELL_COUNT);
    expect(heat?.every((value) => value >= 0 && value <= 1)).toBe(true);
    expect(heat?.[middle]).toBeGreaterThan(heat?.[corner] ?? 1);
  });

  it("should give the bot and its variants one picture, and a stranger empty water", () => {
    // given
    const shooters = ["fathom", "fathom-any-fleet", "brand-new"];

    // when
    const [bot, variant, stranger] = shooters.map(shooterPicture);

    // then
    expect(variant).toBe(bot);
    expect(bot.hits).toEqual(HUNT_HITS);
    expect(bot.heat).not.toBeNull();
    expect(stranger).toEqual({ heat: null, misses: [], hits: [] });
  });
});
