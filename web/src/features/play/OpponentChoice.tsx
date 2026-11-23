import type { Contestant } from "@/data/api/types";
import { Select } from "@/ui/controls/Field";
import { Disclosure } from "@/ui/controls/Panel";
import { Segmented } from "@/ui/controls/Segmented";
import { firstShooterOptions, type FirstShooter } from "@/game/firstShooter";
import { useCatalogue } from "@/data/api/catalogue";

const FIRST_SHOT_TEXT: Record<FirstShooter, string> = {
  random: "random first shot",
  ONE: "you shoot first",
  TWO: "the bot shoots first",
};

const FIRST_SHOT_OPTIONS = firstShooterOptions("You", "Bot");

const botText = ({ layout, shooter }: Contestant): string =>
  layout === shooter ? shooter : `fleet by ${layout}, shoots like ${shooter}`;

interface OpponentChoiceProps {
  opponent: Contestant;
  first: FirstShooter;
  onOpponent: (opponent: Contestant) => void;
  onFirst: (first: FirstShooter) => void;
}

/** Which bot the human faces and who shoots first. Closed by default: the defaults are a fair game. */
export function OpponentChoice({ opponent, first, onOpponent, onFirst }: OpponentChoiceProps) {
  const catalogue = useCatalogue();
  return (
    <Disclosure title="Opponent" hint={`${botText(opponent)}, ${FIRST_SHOT_TEXT[first]}`}>
      <div className="pad play-setup">
        <Select
          inline
          label="Fleet by"
          value={opponent.layout}
          options={catalogue.layouts}
          onChange={(layout) => onOpponent({ ...opponent, layout })}
        />
        <Select
          inline
          label="Shoots like"
          value={opponent.shooter}
          options={catalogue.shooters}
          onChange={(shooter) => onOpponent({ ...opponent, shooter })}
        />
        <span className="label">First shot</span>
        <Segmented label="First shot" value={first} options={FIRST_SHOT_OPTIONS} onChange={onFirst} />
      </div>
    </Disclosure>
  );
}
