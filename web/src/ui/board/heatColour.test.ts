import { describe, expect, it } from "vitest";
import { heatColour, heatInk, inkContrast } from "./heatColour";

/** WCAG asks 3 of large text and 4.5 of small. Where the two inks cross, neither can reach more than about 4.2. */
const READABLE = 4;

describe("heat colours", () => {
  it("should run from deep water to shallow", () => {
    // given
    const values = [0, 0.5, 1];

    // when
    const colours = values.map(heatColour);

    // then
    expect(colours).toEqual(["rgb(27 56 85)", "rgb(74 159 212)", "rgb(215 240 255)"]);
  });

  it("should take the ends for values beyond them", () => {
    // given
    const beyond = [-1, 2];

    // when
    const colours = beyond.map(heatColour);

    // then
    expect(colours).toEqual([heatColour(0), heatColour(1)]);
  });

  it("should write light on deep water and dark on shallow", () => {
    // given
    const ends = [0, 1];

    // when
    const inks = ends.map(heatInk);

    // then
    expect(inks).toEqual(["light", "dark"]);
  });

  it("should keep numbers readable on every colour of the ramp", () => {
    // given
    const steps = Array.from({ length: 101 }, (_, step) => step / 100);

    // when
    const weakest = Math.min(...steps.map(inkContrast));

    // then
    expect(weakest).toBeGreaterThanOrEqual(READABLE);
  });
});
