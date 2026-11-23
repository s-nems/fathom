import { BOT } from "@/data/api/catalogue";
import { BOARD_SIZE, CELL_INDICES, cellPoint } from "@/game/board";

/** What the tiny picture of a shooter shows: a heat 0..1 per cell or none, and cells shot at. Not measured. */
export interface ShooterPicture {
  heat: number[] | null;
  misses: number[];
  hits: number[];
}

/** Below 1 it lifts the low end of a heat ramp, which a picture this small would lose. */
const THUMB_GAMMA = 0.55;

/** A hunt in the middle of the board: three hits in a row and the misses around them. */
export const HUNT_HITS: readonly number[] = [44, 45, 46];
export const HUNT_MISSES: readonly number[] = [43, 47, 34, 55];
const RANDOM_SHOTS = 24;
const HUNTING_SHOTS = 14;

/** A linear congruential generator, so that a schematic looks the same on every visit. */
const LCG_MULTIPLIER = 1664525;
const LCG_INCREMENT = 1013904223;
const LCG_MODULUS = 2 ** 32;

/** `count` different cells of the pool that are not part of the hunt, the same for the same seed. */
export function scattered(seed: number, count: number, pool: readonly number[]): number[] {
  let state = seed;
  const left = pool.filter((cell) => !HUNT_HITS.includes(cell) && !HUNT_MISSES.includes(cell));
  return Array.from({ length: count }, () => {
    state = (state * LCG_MULTIPLIER + LCG_INCREMENT) % LCG_MODULUS;
    return left.splice(Math.floor((state / LCG_MODULUS) * left.length), 1)[0];
  });
}

function shots(seed: number, count: number, pool: readonly number[], hunts: boolean): ShooterPicture {
  const misses = scattered(seed, count, pool);
  return hunts
    ? { heat: null, misses: [...misses, ...HUNT_MISSES], hits: [...HUNT_HITS] }
    : { heat: null, misses, hits: [] };
}

const lifted = (heat: number[]): number[] => heat.map((share) => share ** THUMB_GAMMA);

const heatOnly = (heat: number[]): ShooterPicture => ({ heat: lifted(heat), misses: [], hits: [] });

const LAST = BOARD_SIZE - 1;
const CENTRE = LAST / 2;

/** Every second cell, as a checkerboard: no ship fits between them. */
export const PARITY_CELLS = CELL_INDICES.filter((cell) => (cellPoint(cell).x + cellPoint(cell).y) % 2 === 0);

/** Most placements fit in the middle of an empty board. */
const CENTRE_HEAT = CELL_INDICES.map((cell) => {
  const { x, y } = cellPoint(cell);
  return 1 - (Math.abs(x - CENTRE) + Math.abs(y - CENTRE)) / LAST;
});

/** A density that has studied a layout source leans towards where that source puts ships, here the edges. */
const EDGE_HEAT = CELL_INDICES.map((cell) => {
  const { x, y } = cellPoint(cell);
  return 1 - Math.min(x, y, LAST - x, LAST - y) / CENTRE;
});

/** What the bot thinks in the middle of a hunt: the cells in line with the hits are the likely ones. */
const BELIEF_HEAT = CELL_INDICES.map((cell) => {
  const { x, y } = cellPoint(cell);
  if (HUNT_MISSES.includes(cell)) return 0;
  const nearest = Math.min(...HUNT_HITS.map((hit) => Math.abs(cellPoint(hit).x - x) + Math.abs(cellPoint(hit).y - y)));
  return 1 / (1 + nearest);
});

const RANDOM_SEED = 3;
const HUNT_SEED = 5;
const PARITY_SEED = 7;

const SHOOTER_PICTURES: Record<string, ShooterPicture> = {
  random: shots(RANDOM_SEED, RANDOM_SHOTS, CELL_INDICES, false),
  "hunt-target": shots(HUNT_SEED, HUNTING_SHOTS, CELL_INDICES, true),
  "hunt-target-parity": shots(PARITY_SEED, HUNTING_SHOTS, PARITY_CELLS, true),
  density: heatOnly(CENTRE_HEAT),
  "density-informed": heatOnly(EDGE_HEAT),
};
const BOT_PICTURE: ShooterPicture = { heat: lifted(BELIEF_HEAT), misses: [], hits: [...HUNT_HITS] };
const UNKNOWN_PICTURE: ShooterPicture = { heat: null, misses: [], hits: [] };

/** A schematic of how a shooter picks cells. The bot and its variants share one picture, a stranger has none. */
export const shooterPicture = (shooter: string): ShooterPicture =>
  SHOOTER_PICTURES[shooter] ?? (shooter.startsWith(BOT) ? BOT_PICTURE : UNKNOWN_PICTURE);
