import type { Player } from "@/data/api/types";

/** Who fires the first shot, as the forms offer it. */
export type FirstShooter = "random" | Player;

export const isFirstShooter = (value: string | undefined): value is FirstShooter =>
  value === "random" || value === "ONE" || value === "TWO";

export const toPlayer = (first: FirstShooter): Player | null => (first === "random" ? null : first);

export const firstShooterOptions = (one: string, two: string): { value: FirstShooter; label: string }[] => [
  { value: "random", label: "Random" },
  { value: "ONE", label: one },
  { value: "TWO", label: two },
];
