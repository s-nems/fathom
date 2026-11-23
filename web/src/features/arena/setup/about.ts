import { BOT } from "@/data/api/catalogue";
import type { Catalogue } from "@/data/api/types";

/**
 * What every shooter and layout source of the engine is, in one line each, as the Kotlin sources define them
 * (`ShooterKind`, `LayoutKind`). A name the page does not know yet is shown without a description.
 */

/** Names shown under one heading in a list of options. */
export interface OptionGroup {
  title: string;
  names: string[];
}

/** A ready selection of shooters and layout sources to start a run from. */
export interface Preset {
  id: string;
  label: string;
  shooters: string[];
  layouts: string[];
}

const SHOOTER_ABOUT: Record<string, string> = {
  fathom: "The tournament bot. Samples whole fleets that agree with every shot so far.",
  "fathom-sequential": "The bot, certain that the fleet was placed ship after ship at random.",
  "fathom-any-fleet": "The bot, treating every legal fleet as equally likely.",
  "fathom-no-sampling": "The bot without fleet sampling: it counts placements ship by ship.",
  "density-informed": "Density that has first studied 10,000 fleets of the layout source.",
  density: "Shoots where the most ship placements still fit.",
  "hunt-target-parity": "Like hunt-target, but hunts on every other cell.",
  "hunt-target": "Shoots at random until a hit, then at its neighbours.",
  random: "Shoots at a random open cell.",
};

const LAYOUT_ABOUT: Record<string, string> = {
  sequential: "Ship after ship at random where it still fits, largest first.",
  shuffled: "The same, with the sizes in random order.",
  fathom: "The bot's placement: long ships mostly along the edges, the roomiest of 20 drafts.",
  "fathom-no-edge": "The bot without the preference for edges.",
  "fathom-first-draft": "The bot keeping its first draft.",
};

const SHOOTER_GROUPS: OptionGroup[] = [
  { title: "The bot", names: [BOT] },
  {
    title: "Bot variants, each with one idea changed",
    names: ["fathom-any-fleet", "fathom-sequential", "fathom-no-sampling"],
  },
  { title: "Baselines", names: ["density-informed", "density", "hunt-target-parity", "hunt-target", "random"] },
];

const LAYOUT_GROUPS: OptionGroup[] = [
  { title: "Simple", names: ["sequential", "shuffled"] },
  { title: "From the bot", names: [BOT, "fathom-no-edge", "fathom-first-draft"] },
];

const OTHER_GROUP = "Other";
const BASELINE_SHOOTERS = [BOT, "density", "hunt-target", "random"];
const COMPARED_LAYOUTS = ["shuffled", BOT];

export const aboutShooter = (name: string): string => SHOOTER_ABOUT[name] ?? "";
export const aboutLayout = (name: string): string => LAYOUT_ABOUT[name] ?? "";

/** The groups with only the names on offer, and a last group for names no group knows. */
export function groupsOffered(groups: OptionGroup[], available: string[]): OptionGroup[] {
  const known = new Set(groups.flatMap((group) => group.names));
  const kept = groups.map((group) => ({ ...group, names: group.names.filter((name) => available.includes(name)) }));
  const other = available.filter((name) => !known.has(name));
  return [...kept, { title: OTHER_GROUP, names: other }].filter((group) => group.names.length > 0);
}

export const shooterGroups = (catalogue: Catalogue): OptionGroup[] => groupsOffered(SHOOTER_GROUPS, catalogue.shooters);
export const layoutGroups = (catalogue: Catalogue): OptionGroup[] => groupsOffered(LAYOUT_GROUPS, catalogue.layouts);

const offered = (wanted: string[], available: string[]): string[] => wanted.filter((name) => available.includes(name));

/** The presets a catalogue can fill. The first one is the default of a first run. */
export function presetsOf(catalogue: Catalogue): Preset[] {
  const layouts = offered(COMPARED_LAYOUTS, catalogue.layouts);
  const presets: Preset[] = [
    { id: "baselines", label: "Bot vs baselines", shooters: offered(BASELINE_SHOOTERS, catalogue.shooters), layouts },
    {
      id: "variants",
      label: "Bot vs its variants",
      shooters: catalogue.shooters.filter((name) => name.startsWith(BOT)),
      layouts,
    },
    { id: "all", label: "Everything", shooters: [...catalogue.shooters], layouts: [...catalogue.layouts] },
  ];
  return presets.filter((preset) => preset.shooters.length > 0 && preset.layouts.length > 0);
}

const sameNames = (one: string[], other: string[]): boolean =>
  one.length === other.length && one.every((name) => other.includes(name));

/** The preset that selects exactly these names, in any order. */
export function presetMatching(presets: Preset[], shooters: string[], layouts: string[]): Preset | undefined {
  return presets.find((preset) => sameNames(preset.shooters, shooters) && sameNames(preset.layouts, layouts));
}
