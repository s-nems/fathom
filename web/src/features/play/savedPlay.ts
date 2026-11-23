import type { PlayState } from "@/data/api/types";

/** The part of the storage of a tab the game under way is kept in. */
export type PlayStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const SAVED_PLAY_KEY = "fathom.play";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

/** Whether what was read back is a game under way, as far as the view relies on its shape. */
function isPlayUnderWay(value: unknown): value is PlayState {
  if (!isRecord(value) || !isRecord(value.request) || !isRecord(value.game)) return false;
  const shotLists = [value.shots, value.game.shots];
  return shotLists.every(Array.isArray) && isRecord(value.game.fleets) && value.over === false;
}

/**
 * Keeps the game under way for as long as the tab lives, so that a reload or a look at another view does not
 * lose it. A browser may refuse the storage or what is written to it: then nothing is kept and nothing fails.
 */
export class SavedPlay {
  /** `open` is asked on every use, because reading the storage of a tab may throw by itself. */
  constructor(private readonly open: () => PlayStore) {}

  /** The game under way when the tab was last left, or null. */
  read(): PlayState | null {
    try {
      const text = this.open().getItem(SAVED_PLAY_KEY);
      if (text === null) return null;
      const value: unknown = JSON.parse(text);
      return isPlayUnderWay(value) ? value : null;
    } catch {
      return null;
    }
  }

  /** Keeps a game under way. One that cannot be kept takes the older state with it, which would be wrong. */
  write(play: PlayState): void {
    try {
      this.open().setItem(SAVED_PLAY_KEY, JSON.stringify(play));
    } catch {
      this.clear();
    }
  }

  clear(): void {
    try {
      this.open().removeItem(SAVED_PLAY_KEY);
    } catch {
      // Nothing was kept, so there is nothing to forget.
    }
  }
}

/** The game under way of this tab. */
export const savedPlay = new SavedPlay(() => window.sessionStorage);
