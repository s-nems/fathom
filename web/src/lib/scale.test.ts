import { describe, expect, it } from "vitest";
import { onScale, percentile, robustScale } from "./scale";

describe("scale", () => {
  it("should read a percentile between two neighbours", () => {
    // given
    const sorted = [10, 20, 30, 40, 50];

    // when
    const median = percentile(sorted, 0.5);
    const between = percentile(sorted, 0.9);

    // then
    expect(median).toBe(30);
    expect(between).toBeCloseTo(46, 10);
  });

  it("should leave an outlier off the scale", () => {
    // given: the middle half is 49.25 to 51.75, so 98 lies far beyond one and a half of its widths
    const values = [50, 48, 52, 49, 51, 98];

    // when
    const scale = robustScale(values);

    // then
    expect(scale).toEqual({ low: 48, high: 52 });
  });

  it("should span every value when none is an outlier", () => {
    // given
    const values = [50, 48, 56, 49, 53];

    // when
    const scale = robustScale(values);

    // then
    expect(scale).toEqual({ low: 48, high: 56 });
  });

  it("should clamp values beyond the scale to its ends", () => {
    // given
    const scale = { low: 40, high: 60 };

    // when
    const positions = [30, 40, 50, 60, 99].map((value) => onScale(value, scale));

    // then
    expect(positions).toEqual([0, 0, 0.5, 1, 1]);
  });

  it("should put every value in the middle of a scale without width", () => {
    // given
    const scale = robustScale([42]);

    // when
    const position = onScale(42, scale);

    // then
    expect(position).toBe(0.5);
  });
});
