import { useState, type ReactNode } from "react";
import { api } from "@/data/api/client";
import type { Direction, Ship } from "@/data/api/types";
import { Alert } from "@/ui/controls/Alert";
import { Board } from "@/ui/board/Board";
import { Button } from "@/ui/controls/Button";
import type { CellInteraction } from "@/ui/board/CellTargets";
import { ShipsLayer } from "@/ui/board/ShipsLayer";
import { cellName, type Point } from "@/game/board";
import { sameShip, turned } from "@/game/fleet";
import { plural } from "@/lib/format";
import { fleetTray, placingMove, sizeToPlace } from "./placing";
import { randomSeed } from "@/game/seed";
import { pick, PLAIN_LAYOUT, useCatalogue } from "@/data/api/catalogue";
import { useAsync } from "@/lib/useAsync";
import { useKeys } from "@/lib/useKeys";
import { FleetTray } from "./FleetTray";

const ROTATE_KEY = "r";

interface PlacementProps {
  fleet: Ship[];
  onFleet: (fleet: Ship[]) => void;
  /** The choice of opponent, shown between the tray and the button that starts the game. */
  children: ReactNode;
  starting: boolean;
  failure: string | null;
  onStart: () => void;
}

/** The fleet of the human being placed: the board with a preview of the next ship, the tray, and the start. */
export function Placement({ fleet, onFleet, children, starting, failure, onStart }: PlacementProps) {
  const catalogue = useCatalogue();
  const [direction, setDirection] = useState<Direction>("HORIZONTAL");
  const [wanted, setWanted] = useState<number | null>(null);
  const [pointed, setPointed] = useState<Point | null>(null);
  const draw = useAsync<Ship[]>();

  const size = sizeToPlace(catalogue.fleet, fleet, wanted);
  const left = catalogue.fleet.length - fleet.length;
  const moveAt = (cell: Point) => placingMove(fleet, size, direction, cell);
  const preview = pointed === null ? null : moveAt(pointed);
  const rotate = () => setDirection(turned);

  useKeys({ [ROTATE_KEY]: rotate, [ROTATE_KEY.toUpperCase()]: rotate });

  const randomise = () =>
    draw.run(() => api.drawLayout(pick(catalogue.layouts, PLAIN_LAYOUT), randomSeed()), {
      onDone: onFleet,
    });

  const interaction: CellInteraction = {
    describe: (x, y) => {
      const move = moveAt({ x, y });
      const name = cellName(x, y);
      if (move.kind === "lift") return `${name}, ship of ${move.ship.size}, lift it`;
      if (move.kind === "place") return `${name}, place a ship of ${move.ship.size}`;
      if (move.kind === "refuse") return `${name}, a ship of ${move.ship.size} does not fit here`;
      return `${name}, open water`;
    },
    onActivate: (x, y) => {
      const move = moveAt({ x, y });
      if (move.kind === "place") onFleet([...fleet, move.ship]);
      if (move.kind !== "lift") return;
      onFleet(fleet.filter((ship) => !sameShip(ship, move.ship)));
      setWanted(move.ship.size);
      setDirection(move.ship.direction);
    },
    onPoint: setPointed,
    isDisabled: (x, y) => {
      const { kind } = moveAt({ x, y });
      return kind === "refuse" || kind === "none";
    },
  };

  return (
    <div className="play-place">
      <section className="panel play-place-board">
        <header className="panel-head">
          <h2>Your waters</h2>
          <div className="panel-aside">
            <Button size="sm" onClick={rotate} aria-label={`Rotate, now ${direction.toLowerCase()}`}>
              Rotate
              <span className="kbd kbd-hint">{ROTATE_KEY.toUpperCase()}</span>
            </Button>
            <Button size="sm" onClick={randomise} disabled={draw.state.status === "loading"}>
              Randomise
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onFleet([])} disabled={fleet.length === 0}>
              Clear
            </Button>
          </div>
        </header>
        <div className="pad">
          <Board title="Your waters" interaction={interaction}>
            <ShipsLayer ships={fleet} />
            {preview?.kind === "place" && <ShipsLayer ships={[preview.ship]} tone="ghost" />}
            {preview?.kind === "refuse" && <ShipsLayer ships={[preview.ship]} tone="illegal" />}
          </Board>
        </div>
        <p className="play-place-hint">
          Tap a cell to place the ship. Tap a placed ship to lift it. Ships may touch only at corners.
        </p>
      </section>

      <section className="panel play-place-fleet">
        <header className="panel-head">
          <h2>Fleet</h2>
          <div className="panel-aside num dim">
            {fleet.length} of {catalogue.fleet.length} placed
          </div>
        </header>
        <div className="pad">
          <FleetTray rows={fleetTray(catalogue.fleet, fleet)} selected={size} onSelect={setWanted} />
        </div>
      </section>

      <div className="stack play-place-start">
        {children}
        {draw.state.status === "error" && <Alert title="No fleet was drawn" detail={draw.state.message} />}
        {failure !== null && <Alert title="The game did not start" detail={failure} />}
        <div className="play-place-go">
          <Button variant="primary" size="lg" disabled={left > 0 || starting} onClick={onStart}>
            Start battle
          </Button>
          <span className="dim small" role="status">
            {starting ? "Starting" : left > 0 ? `${plural(left, "ship")} left to place.` : "Your fleet is ready."}
          </span>
        </div>
      </div>
    </div>
  );
}
