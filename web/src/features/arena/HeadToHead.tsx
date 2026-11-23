import { useState } from "react";
import type { Contestant, Player, Run } from "@/data/api/types";
import { pairingsOf } from "./runs/runState";
import { ButtonLink } from "@/ui/controls/Button";
import { Select } from "@/ui/controls/Field";
import { Disclosure } from "@/ui/controls/Panel";
import { PlayerDot } from "@/ui/board/PlayerDot";
import { percent } from "@/lib/format";
import { PERCENT } from "@/lib/number";
import { contestantWinShare } from "./results/winShare";
import { watchHref } from "@/features/replay/gameSetup";
import { cellText } from "./arenaModel";

const SIDE_LABEL: Record<Player, string> = { ONE: "First side", TWO: "Second side" };

const sideText = (side: Contestant): string => `${side.shooter}, fleet by ${side.layout}`;

interface SideSelectProps {
  player: Player;
  sides: Contestant[];
  value: number;
  onChange: (index: number) => void;
}

function SideSelect({ player, sides, value, onChange }: SideSelectProps) {
  return (
    <div className="arena-h2h-row">
      <PlayerDot player={player} />
      <Select
        label={SIDE_LABEL[player]}
        labelHidden
        value={value}
        options={sides.map((side, index) => ({ value: index, label: sideText(side) }))}
        onChange={onChange}
      />
    </div>
  );
}

/** The sides come shooter by shooter, each with every layout source, so this is where the second shooter starts. */
const firstSideOfSecondShooter = (run: Run): number => run.layouts.length;

/** Two sides of a run against each other: each shoots at the fleets of the other, the fewer shots win. */
export function HeadToHead({ run }: { run: Run }) {
  const sides: Contestant[] = pairingsOf(run);
  const [chosen, setChosen] = useState<Record<Player, number>>({ ONE: 0, TWO: firstSideOfSecondShooter(run) });
  const one = sides[chosen.ONE] ?? sides[0];
  const two = sides[chosen.TWO] ?? sides[0];
  if (one === undefined || two === undefined) return null;
  const result = contestantWinShare(run.cells, one, two);
  const watch = watchHref({ one, two, seed: run.seed });

  return (
    <Disclosure title="Head to head" hint="who sinks the other first">
      <div className="pad arena-h2h">
        <SideSelect
          player="ONE"
          sides={sides}
          value={sides.indexOf(one)}
          onChange={(index) => setChosen({ ...chosen, ONE: index })}
        />
        <SideSelect
          player="TWO"
          sides={sides}
          value={sides.indexOf(two)}
          onChange={(index) => setChosen({ ...chosen, TWO: index })}
        />
        {result.known ? (
          <div className="arena-share" role="img" aria-label={`First side wins ${percent(result.share)} of the games`}>
            <span className="arena-share-one" style={{ width: `${result.share * PERCENT}%` }}>
              {percent(result.share)}
            </span>
            <span className="arena-share-two">{percent(1 - result.share)}</span>
          </div>
        ) : (
          <p className="dim">Not measured in this run: {result.missing.map(cellText).join(" and ")}.</p>
        )}
        <ButtonLink size="sm" className="arena-watch" href={watch}>
          Watch this match-up
        </ButtonLink>
      </div>
    </Disclosure>
  );
}
