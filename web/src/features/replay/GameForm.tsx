import { useState, type ReactNode } from "react";
import type { Contestant, Player } from "@/data/api/types";
import { Button } from "@/ui/controls/Button";
import { NumberInput, Select } from "@/ui/controls/Field";
import { Panel } from "@/ui/controls/Panel";
import { INK, PlayerDot } from "@/ui/board/PlayerDot";
import { Segmented } from "@/ui/controls/Segmented";
import { firstShooterOptions } from "@/game/firstShooter";
import { MAX_SEED, MIN_SEED } from "@/game/seed";
import { useCatalogue } from "@/data/api/catalogue";
import type { GameSetup } from "./gameSetup";

const SIDE_NAME: Record<Player, string> = { ONE: "One", TWO: "Two" };

interface SideRowProps {
  player: Player;
  value: Contestant;
  onChange: (value: Contestant) => void;
}

/** One side of the game in a line: who places its fleet and who shoots for it. */
function SideRow({ player, value, onChange }: SideRowProps) {
  const { layouts, shooters } = useCatalogue();
  const name = SIDE_NAME[player];
  const choice = (label: string, chosen: string, names: string[], change: (name: string) => void) => (
    <Select label={label} labelHidden className="replay-side-choice" value={chosen} options={names} onChange={change} />
  );
  return (
    <div className="replay-side">
      <PlayerDot player={player} />
      <span className={`replay-side-who ${INK[player]}`}>{name}</span>
      <span className="replay-versus">fleet by</span>
      {choice(`Layout of ${name}`, value.layout, layouts, (layout) => onChange({ ...value, layout }))}
      <span className="replay-versus">shoots like</span>
      {choice(`Shooter of ${name}`, value.shooter, shooters, (shooter) => onChange({ ...value, shooter }))}
    </div>
  );
}

interface GameFormProps {
  initial: GameSetup;
  busy: boolean;
  /** Shown under the button, as when the game could not be played. */
  children?: ReactNode;
  onPlay: (setup: GameSetup) => void;
}

/** Sets up a game between two bots. */
export function GameForm({ initial, busy, children, onPlay }: GameFormProps) {
  const [setup, setSetup] = useState(initial);
  const change = (patch: Partial<GameSetup>) => setSetup((current) => ({ ...current, ...patch }));

  return (
    <Panel title="Two bots">
      <form
        className="pad"
        onSubmit={(event) => {
          event.preventDefault();
          onPlay(setup);
        }}
      >
        <div className="replay-sides">
          <SideRow player="ONE" value={setup.one} onChange={(one) => change({ one })} />
          <SideRow player="TWO" value={setup.two} onChange={(two) => change({ two })} />
        </div>
        <div className="replay-options">
          <NumberInput
            label="Seed"
            inline
            value={setup.seed}
            min={MIN_SEED}
            max={MAX_SEED}
            onChange={(seed) => change({ seed })}
          />
          <span className="inline">
            <span className="label">First</span>
            <Segmented
              label="Who shoots first"
              value={setup.first}
              options={firstShooterOptions(SIDE_NAME.ONE, SIDE_NAME.TWO)}
              onChange={(first) => change({ first })}
            />
          </span>
        </div>
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? "Playing" : "Play a game"}
        </Button>
        {children}
      </form>
    </Panel>
  );
}
