import type { GameRecord } from "@/data/api/types";
import { Art } from "@/ui/controls/Art";
import { Button } from "@/ui/controls/Button";
import { percent } from "@/lib/format";
import { playerStats } from "./gameStats";
import { closeness } from "./closeness";

const ACCURACY_DIGITS = 0;

interface ResultProps {
  game: GameRecord;
  fleetSize: number;
  /** Takes the heading, which gets the focus when the banner replaces the battle. */
  landing: (element: HTMLElement | null) => void;
  onAgain: () => void;
}

/** How a game against the bot ended, in one banner: who won, three numbers, and the way to the next game. */
export function Result({ game, fleetSize, landing, onAgain }: ResultProps) {
  const won = game.result?.winner === "ONE";
  const you = playerStats(game, "ONE");
  const bot = playerStats(game, "TWO");
  return (
    <section className="play-result" aria-live="polite">
      <Art piece={won ? "ship" : "wreck"} className={won ? "play-result-ship" : "play-result-wreck"} />
      <div>
        <span className="label">Game over</span>
        <h2 ref={landing} tabIndex={-1}>
          {won ? "You won" : "The bot won"}
        </h2>
        <p>{closeness(game, won, fleetSize)}</p>
      </div>
      <dl className="play-result-stats">
        <div>
          <dt className="label">Your shots</dt>
          <dd className="num">{you.shots}</dd>
        </div>
        <div>
          <dt className="label">Your accuracy</dt>
          <dd className="num">{percent(you.accuracy, ACCURACY_DIGITS)}</dd>
        </div>
        <div>
          <dt className="label">Bot accuracy</dt>
          <dd className="num">{percent(bot.accuracy, ACCURACY_DIGITS)}</dd>
        </div>
      </dl>
      <div className="play-result-again">
        <Button variant="primary" size="lg" onClick={onAgain}>
          Play again
        </Button>
      </div>
    </section>
  );
}
