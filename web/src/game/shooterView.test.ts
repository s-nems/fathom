import { describe, expect, it } from "vitest";
import type { GameRecord, Player, ShotRecord } from "@/data/api/types";
import { CELL_COUNT, cellIndex } from "./board";
import { replayStateAt } from "./replayState";
import { hasWeights, shooterViews, weightHeat } from "./shooterView";

function weightsOf(values: Record<number, number>, rest: number): number[] {
  const weights = new Array<number>(CELL_COUNT).fill(rest);
  for (const [cell, weight] of Object.entries(values)) weights[Number(cell)] = weight;
  return weights;
}

function shot(player: Player, x: number, y: number, weights: number[] | null): ShotRecord {
  return { player, x, y, result: "MISS", sunk: null, weights, millis: 1, at: null };
}

function gameOf(shots: ShotRecord[]): GameRecord {
  return { title: "sample", players: { ONE: "one", TWO: "two" }, fleets: { ONE: [], TWO: [] }, shots, result: null };
}

const viewsAt = (game: GameRecord, position: number) => shooterViews(game, position, replayStateAt(game, position));

describe("shooter's view", () => {
  it("should spread the weights of the open cells over the whole ramp and sharpen them", () => {
    // given
    const weights = weightsOf({ 0: 40, 1: 60, 2: 50 }, 40);

    // when
    const heat = weightHeat(weights, new Set());

    // then
    expect(heat[0]).toBe(0);
    expect(heat[1]).toBe(1);
    expect(heat[2]).toBe(0.25);
  });

  it("should leave shot cells alone and ignore their weights in the scale", () => {
    // given
    const weights = weightsOf({ 0: 0, 1: 60 }, 40);

    // when
    const heat = weightHeat(weights, new Set([0]));

    // then
    expect(heat[0]).toBeNull();
    expect(heat[1]).toBe(1);
    expect(heat[2]).toBe(0);
  });

  it("should show each board as the player shooting at it weighs it before its next shot", () => {
    // given: ONE fires at the board of TWO, then TWO at the board of ONE
    const first = weightsOf({ 5: 9 }, 1);
    const second = weightsOf({ 7: 9 }, 1);
    const game = gameOf([shot("ONE", 5, 0, first), shot("TWO", 7, 0, second)]);

    // when
    const views = viewsAt(game, 0);

    // then
    expect(views.TWO.heat?.[5]).toBe(1);
    expect(views.TWO.chosen).toEqual({ x: 5, y: 0 });
    expect(views.ONE.heat?.[7]).toBe(1);
    expect(views.ONE.chosen).toBeNull();
  });

  it("should have no heat for a shooter that weighs nothing or has no shot left", () => {
    // given
    const game = gameOf([shot("ONE", 5, 0, null), shot("TWO", 7, 0, weightsOf({}, 1))]);

    // when
    const before = viewsAt(game, 0);
    const after = viewsAt(game, 2);

    // then
    expect(before.TWO.heat).toBeNull();
    expect(after.ONE).toEqual({ heat: null, chosen: null });
  });

  it("should not weigh a cell that was shot already", () => {
    // given
    const weights = weightsOf({}, 1);
    const game = gameOf([shot("ONE", 5, 0, weights), shot("TWO", 0, 0, null), shot("ONE", 6, 0, weights)]);

    // when
    const views = viewsAt(game, 2);

    // then
    expect(views.TWO.heat?.[cellIndex(5, 0)]).toBeNull();
  });

  it("should tell a game with weights from one without", () => {
    // given
    const games = [gameOf([shot("ONE", 0, 0, weightsOf({}, 1))]), gameOf([shot("ONE", 0, 0, null)])];

    // when
    const known = games.map(hasWeights);

    // then
    expect(known).toEqual([true, false]);
  });
});
