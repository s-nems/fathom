import type { Catalogue, Contestant, GameRequest } from "@/data/api/types";
import { isFirstShooter, toPlayer, type FirstShooter } from "@/game/firstShooter";
import { seedFrom } from "@/game/seed";
import { pick } from "@/data/api/catalogue";
import { hrefOf, type RouteParams } from "@/app/route";

/** Everything that decides a game between two bots. */
export interface GameSetup {
  one: Contestant;
  two: Contestant;
  seed: number;
  first: FirstShooter;
}

/** The value of the `play` parameter that asks for the game of the setup in the hash. */
const WATCH = "1";
const DEFAULT_FIRST: FirstShooter = "random";

/** The setup written in the hash. What is missing or unknown to the catalogue falls back to the default. */
export function setupFrom(params: RouteParams, catalogue: Catalogue): GameSetup {
  const { layouts, shooters } = catalogue;
  return {
    one: { layout: pick(layouts, params.l1), shooter: pick(shooters, params.s1) },
    two: { layout: pick(layouts, params.l2), shooter: pick(shooters, params.s2) },
    seed: seedFrom(params.seed),
    first: isFirstShooter(params.first) ? params.first : DEFAULT_FIRST,
  };
}

export const setupParams = (setup: GameSetup): RouteParams => ({
  l1: setup.one.layout,
  s1: setup.one.shooter,
  l2: setup.two.layout,
  s2: setup.two.shooter,
  seed: String(setup.seed),
  first: setup.first,
});

export const requestOf = (setup: GameSetup): GameRequest => ({
  one: setup.one,
  two: setup.two,
  seed: setup.seed,
  firstShooter: toPlayer(setup.first),
});

/** Whether the hash asks for the game of its setup. Such a game is only looked at and never kept. */
export const asksToWatch = (params: RouteParams): boolean => params.play === WATCH;

/** The address that plays the game of a setup and shows it without keeping it, for a link from any view. */
export const watchHref = (setup: Omit<GameSetup, "first"> & Partial<Pick<GameSetup, "first">>): string =>
  hrefOf("replay", { ...setupParams({ first: DEFAULT_FIRST, ...setup }), play: WATCH });
