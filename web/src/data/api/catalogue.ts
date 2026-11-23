import { createContext, useContext } from "react";
import type { Catalogue, Contestant } from "./types";

export const BOT = "fathom";

/** The plainest layout source: the default opponent of a comparison and the default for cheap draws. */
const SEQUENTIAL_LAYOUT = "sequential";

/** The layout source of a plain random fleet: what a fleet is drawn from when nothing says otherwise. */
export const PLAIN_LAYOUT = SEQUENTIAL_LAYOUT;

export const CatalogueContext = createContext<Catalogue | null>(null);

export function useCatalogue(): Catalogue {
  const catalogue = useContext(CatalogueContext);
  if (catalogue === null) throw new Error("The catalogue is read before it was loaded.");
  return catalogue;
}

/** `wanted` when the list has it, then the default name, then the first entry. */
export function pick(names: string[], wanted?: string, fallback: string = BOT): string {
  if (wanted !== undefined && names.includes(wanted)) return wanted;
  return names.includes(fallback) ? fallback : (names[0] ?? "");
}

export function defaultContestant(catalogue: Catalogue): Contestant {
  return { layout: pick(catalogue.layouts), shooter: pick(catalogue.shooters) };
}
