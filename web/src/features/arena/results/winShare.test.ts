import { describe, expect, it } from "vitest";
import type { Cell } from "@/data/api/types";
import { CELL_COUNT } from "@/game/board";
import { contestantWinShare, winShare } from "./winShare";

const HISTOGRAM_BINS = CELL_COUNT + 1;

function histogram(counts: Record<number, number>): number[] {
  const bins = new Array<number>(HISTOGRAM_BINS).fill(0);
  for (const [shots, games] of Object.entries(counts)) bins[Number(shots)] = games;
  return bins;
}

function cell(shooter: string, layout: string, counts: Record<number, number>): Cell {
  return { shooter, layout, mean: 0, margin: 0, histogram: histogram(counts) };
}

describe("win share", () => {
  it("should be one when every game of mine is shorter", () => {
    // given
    const mine = histogram({ 40: 10 });
    const theirs = histogram({ 50: 3, 60: 7 });

    // when
    const share = winShare(mine, theirs);

    // then
    expect(share).toBe(1);
  });

  it("should count equal lengths as half a win", () => {
    // given
    const mine = histogram({ 45: 4 });
    const theirs = histogram({ 45: 9 });

    // when
    const share = winShare(mine, theirs);

    // then
    expect(share).toBe(0.5);
  });

  it("should weigh wins, ties and losses by their probabilities", () => {
    // given
    const mine = histogram({ 40: 1, 50: 1 });
    const theirs = histogram({ 40: 1, 45: 1, 60: 2 });

    // when
    const share = winShare(mine, theirs);

    // then
    // mine=40: tie 1/4, win 3/4 -> 0.875. mine=50: win 2/4 -> 0.5. Mean 0.6875.
    expect(share).toBeCloseTo(0.6875, 10);
  });

  it("should complement the share of the other side", () => {
    // given
    const mine = histogram({ 38: 2, 44: 5, 51: 3 });
    const theirs = histogram({ 41: 4, 44: 4, 70: 1 });

    // when
    const sum = winShare(mine, theirs) + winShare(theirs, mine);

    // then
    expect(sum).toBeCloseTo(1, 10);
  });

  it("should take the cell of each shooter against the layout of the other", () => {
    // given
    const cells = [
      cell("sharp", "open", { 40: 1 }),
      cell("blunt", "tight", { 60: 1 }),
      cell("sharp", "tight", { 90: 1 }),
      cell("blunt", "open", { 20: 1 }),
    ];

    // when
    const result = contestantWinShare(
      cells,
      { layout: "tight", shooter: "sharp" },
      { layout: "open", shooter: "blunt" },
    );

    // then
    expect(result).toMatchObject({ known: true, share: 1 });
  });

  it("should name the cells the run lacks", () => {
    // given
    const cells = [cell("sharp", "open", { 40: 1 })];

    // when
    const result = contestantWinShare(
      cells,
      { layout: "tight", shooter: "sharp" },
      { layout: "open", shooter: "blunt" },
    );

    // then
    expect(result).toEqual({ known: false, missing: [{ shooter: "blunt", layout: "tight" }] });
  });

  it("should name a missing cell once when both sides need the same one", () => {
    // given
    const contestant = { layout: "open", shooter: "sharp" };

    // when
    const result = contestantWinShare([], contestant, contestant);

    // then
    expect(result).toEqual({ known: false, missing: [{ shooter: "sharp", layout: "open" }] });
  });
});
