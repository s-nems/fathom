import type { Catalogue } from "@/data/api/types";
import { ButtonLink } from "@/ui/controls/Button";
import { hrefOf, type ViewId } from "@/app/route";
import { ContinueRow } from "./ContinueRow";
import { HeroBoard } from "./HeroBoard";

const MORE: readonly { view: ViewId; name: string; what: string }[] = [
  { view: "replay", name: "Replay", what: "Watch a game" },
  { view: "arena", name: "Arena", what: "Compare shooters" },
  { view: "distributions", name: "Distributions", what: "See where ships go" },
];

/** The first screen: what this is in one line, the way into a game, and the bot at work on a board. */
export function HomeView({ catalogue }: { catalogue: Catalogue | undefined }) {
  return (
    <>
      <div className="home">
        <div className="home-title">
          <h1>Battleships against a bot.</h1>
          <p>Play it, watch it think, measure it.</p>
          <ButtonLink variant="primary" size="lg" href={hrefOf("play")}>
            Play
          </ButtonLink>
        </div>
        <HeroBoard catalogue={catalogue} />
        <nav className="home-quiet" aria-label="More">
          {MORE.map(({ view, name, what }) => (
            <a key={view} href={hrefOf(view)}>
              <b>{name}</b>
              <span>{what}</span>
            </a>
          ))}
        </nav>
      </div>
      <ContinueRow />
    </>
  );
}
