import { expect, test } from "vitest";
import { titleOf } from "./viewLabel";

test("should title the home view with the name of the app alone", () => {
  // given
  const view = "home";

  // when
  const title = titleOf(view);

  // then
  expect(title).toBe("Fathom");
});

test("should put the view before the name of the app in the title", () => {
  // given
  const view = "arena";

  // when
  const title = titleOf(view);

  // then
  expect(title).toBe("Arena - Fathom");
});
