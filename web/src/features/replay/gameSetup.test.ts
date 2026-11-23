import { expect, test } from "vitest";
import type { Catalogue } from "@/data/api/types";
import { parseHash } from "@/app/route";
import { asksToWatch, requestOf, setupFrom, setupParams, watchHref, type GameSetup } from "./gameSetup";

const CATALOGUE: Catalogue = {
  layouts: ["fathom", "shuffled"],
  shooters: ["fathom", "density"],
  boardSize: 10,
  fleet: [5, 4, 3, 3, 2],
};

const SETUP: GameSetup = {
  one: { layout: "shuffled", shooter: "density" },
  two: { layout: "fathom", shooter: "fathom" },
  seed: 42,
  first: "TWO",
};

test("should read back the setup it wrote into the hash", () => {
  // given
  const params = setupParams(SETUP);

  // when
  const setup = setupFrom(params, CATALOGUE);

  // then
  expect(setup).toEqual(SETUP);
});

test("should fall back to the defaults for what the hash leaves out or the catalogue does not know", () => {
  // given
  const params = { l1: "unknown", seed: "not a number", first: "THREE" };

  // when
  const setup = setupFrom(params, CATALOGUE);

  // then
  expect(setup).toEqual({
    one: { layout: "fathom", shooter: "fathom" },
    two: { layout: "fathom", shooter: "fathom" },
    seed: 1,
    first: "random",
  });
});

test("should ask the engine for a random first shooter as no player", () => {
  // given
  const setup: GameSetup = { ...SETUP, first: "random" };

  // when
  const request = requestOf(setup);

  // then
  expect(request).toEqual({ one: SETUP.one, two: SETUP.two, seed: 42, firstShooter: null });
});

test("should link to the game of a setup as one that is watched", () => {
  // given
  const href = watchHref(SETUP);

  // when
  const route = parseHash(href);

  // then
  expect(route.view).toBe("replay");
  expect(asksToWatch(route.params)).toBe(true);
  expect(setupFrom(route.params, CATALOGUE)).toEqual(SETUP);
});

test("should let either side shoot first when a link to a game does not say who does", () => {
  // given
  const { one, two, seed } = SETUP;

  // when
  const route = parseHash(watchHref({ one, two, seed }));

  // then
  expect(setupFrom(route.params, CATALOGUE)).toEqual({ ...SETUP, first: "random" });
});

test("should not take the hash of a setup alone as a game to watch", () => {
  // given
  const params = setupParams(SETUP);

  // when
  const watched = asksToWatch(params);

  // then
  expect(watched).toBe(false);
});
