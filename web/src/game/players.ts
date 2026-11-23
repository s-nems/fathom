import type { GameRecord, Player } from "@/data/api/types";

export const PLAYERS: readonly Player[] = ["ONE", "TWO"];

export const opponentOf = (player: Player): Player => (player === "ONE" ? "TWO" : "ONE");

/** What the engine calls the human in the players of a game. */
const HUMAN_NAME = "you";

/** How a side of a game is called on screen. */
export interface SideName {
  /** One word: who it is. */
  short: string;
  /** What it plays like, empty when there is nothing to add. */
  detail: string;
  /** Its fleet, as in "Fleet of One". */
  fleet: string;
}

const BOT_SIDES: Record<Player, SideName> = {
  ONE: { short: "One", detail: "", fleet: "Fleet of One" },
  TWO: { short: "Two", detail: "", fleet: "Fleet of Two" },
};

/** Whether the human played this game. The human is always player ONE. */
export const isHumanGame = (game: GameRecord): boolean => game.players.ONE === HUMAN_NAME;

/** The names of both sides: "You" and "Bot" when the human played, "One" and "Two" otherwise. */
export function sideNames(game: GameRecord): Record<Player, SideName> {
  if (isHumanGame(game)) {
    return {
      ONE: { short: "You", detail: "", fleet: "Your fleet" },
      TWO: { short: "Bot", detail: game.players.TWO, fleet: "Bot's fleet" },
    };
  }
  return {
    ONE: { ...BOT_SIDES.ONE, detail: game.players.ONE },
    TWO: { ...BOT_SIDES.TWO, detail: game.players.TWO },
  };
}
