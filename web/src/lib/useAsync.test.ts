import { describe, expect, it } from "vitest";
import { failureMessage, shownData, type AsyncState } from "./useAsync";

describe("answer on screen", () => {
  it.each<[AsyncState<number>, number | undefined]>([
    [{ status: "idle" }, undefined],
    [{ status: "ready", data: 4 }, 4],
    [{ status: "loading", stale: 3 }, 3],
    [{ status: "loading" }, undefined],
    [{ status: "error", message: "No." }, undefined],
  ])("should show for %j the answer %s", (state, expected) => {
    // given
    const current = state;

    // when
    const shown = shownData(current);

    // then
    expect(shown).toBe(expected);
  });

  it("should have words for a failure that is not an error", () => {
    // given
    const causes = [new Error("The engine is gone."), null];

    // when
    const messages = causes.map(failureMessage);

    // then
    expect(messages).toEqual(["The engine is gone.", "Something went wrong."]);
  });
});
