import type { GameKind, GameRecord, StoredGame, StoredGameSummary } from "../api/types";
import type { Store } from "./store";
import { descending } from "@/lib/order";

/** Games kept at most. Each carries the weights of every shot, so the oldest make room for new ones. */
export const MAX_GAMES_KEPT = 50;

const newestGamesFirst = (games: StoredGame[]): StoredGame[] => descending(games, (game) => game.playedAt);

const gameSummary = ({ id, playedAt, kind, game }: StoredGame): StoredGameSummary => ({
  id,
  playedAt,
  kind,
  title: game.title,
  winner: game.result?.winner ?? null,
  shots: game.shots.length,
});

/** The games played in this browser, newest first, capped at a fixed number. */
export class GameHistory {
  constructor(
    private readonly store: Store<StoredGame>,
    private readonly now: () => Date,
    private readonly newId: () => string,
  ) {}

  async list(): Promise<StoredGameSummary[]> {
    return newestGamesFirst(await this.store.list()).map(gameSummary);
  }

  get(id: string): Promise<StoredGame | undefined> {
    return this.store.get(id);
  }

  async add(kind: GameKind, game: GameRecord): Promise<StoredGame> {
    const stored: StoredGame = { id: this.newId(), playedAt: this.now().toISOString(), kind, game };
    await this.store.put(stored);
    const surplus = newestGamesFirst(await this.store.list()).slice(MAX_GAMES_KEPT);
    await Promise.all(surplus.map((old) => this.store.delete(old.id)));
    return stored;
  }

  delete(id: string): Promise<void> {
    return this.store.delete(id);
  }

  clear(): Promise<void> {
    return this.store.clear();
  }
}
